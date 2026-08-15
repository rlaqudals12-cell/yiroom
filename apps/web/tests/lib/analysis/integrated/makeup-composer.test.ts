/**
 * Makeup Composer 순수 함수 테스트
 *
 * @see lib/analysis/integrated/internal/makeup-composer.ts
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §6 ATOM 5
 *
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 저장 직전 INSERT 페이로드 캡처 (axis-adapters.test.ts와 동일 기법)
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
              single: async () => ({ data: { id: 'makeup-id-123' }, error: null }),
            }),
          };
        },
      };
    },
  }),
}));

import {
  composeMakeupData,
  runMakeupComposer,
} from '@/lib/analysis/integrated/internal/makeup-composer';
import type {
  AxisResult,
  HairAxisData,
  PersonalColorAxisData,
  SkinAxisData,
} from '@/lib/analysis/integrated';

// ============================================
// Fixtures
// ============================================

const pcWarm: PersonalColorAxisData = {
  season: 'spring',
  tone: 'light-spring',
  undertone: 'warm',
  confidence: 88,
  palette: ['#F9A8D4', '#FBCFE8', '#F472B6', '#EC4899', '#DB2777', '#BE185D'],
};

const pcCool: PersonalColorAxisData = {
  season: 'summer',
  tone: 'true-summer',
  undertone: 'cool',
  confidence: 85,
  palette: ['#A5B4FC', '#C4B5FD', '#818CF8', '#6366F1'],
};

const skinDryHigh: SkinAxisData = {
  skinType: 'dry',
  overallScore: 85,
};

const skinOilyLow: SkinAxisData = {
  skinType: 'oily',
  overallScore: 45,
};

const skinCombinationMid: SkinAxisData = {
  skinType: 'combination',
  overallScore: 65,
};

// ============================================
// Tests
// ============================================

describe('composeMakeupData — 순수 조합 로직', () => {
  describe('베이스 추천 도출 (소비자 눈높이 한국어 — 원시 영문 노출 금지)', () => {
    it('건성 피부 + 높은 점수 → 듀이 + 라이트 커버', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.baseRecommendation).toContain('건성');
      expect(result.baseRecommendation).toContain('듀이');
      expect(result.baseRecommendation).toContain('라이트');
      // 원시 영문값(dewy/light) 노출 금지
      expect(result.baseRecommendation).not.toMatch(/dewy|light/i);
    });

    it('지성 피부 + 낮은 점수 → 매트 + 풀 커버', () => {
      const result = composeMakeupData(pcCool, skinOilyLow);
      expect(result.baseRecommendation).toContain('지성');
      expect(result.baseRecommendation).toContain('매트');
      expect(result.baseRecommendation).toContain('풀');
      expect(result.baseRecommendation).not.toMatch(/matte|full/i);
    });

    it('복합성 피부 + 중간 점수 → 세미매트 + 미디엄', () => {
      const result = composeMakeupData(pcWarm, skinCombinationMid);
      expect(result.baseRecommendation).toContain('복합성');
      expect(result.baseRecommendation).toContain('세미매트');
      expect(result.baseRecommendation).toContain('미디엄');
      // 원시 영문값(combination/semi-matte/medium) 노출 금지
      expect(result.baseRecommendation).not.toMatch(/combination|semi-matte|medium/i);
    });
  });

  describe('립/아이섀도 팔레트 도출', () => {
    it('립 팔레트는 PC palette 앞 4개까지', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.lipPalette).toBeDefined();
      expect(result.lipPalette!.length).toBeLessThanOrEqual(4);
      expect(result.lipPalette![0]).toBe('#F9A8D4');
    });

    it('아이섀도 팔레트는 PC palette 중간 이후', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.eyeshadowPalette).toBeDefined();
      expect(result.eyeshadowPalette!.length).toBeGreaterThan(0);
    });

    it('palette가 비어있으면 빈 배열 반환', () => {
      const pcEmpty: PersonalColorAxisData = {
        ...pcWarm,
        palette: [],
      };
      const result = composeMakeupData(pcEmpty, skinDryHigh);
      expect(result.lipPalette).toEqual([]);
      expect(result.eyeshadowPalette).toEqual([]);
    });
  });

  describe('튜토리얼 스텝 생성', () => {
    it('3단계 튜토리얼이 항상 포함', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.tutorialSteps).toHaveLength(3);
      expect(result.tutorialSteps![0]).toMatch(/^1\./);
      expect(result.tutorialSteps![1]).toMatch(/^2\./);
      expect(result.tutorialSteps![2]).toMatch(/^3\./);
    });

    it('튜토리얼에 실제 팔레트 색상 참조', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.tutorialSteps![1]).toContain('#F9A8D4');
    });
  });

  describe('undertone 무관한 공통 구조', () => {
    it('warm/cool 모두 동일한 구조 반환', () => {
      const warmResult = composeMakeupData(pcWarm, skinDryHigh);
      const coolResult = composeMakeupData(pcCool, skinDryHigh);

      expect(Object.keys(warmResult).sort()).toEqual(Object.keys(coolResult).sort());
    });
  });
});

// ============================================
// DB 저장 규격 — "지어낸 진단" 회귀 방지 (2026-08 수리)
// ============================================

/**
 * 배경: composer가 얼굴형·눈·입술을 측정 없이 상수('oval'/'almond'/'full')로 저장하고
 * usedFallback:false로 고정해, 결과 페이지가 이를 개인 판정처럼 렌더했다.
 * 이제 얼굴형은 H-1 실측만 승계하고, 나머지는 measured=false로 표시를 차단한다.
 */
function axisOk<T>(data: T, usedFallback = false): AxisResult<T> {
  return { success: true, data, usedFallback };
}

const hairMeasured: AxisResult<HairAxisData> = axisOk<HairAxisData>({
  faceShape: 'heart',
  recommendedStyles: ['레이어드 컷'],
});

function lastMakeupPayload(): Record<string, unknown> {
  const insert = capturedInserts.find((i) => i.table === 'makeup_analyses');
  expect(insert).toBeDefined();
  return insert!.payload;
}

function recommendations(): Record<string, unknown> {
  return lastMakeupPayload().recommendations as Record<string, unknown>;
}

describe('runMakeupComposer — 측정하지 않은 값을 진단으로 저장하지 않는다', () => {
  beforeEach(() => {
    capturedInserts.length = 0;
  });

  it('헤어 축이 실측 얼굴형을 주면 승계하고 measured.faceShape=true', async () => {
    const result = await runMakeupComposer(
      'session-1',
      'user_1',
      axisOk(pcWarm),
      axisOk(skinDryHigh),
      hairMeasured
    );

    expect(result.success).toBe(true);
    expect(lastMakeupPayload().face_shape).toBe('heart');
    expect((recommendations().measured as Record<string, boolean>).faceShape).toBe(true);
  });

  it('헤어 축이 폴백이면 얼굴형을 실측으로 표시하지 않는다', async () => {
    const hairFallback = axisOk<HairAxisData>({ faceShape: 'diamond' }, true);
    await runMakeupComposer(
      'session-2',
      'user_1',
      axisOk(pcWarm),
      axisOk(skinDryHigh),
      hairFallback
    );

    const measured = recommendations().measured as Record<string, boolean>;
    expect(measured.faceShape).toBe(false);
    // NOT NULL CHECK 컬럼이므로 값은 있어야 한다 (스키마 유효 placeholder)
    expect(lastMakeupPayload().face_shape).toBe('oval');
  });

  it('헤어 축이 없으면(미실행) 얼굴형 미측정', async () => {
    await runMakeupComposer('session-3', 'user_1', axisOk(pcWarm), axisOk(skinDryHigh));

    expect((recommendations().measured as Record<string, boolean>).faceShape).toBe(false);
  });

  it('눈·입술은 항상 미측정으로 표시된다 (통합 플로우엔 측정이 없다)', async () => {
    await runMakeupComposer(
      'session-4',
      'user_1',
      axisOk(pcWarm),
      axisOk(skinDryHigh),
      hairMeasured
    );

    const measured = recommendations().measured as Record<string, boolean>;
    expect(measured.eyeShape).toBe(false);
    expect(measured.lipShape).toBe(false);
  });

  it('피부 세부 지표는 상수 대신 null로 저장한다', async () => {
    await runMakeupComposer('session-5', 'user_1', axisOk(pcWarm), axisOk(skinDryHigh));

    const payload = lastMakeupPayload();
    expect(payload.hydration).toBeNull();
    expect(payload.pore_visibility).toBeNull();
    expect(payload.oil_balance).toBeNull();
    expect(payload.skin_texture).toBeNull();
    expect(payload.skin_tone_uniformity).toBeNull();
    // 실측값(S축 종합 점수)은 그대로 저장
    expect(payload.overall_score).toBe(85);
  });

  it('PC/S가 폴백이면 usedMock 고지 + 낮은 신뢰도를 승계한다', async () => {
    const result = await runMakeupComposer(
      'session-6',
      'user_1',
      axisOk(pcWarm, true),
      axisOk(skinDryHigh),
      hairMeasured
    );

    expect(result.success && result.usedFallback).toBe(true);
    expect(recommendations().usedMock).toBe(true);
    expect(lastMakeupPayload().analysis_reliability).toBe('low');
  });

  it('입력 축이 전부 실측이면 Mock 고지를 켜지 않는다', async () => {
    const result = await runMakeupComposer(
      'session-7',
      'user_1',
      axisOk(pcWarm),
      axisOk(skinDryHigh),
      hairMeasured
    );

    expect(result.success && result.usedFallback).toBe(false);
    expect(recommendations().usedMock).toBe(false);
    expect(lastMakeupPayload().analysis_reliability).toBe('medium');
  });
});
