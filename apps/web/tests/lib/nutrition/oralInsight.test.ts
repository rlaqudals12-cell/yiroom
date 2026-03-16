/**
 * N-1 OH-1 구강건강 연동 인사이트 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getOralNutritionInsight,
  convertOralMetricsToSummary,
  ORAL_FOOD_RECOMMENDATIONS,
  ORAL_SUPPLEMENT_RECOMMENDATIONS,
  type OralAnalysisSummary,
} from '@/lib/nutrition/oralInsight';

describe('getOralNutritionInsight', () => {
  describe('구강 분석 없음', () => {
    it('null 입력 시 hasAnalysis가 false다', () => {
      const result = getOralNutritionInsight(null);

      expect(result.hasAnalysis).toBe(false);
      expect(result.foodRecommendations).toHaveLength(0);
      expect(result.supplementRecommendations).toHaveLength(0);
    });

    it('null 입력 시 안내 메시지를 반환한다', () => {
      const result = getOralNutritionInsight(null);

      expect(result.summaryMessage).toContain('OH-1 구강건강 분석');
    });
  });

  describe('구강 분석 있음 - 정상 상태', () => {
    const goodOral: OralAnalysisSummary = {
      cavityRisk: 'good',
      gumHealth: 'good',
      sensitivity: 'good',
      plaque: 'good',
      badBreath: 'good',
    };

    it('모든 지표가 좋으면 유지 목적의 low 우선순위 추천을 반환한다', () => {
      const result = getOralNutritionInsight(goodOral);

      expect(result.hasAnalysis).toBe(true);
      // good 등급에서도 유지 식품을 추천 (low 우선순위)
      expect(result.foodRecommendations.length).toBeGreaterThan(0);
      result.foodRecommendations.forEach((rec) => {
        expect(rec.priority).toBe('low');
      });
    });

    it('모든 지표가 좋으면 긍정적 메시지를 반환한다', () => {
      const result = getOralNutritionInsight(goodOral);

      expect(result.summaryMessage).toContain('좋아요');
    });

    it('모든 지표가 좋으면 영양제 추천이 없다', () => {
      const result = getOralNutritionInsight(goodOral);

      expect(result.supplementRecommendations).toHaveLength(0);
    });
  });

  describe('구강 분석 있음 - normal 상태', () => {
    const normalOral: OralAnalysisSummary = {
      cavityRisk: 'normal',
      gumHealth: 'normal',
      sensitivity: 'normal',
      plaque: 'normal',
      badBreath: 'normal',
    };

    it('cavityRisk가 normal이면 치아 건강 유지 식품을 추천한다', () => {
      const result = getOralNutritionInsight(normalOral);

      // cavityRisk의 normal은 음식 추천이 있음
      const cavityRec = result.foodRecommendations.find((r) => r.relatedMetric === 'cavityRisk');
      expect(cavityRec).toBeDefined();
      expect(cavityRec?.priority).toBe('low');
    });
  });

  describe('구강 분석 있음 - 경고 상태', () => {
    it('충치 위험 경고 시 칼슘 식품을 추천한다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'warning',
        gumHealth: 'good',
        sensitivity: 'good',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      const cavityRec = result.foodRecommendations.find((r) => r.relatedMetric === 'cavityRisk');
      expect(cavityRec).toBeDefined();
      expect(cavityRec?.priority).toBe('high');
      expect(cavityRec?.foods).toContain('치즈');
      expect(cavityRec?.avoidFoods).toContain('사탕');
    });

    it('잇몸 건강 경고 시 비타민C 식품을 추천한다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'good',
        gumHealth: 'warning',
        sensitivity: 'good',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      const gumRec = result.foodRecommendations.find((r) => r.relatedMetric === 'gumHealth');
      expect(gumRec).toBeDefined();
      expect(gumRec?.foods).toContain('키위');
    });

    it('경고 시 관련 영양제를 추천한다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'warning',
        gumHealth: 'good',
        sensitivity: 'good',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      expect(result.supplementRecommendations.length).toBeGreaterThan(0);
      const calciumSupp = result.supplementRecommendations.find((s) => s.name === '칼슘');
      expect(calciumSupp).toBeDefined();
      expect(calciumSupp?.priority).toBe('high');
    });
  });

  describe('우선순위 정렬', () => {
    it('high 우선순위가 먼저 정렬된다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'good',
        gumHealth: 'good',
        sensitivity: 'good',
        plaque: 'warning',
        badBreath: 'warning',
      };

      const result = getOralNutritionInsight(oral);

      // plaque, badBreath 모두 medium이므로 순서 유지
      const priorities = result.foodRecommendations.map((r) => r.priority);
      for (let i = 1; i < priorities.length; i++) {
        const order = { high: 0, medium: 1, low: 2 };
        expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
      }
    });

    it('high 경고와 medium 경고 혼합 시 high가 먼저다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'warning', // high
        gumHealth: 'good',
        sensitivity: 'good',
        plaque: 'warning', // medium
        badBreath: 'warning', // medium
      };

      const result = getOralNutritionInsight(oral);

      expect(result.foodRecommendations[0].priority).toBe('high');
    });
  });

  describe('최대 개수 제한', () => {
    it('음식 추천은 최대 3개까지만 반환한다', () => {
      const allWarning: OralAnalysisSummary = {
        cavityRisk: 'warning',
        gumHealth: 'warning',
        sensitivity: 'warning',
        plaque: 'warning',
        badBreath: 'warning',
      };

      const result = getOralNutritionInsight(allWarning);

      expect(result.foodRecommendations.length).toBeLessThanOrEqual(3);
    });

    it('영양제 추천은 최대 3개까지만 반환한다', () => {
      const allWarning: OralAnalysisSummary = {
        cavityRisk: 'warning',
        gumHealth: 'warning',
        sensitivity: 'warning',
        plaque: 'warning',
        badBreath: 'warning',
      };

      const result = getOralNutritionInsight(allWarning);

      expect(result.supplementRecommendations.length).toBeLessThanOrEqual(3);
    });

    it('중복 영양제는 제거된다', () => {
      // cavityRisk + sensitivity 모두 칼슘 추천하지만 중복 제거
      const oral: OralAnalysisSummary = {
        cavityRisk: 'warning',
        gumHealth: 'good',
        sensitivity: 'warning',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      const names = result.supplementRecommendations.map((s) => s.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('요약 메시지', () => {
    it('경고 3개 이상이면 종합 관리 메시지를 반환한다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'warning',
        gumHealth: 'warning',
        sensitivity: 'warning',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      expect(result.summaryMessage).toContain('관심이 필요');
    });

    it('경고 1~2개이면 맞춤 관리 메시지를 반환한다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'warning',
        gumHealth: 'good',
        sensitivity: 'good',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      expect(result.summaryMessage).toContain('맞춤 영양 관리');
    });

    it('경고 0개, good 4개 이상이면 "매우 좋아요" 메시지를 반환한다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'good',
        gumHealth: 'good',
        sensitivity: 'good',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      expect(result.summaryMessage).toContain('매우 좋아요');
    });

    it('경고 0개, good 3개 이하면 "양호" 메시지를 반환한다', () => {
      const oral: OralAnalysisSummary = {
        cavityRisk: 'normal',
        gumHealth: 'normal',
        sensitivity: 'good',
        plaque: 'good',
        badBreath: 'good',
      };

      const result = getOralNutritionInsight(oral);

      expect(result.summaryMessage).toContain('양호');
    });
  });
});

describe('convertOralMetricsToSummary', () => {
  it('null 입력 시 null을 반환한다', () => {
    expect(convertOralMetricsToSummary(null)).toBeNull();
  });

  it('숫자 점수를 상태로 변환한다 (40 미만 = warning)', () => {
    const result = convertOralMetricsToSummary({
      cavityRisk: 30,
      gumHealth: 50,
      sensitivity: 80,
      plaque: 10,
      badBreath: 65,
    });

    expect(result).not.toBeNull();
    expect(result!.cavityRisk).toBe('warning');
    expect(result!.gumHealth).toBe('normal');
    expect(result!.sensitivity).toBe('good');
    expect(result!.plaque).toBe('warning');
    expect(result!.badBreath).toBe('normal');
  });

  it('snake_case 키도 처리한다', () => {
    const result = convertOralMetricsToSummary({
      cavity_risk: 20,
      gum_health: 50,
      sensitivity: 80,
      plaque_level: 30,
      bad_breath: 90,
    });

    expect(result).not.toBeNull();
    expect(result!.cavityRisk).toBe('warning');
    expect(result!.gumHealth).toBe('normal');
    expect(result!.sensitivity).toBe('good');
    expect(result!.plaque).toBe('warning');
    expect(result!.badBreath).toBe('good');
  });

  it('값이 없으면 50(normal)으로 기본 처리한다', () => {
    const result = convertOralMetricsToSummary({});

    expect(result).not.toBeNull();
    expect(result!.cavityRisk).toBe('normal');
    expect(result!.gumHealth).toBe('normal');
  });

  it('숫자가 아닌 값은 50(normal)으로 기본 처리한다', () => {
    const result = convertOralMetricsToSummary({
      cavityRisk: 'high',
      gumHealth: null,
    });

    expect(result).not.toBeNull();
    expect(result!.cavityRisk).toBe('normal');
    expect(result!.gumHealth).toBe('normal');
  });

  it('경계값 정확히 처리한다 (40 = normal, 70 = good)', () => {
    const result = convertOralMetricsToSummary({
      cavityRisk: 39,
      gumHealth: 40,
      sensitivity: 69,
      plaque: 70,
      badBreath: 100,
    });

    expect(result!.cavityRisk).toBe('warning');
    expect(result!.gumHealth).toBe('normal');
    expect(result!.sensitivity).toBe('normal');
    expect(result!.plaque).toBe('good');
    expect(result!.badBreath).toBe('good');
  });
});

describe('ORAL_FOOD_RECOMMENDATIONS', () => {
  it('모든 구강 지표에 대한 추천이 정의되어 있다', () => {
    const keys = ['cavityRisk', 'gumHealth', 'sensitivity', 'plaque', 'badBreath'];
    keys.forEach((key) => {
      expect(
        ORAL_FOOD_RECOMMENDATIONS[key as keyof typeof ORAL_FOOD_RECOMMENDATIONS]
      ).toBeDefined();
    });
  });

  it('cavityRisk warning에는 칼슘 식품이 포함되어 있다', () => {
    const rec = ORAL_FOOD_RECOMMENDATIONS.cavityRisk.warning;
    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('치즈');
    expect(rec?.foods).toContain('우유');
  });

  it('gumHealth warning에는 비타민C 식품이 포함되어 있다', () => {
    const rec = ORAL_FOOD_RECOMMENDATIONS.gumHealth.warning;
    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('키위');
    expect(rec?.foods).toContain('딸기');
  });

  it('badBreath warning에는 녹차가 포함되어 있다', () => {
    const rec = ORAL_FOOD_RECOMMENDATIONS.badBreath.warning;
    expect(rec).not.toBeNull();
    expect(rec?.foods).toContain('녹차');
  });
});

describe('ORAL_SUPPLEMENT_RECOMMENDATIONS', () => {
  it('cavityRisk warning에 칼슘과 비타민D가 포함되어 있다', () => {
    const recs = ORAL_SUPPLEMENT_RECOMMENDATIONS.cavityRisk.warning;
    expect(recs).not.toBeNull();
    const names = recs!.map((r) => r.name);
    expect(names).toContain('칼슘');
    expect(names).toContain('비타민D');
  });

  it('gumHealth warning에 비타민C가 포함되어 있다', () => {
    const recs = ORAL_SUPPLEMENT_RECOMMENDATIONS.gumHealth.warning;
    expect(recs).not.toBeNull();
    const names = recs!.map((r) => r.name);
    expect(names).toContain('비타민C');
  });
});
