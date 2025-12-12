/**
 * R-1 월간 리포트 집계 로직 테스트
 * Task R-2.1: 월간 집계 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getMonthStart,
  getMonthEnd,
  getMonthRangeFromYYYYMM,
  getWeeksInMonth,
  calculateWeeklySummary,
  calculateBodyProgress,
  calculateGoalProgress,
  generateMonthlyInsights,
  calculateMonthlyHighlights,
  generateMonthlyReport,
} from '@/lib/reports/monthlyAggregator';
import type {
  DailyNutrition,
  DailyWorkout,
  WeeklySummary,
  NutritionSummaryStats,
  NutritionAchievement,
  NutritionTrend,
  WorkoutSummaryStats,
  BodyProgress,
  RawMealRecord,
  RawWaterRecord,
  RawWorkoutLog,
  RawNutritionSettings,
} from '@/types/report';

describe('유틸리티 함수', () => {
  describe('getMonthStart', () => {
    it('월의 첫째 날을 반환한다', () => {
      const result = getMonthStart(new Date('2024-01-15'));
      expect(result).toBe('2024-01-01');
    });

    it('말일에도 첫째 날을 반환한다', () => {
      const result = getMonthStart(new Date('2024-01-31'));
      expect(result).toBe('2024-01-01');
    });
  });

  describe('getMonthEnd', () => {
    it('월의 마지막 날을 반환한다', () => {
      const result = getMonthEnd(new Date('2024-01-15'));
      expect(result).toBe('2024-01-31');
    });

    it('2월의 마지막 날을 정확히 계산한다 (윤년)', () => {
      const result = getMonthEnd(new Date('2024-02-15'));
      expect(result).toBe('2024-02-29'); // 2024년은 윤년
    });

    it('2월의 마지막 날을 정확히 계산한다 (평년)', () => {
      const result = getMonthEnd(new Date('2023-02-15'));
      expect(result).toBe('2023-02-28');
    });
  });

  describe('getMonthRangeFromYYYYMM', () => {
    it('YYYY-MM 형식에서 시작일/종료일을 계산한다', () => {
      const result = getMonthRangeFromYYYYMM('2024-03');
      expect(result.monthStart).toBe('2024-03-01');
      expect(result.monthEnd).toBe('2024-03-31');
    });

    it('12월을 정확히 계산한다', () => {
      const result = getMonthRangeFromYYYYMM('2024-12');
      expect(result.monthStart).toBe('2024-12-01');
      expect(result.monthEnd).toBe('2024-12-31');
    });
  });

  describe('getWeeksInMonth', () => {
    it('월의 주 단위로 나눈다', () => {
      const result = getWeeksInMonth('2024-01-01', '2024-01-31');

      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result[0].weekNum).toBe(1);
      expect(result[0].weekStart).toBe('2024-01-01');
    });

    it('마지막 주는 월 종료일을 넘지 않는다', () => {
      const result = getWeeksInMonth('2024-01-01', '2024-01-31');
      const lastWeek = result[result.length - 1];

      expect(lastWeek.weekEnd).toBe('2024-01-31');
    });
  });
});

describe('주간 요약 계산', () => {
  describe('calculateWeeklySummary', () => {
    it('해당 주 데이터만 집계한다', () => {
      const dailyNutrition: DailyNutrition[] = [
        createDailyNutrition({ date: '2024-01-01', calories: 2000, mealsLogged: 3 }),
        createDailyNutrition({ date: '2024-01-02', calories: 1800, mealsLogged: 2 }),
        createDailyNutrition({ date: '2024-01-08', calories: 2200, mealsLogged: 3 }), // 다른 주
      ];
      const dailyWorkout: DailyWorkout[] = [
        createDailyWorkout({ date: '2024-01-01', sessions: 1 }),
      ];

      const result = calculateWeeklySummary(
        dailyNutrition,
        dailyWorkout,
        '2024-01-01',
        '2024-01-07'
      );

      expect(result.avgCalories).toBe(1900); // (2000 + 1800) / 2
      expect(result.mealCount).toBe(5); // 3 + 2
      expect(result.workoutCount).toBe(1);
    });

    it('데이터가 없는 주는 0을 반환한다', () => {
      const result = calculateWeeklySummary([], [], '2024-01-01', '2024-01-07');

      expect(result.avgCalories).toBe(0);
      expect(result.mealCount).toBe(0);
    });
  });
});

describe('체중 변화 계산', () => {
  describe('calculateBodyProgress', () => {
    it('체중 감소를 계산한다', () => {
      const result = calculateBodyProgress(
        { weight: 70 },
        { weight: 68 },
        'weight_loss'
      );

      expect(result.weightChange).toBe(-2);
      expect(result.message).toContain('감량');
    });

    it('체중 증가를 계산한다', () => {
      const result = calculateBodyProgress(
        { weight: 70 },
        { weight: 72 },
        'muscle'
      );

      expect(result.weightChange).toBe(2);
      expect(result.message).toContain('증가');
    });

    it('2kg 이상 변화 시 재분석 권장', () => {
      const result = calculateBodyProgress(
        { weight: 70 },
        { weight: 68 },
        'weight_loss'
      );

      expect(result.reanalysisRecommended).toBe(true);
    });

    it('시작 체중이 없으면 메시지를 반환한다', () => {
      const result = calculateBodyProgress(null, null, 'maintain');

      expect(result.startWeight).toBeNull();
      expect(result.message).toContain('분석');
    });

    it('안정적인 체중 유지', () => {
      const result = calculateBodyProgress(
        { weight: 70 },
        { weight: 70.3 },
        'maintain'
      );

      expect(result.message).toContain('안정');
    });
  });
});

describe('목표 진행률 계산', () => {
  describe('calculateGoalProgress', () => {
    const bodyProgress: BodyProgress = {
      startWeight: 70,
      endWeight: 69,
      weightChange: -1,
      reanalysisRecommended: false,
      message: '',
    };

    it('체중 감량 목표 달성률을 계산한다', () => {
      const achievement = createAchievement({ caloriesPercent: 95 });

      const result = calculateGoalProgress('weight_loss', achievement, bodyProgress);

      expect(result.goal).toBe('weight_loss');
      expect(result.achievementRate).toBeGreaterThan(0);
      expect(result.isOnTrack).toBe(true);
    });

    it('근육 증가 목표 달성률을 계산한다', () => {
      const achievement = createAchievement({ proteinPercent: 110 });

      const result = calculateGoalProgress('muscle', achievement, bodyProgress);

      expect(result.goal).toBe('muscle');
      expect(result.isOnTrack).toBe(true);
    });

    it('피부 개선 목표는 수분 섭취 기반', () => {
      const achievement = createAchievement({ waterPercent: 90 });

      const result = calculateGoalProgress('skin', achievement, bodyProgress);

      expect(result.goal).toBe('skin');
      expect(result.isOnTrack).toBe(true);
    });

    it('건강 관리 목표는 전체 균형 기반', () => {
      const achievement = createAchievement({
        caloriesPercent: 100,
        proteinPercent: 100,
        carbsPercent: 100,
        fatPercent: 100,
        waterPercent: 100,
      });

      const result = calculateGoalProgress('health', achievement, bodyProgress);

      expect(result.achievementRate).toBe(100);
      expect(result.isOnTrack).toBe(true);
    });
  });
});

describe('월간 인사이트 생성', () => {
  describe('generateMonthlyInsights', () => {
    it('20일 이상 기록 시 하이라이트를 생성한다', () => {
      const summary = createNutritionSummary({ daysWithRecords: 25 });
      const achievement = createAchievement({});
      const trend = createTrend({ consistencyScore: 80 });
      const workoutSummary = createWorkoutSummary({});
      const weeklyComparison: WeeklySummary[] = [];
      const bodyProgress = createBodyProgress({});
      const goalProgress = { goal: 'maintain' as const, achievementRate: 70, message: '', isOnTrack: true };

      const result = generateMonthlyInsights(
        summary,
        achievement,
        trend,
        workoutSummary,
        weeklyComparison,
        bodyProgress,
        goalProgress
      );

      expect(result.highlights.some(h => h.includes('25일'))).toBe(true);
    });

    it('단백질 부족 시 개선 사항을 생성한다', () => {
      const summary = createNutritionSummary({});
      const achievement = createAchievement({ proteinPercent: 60 });
      const trend = createTrend({});
      const workoutSummary = createWorkoutSummary({});
      const weeklyComparison: WeeklySummary[] = [];
      const bodyProgress = createBodyProgress({});
      const goalProgress = { goal: 'maintain' as const, achievementRate: 70, message: '', isOnTrack: true };

      const result = generateMonthlyInsights(
        summary,
        achievement,
        trend,
        workoutSummary,
        weeklyComparison,
        bodyProgress,
        goalProgress
      );

      expect(result.improvements.some(i => i.includes('단백질'))).toBe(true);
    });

    it('목표 달성 시 achievements를 생성한다', () => {
      const summary = createNutritionSummary({});
      const achievement = createAchievement({});
      const trend = createTrend({});
      const workoutSummary = createWorkoutSummary({});
      const weeklyComparison: WeeklySummary[] = [];
      const bodyProgress = createBodyProgress({});
      const goalProgress = { goal: 'weight_loss' as const, achievementRate: 85, message: '', isOnTrack: true };

      const result = generateMonthlyInsights(
        summary,
        achievement,
        trend,
        workoutSummary,
        weeklyComparison,
        bodyProgress,
        goalProgress
      );

      expect(result.achievements?.some(a => a.includes('체중 감량'))).toBe(true);
    });
  });
});

describe('월간 하이라이트', () => {
  describe('calculateMonthlyHighlights', () => {
    it('가장 좋은/나쁜 주를 찾는다', () => {
      const weeklyComparison: WeeklySummary[] = [
        createWeeklySummary({ foodQualityScore: 80, workoutCount: 3 }),
        createWeeklySummary({ foodQualityScore: 50, workoutCount: 1 }),
        createWeeklySummary({ foodQualityScore: 70, workoutCount: 2 }),
      ];

      const result = calculateMonthlyHighlights(weeklyComparison);

      expect(result.bestWeek).toBe(1); // 80점
      expect(result.worstWeek).toBe(2); // 50점
      expect(result.bestWeekScore).toBeGreaterThan(result.worstWeekScore);
    });

    it('데이터가 없으면 null을 반환한다', () => {
      const result = calculateMonthlyHighlights([]);

      expect(result.bestWeek).toBeNull();
      expect(result.worstWeek).toBeNull();
    });
  });
});

describe('generateMonthlyReport', () => {
  it('완전한 월간 리포트를 생성한다', () => {
    const meals: RawMealRecord[] = [
      createRawMealRecord({ meal_date: '2024-01-05', total_calories: 2000 }),
      createRawMealRecord({ meal_date: '2024-01-15', total_calories: 1800 }),
      createRawMealRecord({ meal_date: '2024-01-25', total_calories: 2100 }),
    ];
    const waterRecords: RawWaterRecord[] = [
      createRawWaterRecord({ record_date: '2024-01-05', effective_ml: 2000 }),
    ];
    const workoutLogs: RawWorkoutLog[] = [];
    const settings: RawNutritionSettings = {
      goal: 'maintain',
      daily_calories: 2000,
      daily_protein: 80,
      daily_carbs: 250,
      daily_fat: 55,
      daily_water: 2000,
    };
    const nutritionStreak = { current: 10, longest: 15, milestone: null, message: '' };
    const workoutStreak = { current: 0, longest: 0, milestone: null, message: '' };

    const result = generateMonthlyReport({
      month: '2024-01',
      meals,
      waterRecords,
      workoutLogs,
      settings,
      nutritionStreak,
      workoutStreak,
    });

    expect(result.month).toBe('2024-01');
    expect(result.monthStart).toBe('2024-01-01');
    expect(result.monthEnd).toBe('2024-01-31');
    expect(result.nutrition.summary.totalCalories).toBe(5900);
    expect(result.weeklyComparison.length).toBeGreaterThanOrEqual(4);
    expect(result.goalProgress.goal).toBe('maintain');
  });

  it('데이터가 없을 때도 기본 리포트 구조를 반환한다', () => {
    const result = generateMonthlyReport({
      month: '2024-01',
      meals: [],
      waterRecords: [],
      workoutLogs: [],
      settings: null,
      nutritionStreak: { current: 0, longest: 0, milestone: null, message: '' },
      workoutStreak: { current: 0, longest: 0, milestone: null, message: '' },
    });

    expect(result.month).toBe('2024-01');
    expect(result.nutrition.summary.totalCalories).toBe(0);
    expect(result.weeklyComparison.length).toBeGreaterThanOrEqual(4);
  });

  it('체중 변화를 포함한다', () => {
    const result = generateMonthlyReport({
      month: '2024-01',
      meals: [],
      waterRecords: [],
      workoutLogs: [],
      settings: { goal: 'weight_loss', daily_calories: 1800, daily_protein: 80, daily_carbs: 200, daily_fat: 50, daily_water: 2000 },
      nutritionStreak: { current: 0, longest: 0, milestone: null, message: '' },
      workoutStreak: { current: 0, longest: 0, milestone: null, message: '' },
      bodyAnalysisStart: { weight: 70 },
      bodyAnalysisEnd: { weight: 68 },
    });

    expect(result.bodyProgress.weightChange).toBe(-2);
    expect(result.bodyProgress.reanalysisRecommended).toBe(true);
  });
});

// =====================================================
// 헬퍼 함수
// =====================================================

function createDailyNutrition(overrides: Partial<DailyNutrition> = {}): DailyNutrition {
  return {
    date: '2024-01-01',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
    mealsLogged: 0,
    trafficLightRatio: { green: 50, yellow: 30, red: 20 },
    calorieTarget: 2000,
    caloriePercent: 0,
    ...overrides,
  };
}

function createDailyWorkout(overrides: Partial<DailyWorkout> = {}): DailyWorkout {
  return {
    date: '2024-01-01',
    sessions: 0,
    duration: 0,
    caloriesBurned: 0,
    workoutTypes: [],
    ...overrides,
  };
}

function createWeeklySummary(overrides: Partial<WeeklySummary> = {}): WeeklySummary {
  return {
    weekStart: '2024-01-01',
    weekEnd: '2024-01-07',
    avgCalories: 2000,
    avgWater: 2000,
    avgProtein: 80,
    workoutCount: 0,
    mealCount: 21,
    foodQualityScore: 60,
    ...overrides,
  };
}

function createNutritionSummary(overrides: Partial<NutritionSummaryStats> = {}): NutritionSummaryStats {
  return {
    totalCalories: 60000,
    avgCaloriesPerDay: 2000,
    totalProtein: 2400,
    avgProteinPerDay: 80,
    totalCarbs: 7500,
    avgCarbsPerDay: 250,
    totalFat: 1650,
    avgFatPerDay: 55,
    totalWater: 60000,
    avgWaterPerDay: 2000,
    mealCount: 90,
    daysWithRecords: 30,
    ...overrides,
  };
}

function createAchievement(overrides: Partial<NutritionAchievement> = {}): NutritionAchievement {
  return {
    caloriesPercent: 100,
    proteinPercent: 100,
    carbsPercent: 100,
    fatPercent: 100,
    waterPercent: 100,
    ...overrides,
  };
}

function createTrend(overrides: Partial<NutritionTrend> = {}): NutritionTrend {
  return {
    caloriesTrend: 'stable',
    waterTrend: 'stable',
    proteinTrend: 'stable',
    foodQualityScore: 60,
    consistencyScore: 70,
    ...overrides,
  };
}

function createWorkoutSummary(overrides: Partial<WorkoutSummaryStats> = {}): WorkoutSummaryStats {
  return {
    totalSessions: 0,
    totalDuration: 0,
    avgDurationPerSession: 0,
    totalCaloriesBurned: 0,
    daysWithWorkout: 0,
    ...overrides,
  };
}

function createBodyProgress(overrides: Partial<BodyProgress> = {}): BodyProgress {
  return {
    startWeight: null,
    endWeight: null,
    weightChange: 0,
    reanalysisRecommended: false,
    message: '',
    ...overrides,
  };
}

function createRawMealRecord(overrides: Partial<RawMealRecord> = {}): RawMealRecord {
  return {
    id: 'meal-1',
    clerk_user_id: 'user-1',
    meal_date: '2024-01-01',
    meal_type: 'lunch',
    foods: [],
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    created_at: '2024-01-01T12:00:00Z',
    ...overrides,
  };
}

function createRawWaterRecord(overrides: Partial<RawWaterRecord> = {}): RawWaterRecord {
  return {
    id: 'water-1',
    clerk_user_id: 'user-1',
    record_date: '2024-01-01',
    amount_ml: 250,
    effective_ml: 250,
    drink_type: 'water',
    ...overrides,
  };
}

function _createRawWorkoutLog(overrides: Partial<RawWorkoutLog> = {}): RawWorkoutLog {
  return {
    id: 'workout-1',
    clerk_user_id: 'user-1',
    session_date: '2024-01-01',
    workout_type: 'cardio',
    duration: 30,
    calories_burned: 200,
    completed_at: '2024-01-01T10:00:00Z',
    ...overrides,
  };
}
