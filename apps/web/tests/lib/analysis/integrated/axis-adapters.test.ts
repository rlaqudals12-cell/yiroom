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

// AI 성공 경로 검증용 — Gemini/prior-context는 어댑터 밖 의존성이라 스텁으로 고정
vi.mock('@/lib/gemini/v2-analysis', () => ({
  extractSkinColorWithGemini: vi.fn(),
  analyzeSkinV2WithGemini: vi.fn(),
  analyzeBodyWithGemini: vi.fn(),
  analyzeHairWithGemini: vi.fn(),
}));

vi.mock('@/lib/analysis/prior-context', () => ({
  getSkinPriorHint: vi.fn(async () => null),
  getBodyPriorHint: vi.fn(async () => null),
  getHairPriorHint: vi.fn(async () => null),
}));

// mock 모드에서 어댑터를 구동하면 Gemini/prior-context를 타지 않고 순수 Mock → INSERT 경로만 실행됨
import {
  runPersonalColorAxis,
  runSkinAxis,
  runBodyAxis,
  runHairAxis,
} from '@/lib/analysis/integrated/internal/axis-adapters';
import type { CaptureConditions } from '@/lib/analysis/integrated';
import { analyzeBodyWithGemini, analyzeHairWithGemini } from '@/lib/gemini/v2-analysis';
import { getBodyShapeInfo, generateMockBodyAnalysisResult } from '@/lib/analysis/body-v2';
import { recommendHairstyles, generateMockHairAnalysisResult } from '@/lib/analysis/hair';
import { buildFallbackSeed } from '@/lib/utils/seeded-random';

// prod CHECK 제약이 허용하는 값 (실제 personal_color_assessments 제약과 동일)
const ALLOWED_SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const ALLOWED_UNDERTONES = ['Warm', 'Cool', 'Neutral'];
// season_subtype 컬럼의 정본 어휘 (마이그레이션 20260709_pc_season_subtype.sql 코멘트와 동일)
const ALLOWED_SUBTYPES = ['bright', 'light', 'true', 'mute', 'deep'];

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

    it('12톤 서브타입을 season_subtype 컬럼에 정본 표기로 저장한다', async () => {
      const result = await runPersonalColorAxis('sess-subtype', 'clerk-1', baseInput());

      expect(result.success).toBe(true);

      const insert = capturedInserts.find((c) => c.table === 'personal_color_assessments');
      expect(insert).toBeDefined();
      // 근본 원인: image_analysis.subtype에만 저장 → 단독 진단지가 읽는 컬럼이 비어 시즌 폴백으로 추락
      expect(ALLOWED_SUBTYPES).toContain(insert!.payload.season_subtype);
      // classifyTone의 'muted'는 컬럼 정본 어휘 'mute'로 접혀야 한다 (표기 단일화)
      expect(insert!.payload.season_subtype).not.toBe('muted');
    });

    it('image_analysis.subtype도 유지한다 (통합 리포트가 읽는 키 — 구 데이터 호환)', async () => {
      const result = await runPersonalColorAxis('sess-subtype-2', 'clerk-1', baseInput());

      expect(result.success).toBe(true);

      const insert = capturedInserts.find((c) => c.table === 'personal_color_assessments');
      expect(insert).toBeDefined();
      const analysis = insert!.payload.image_analysis as Record<string, unknown>;
      expect(typeof analysis.subtype).toBe('string');
      expect(analysis.subtype).toBeTruthy();
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

/**
 * AI 성공 경로 Mock 누수 (2026-08-13).
 *
 * 배경: 어댑터가 Mock 결과를 먼저 만들어 두고 AI 값으로 **일부 필드만** 덮어썼다.
 * 그래서 usedFallback=false(= "AI가 판정했다")인데도 덮이지 않은 필드는 Mock 값이 그대로
 * 나갔다 — 지어낸 데이터가 진짜인 척 저장·표시되는 정직성 위반(design-contracts §3).
 * 특히 헤어는 Gemini H-1 스키마에 없는 `stylingTips`를 보고 덮으려 해서 스타일 추천이
 * **항상** Mock이었다. 이 테스트는 "AI가 준 것 + 판정값 파생"만 나가는 것을 고정한다.
 */
describe('axis-adapters — AI 성공 경로에 Mock 값이 섞이지 않는다', () => {
  const USER = 'clerk-ai-1';
  const BODY_IMG = 'data:image/jpeg;base64,BODYIMAGE';

  function bodyInput(): IntegratedAnalysisInput {
    return { ...baseInput(), bodyImageBase64: BODY_IMG } as IntegratedAnalysisInput;
  }

  beforeEach(() => {
    capturedInserts.length = 0;
    // 실제 AI 경로: FORCE_MOCK_AI=false → Gemini 스텁이 성공을 반환
    vi.stubEnv('FORCE_MOCK_AI', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(analyzeBodyWithGemini).mockReset();
    vi.mocked(analyzeHairWithGemini).mockReset();
  });

  it('체형: 저장되는 스타일링·특징이 AI 판정 체형에서만 나온다', async () => {
    // 폴백 Mock이 뽑을 체형과 "다른" 체형을 AI가 판정하게 해서 누수를 검출
    const mockShape = generateMockBodyAnalysisResult({
      seed: buildFallbackSeed(USER, 'body', BODY_IMG),
    }).bodyShape;
    const aiShape = mockShape === 'triangle' ? 'hourglass' : 'triangle';

    vi.mocked(analyzeBodyWithGemini).mockResolvedValue({
      usedFallback: false,
      data: {
        canAnalyze: true,
        bodyShape: aiShape,
        confidence: 88,
        estimatedRatios: {
          shoulderToWaistRatio: 1.4,
          waistToHipRatio: 0.8,
          upperToLowerRatio: 0.9,
        },
        visualAssessment: {
          shoulderWidth: 'medium',
          waistDefinition: 'defined',
          hipWidth: 'medium',
        },
        stylingRecommendations: {
          tops: ['AI 상의'],
          bottoms: ['AI 하의'],
          avoid: ['AI 회피'],
        },
        imageQuality: {
          fullBodyVisible: true,
          poseQuality: 'front',
          clothingImpact: 'minimal',
        },
      },
    } as unknown as Awaited<ReturnType<typeof analyzeBodyWithGemini>>);

    const result = await runBodyAxis('sess-ai-body', USER, bodyInput());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedFallback).toBe(false);

    const insert = capturedInserts.find((c) => c.table === 'body_analyses');
    expect(insert).toBeDefined();

    // AI가 준 3개 필드만 저장 — Mock 상수(outerwear '롱 카디건' 등)는 더 이상 나가지 않는다
    expect(insert!.payload.style_recommendations).toEqual({
      tops: ['AI 상의'],
      bottoms: ['AI 하의'],
      avoid: ['AI 회피'],
    });

    // 특징(strengths)은 AI 판정 체형의 지식표 — Mock이 뽑은 다른 체형의 것이면 안 된다
    expect(insert!.payload.strengths).toEqual(getBodyShapeInfo(aiShape).characteristics);
    expect(insert!.payload.strengths).not.toEqual(getBodyShapeInfo(mockShape).characteristics);
    expect(result.data.stylingPrinciples).toEqual(getBodyShapeInfo(aiShape).stylingTips);
  });

  it('헤어: 저장되는 스타일 추천이 AI 판정 얼굴형에서만 나온다', async () => {
    const mockShape = generateMockHairAnalysisResult({
      seed: buildFallbackSeed(USER, 'hair', baseInput().faceImageBase64),
    }).faceShapeAnalysis.faceShape;
    const aiShape = mockShape === 'square' ? 'heart' : 'square';

    // 실제 H-1 응답에는 stylingTips가 없다 — 구 코드가 이 필드를 찾다 실패해 Mock을 저장했다
    vi.mocked(analyzeHairWithGemini).mockResolvedValue({
      usedFallback: false,
      data: {
        canAnalyze: true,
        faceShape: aiShape,
        confidence: 90,
        estimatedRatios: {
          faceLength: 120,
          faceWidth: 90,
          foreheadWidth: 80,
          cheekboneWidth: 90,
          jawWidth: 70,
          lengthToWidthRatio: 1.33,
        },
        visualAssessment: {
          foreheadShape: 'medium',
          cheekboneProminence: 'medium',
          jawlineDefinition: 'moderate',
          chinShape: 'round',
        },
        hairstyleRecommendations: { recommended: ['AI 추천컷'], avoid: ['AI 비추천컷'] },
        imageQuality: {
          faceFullyVisible: true,
          poseQuality: 'frontal',
          hairCoverage: 'moderate',
        },
      },
    } as unknown as Awaited<ReturnType<typeof analyzeHairWithGemini>>);

    const result = await runHairAxis('sess-ai-hair', USER, baseInput());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedFallback).toBe(false);

    const insert = capturedInserts.find((c) => c.table === 'hair_analyses');
    expect(insert).toBeDefined();
    expect(insert!.payload.face_shape).toBe(aiShape);

    const expected = recommendHairstyles(aiShape, { maxResults: 5 });
    const recs = insert!.payload.recommendations as Record<string, unknown>;
    expect(recs.styleRecommendations).toEqual(expected);
    // 구 결함 재발 방지: Mock이 뽑은 얼굴형의 추천이 저장되면 안 된다
    expect(recs.styleRecommendations).not.toEqual(
      recommendHairstyles(mockShape, { maxResults: 5 })
    );
    // 반환 데이터도 저장한 것과 같은 출처여야 한다
    expect(result.data.recommendedStyles).toEqual(expected.map((s) => s.name));
  });
});

/**
 * 폴백 시드 배선 (2026-08-13).
 *
 * 폴백 Mock은 결정론이지만, 호출부가 시드를 넘기지 않으면 모두가 같은 기본 결과를 받는다.
 * "같은 사용자 + 같은 사진 = 같은 폴백 결과"가 성립하는지(=시드가 실제로 전달되는지) 고정한다.
 */
describe('axis-adapters — 폴백 시드 배선 (재현성)', () => {
  const USER = 'clerk-seed-1';
  const BODY_IMG = 'data:image/jpeg;base64,BODYSEED';

  beforeEach(() => {
    capturedInserts.length = 0;
    vi.stubEnv('FORCE_MOCK_AI', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('헤어 폴백 얼굴형이 "사용자+사진" 시드로 결정된다', async () => {
    const input = baseInput();
    const result = await runHairAxis('sess-seed-hair', USER, input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedFallback).toBe(true);

    const expectedShape = generateMockHairAnalysisResult({
      seed: buildFallbackSeed(USER, 'hair', input.faceImageBase64),
    }).faceShapeAnalysis.faceShape;

    const insert = capturedInserts.find((c) => c.table === 'hair_analyses');
    expect(insert!.payload.face_shape).toBe(expectedShape);
  });

  it('같은 사용자·같은 사진을 재분석해도 폴백 얼굴형이 그대로다', async () => {
    await runHairAxis('sess-seed-hair-1', USER, baseInput());
    await runHairAxis('sess-seed-hair-2', USER, baseInput());

    const shapes = capturedInserts
      .filter((c) => c.table === 'hair_analyses')
      .map((c) => c.payload.face_shape);

    expect(shapes).toHaveLength(2);
    // 세션 ID가 달라도 결과는 같아야 한다 (세션은 시드 재료가 아니다)
    expect(shapes[0]).toBe(shapes[1]);
  });

  it('체형 폴백이 "사용자+전신사진" 시드로 결정된다', async () => {
    const input = { ...baseInput(), bodyImageBase64: BODY_IMG } as IntegratedAnalysisInput;
    const result = await runBodyAxis('sess-seed-body', USER, input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedFallback).toBe(true);

    const expectedShape = generateMockBodyAnalysisResult({
      seed: buildFallbackSeed(USER, 'body', BODY_IMG),
    }).bodyShape;

    const insert = capturedInserts.find((c) => c.table === 'body_analyses');
    expect(insert!.payload.strengths).toEqual(getBodyShapeInfo(expectedShape).characteristics);
    // 폴백에서도 저장 스타일링은 판정 체형 파생 3필드만 (Mock 상수 outerwear 없음)
    expect(Object.keys(insert!.payload.style_recommendations as object).sort()).toEqual([
      'avoid',
      'bottoms',
      'tops',
    ]);
  });

  it('신뢰 측정이 있으면 그 체형의 특징을 저장한다 (측정 우선)', async () => {
    const input = {
      ...baseInput(),
      // 전신 사진 없이 측정만 있는 경우 — 자가입력이 있어야 MISSING_INPUT 게이트를 통과한다
      questionnaire: { ...baseInput().questionnaire, body: { heightCm: 170 } },
      measuredBody: {
        shoulderWidth: 0.4,
        waistWidth: 0.3,
        hipWidth: 0.35,
        shape: 'hourglass',
        confidence: 0.8,
      },
    } as IntegratedAnalysisInput;

    const result = await runBodyAxis('sess-measured', USER, input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    // 측정은 실제 신호 → Mock 모드여도 폴백이 아니다
    expect(result.usedFallback).toBe(false);

    const insert = capturedInserts.find((c) => c.table === 'body_analyses');
    expect(insert!.payload.strengths).toEqual(getBodyShapeInfo('hourglass').characteristics);
  });

  it('측정 체형 문자열이 알 수 없는 값이면 축을 깨뜨리지 않고 폴백한다', async () => {
    const input = {
      ...baseInput(),
      questionnaire: { ...baseInput().questionnaire, body: { heightCm: 170 } },
      measuredBody: {
        shoulderWidth: 0.4,
        waistWidth: 0.3,
        hipWidth: 0.35,
        // 구/변조 클라이언트가 보낼 수 있는 미지의 값 (입력 스키마가 자유 문자열)
        shape: 'unknown-shape',
        confidence: 0.9,
      },
    } as unknown as IntegratedAnalysisInput;

    const result = await runBodyAxis('sess-unknown-shape', USER, input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.usedFallback).toBe(true);
    // 폴백이라도 특징·스타일 원칙은 반드시 채워진다 (조회 실패로 비면 안 됨)
    expect(result.data.stylingPrinciples?.length).toBeGreaterThan(0);
  });
});
