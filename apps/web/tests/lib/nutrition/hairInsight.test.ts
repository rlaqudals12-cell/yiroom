/**
 * N-1 H-1 헤어 연동 인사이트 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getHairNutritionInsight,
  convertHairMetricsToSummary,
  HAIR_FOOD_RECOMMENDATIONS,
  type HairAnalysisSummary,
  type SkinSummaryForHair,
} from '@/lib/nutrition/hairInsight';

describe('getHairNutritionInsight', () => {
  describe('헤어 분석 없음', () => {
    it('null 입력 시 hasAnalysis가 false다', () => {
      const result = getHairNutritionInsight(null);

      expect(result.hasAnalysis).toBe(false);
      expect(result.foodRecommendations).toHaveLength(0);
      expect(result.scalpSkinCorrelation).toBeNull();
    });

    it('null 입력 시 안내 메시지를 반환한다', () => {
      const result = getHairNutritionInsight(null);

      expect(result.summaryMessage).toContain('H-1 헤어 분석');
    });
  });

  describe('헤어 분석 있음 - 정상 상태', () => {
    const goodHair: HairAnalysisSummary = {
      scalpDryness: 'good',
      scalpOil: 'good',
      hairDamage: 'good',
      hairLoss: 'good',
      hairDensity: 'good',
    };

    it('모든 지표가 좋으면 음식 추천이 없다', () => {
      const result = getHairNutritionInsight(goodHair);

      expect(result.hasAnalysis).toBe(true);
      expect(result.foodRecommendations).toHaveLength(0);
    });

    it('모든 지표가 좋으면 긍정적 메시지를 반환한다', () => {
      const result = getHairNutritionInsight(goodHair);

      expect(result.summaryMessage).toContain('좋아요');
    });

    it('상관관계가 null이다', () => {
      const result = getHairNutritionInsight(goodHair);

      expect(result.scalpSkinCorrelation).toBeNull();
    });
  });

  describe('헤어 분석 있음 - normal 상태', () => {
    it('hairDamage가 normal이면 유지 식품을 추천한다', () => {
      const normalHair: HairAnalysisSummary = {
        scalpDryness: 'good',
        scalpOil: 'good',
        hairDamage: 'normal',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(normalHair);

      const damageRec = result.foodRecommendations.find((r) => r.relatedMetric === 'hairDamage');
      expect(damageRec).toBeDefined();
      expect(damageRec?.priority).toBe('low');
    });
  });

  describe('헤어 분석 있음 - 경고 상태', () => {
    it('두피 건조 경고 시 오메가3 식품을 추천한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair);

      const dryRec = result.foodRecommendations.find((r) => r.relatedMetric === 'scalpDryness');
      expect(dryRec).toBeDefined();
      expect(dryRec?.priority).toBe('high');
      expect(dryRec?.foods).toContain('연어');
    });

    it('탈모 경고 시 철분/아연 식품을 추천한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'good',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'warning',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair);

      const lossRec = result.foodRecommendations.find((r) => r.relatedMetric === 'hairLoss');
      expect(lossRec).toBeDefined();
      expect(lossRec?.foods).toContain('시금치');
      expect(lossRec?.foods).toContain('호박씨');
    });

    it('모발 손상 경고 시 단백질 식품을 추천한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'good',
        scalpOil: 'good',
        hairDamage: 'warning',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair);

      const damageRec = result.foodRecommendations.find((r) => r.relatedMetric === 'hairDamage');
      expect(damageRec).toBeDefined();
      expect(damageRec?.priority).toBe('high');
      expect(damageRec?.foods).toContain('달걀');
    });
  });

  describe('우선순위 정렬', () => {
    it('high 우선순위가 medium보다 먼저 정렬된다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning', // high
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'warning', // medium
      };

      const result = getHairNutritionInsight(hair);

      expect(result.foodRecommendations[0].priority).toBe('high');
    });

    it('정렬 순서가 high > medium > low다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning', // high
        scalpOil: 'good',
        hairDamage: 'normal', // low (normal 추천)
        hairLoss: 'good',
        hairDensity: 'warning', // medium
      };

      const result = getHairNutritionInsight(hair);

      const priorities = result.foodRecommendations.map((r) => r.priority);
      const order = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < priorities.length; i++) {
        expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
      }
    });
  });

  describe('최대 개수 제한', () => {
    it('음식 추천은 최대 3개까지만 반환한다', () => {
      const allWarning: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'warning',
        hairDamage: 'warning',
        hairLoss: 'warning',
        hairDensity: 'warning',
      };

      const result = getHairNutritionInsight(allWarning);

      expect(result.foodRecommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('요약 메시지', () => {
    it('경고 3개 이상이면 종합 케어 메시지를 반환한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'warning',
        hairDamage: 'warning',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair);

      expect(result.summaryMessage).toContain('신경쓰면 좋아요');
    });

    it('경고 1~2개이면 맞춤 관리 메시지를 반환한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair);

      expect(result.summaryMessage).toContain('맞는 영양 관리');
    });

    it('경고 0개이면 긍정 메시지를 반환한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'good',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair);

      expect(result.summaryMessage).toContain('좋아요');
    });
  });

  describe('두피-피부 상관관계 (H-1 + S-1)', () => {
    it('skinSummary 없으면 상관관계가 null이다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair, null);

      expect(result.scalpSkinCorrelation).toBeNull();
    });

    it('skinSummary undefined면 상관관계가 null이다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };

      const result = getHairNutritionInsight(hair);

      expect(result.scalpSkinCorrelation).toBeNull();
    });

    it('두피 건조 + 피부 건조 시 전신 수분 부족 인사이트를 반환한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };
      const skin: SkinSummaryForHair = {
        hydration: 'warning',
        oil: 'good',
        trouble: 'good',
      };

      const result = getHairNutritionInsight(hair, skin);

      expect(result.scalpSkinCorrelation).not.toBeNull();
      expect(result.scalpSkinCorrelation?.title).toContain('수분 부족');
      expect(result.scalpSkinCorrelation?.priority).toBe('high');
      expect(result.scalpSkinCorrelation?.sharedNutrients).toContain('오메가3');
    });

    it('두피 유분 + 피부 유분 시 피지 분비 종합 인사이트를 반환한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'good',
        scalpOil: 'warning',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };
      const skin: SkinSummaryForHair = {
        hydration: 'good',
        oil: 'warning',
        trouble: 'good',
      };

      const result = getHairNutritionInsight(hair, skin);

      expect(result.scalpSkinCorrelation).not.toBeNull();
      expect(result.scalpSkinCorrelation?.title).toContain('피지 분비');
      expect(result.scalpSkinCorrelation?.sharedNutrients).toContain('아연');
    });

    it('탈모 + 트러블 시 영양 밸런스 인사이트를 반환한다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'good',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'warning',
        hairDensity: 'good',
      };
      const skin: SkinSummaryForHair = {
        hydration: 'good',
        oil: 'good',
        trouble: 'warning',
      };

      const result = getHairNutritionInsight(hair, skin);

      expect(result.scalpSkinCorrelation).not.toBeNull();
      expect(result.scalpSkinCorrelation?.title).toContain('영양 밸런스');
      expect(result.scalpSkinCorrelation?.sharedNutrients).toContain('오메가3');
    });

    it('매칭되지 않는 조합이면 상관관계가 null이다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };
      const skin: SkinSummaryForHair = {
        hydration: 'good', // 건조하지 않으므로 매칭 안 됨
        oil: 'good',
        trouble: 'good',
      };

      const result = getHairNutritionInsight(hair, skin);

      expect(result.scalpSkinCorrelation).toBeNull();
    });

    it('상관관계가 있으면 요약 메시지에 추가 문구가 포함된다', () => {
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'good',
        hairDamage: 'good',
        hairLoss: 'good',
        hairDensity: 'good',
      };
      const skin: SkinSummaryForHair = {
        hydration: 'warning',
        oil: 'good',
        trouble: 'good',
      };

      const result = getHairNutritionInsight(hair, skin);

      expect(result.summaryMessage).toContain('두피와 피부 상태를 함께');
    });

    it('상관관계 우선순위 (건조 > 유분 > 탈모+트러블)', () => {
      // 건조가 유분보다 먼저 체크됨 (코드 순서)
      const hair: HairAnalysisSummary = {
        scalpDryness: 'warning',
        scalpOil: 'warning',
        hairDamage: 'good',
        hairLoss: 'warning',
        hairDensity: 'good',
      };
      const skin: SkinSummaryForHair = {
        hydration: 'warning',
        oil: 'warning',
        trouble: 'warning',
      };

      const result = getHairNutritionInsight(hair, skin);

      // 건조가 먼저 매칭됨
      expect(result.scalpSkinCorrelation?.title).toContain('수분 부족');
    });
  });
});

describe('convertHairMetricsToSummary', () => {
  it('null 입력 시 null을 반환한다', () => {
    expect(convertHairMetricsToSummary(null)).toBeNull();
  });

  it('숫자 점수를 상태로 변환한다', () => {
    const result = convertHairMetricsToSummary({
      scalpDryness: 30,
      scalpOil: 50,
      hairDamage: 80,
      hairLoss: 10,
      hairDensity: 65,
    });

    expect(result).not.toBeNull();
    expect(result!.scalpDryness).toBe('warning');
    expect(result!.scalpOil).toBe('normal');
    expect(result!.hairDamage).toBe('good');
    expect(result!.hairLoss).toBe('warning');
    expect(result!.hairDensity).toBe('normal');
  });

  it('snake_case 키도 처리한다', () => {
    const result = convertHairMetricsToSummary({
      scalp_dryness: 20,
      scalp_oil: 50,
      damage_level: 80,
      hair_loss: 30,
      density: 90,
    });

    expect(result).not.toBeNull();
    expect(result!.scalpDryness).toBe('warning');
    expect(result!.scalpOil).toBe('normal');
    expect(result!.hairDamage).toBe('good');
    expect(result!.hairLoss).toBe('warning');
    expect(result!.hairDensity).toBe('good');
  });

  it('값이 없으면 50(normal)으로 기본 처리한다', () => {
    const result = convertHairMetricsToSummary({});

    expect(result).not.toBeNull();
    expect(result!.scalpDryness).toBe('normal');
    expect(result!.hairLoss).toBe('normal');
  });

  it('경계값 정확히 처리한다', () => {
    const result = convertHairMetricsToSummary({
      scalpDryness: 39,
      scalpOil: 40,
      hairDamage: 69,
      hairLoss: 70,
      hairDensity: 0,
    });

    expect(result!.scalpDryness).toBe('warning');
    expect(result!.scalpOil).toBe('normal');
    expect(result!.hairDamage).toBe('normal');
    expect(result!.hairLoss).toBe('good');
    expect(result!.hairDensity).toBe('warning');
  });
});

describe('HAIR_FOOD_RECOMMENDATIONS', () => {
  it('모든 헤어 지표에 대한 추천이 정의되어 있다', () => {
    const keys = ['scalpDryness', 'scalpOil', 'hairDamage', 'hairLoss', 'hairDensity'];
    keys.forEach((key) => {
      expect(
        HAIR_FOOD_RECOMMENDATIONS[key as keyof typeof HAIR_FOOD_RECOMMENDATIONS]
      ).toBeDefined();
    });
  });

  it('scalpDryness warning에 오메가3 식품이 포함되어 있다', () => {
    const rec = HAIR_FOOD_RECOMMENDATIONS.scalpDryness.warning;
    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('연어');
    expect(rec?.foods).toContain('아보카도');
  });

  it('hairLoss warning에 철분/아연 식품이 포함되어 있다', () => {
    const rec = HAIR_FOOD_RECOMMENDATIONS.hairLoss.warning;
    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('시금치');
    expect(rec?.foods).toContain('호박씨');
  });

  it('hairDamage normal에 유지 식품이 있다', () => {
    const rec = HAIR_FOOD_RECOMMENDATIONS.hairDamage.normal;
    expect(rec).not.toBeNull();
    expect(rec?.priority).toBe('low');
    expect(rec?.foods).toContain('달걀');
  });
});
