/**
 * N-1 S-1 피부 연동 인사이트 로직 테스트
 * Task 3.7: S-1 피부 연동 인사이트
 */

import { describe, it, expect } from 'vitest';
import {
  getSkinNutritionInsight,
  getHydrationTargetFromSkin,
  getSkinHydrationMessage,
  convertSkinMetricsToSummary,
  SKIN_FOOD_RECOMMENDATIONS,
  HYDRATION_TARGETS,
  type SkinAnalysisSummary,
} from '@/lib/nutrition/skinInsight';

describe('getSkinNutritionInsight', () => {
  describe('피부 분석 없음', () => {
    it('피부 분석이 없으면 hasAnalysis가 false다', () => {
      const result = getSkinNutritionInsight(null);

      expect(result.hasAnalysis).toBe(false);
      expect(result.foodRecommendations).toHaveLength(0);
      expect(result.hydrationInsight).toBeNull();
    });

    it('피부 분석이 없으면 안내 메시지를 반환한다', () => {
      const result = getSkinNutritionInsight(null);

      expect(result.summaryMessage).toContain('S-1 피부 분석');
    });
  });

  describe('피부 분석 있음 - 정상 상태', () => {
    const normalSkin: SkinAnalysisSummary = {
      hydration: 'good',
      oil: 'good',
      pores: 'good',
      wrinkles: 'good',
      elasticity: 'good',
      pigmentation: 'good',
      trouble: 'good',
    };

    it('모든 지표가 좋으면 추천이 없다', () => {
      const result = getSkinNutritionInsight(normalSkin);

      expect(result.hasAnalysis).toBe(true);
      expect(result.foodRecommendations).toHaveLength(0);
    });

    it('모든 지표가 좋으면 긍정적 메시지를 반환한다', () => {
      const result = getSkinNutritionInsight(normalSkin);

      expect(result.summaryMessage).toContain('좋아요');
    });

    it('수분 인사이트는 항상 포함된다', () => {
      const result = getSkinNutritionInsight(normalSkin);

      expect(result.hydrationInsight).not.toBeNull();
      expect(result.hydrationInsight?.priority).toBe('low');
    });
  });

  describe('피부 분석 있음 - 경고 상태', () => {
    const warningSkin: SkinAnalysisSummary = {
      hydration: 'warning',
      oil: 'good',
      pores: 'good',
      wrinkles: 'good',
      elasticity: 'good',
      pigmentation: 'good',
      trouble: 'warning',
    };

    it('경고 지표에 대한 음식 추천을 반환한다', () => {
      const result = getSkinNutritionInsight(warningSkin);

      expect(result.hasAnalysis).toBe(true);
      expect(result.foodRecommendations.length).toBeGreaterThan(0);
    });

    it('수분 부족 시 수분 보충 식품을 추천한다', () => {
      const result = getSkinNutritionInsight(warningSkin);

      const hydrationRec = result.foodRecommendations.find(
        (r) => r.relatedMetric === 'hydration'
      );
      expect(hydrationRec).toBeDefined();
      expect(hydrationRec?.priority).toBe('high');
      expect(hydrationRec?.foods).toContain('수박');
    });

    it('트러블 있을 시 트러블 진정 식품을 추천한다', () => {
      const result = getSkinNutritionInsight(warningSkin);

      const troubleRec = result.foodRecommendations.find(
        (r) => r.relatedMetric === 'trouble'
      );
      expect(troubleRec).toBeDefined();
      expect(troubleRec?.foods).toContain('브로콜리');
    });

    it('수분 부족 시 수분 인사이트 우선순위가 높다', () => {
      const result = getSkinNutritionInsight(warningSkin);

      expect(result.hydrationInsight?.priority).toBe('high');
      expect(result.hydrationInsight?.targetMl).toBe(2500);
    });
  });

  describe('우선순위 정렬', () => {
    const mixedSkin: SkinAnalysisSummary = {
      hydration: 'normal',
      oil: 'good',
      pores: 'warning',
      wrinkles: 'warning',
      elasticity: 'normal',
      pigmentation: 'good',
      trouble: 'good',
    };

    it('high 우선순위가 먼저 정렬된다', () => {
      const result = getSkinNutritionInsight(mixedSkin);

      // wrinkles(warning=high)가 pores(warning=medium)보다 먼저
      const priorities = result.foodRecommendations.map((r) => r.priority);
      expect(priorities[0]).toBe('high');
    });

    it('최대 3개까지만 추천한다', () => {
      const allWarningSkin: SkinAnalysisSummary = {
        hydration: 'warning',
        oil: 'warning',
        pores: 'warning',
        wrinkles: 'warning',
        elasticity: 'warning',
        pigmentation: 'warning',
        trouble: 'warning',
      };

      const result = getSkinNutritionInsight(allWarningSkin);

      expect(result.foodRecommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('현재 수분량 연동', () => {
    const normalSkin: SkinAnalysisSummary = {
      hydration: 'normal',
      oil: 'good',
      pores: 'good',
      wrinkles: 'good',
      elasticity: 'good',
      pigmentation: 'good',
      trouble: 'good',
    };

    it('현재 수분량이 인사이트에 포함된다', () => {
      const result = getSkinNutritionInsight(normalSkin, 1500);

      expect(result.hydrationInsight?.currentMl).toBe(1500);
    });
  });

  describe('영양 목표 연동', () => {
    const normalSkin: SkinAnalysisSummary = {
      hydration: 'normal',
      oil: 'good',
      pores: 'good',
      wrinkles: 'good',
      elasticity: 'good',
      pigmentation: 'good',
      trouble: 'good',
    };

    it('피부 개선 목표일 때 추가 메시지가 포함된다', () => {
      const result = getSkinNutritionInsight(normalSkin, undefined, 'skin_improvement');

      expect(result.summaryMessage).toContain('피부 개선 목표');
    });
  });
});

describe('getHydrationTargetFromSkin', () => {
  it('피부 분석 없으면 기본값 2000을 반환한다', () => {
    const target = getHydrationTargetFromSkin(null);

    expect(target).toBe(2000);
  });

  it('수분 부족 시 2500ml를 반환한다', () => {
    const skin: SkinAnalysisSummary = {
      hydration: 'warning',
      oil: 'good',
      pores: 'good',
      wrinkles: 'good',
      elasticity: 'good',
      pigmentation: 'good',
      trouble: 'good',
    };

    const target = getHydrationTargetFromSkin(skin);

    expect(target).toBe(2500);
  });

  it('수분 정상/좋음 시 2000ml를 반환한다', () => {
    const normalSkin: SkinAnalysisSummary = {
      hydration: 'normal',
      oil: 'good',
      pores: 'good',
      wrinkles: 'good',
      elasticity: 'good',
      pigmentation: 'good',
      trouble: 'good',
    };

    const goodSkin: SkinAnalysisSummary = {
      ...normalSkin,
      hydration: 'good',
    };

    expect(getHydrationTargetFromSkin(normalSkin)).toBe(2000);
    expect(getHydrationTargetFromSkin(goodSkin)).toBe(2000);
  });
});

describe('getSkinHydrationMessage', () => {
  const warningSkin: SkinAnalysisSummary = {
    hydration: 'warning',
    oil: 'good',
    pores: 'good',
    wrinkles: 'good',
    elasticity: 'good',
    pigmentation: 'good',
    trouble: 'good',
  };

  it('피부 분석 없으면 빈 문자열을 반환한다', () => {
    const message = getSkinHydrationMessage(null, 1000, 2000);

    expect(message).toBe('');
  });

  it('수분 부족 + 섭취 50% 미만이면 챌린지 메시지를 반환한다', () => {
    const message = getSkinHydrationMessage(warningSkin, 500, 2500);

    expect(message).toContain('챌린지');
  });

  it('수분 부족 + 섭취 50-80%면 격려 메시지를 반환한다', () => {
    const message = getSkinHydrationMessage(warningSkin, 1500, 2500);

    expect(message).toContain('조금만 더');
  });

  it('수분 부족 + 섭취 80% 이상이면 칭찬 메시지를 반환한다', () => {
    const message = getSkinHydrationMessage(warningSkin, 2000, 2500);

    expect(message).toContain('잘하고 있어요');
  });

  it('목표 100% 달성 시 축하 메시지를 반환한다', () => {
    const normalSkin: SkinAnalysisSummary = {
      ...warningSkin,
      hydration: 'normal',
    };

    const message = getSkinHydrationMessage(normalSkin, 2000, 2000);

    expect(message).toContain('목표 달성');
  });
});

describe('convertSkinMetricsToSummary', () => {
  it('metrics 배열을 SkinAnalysisSummary로 변환한다', () => {
    const metrics = [
      { id: 'hydration', status: 'warning' as const },
      { id: 'oil', status: 'good' as const },
      { id: 'pores', status: 'normal' as const },
      { id: 'wrinkles', status: 'good' as const },
      { id: 'elasticity', status: 'warning' as const },
      { id: 'pigmentation', status: 'normal' as const },
      { id: 'trouble', status: 'good' as const },
    ];

    const summary = convertSkinMetricsToSummary(metrics);

    expect(summary.hydration).toBe('warning');
    expect(summary.oil).toBe('good');
    expect(summary.pores).toBe('normal');
    expect(summary.elasticity).toBe('warning');
  });

  it('누락된 지표는 normal로 설정한다', () => {
    const metrics = [
      { id: 'hydration', status: 'warning' as const },
    ];

    const summary = convertSkinMetricsToSummary(metrics);

    expect(summary.hydration).toBe('warning');
    expect(summary.oil).toBe('normal');
    expect(summary.trouble).toBe('normal');
  });
});

describe('SKIN_FOOD_RECOMMENDATIONS', () => {
  it('모든 피부 지표에 대한 추천이 정의되어 있다', () => {
    const metricKeys = [
      'hydration',
      'oil',
      'pores',
      'wrinkles',
      'elasticity',
      'pigmentation',
      'trouble',
    ];

    metricKeys.forEach((key) => {
      expect(SKIN_FOOD_RECOMMENDATIONS[key as keyof typeof SKIN_FOOD_RECOMMENDATIONS]).toBeDefined();
    });
  });

  it('hydration warning에는 수분 식품이 포함되어 있다', () => {
    const rec = SKIN_FOOD_RECOMMENDATIONS.hydration.warning;

    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('수박');
    expect(rec?.foods).toContain('오이');
  });

  it('trouble warning에는 항염 식품이 포함되어 있다', () => {
    const rec = SKIN_FOOD_RECOMMENDATIONS.trouble.warning;

    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('브로콜리');
    expect(rec?.foods).toContain('강황');
  });

  it('wrinkles warning에는 콜라겐 식품이 포함되어 있다', () => {
    const rec = SKIN_FOOD_RECOMMENDATIONS.wrinkles.warning;

    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('연어');
    expect(rec?.foods).toContain('레몬');
  });
});

describe('HYDRATION_TARGETS', () => {
  it('모든 상태에 대한 목표가 정의되어 있다', () => {
    expect(HYDRATION_TARGETS.good).toBeDefined();
    expect(HYDRATION_TARGETS.normal).toBeDefined();
    expect(HYDRATION_TARGETS.warning).toBeDefined();
  });

  it('warning 상태의 목표가 가장 높다', () => {
    expect(HYDRATION_TARGETS.warning.targetMl).toBeGreaterThan(
      HYDRATION_TARGETS.normal.targetMl
    );
  });

  it('각 상태에 메시지가 있다', () => {
    expect(HYDRATION_TARGETS.good.message).toBeTruthy();
    expect(HYDRATION_TARGETS.normal.message).toBeTruthy();
    expect(HYDRATION_TARGETS.warning.message).toBeTruthy();
  });
});
