/**
 * N-1 C-1 체형 연동 인사이트 로직 테스트
 * Task 3.9: C-1 체형 연동 칼로리
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getBodyNutritionInsight,
  convertBodyAnalysisToData,
  getRecommendedCaloriesFromWeight,
  WEIGHT_THRESHOLDS,
  REANALYSIS_CRITERIA,
  BODY_TYPE_CALORIE_ADJUSTMENTS,
  DEFAULT_BASE_CALORIES,
  type BodyAnalysisData,
} from '@/lib/nutrition/bodyInsight';

describe('getBodyNutritionInsight', () => {
  // 테스트용 체형 분석 데이터
  // BodyType: X(균형), A(하체 볼륨), V(상체 볼륨), H(일자), O(라운드), I(마름), Y(어깨넓음), 8(모래시계)
  const createBodyAnalysis = (overrides?: Partial<BodyAnalysisData>): BodyAnalysisData => ({
    bodyType: 'X',
    height: 165,
    weight: 60,
    analyzedAt: new Date('2024-01-01'),
    ...overrides,
  });

  // 날짜 mock 설정
  beforeEach(() => {
    vi.useFakeTimers();
    // 분석 후 2주 경과로 설정
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('체형 분석 없음', () => {
    it('체형 분석이 없으면 hasAnalysis가 false다', () => {
      const result = getBodyNutritionInsight(null);

      expect(result.hasAnalysis).toBe(false);
      expect(result.weightChangeInsight).toBeNull();
    });

    it('체형 분석이 없으면 안내 메시지를 반환한다', () => {
      const result = getBodyNutritionInsight(null);

      expect(result.summaryMessage).toContain('C-1 체형 분석');
    });

    it('체형 분석이 없으면 재분석 유도를 표시한다', () => {
      const result = getBodyNutritionInsight(null);

      expect(result.reanalysisPrompt.shouldPrompt).toBe(true);
      expect(result.reanalysisPrompt.title).toContain('체형 분석');
    });

    it('체형 분석이 없으면 기본 칼로리를 반환한다', () => {
      const result = getBodyNutritionInsight(null, null, 2000);

      expect(result.calorieAdjustment.baseCalories).toBe(2000);
      expect(result.calorieAdjustment.adjustedCalories).toBe(2000);
    });
  });

  describe('체형 분석 있음 - 체중 변화 없음', () => {
    it('현재 체중이 없으면 체중 변화 인사이트가 null이다', () => {
      const bodyAnalysis = createBodyAnalysis();
      const result = getBodyNutritionInsight(bodyAnalysis, null);

      expect(result.hasAnalysis).toBe(true);
      expect(result.weightChangeInsight).toBeNull();
    });

    it('체중 변화가 없으면 stable 상태다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      const result = getBodyNutritionInsight(bodyAnalysis, 60);

      expect(result.weightChangeInsight?.status).toBe('stable');
      expect(result.weightChangeInsight?.message).toContain('안정적');
    });
  });

  describe('체중 감소', () => {
    it('2kg 이상 감소하면 significant_loss다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 62 });
      const result = getBodyNutritionInsight(bodyAnalysis, 59);

      expect(result.weightChangeInsight?.status).toBe('significant_loss');
      expect(result.weightChangeInsight?.weightChange).toBe(-3);
      expect(result.weightChangeInsight?.message).toContain('성공');
    });

    it('1-2kg 감소하면 slight_loss다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      const result = getBodyNutritionInsight(bodyAnalysis, 58.5);

      expect(result.weightChangeInsight?.status).toBe('slight_loss');
      expect(result.weightChangeInsight?.message).toContain('감소');
    });

    it('유의미한 체중 감소 시 재분석을 유도한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 62 });
      const result = getBodyNutritionInsight(bodyAnalysis, 59);

      expect(result.reanalysisPrompt.shouldPrompt).toBe(true);
      expect(result.reanalysisPrompt.reason).toBe('weight_change');
      expect(result.reanalysisPrompt.isPositive).toBe(true);
    });
  });

  describe('체중 증가', () => {
    it('2kg 이상 증가하면 significant_gain이다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      const result = getBodyNutritionInsight(bodyAnalysis, 63);

      expect(result.weightChangeInsight?.status).toBe('significant_gain');
      expect(result.weightChangeInsight?.weightChange).toBe(3);
      expect(result.weightChangeInsight?.message).toContain('증가');
    });

    it('1-2kg 증가하면 slight_gain이다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      const result = getBodyNutritionInsight(bodyAnalysis, 61.5);

      expect(result.weightChangeInsight?.status).toBe('slight_gain');
    });

    it('유의미한 체중 증가 시 재분석을 유도한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      const result = getBodyNutritionInsight(bodyAnalysis, 63);

      expect(result.reanalysisPrompt.shouldPrompt).toBe(true);
      expect(result.reanalysisPrompt.reason).toBe('weight_change');
      expect(result.reanalysisPrompt.isPositive).toBe(false);
    });
  });

  describe('경과 시간 기반 재분석 유도', () => {
    it('4주 이상 경과하면 재분석을 유도한다', () => {
      vi.setSystemTime(new Date('2024-02-01')); // 31일 경과
      const bodyAnalysis = createBodyAnalysis();
      const result = getBodyNutritionInsight(bodyAnalysis, 60);

      expect(result.reanalysisPrompt.shouldPrompt).toBe(true);
      expect(result.reanalysisPrompt.reason).toBe('time_elapsed');
    });

    it('4주 미만이면 경과 시간 기반 재분석을 유도하지 않는다', () => {
      vi.setSystemTime(new Date('2024-01-20')); // 19일 경과
      const bodyAnalysis = createBodyAnalysis();
      const result = getBodyNutritionInsight(bodyAnalysis, 60);

      // 체중 변화가 없고 4주 미만이면 재분석 불필요
      expect(result.reanalysisPrompt.reason).not.toBe('time_elapsed');
    });
  });

  describe('체형별 칼로리 조정', () => {
    it('A자형 체형은 칼로리를 5% 감소한다', () => {
      const bodyAnalysis = createBodyAnalysis({ bodyType: 'A' });
      const result = getBodyNutritionInsight(bodyAnalysis, null, 2000);

      expect(result.calorieAdjustment.adjustedCalories).toBe(1900); // 2000 * 0.95
    });

    it('V자형 체형은 칼로리를 5% 증가한다', () => {
      const bodyAnalysis = createBodyAnalysis({ bodyType: 'V' });
      const result = getBodyNutritionInsight(bodyAnalysis, null, 2000);

      expect(result.calorieAdjustment.adjustedCalories).toBe(2100); // 2000 * 1.05
    });

    it('O자형 체형은 칼로리를 10% 감소한다', () => {
      const bodyAnalysis = createBodyAnalysis({ bodyType: 'O' });
      const result = getBodyNutritionInsight(bodyAnalysis, null, 2000);

      expect(result.calorieAdjustment.adjustedCalories).toBe(1800); // 2000 * 0.90
    });

    it('X자형 체형은 칼로리를 그대로 유지한다', () => {
      const bodyAnalysis = createBodyAnalysis({ bodyType: 'X' });
      const result = getBodyNutritionInsight(bodyAnalysis, null, 2000);

      expect(result.calorieAdjustment.adjustedCalories).toBe(2000);
    });
  });

  describe('영양 목표 연동', () => {
    it('체중 감량 목표면 진행 중 메시지를 표시한다', () => {
      const bodyAnalysis = createBodyAnalysis({ weight: 60 });
      const result = getBodyNutritionInsight(bodyAnalysis, 59, 2000, 'weight_loss');

      // 감량 진행 중이면 재분석 불필요
      expect(result.reanalysisPrompt.reason).toBe('goal_progress');
    });
  });
});

describe('convertBodyAnalysisToData', () => {
  it('DB 결과를 BodyAnalysisData로 변환한다', () => {
    // body_analyses 테이블 실제 컬럼: body_type, height, weight, created_at
    const dbResult = {
      body_type: 'A',
      height: 165,
      weight: 55,
      created_at: '2024-01-01T00:00:00Z',
    };

    const result = convertBodyAnalysisToData(dbResult);

    expect(result?.bodyType).toBe('A');
    expect(result?.height).toBe(165);
    expect(result?.weight).toBe(55);
    // BMI는 height/weight로 자동 계산: 55 / (1.65)^2 ≈ 20.2
    expect(result?.bmi).toBeCloseTo(20.2, 1);
    expect(result?.analyzedAt).toBeInstanceOf(Date);
  });

  it('null 입력 시 null을 반환한다', () => {
    const result = convertBodyAnalysisToData(null);

    expect(result).toBeNull();
  });

  it('height/weight가 없으면 0으로 처리한다', () => {
    const dbResult = {
      body_type: 'X',
      created_at: '2024-01-01T00:00:00Z',
    };

    const result = convertBodyAnalysisToData(dbResult);

    expect(result?.height).toBe(0);
    expect(result?.weight).toBe(0);
  });
});

describe('getRecommendedCaloriesFromWeight', () => {
  const bodyAnalysis: BodyAnalysisData = {
    bodyType: 'X',
    height: 165,
    weight: 60,
    analyzedAt: new Date('2024-01-01'),
  };

  it('체형 분석 없으면 기본 칼로리를 반환한다', () => {
    const calories = getRecommendedCaloriesFromWeight(null, null);

    expect(calories).toBe(DEFAULT_BASE_CALORIES);
  });

  it('체중 감량 목표면 15% 감소한다', () => {
    const calories = getRecommendedCaloriesFromWeight(bodyAnalysis, 60, 'weight_loss');

    expect(calories).toBe(1700); // 2000 * 0.85
  });

  it('근육 증가 목표면 15% 증가한다', () => {
    const calories = getRecommendedCaloriesFromWeight(bodyAnalysis, 60, 'muscle_gain');

    expect(calories).toBe(2300); // 2000 * 1.15
  });

  it('일반 목표면 체형 기반 조정만 적용한다', () => {
    const calories = getRecommendedCaloriesFromWeight(bodyAnalysis, 60);

    expect(calories).toBe(2000); // X자형은 1.0 비율
  });
});

describe('상수 값 검증', () => {
  describe('WEIGHT_THRESHOLDS', () => {
    it('유의미한 변화 임계값은 2kg이다', () => {
      expect(WEIGHT_THRESHOLDS.significant).toBe(2.0);
    });

    it('소폭 변화 임계값은 1kg이다', () => {
      expect(WEIGHT_THRESHOLDS.slight).toBe(1.0);
    });
  });

  describe('REANALYSIS_CRITERIA', () => {
    it('체중 변화 임계값은 2kg이다', () => {
      expect(REANALYSIS_CRITERIA.weightChangeThreshold).toBe(2.0);
    });

    it('경과 일수 임계값은 28일이다', () => {
      expect(REANALYSIS_CRITERIA.daysSinceAnalysisThreshold).toBe(28);
    });
  });

  describe('BODY_TYPE_CALORIE_ADJUSTMENTS', () => {
    it('모든 체형에 대한 조정 비율이 정의되어 있다', () => {
      // BodyType: X, A, V, H, O, I, Y, 8
      const bodyTypes = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

      bodyTypes.forEach((type) => {
        expect(BODY_TYPE_CALORIE_ADJUSTMENTS[type as keyof typeof BODY_TYPE_CALORIE_ADJUSTMENTS]).toBeDefined();
        expect(BODY_TYPE_CALORIE_ADJUSTMENTS[type as keyof typeof BODY_TYPE_CALORIE_ADJUSTMENTS].ratio).toBeGreaterThan(0);
        expect(BODY_TYPE_CALORIE_ADJUSTMENTS[type as keyof typeof BODY_TYPE_CALORIE_ADJUSTMENTS].message).toBeTruthy();
      });
    });
  });

  describe('DEFAULT_BASE_CALORIES', () => {
    it('기본 칼로리는 2000kcal이다', () => {
      expect(DEFAULT_BASE_CALORIES).toBe(2000);
    });
  });
});
