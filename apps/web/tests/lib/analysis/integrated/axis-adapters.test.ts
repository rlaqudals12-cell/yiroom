/**
 * 축 Adapter DB 저장 규격 회귀 테스트
 *
 * 배경 (2026-07-12): prod 통합분석이 "피부만 성공, PC·헤어·메이크업 partial"로 재현.
 * 근본 원인 = 통합 어댑터의 INSERT 페이로드가 실제 테이블 스키마와 불일치:
 *   - PC: season/undertone을 소문자로 저장 → CHECK 제약(대문자 시작)에 100% 걸림
 *   - Hair: 존재하지 않는 style_recommendations 컬럼 + NOT NULL scalp_type 누락
 * 이 테스트는 저장 직전 페이로드를 캡처해 두 규격을 고정한다.
 *
 * @see lib/analysis/integrated/internal/axis-adapters.ts
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { IntegratedAnalysisInput } from '@/lib/analysis/integrated';

// 저장 직전 INSERT 페이로드를 캡처 (createServiceRoleClient는 여러 번 호출되지만 같은 배열에 누적)
const { capturedInserts } = vi.hoisted(() => ({
  capturedInserts: [] as Array<{ table: string; payload: Record<string, unknown> }>,
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from(table: string) {
      return {
        insert(payload: Record<string, unknown>) {
          capturedInserts.push({ table, payload });
          return {
            select: () => ({
              single: async () => ({ data: { id: 'test-id-123' }, error: null }),
            }),
          };
        },
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
      };
    },
  }),
}));

// mock 모드에서 어댑터를 구동하면 Gemini/prior-context를 타지 않고 순수 Mock → INSERT 경로만 실행됨
import {
  runPersonalColorAxis,
  runSkinAxis,
  runHairAxis,
} from '@/lib/analysis/integrated/internal/axis-adapters';
import type { CaptureConditions } from '@/lib/analysis/integrated';

// prod CHECK 제약이 허용하는 값 (실제 personal_color_assessments 제약과 동일)
const ALLOWED_SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const ALLOWED_UNDERTONES = ['Warm', 'Cool', 'Neutral'];

function baseInput(): IntegratedAnalysisInput {
  return {
    faceImageBase64: 'data:image/jpeg;base64,AAAA',
    questionnaire: {
      skin: { selfReportedType: 'unknown', concerns: [] },
      hair: {}, // curlType/density 미입력 → 어댑터 기본값이 채워져야 함
      body: {},
    },
    mode: 'full',
    options: { locale: 'ko', skipMakeup: false },
  } as unknown as IntegratedAnalysisInput;
}

describe('axis-adapters — DB 저장 규격 (스키마 계약)', () => {
  beforeEach(() => {
    capturedInserts.length = 0;
    // mock 모드: Gemini 호출 없이 Mock 결과로 INSERT 경로만 검증
    vi.stubEnv('FORCE_MOCK_AI', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('PC(퍼스널컬러) — season/undertone 대문자 규격', () => {
    it('season/undertone을 CHECK 제약(대문자 시작) 값으로 저장한다', async () => {
      const result = await runPersonalColorAxis('sess-1', 'clerk-1', baseInput());

      expect(result.success).toBe(true);

      const insert = capturedInserts.find((c) => c.table === 'personal_color_assessments');
      expect(insert).toBeDefined();
      // 근본 원인: 소문자('spring')가 저장돼 CHECK 위반 → 반드시 대문자 시작으로 변환돼야 함
      expect(ALLOWED_SEASONS).toContain(insert!.payload.season);
      expect(ALLOWED_UNDERTONES).toContain(insert!.payload.undertone);
    });

    it('반환 AxisData는 소문자 season을 유지한다 (persona-composer 톤 판정 계약)', async () => {
      const result = await runPersonalColorAxis('sess-2', 'clerk-1', baseInput());

      expect(result.success).toBe(true);
      if (result.success) {
        // persona-composer는 season === 'spring' | 'autumn' 소문자 비교로 웜/쿨을 가른다
        expect(result.data.season).toBe(result.data.season.toLowerCase());
      }
    });
  });

  describe('Hair(헤어) — hair_analyses 컬럼 규격', () => {
    it('존재하지 않는 style_recommendations 컬럼을 저장하지 않는다', async () => {
      await runHairAxis('sess-3', 'clerk-1', baseInput());

      const insert = capturedInserts.find((c) => c.table === 'hair_analyses');
      expect(insert).toBeDefined();
      expect(insert!.payload).not.toHaveProperty('style_recommendations');
    });

    it('NOT NULL 컬럼(hair_type·hair_thickness·scalp_type)을 non-null로 채운다', async () => {
      await runHairAxis('sess-4', 'clerk-1', baseInput());

      const insert = capturedInserts.find((c) => c.table === 'hair_analyses');
      expect(insert).toBeDefined();
      // 문진값이 비어도(hair: {}) NOT NULL 위반이 나지 않도록 기본값이 채워져야 함
      expect(insert!.payload.hair_type).toBeTruthy();
      expect(insert!.payload.hair_thickness).toBeTruthy();
      expect(insert!.payload.scalp_type).toBeTruthy();
    });

    it('스타일 추천은 recommendations(jsonb)에 담는다', async () => {
      await runHairAxis('sess-5', 'clerk-1', baseInput());

      const insert = capturedInserts.find((c) => c.table === 'hair_analyses');
      expect(insert).toBeDefined();
      expect(insert!.payload).toHaveProperty('recommendations');
      const recs = insert!.payload.recommendations as Record<string, unknown>;
      expect(recs).toHaveProperty('styleRecommendations');
    });
  });

  /**
   * 촬영 조건 영속화 (2026-07-14).
   *
   * 배경: 통합 경로가 CIE-1 게이트를 돌려놓고 통과/차단 판정만 쓰고 결과를 버렸다.
   * 촬영 조건은 사진이 남아 있어도 **소급 복구가 불가능**하다 — 저장하지 않은 회차는
   * 영구히 "조건 미상"이 된다. 조건 없이 회차 간 점수를 비교하면 조명·흐림 노이즈를
   * 개선/악화로 오독시키게 되어, 재현성·정직성 계약(ADR-007)을 정면으로 깬다.
   */
  describe('촬영 조건 영속화 — 소급 불가 값', () => {
    const capture: CaptureConditions = {
      qualityScore: 82,
      sharpnessScore: 71,
      sharpnessVerdict: 'accepted',
      exposureVerdict: 'normal',
      cctKelvin: 5200,
      cctVerdict: 'neutral',
      resolutionValid: true,
      confidence: 0.86,
      measuredAt: '2026-07-14T00:00:00.000Z',
    };

    it('피부: recommendations(jsonb)에 촬영 조건을 저장한다', async () => {
      await runSkinAxis('sess-cap-1', 'clerk-1', baseInput(), capture);

      const insert = capturedInserts.find((c) => c.table === 'skin_analyses');
      expect(insert).toBeDefined();
      const recs = insert!.payload.recommendations as Record<string, unknown>;
      expect(recs.capture).toEqual(capture);
    });

    it('PC: image_analysis(jsonb)에 촬영 조건을 저장한다 (색 판정은 조명에 민감)', async () => {
      await runPersonalColorAxis('sess-cap-2', 'clerk-1', baseInput(), capture);

      const insert = capturedInserts.find((c) => c.table === 'personal_color_assessments');
      expect(insert).toBeDefined();
      const analysis = insert!.payload.image_analysis as Record<string, unknown>;
      expect(analysis.capture).toEqual(capture);
    });

    it('촬영 조건이 없으면 키 자체를 넣지 않는다 (추측 금지 — 미측정과 "조건 좋음"은 다르다)', async () => {
      await runSkinAxis('sess-cap-3', 'clerk-1', baseInput());

      const insert = capturedInserts.find((c) => c.table === 'skin_analyses');
      expect(insert).toBeDefined();
      const recs = insert!.payload.recommendations as Record<string, unknown>;
      expect(recs).not.toHaveProperty('capture');
    });
  });
});
