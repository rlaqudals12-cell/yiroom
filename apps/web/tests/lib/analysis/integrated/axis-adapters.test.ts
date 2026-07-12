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
  runHairAxis,
} from '@/lib/analysis/integrated/internal/axis-adapters';

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
});
