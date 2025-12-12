/**
 * R-1 주간 리포트 집계 로직 테스트
 * Task R-1.2: 주간 집계 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getWeekStart,
  getWeekEnd,
  getDateRange,
  calculateTrend,
  calculateFoodQualityScore,
  calculateConsistencyScore,
  getCalorieBalanceStatus,
  calculateDayScore,
  aggregateMealsByDay,
  aggregateWorkoutsByDay,
  calculateNutritionSummary,
  calculateNutritionAchievement,
  generateWeeklyInsights,
  calculateHighlights,
  generateWeeklyReport,
} from '@/lib/reports/weeklyAggregator';
import type {
  DailyNutrition,
  RawMealRecord,
  RawWaterRecord,
  RawWorkoutLog,
  RawNutritionSettings,
} from '@/types/report';

describe('유틸리티 함수', () => {
  describe('getWeekStart', () => {
    it('월요일을 주 시작으로 반환한다', () => {
      // 2024-01-17 (수요일)
      const result = getWeekStart(new Date('2024-01-17'));
      expect(result).toBe('2024-01-15'); // 월요일
    });

    it('월요일이면 그대로 반환한다', () => {
      const result = getWeekStart(new Date('2024-01-15'));
      expect(result).toBe('2024-01-15');
    });

    it('일요일이면 전 주 월요일을 반환한다', () => {
      const result = getWeekStart(new Date('2024-01-21'));
      expect(result).toBe('2024-01-15');
    });
  });

  describe('getWeekEnd', () => {
    it('주 시작일로부터 6일 후를 반환한다', () => {
      const result = getWeekEnd('2024-01-15');
      expect(result).toBe('2024-01-21'); // 일요일
    });
  });

  describe('getDateRange', () => {
    it('시작일부터 종료일까지 날짜 배열을 반환한다', () => {
      const result = getDateRange('2024-01-15', '2024-01-17');
      expect(result).toEqual(['2024-01-15', '2024-01-16', '2024-01-17']);
    });

    it('같은 날짜면 하나만 반환한다', () => {
      const result = getDateRange('2024-01-15', '2024-01-15');
      expect(result).toEqual(['2024-01-15']);
    });
  });

  describe('calculateTrend', () => {
    it('값이 증가하면 up을 반환한다', () => {
      const values = [100, 100, 120, 130];
      expect(calculateTrend(values)).toBe('up');
    });

    it('값이 감소하면 down을 반환한다', () => {
      const values = [130, 120, 100, 100];
      expect(calculateTrend(values)).toBe('down');
    });

    it('변화가 10% 이내면 stable을 반환한다', () => {
      const values = [100, 100, 102, 105];
      expect(calculateTrend(values)).toBe('stable');
    });

    it('값이 2개 미만이면 stable을 반환한다', () => {
      expect(calculateTrend([100])).toBe('stable');
      expect(calculateTrend([])).toBe('stable');
    });
  });

  describe('calculateFoodQualityScore', () => {
    it('green 비율의 평균을 반환한다', () => {
      const data: DailyNutrition[] = [
        createDailyNutrition({ trafficLightRatio: { green: 60, yellow: 30, red: 10 }, mealsLogged: 2 }),
        createDailyNutrition({ trafficLightRatio: { green: 80, yellow: 15, red: 5 }, mealsLogged: 2 }),
      ];
      expect(calculateFoodQualityScore(data)).toBe(70); // (60 + 80) / 2
    });

    it('식사 기록이 없는 날은 제외한다', () => {
      const data: DailyNutrition[] = [
        createDailyNutrition({ trafficLightRatio: { green: 60, yellow: 30, red: 10 }, mealsLogged: 2 }),
        createDailyNutrition({ trafficLightRatio: { green: 0, yellow: 0, red: 0 }, mealsLogged: 0 }),
      ];
      expect(calculateFoodQualityScore(data)).toBe(60);
    });

    it('데이터가 없으면 0을 반환한다', () => {
      expect(calculateFoodQualityScore([])).toBe(0);
    });
  });

  describe('calculateConsistencyScore', () => {
    it('기록 비율을 퍼센트로 반환한다', () => {
      expect(calculateConsistencyScore(5, 7)).toBe(71); // Math.round(5/7 * 100)
    });

    it('전체 기록하면 100을 반환한다', () => {
      expect(calculateConsistencyScore(7, 7)).toBe(100);
    });

    it('totalDays가 0이면 0을 반환한다', () => {
      expect(calculateConsistencyScore(0, 0)).toBe(0);
    });
  });

  describe('getCalorieBalanceStatus', () => {
    it('목표보다 200 이상 적으면 deficit', () => {
      expect(getCalorieBalanceStatus(1700, 2000)).toBe('deficit');
    });

    it('목표보다 200 이상 많으면 surplus', () => {
      expect(getCalorieBalanceStatus(2300, 2000)).toBe('surplus');
    });

    it('목표와 ±200 이내면 balanced', () => {
      expect(getCalorieBalanceStatus(2100, 2000)).toBe('balanced');
      expect(getCalorieBalanceStatus(1900, 2000)).toBe('balanced');
    });
  });

  describe('calculateDayScore', () => {
    it('목표 90-110% 달성 + 높은 green 비율이면 높은 점수', () => {
      const daily = createDailyNutrition({
        caloriePercent: 100,
        trafficLightRatio: { green: 80, yellow: 15, red: 5 },
        mealsLogged: 3,
      });
      const score = calculateDayScore(daily);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('식사 기록이 없으면 0점', () => {
      const daily = createDailyNutrition({ mealsLogged: 0 });
      expect(calculateDayScore(daily)).toBe(0);
    });

    it('칼로리 목표와 멀수록 점수가 낮다', () => {
      const onTarget = createDailyNutrition({ caloriePercent: 100, mealsLogged: 1 });
      const offTarget = createDailyNutrition({ caloriePercent: 150, mealsLogged: 1 });
      expect(calculateDayScore(onTarget)).toBeGreaterThan(calculateDayScore(offTarget));
    });
  });
});

describe('집계 함수', () => {
  describe('aggregateMealsByDay', () => {
    it('날짜별로 식사를 집계한다', () => {
      const meals: RawMealRecord[] = [
        createRawMealRecord({ meal_date: '2024-01-15', total_calories: 500 }),
        createRawMealRecord({ meal_date: '2024-01-15', total_calories: 700 }),
        createRawMealRecord({ meal_date: '2024-01-16', total_calories: 600 }),
      ];
      const dateRange = ['2024-01-15', '2024-01-16', '2024-01-17'];

      const result = aggregateMealsByDay(meals, [], null, dateRange);

      expect(result).toHaveLength(3);
      expect(result[0].calories).toBe(1200); // 500 + 700
      expect(result[0].mealsLogged).toBe(2);
      expect(result[1].calories).toBe(600);
      expect(result[2].calories).toBe(0); // 기록 없음
    });

    it('수분 기록도 집계한다', () => {
      const waterRecords: RawWaterRecord[] = [
        createRawWaterRecord({ record_date: '2024-01-15', effective_ml: 500 }),
        createRawWaterRecord({ record_date: '2024-01-15', effective_ml: 300 }),
      ];
      const dateRange = ['2024-01-15'];

      const result = aggregateMealsByDay([], waterRecords, null, dateRange);

      expect(result[0].water).toBe(800);
    });

    it('설정이 있으면 목표값을 사용한다', () => {
      const settings: RawNutritionSettings = {
        goal: 'weight_loss',
        daily_calories: 1800,
        daily_protein: 100,
        daily_carbs: 200,
        daily_fat: 50,
        daily_water: 2500,
      };
      const dateRange = ['2024-01-15'];

      const result = aggregateMealsByDay([], [], settings, dateRange);

      expect(result[0].calorieTarget).toBe(1800);
    });

    it('칼로리 달성률을 계산한다', () => {
      const meals: RawMealRecord[] = [
        createRawMealRecord({ meal_date: '2024-01-15', total_calories: 1000 }),
      ];
      const settings: RawNutritionSettings = {
        goal: 'maintain',
        daily_calories: 2000,
        daily_protein: 80,
        daily_carbs: 250,
        daily_fat: 55,
        daily_water: 2000,
      };
      const dateRange = ['2024-01-15'];

      const result = aggregateMealsByDay(meals, [], settings, dateRange);

      expect(result[0].caloriePercent).toBe(50); // 1000 / 2000 * 100
    });
  });

  describe('aggregateWorkoutsByDay', () => {
    it('날짜별로 운동을 집계한다', () => {
      const workouts: RawWorkoutLog[] = [
        createRawWorkoutLog({ session_date: '2024-01-15', duration: 30, calories_burned: 200, completed_at: '2024-01-15T10:00:00' }),
        createRawWorkoutLog({ session_date: '2024-01-15', duration: 45, calories_burned: 300, completed_at: '2024-01-15T18:00:00' }),
      ];
      const dateRange = ['2024-01-15', '2024-01-16'];

      const result = aggregateWorkoutsByDay(workouts, dateRange);

      expect(result[0].sessions).toBe(2);
      expect(result[0].duration).toBe(75);
      expect(result[0].caloriesBurned).toBe(500);
      expect(result[1].sessions).toBe(0);
    });

    it('완료되지 않은 운동은 제외한다', () => {
      const workouts: RawWorkoutLog[] = [
        createRawWorkoutLog({ session_date: '2024-01-15', duration: 30, completed_at: null }),
      ];
      const dateRange = ['2024-01-15'];

      const result = aggregateWorkoutsByDay(workouts, dateRange);

      expect(result[0].sessions).toBe(0);
    });
  });

  describe('calculateNutritionSummary', () => {
    it('전체 기간의 영양 통계를 계산한다', () => {
      const dailyData: DailyNutrition[] = [
        createDailyNutrition({ calories: 2000, protein: 80, water: 2000, mealsLogged: 3 }),
        createDailyNutrition({ calories: 1800, protein: 70, water: 1500, mealsLogged: 2 }),
        createDailyNutrition({ calories: 0, protein: 0, water: 0, mealsLogged: 0 }), // 기록 없음
      ];

      const result = calculateNutritionSummary(dailyData);

      expect(result.totalCalories).toBe(3800);
      expect(result.avgCaloriesPerDay).toBe(1900); // 3800 / 2 (기록 있는 날만)
      expect(result.daysWithRecords).toBe(2);
      expect(result.mealCount).toBe(5);
    });

    it('기록이 없으면 0을 반환한다', () => {
      const result = calculateNutritionSummary([]);

      expect(result.totalCalories).toBe(0);
      expect(result.avgCaloriesPerDay).toBe(0);
    });
  });

  describe('calculateNutritionAchievement', () => {
    it('목표 대비 달성률을 계산한다', () => {
      const summary = {
        totalCalories: 14000,
        avgCaloriesPerDay: 2000,
        totalProtein: 560,
        avgProteinPerDay: 80,
        totalCarbs: 1750,
        avgCarbsPerDay: 250,
        totalFat: 385,
        avgFatPerDay: 55,
        totalWater: 14000,
        avgWaterPerDay: 2000,
        mealCount: 21,
        daysWithRecords: 7,
      };
      const settings: RawNutritionSettings = {
        goal: 'maintain',
        daily_calories: 2000,
        daily_protein: 80,
        daily_carbs: 250,
        daily_fat: 55,
        daily_water: 2000,
      };

      const result = calculateNutritionAchievement(summary, settings);

      expect(result.caloriesPercent).toBe(100);
      expect(result.proteinPercent).toBe(100);
      expect(result.waterPercent).toBe(100);
    });

    it('설정이 없으면 기본값을 사용한다', () => {
      const summary = {
        totalCalories: 14000,
        avgCaloriesPerDay: 2000,
        totalProtein: 560,
        avgProteinPerDay: 80,
        totalCarbs: 1750,
        avgCarbsPerDay: 250,
        totalFat: 385,
        avgFatPerDay: 55,
        totalWater: 14000,
        avgWaterPerDay: 2000,
        mealCount: 21,
        daysWithRecords: 7,
      };

      const result = calculateNutritionAchievement(summary, null);

      expect(result.caloriesPercent).toBe(100); // 2000 / DEFAULT 2000
    });
  });
});

describe('인사이트 생성', () => {
  describe('generateWeeklyInsights', () => {
    it('칼로리 목표 달성 시 하이라이트를 생성한다', () => {
      const summary = {
        totalCalories: 14000,
        avgCaloriesPerDay: 2000,
        totalProtein: 560,
        avgProteinPerDay: 80,
        totalCarbs: 1750,
        avgCarbsPerDay: 250,
        totalFat: 385,
        avgFatPerDay: 55,
        totalWater: 14000,
        avgWaterPerDay: 2000,
        mealCount: 21,
        daysWithRecords: 7,
      };
      const achievement = {
        caloriesPercent: 100,
        proteinPercent: 100,
        carbsPercent: 100,
        fatPercent: 100,
        waterPercent: 100,
      };
      const trend = {
        caloriesTrend: 'stable' as const,
        waterTrend: 'stable' as const,
        proteinTrend: 'stable' as const,
        foodQualityScore: 70,
        consistencyScore: 100,
      };
      const workoutSummary = {
        totalSessions: 5,
        totalDuration: 150,
        avgDurationPerSession: 30,
        totalCaloriesBurned: 1000,
        daysWithWorkout: 5,
      };

      const result = generateWeeklyInsights(
        summary,
        achievement,
        trend,
        workoutSummary,
        null
      );

      expect(result.highlights.length).toBeGreaterThan(0);
      expect(result.highlights.some(h => h.includes('칼로리'))).toBe(true);
    });

    it('단백질 부족 시 개선 사항을 생성한다', () => {
      const summary = {
        totalCalories: 14000,
        avgCaloriesPerDay: 2000,
        totalProtein: 280,
        avgProteinPerDay: 40,
        totalCarbs: 1750,
        avgCarbsPerDay: 250,
        totalFat: 385,
        avgFatPerDay: 55,
        totalWater: 14000,
        avgWaterPerDay: 2000,
        mealCount: 21,
        daysWithRecords: 7,
      };
      const achievement = {
        caloriesPercent: 100,
        proteinPercent: 50, // 부족
        carbsPercent: 100,
        fatPercent: 100,
        waterPercent: 100,
      };
      const trend = {
        caloriesTrend: 'stable' as const,
        waterTrend: 'stable' as const,
        proteinTrend: 'stable' as const,
        foodQualityScore: 50,
        consistencyScore: 100,
      };
      const workoutSummary = {
        totalSessions: 0,
        totalDuration: 0,
        avgDurationPerSession: 0,
        totalCaloriesBurned: 0,
        daysWithWorkout: 0,
      };

      const result = generateWeeklyInsights(
        summary,
        achievement,
        trend,
        workoutSummary,
        null
      );

      expect(result.improvements.some(i => i.includes('단백질'))).toBe(true);
    });

    it('운동 없을 때 팁을 생성한다', () => {
      const summary = {
        totalCalories: 14000,
        avgCaloriesPerDay: 2000,
        totalProtein: 560,
        avgProteinPerDay: 80,
        totalCarbs: 1750,
        avgCarbsPerDay: 250,
        totalFat: 385,
        avgFatPerDay: 55,
        totalWater: 14000,
        avgWaterPerDay: 2000,
        mealCount: 21,
        daysWithRecords: 7,
      };
      const achievement = {
        caloriesPercent: 100,
        proteinPercent: 100,
        carbsPercent: 100,
        fatPercent: 100,
        waterPercent: 100,
      };
      const trend = {
        caloriesTrend: 'stable' as const,
        waterTrend: 'stable' as const,
        proteinTrend: 'stable' as const,
        foodQualityScore: 70,
        consistencyScore: 100,
      };
      const workoutSummary = {
        totalSessions: 0,
        totalDuration: 0,
        avgDurationPerSession: 0,
        totalCaloriesBurned: 0,
        daysWithWorkout: 0,
      };

      const result = generateWeeklyInsights(
        summary,
        achievement,
        trend,
        workoutSummary,
        null
      );

      expect(result.tips.some(t => t.includes('운동'))).toBe(true);
    });
  });

  describe('calculateHighlights', () => {
    it('가장 점수가 높은 날과 낮은 날을 반환한다', () => {
      const dailyData: DailyNutrition[] = [
        createDailyNutrition({
          date: '2024-01-15',
          caloriePercent: 100,
          trafficLightRatio: { green: 80, yellow: 15, red: 5 },
          mealsLogged: 3,
        }),
        createDailyNutrition({
          date: '2024-01-16',
          caloriePercent: 50,
          trafficLightRatio: { green: 20, yellow: 30, red: 50 },
          mealsLogged: 2,
        }),
      ];

      const result = calculateHighlights(dailyData);

      expect(result.bestDay).toBe('2024-01-15');
      expect(result.worstDay).toBe('2024-01-16');
      expect(result.bestDayScore).toBeGreaterThan(result.worstDayScore);
    });

    it('데이터가 없으면 null을 반환한다', () => {
      const result = calculateHighlights([]);

      expect(result.bestDay).toBeNull();
      expect(result.worstDay).toBeNull();
    });
  });
});

describe('generateWeeklyReport', () => {
  it('모든 데이터가 있을 때 완전한 리포트를 생성한다', () => {
    const meals: RawMealRecord[] = [
      createRawMealRecord({ meal_date: '2024-01-15', total_calories: 2000 }),
      createRawMealRecord({ meal_date: '2024-01-16', total_calories: 1800 }),
    ];
    const waterRecords: RawWaterRecord[] = [
      createRawWaterRecord({ record_date: '2024-01-15', effective_ml: 2000 }),
    ];
    const workoutLogs: RawWorkoutLog[] = [
      createRawWorkoutLog({
        session_date: '2024-01-15',
        duration: 30,
        calories_burned: 200,
        completed_at: '2024-01-15T10:00:00',
      }),
    ];
    const settings: RawNutritionSettings = {
      goal: 'maintain',
      daily_calories: 2000,
      daily_protein: 80,
      daily_carbs: 250,
      daily_fat: 55,
      daily_water: 2000,
    };
    const nutritionStreak = { current: 14, longest: 14, milestone: 14, message: '2주 연속!' };
    const workoutStreak = { current: 3, longest: 5, milestone: 3, message: '3일 연속!' };

    const result = generateWeeklyReport({
      weekStart: '2024-01-15',
      meals,
      waterRecords,
      workoutLogs,
      settings,
      nutritionStreak,
      workoutStreak,
    });

    expect(result.weekStart).toBe('2024-01-15');
    expect(result.weekEnd).toBe('2024-01-21');
    expect(result.nutrition.summary.totalCalories).toBe(3800);
    expect(result.nutrition.dailyBreakdown).toHaveLength(7);
    expect(result.workout.summary.totalSessions).toBe(1);
    expect(result.workout.hasData).toBe(true);
    expect(result.calorieBalance.totalIntake).toBe(3800);
    expect(result.calorieBalance.totalBurned).toBe(200);
    expect(result.streak.nutrition.current).toBe(14);
  });

  it('데이터가 없을 때도 기본 리포트 구조를 반환한다', () => {
    const result = generateWeeklyReport({
      weekStart: '2024-01-15',
      meals: [],
      waterRecords: [],
      workoutLogs: [],
      settings: null,
      nutritionStreak: { current: 0, longest: 0, milestone: null, message: '' },
      workoutStreak: { current: 0, longest: 0, milestone: null, message: '' },
    });

    expect(result.weekStart).toBe('2024-01-15');
    expect(result.nutrition.summary.totalCalories).toBe(0);
    expect(result.nutrition.dailyBreakdown).toHaveLength(7);
    expect(result.workout.hasData).toBe(false);
  });
});

// =====================================================
// 헬퍼 함수
// =====================================================

function createDailyNutrition(overrides: Partial<DailyNutrition> = {}): DailyNutrition {
  return {
    date: '2024-01-15',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
    mealsLogged: 0,
    trafficLightRatio: { green: 0, yellow: 0, red: 0 },
    calorieTarget: 2000,
    caloriePercent: 0,
    ...overrides,
  };
}

function createRawMealRecord(overrides: Partial<RawMealRecord> = {}): RawMealRecord {
  return {
    id: 'meal-1',
    clerk_user_id: 'user-1',
    meal_date: '2024-01-15',
    meal_type: 'lunch',
    foods: [],
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    created_at: '2024-01-15T12:00:00Z',
    ...overrides,
  };
}

function createRawWaterRecord(overrides: Partial<RawWaterRecord> = {}): RawWaterRecord {
  return {
    id: 'water-1',
    clerk_user_id: 'user-1',
    record_date: '2024-01-15',
    amount_ml: 250,
    effective_ml: 250,
    drink_type: 'water',
    ...overrides,
  };
}

function createRawWorkoutLog(overrides: Partial<RawWorkoutLog> = {}): RawWorkoutLog {
  return {
    id: 'workout-1',
    clerk_user_id: 'user-1',
    session_date: '2024-01-15',
    workout_type: 'cardio',
    duration: 30,
    calories_burned: 200,
    completed_at: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}
