import { describe, it, expect } from 'vitest';
import {
  inferIntensity,
  estimateCaloriesBurned,
  getPostWorkoutNutritionTips,
  getQuickNutritionMessage,
  calculateProteinRecommendation,
  CALORIE_RATES,
  PROTEIN_TIPS,
  MEAL_TIPS,
  HYDRATION_TIPS,
  TIMING,
  type WorkoutType,
} from '@/lib/workout/nutritionTips';

describe('nutritionTips', () => {
  describe('inferIntensity', () => {
    it('flexer는 항상 low 강도', () => {
      expect(inferIntensity('flexer', 60)).toBe('low');
      expect(inferIntensity('flexer', 10)).toBe('low');
    });

    it('burner(유산소)는 시간에 따라 강도 증가', () => {
      expect(inferIntensity('burner', 15)).toBe('low');
      expect(inferIntensity('burner', 25)).toBe('medium');
      expect(inferIntensity('burner', 45)).toBe('high');
    });

    it('builder(근력)는 짧아도 고강도 가능', () => {
      expect(inferIntensity('builder', 10)).toBe('low');
      expect(inferIntensity('builder', 20)).toBe('medium');
      expect(inferIntensity('builder', 35)).toBe('high');
    });

    it('toner, mover는 중간 정도 기준', () => {
      expect(inferIntensity('toner', 20)).toBe('low');
      expect(inferIntensity('toner', 30)).toBe('medium');
      expect(inferIntensity('toner', 50)).toBe('high');

      expect(inferIntensity('mover', 20)).toBe('low');
      expect(inferIntensity('mover', 30)).toBe('medium');
      expect(inferIntensity('mover', 50)).toBe('high');
    });
  });

  describe('estimateCaloriesBurned', () => {
    it('운동 타입별 기본 칼로리율 적용', () => {
      // builder: 8 kcal/분, 30분, 60kg
      const builder = estimateCaloriesBurned('builder', 30, 60);
      expect(builder.total).toBe(240); // 8 * 30

      // burner: 10 kcal/분, 30분, 60kg
      const burner = estimateCaloriesBurned('burner', 30, 60);
      expect(burner.total).toBe(300); // 10 * 30
    });

    it('체중에 따라 칼로리 보정', () => {
      const light = estimateCaloriesBurned('builder', 30, 50);
      const heavy = estimateCaloriesBurned('builder', 30, 70);

      expect(light.total).toBeLessThan(heavy.total);
    });

    it('perMinute 값이 올바르게 계산됨', () => {
      const result = estimateCaloriesBurned('toner', 30, 60);
      expect(result.perMinute).toBe(6); // toner: 6 kcal/분
    });
  });

  describe('getPostWorkoutNutritionTips', () => {
    it('builder 운동에 대한 팁 반환', () => {
      const tips = getPostWorkoutNutritionTips('builder', 30);

      expect(tips.proteinTips.length).toBeGreaterThan(0);
      expect(tips.mealTips.length).toBeGreaterThan(0);
      expect(tips.hydrationTip).toBeDefined();
      expect(tips.timing.optimal).toBe('30분 이내');
    });

    it('flexer 운동에 대한 가벼운 팁 반환', () => {
      const tips = getPostWorkoutNutritionTips('flexer', 20);

      expect(tips.proteinTips.length).toBeGreaterThan(0);
      expect(tips.hydrationTip.priority).toBe('low');
      expect(tips.timing.optimal).toBe('식사 시간에 맞춰');
    });

    it('burner 운동에 탄수화물 관련 팁 포함', () => {
      const tips = getPostWorkoutNutritionTips('burner', 40);

      const hasCarbs = tips.mealTips.some((tip) => tip.category === 'carbs');
      expect(hasCarbs).toBe(true);
    });

    it('고강도 운동에 high priority 수분 팁 반환', () => {
      const tips = getPostWorkoutNutritionTips('builder', 45);
      expect(tips.hydrationTip.priority).toBe('high');
    });
  });

  describe('getQuickNutritionMessage', () => {
    it('builder 운동 메시지에 단백질 언급', () => {
      const message = getQuickNutritionMessage('builder', 30, 200);

      expect(message.icon).toBe('💪');
      expect(message.message).toContain('200kcal');
      expect(message.message).toContain('단백질');
    });

    it('burner 운동 메시지에 탄수화물 언급', () => {
      const message = getQuickNutritionMessage('burner', 30, 300);

      expect(message.icon).toBe('🔥');
      expect(message.message).toContain('탄수화물');
    });

    it('caloriesBurned가 없으면 자동 계산', () => {
      const message = getQuickNutritionMessage('toner', 30);

      // toner 30분 = 6 * 30 = 180kcal
      expect(message.message).toContain('180kcal');
    });
  });

  describe('calculateProteinRecommendation', () => {
    it('builder는 높은 단백질 권장', () => {
      const rec = calculateProteinRecommendation('builder', 60);

      expect(rec.min).toBe(15); // 60 * 0.25
      expect(rec.max).toBe(24); // 60 * 0.4
      expect(rec.unit).toBe('g');
    });

    it('burner는 중간 단백질 권장', () => {
      const rec = calculateProteinRecommendation('burner', 60);

      expect(rec.min).toBe(9);  // 60 * 0.15
      expect(rec.max).toBe(15); // 60 * 0.25
    });

    it('flexer는 낮은 단백질 권장', () => {
      const rec = calculateProteinRecommendation('flexer', 60);

      expect(rec.min).toBe(9);  // 60 * 0.15
      expect(rec.max).toBe(18); // 60 * 0.3
    });
  });

  describe('상수 정의', () => {
    it('모든 운동 타입에 칼로리율 정의', () => {
      const types: WorkoutType[] = ['toner', 'builder', 'burner', 'mover', 'flexer'];
      types.forEach((type) => {
        expect(CALORIE_RATES[type]).toBeGreaterThan(0);
      });
    });

    it('모든 운동 타입에 단백질 팁 정의', () => {
      const types: WorkoutType[] = ['toner', 'builder', 'burner', 'mover', 'flexer'];
      types.forEach((type) => {
        expect(PROTEIN_TIPS[type]).toBeDefined();
        expect(PROTEIN_TIPS[type].length).toBeGreaterThan(0);
      });
    });

    it('모든 운동 타입에 식사 팁 정의', () => {
      const types: WorkoutType[] = ['toner', 'builder', 'burner', 'mover', 'flexer'];
      types.forEach((type) => {
        expect(MEAL_TIPS[type]).toBeDefined();
        expect(MEAL_TIPS[type].length).toBeGreaterThan(0);
      });
    });

    it('모든 강도에 수분 팁 정의', () => {
      expect(HYDRATION_TIPS.low).toBeDefined();
      expect(HYDRATION_TIPS.medium).toBeDefined();
      expect(HYDRATION_TIPS.high).toBeDefined();
    });

    it('모든 운동 타입에 타이밍 정의', () => {
      const types: WorkoutType[] = ['toner', 'builder', 'burner', 'mover', 'flexer'];
      types.forEach((type) => {
        expect(TIMING[type].optimal).toBeDefined();
        expect(TIMING[type].deadline).toBeDefined();
      });
    });
  });
});
