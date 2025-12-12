/**
 * N-1 W-1 운동 연동 인사이트 로직 테스트
 * Task 3.8: W-1 운동 연동 알림
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWorkoutNutritionInsight,
  createWorkoutSummary,
  getWorkoutMealMessage,
  CALORIES_PER_MINUTE,
  DEFAULT_CALORIE_TARGET,
  CALORIE_THRESHOLDS,
  type WorkoutSummary,
} from '@/lib/nutrition/workoutInsight';

describe('getWorkoutNutritionInsight', () => {
  describe('운동 데이터 없음', () => {
    it('운동 데이터가 없으면 hasWorkoutData가 false다', () => {
      const result = getWorkoutNutritionInsight(null, 1500);

      expect(result.hasWorkoutData).toBe(false);
      expect(result.workoutSummary.workoutCount).toBe(0);
    });

    it('운동 데이터가 없으면 기본 요약을 반환한다', () => {
      const result = getWorkoutNutritionInsight(null, 1500);

      expect(result.workoutSummary.totalDuration).toBe(0);
      expect(result.workoutSummary.totalCaloriesBurned).toBe(0);
      expect(result.workoutSummary.lastWorkoutTime).toBeNull();
    });
  });

  describe('운동 데이터 있음', () => {
    const workoutSummary: WorkoutSummary = {
      workoutCount: 2,
      totalDuration: 60,
      totalCaloriesBurned: 400,
      lastWorkoutTime: new Date(),
    };

    it('운동 데이터가 있으면 hasWorkoutData가 true다', () => {
      const result = getWorkoutNutritionInsight(workoutSummary, 1800);

      expect(result.hasWorkoutData).toBe(true);
    });

    it('운동 요약 정보를 반환한다', () => {
      const result = getWorkoutNutritionInsight(workoutSummary, 1800);

      expect(result.workoutSummary.workoutCount).toBe(2);
      expect(result.workoutSummary.totalDuration).toBe(60);
      expect(result.workoutSummary.totalCaloriesBurned).toBe(400);
    });
  });

  describe('칼로리 밸런스 계산', () => {
    it('순 칼로리를 계산한다 (섭취 - 소모)', () => {
      const workoutSummary: WorkoutSummary = {
        workoutCount: 1,
        totalDuration: 30,
        totalCaloriesBurned: 200,
        lastWorkoutTime: new Date(),
      };

      const result = getWorkoutNutritionInsight(workoutSummary, 1800, 2000);

      expect(result.calorieBalance.intakeCalories).toBe(1800);
      expect(result.calorieBalance.burnedCalories).toBe(200);
      expect(result.calorieBalance.netCalories).toBe(1600);
    });

    it('목표 대비 퍼센트를 계산한다', () => {
      const result = getWorkoutNutritionInsight(null, 2000, 2000);

      expect(result.calorieBalance.percentage).toBe(100);
    });

    it('목표가 0이면 퍼센트는 0이다', () => {
      const result = getWorkoutNutritionInsight(null, 1000, 0);

      expect(result.calorieBalance.percentage).toBe(0);
    });
  });

  describe('칼로리 밸런스 상태', () => {
    it('목표보다 200kcal 이상 적으면 deficit 상태다', () => {
      const result = getWorkoutNutritionInsight(null, 1700, 2000);

      expect(result.calorieBalance.status).toBe('deficit');
    });

    it('목표보다 200kcal 이상 초과하면 surplus 상태다', () => {
      const result = getWorkoutNutritionInsight(null, 2300, 2000);

      expect(result.calorieBalance.status).toBe('surplus');
    });

    it('목표 ±200kcal 범위면 balanced 상태다', () => {
      const result = getWorkoutNutritionInsight(null, 2100, 2000);

      expect(result.calorieBalance.status).toBe('balanced');
    });

    it('운동으로 칼로리 소모 시 순 칼로리로 상태를 판단한다', () => {
      const workoutSummary: WorkoutSummary = {
        workoutCount: 1,
        totalDuration: 60,
        totalCaloriesBurned: 500,
        lastWorkoutTime: new Date(),
      };

      // 섭취 2500 - 소모 500 = 순 2000 (balanced)
      const result = getWorkoutNutritionInsight(workoutSummary, 2500, 2000);

      expect(result.calorieBalance.netCalories).toBe(2000);
      expect(result.calorieBalance.status).toBe('balanced');
    });
  });

  describe('칼로리 밸런스 메시지', () => {
    it('deficit 상태일 때 간식 추가 메시지를 반환한다', () => {
      const result = getWorkoutNutritionInsight(null, 1500, 2000);

      expect(result.calorieBalance.message).toContain('부족');
      expect(result.calorieBalance.message).toContain('간식');
    });

    it('surplus 상태에서 운동 없으면 운동 추천 메시지를 반환한다', () => {
      const result = getWorkoutNutritionInsight(null, 2500, 2000);

      expect(result.calorieBalance.message).toContain('초과');
      expect(result.calorieBalance.message).toContain('운동');
    });

    it('surplus 상태에서 운동 있으면 소모 칼로리를 언급한다', () => {
      const workoutSummary: WorkoutSummary = {
        workoutCount: 1,
        totalDuration: 30,
        totalCaloriesBurned: 200,
        lastWorkoutTime: new Date(),
      };

      // 섭취 2600 - 소모 200 = 순 2400 (surplus)
      const result = getWorkoutNutritionInsight(workoutSummary, 2600, 2000);

      expect(result.calorieBalance.message).toContain('200kcal');
      expect(result.calorieBalance.message).toContain('소모');
    });

    it('balanced 상태일 때 긍정적 메시지를 반환한다', () => {
      const result = getWorkoutNutritionInsight(null, 2000, 2000);

      expect(result.calorieBalance.message).toContain('목표 범위');
      expect(result.calorieBalance.message).toContain('👍');
    });
  });

  describe('운동 추천', () => {
    it('칼로리 초과 시 운동을 추천한다', () => {
      const result = getWorkoutNutritionInsight(null, 2500, 2000);

      expect(result.recommendation.shouldRecommend).toBe(true);
      expect(result.recommendation.reason).toBe('calorie_surplus');
    });

    it('칼로리 초과 시 추천 운동 시간을 계산한다', () => {
      const result = getWorkoutNutritionInsight(null, 2500, 2000);

      // 500kcal 초과, 분당 7kcal = 약 72분
      expect(result.recommendation.recommendedDuration).toBeGreaterThan(0);
      expect(result.recommendation.estimatedCalories).toBeGreaterThan(0);
    });

    it('오늘 운동 없고 식사량 충분하면 운동을 추천한다', () => {
      // 1500kcal > 2000 * 0.7 = 1400 → 운동 추천
      const result = getWorkoutNutritionInsight(null, 1500, 2000);

      expect(result.recommendation.shouldRecommend).toBe(true);
      expect(result.recommendation.reason).toBe('no_workout_today');
    });

    it('오늘 운동 있으면 추가 운동 추천하지 않는다 (balanced일 때)', () => {
      const workoutSummary: WorkoutSummary = {
        workoutCount: 1,
        totalDuration: 30,
        totalCaloriesBurned: 200,
        lastWorkoutTime: new Date(),
      };

      // 섭취 2000 - 소모 200 = 순 1800 (balanced)
      const result = getWorkoutNutritionInsight(workoutSummary, 2000, 2000);

      expect(result.recommendation.shouldRecommend).toBe(false);
    });

    it('식사량 적으면 운동 추천하지 않는다', () => {
      // 1000kcal < 2000 * 0.7 = 1400 → 운동 추천 안함
      const result = getWorkoutNutritionInsight(null, 1000, 2000);

      // deficit 상태지만 운동 추천은 아님
      expect(result.recommendation.shouldRecommend).toBe(false);
    });
  });

  describe('기본값', () => {
    it('기본 칼로리 목표는 2000kcal다', () => {
      const result = getWorkoutNutritionInsight(null, 2000);

      expect(result.calorieBalance.targetCalories).toBe(DEFAULT_CALORIE_TARGET);
    });
  });
});

describe('createWorkoutSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('빈 배열이면 기본 요약을 반환한다', () => {
    const result = createWorkoutSummary([]);

    expect(result.workoutCount).toBe(0);
    expect(result.totalDuration).toBe(0);
    expect(result.totalCaloriesBurned).toBe(0);
    expect(result.lastWorkoutTime).toBeNull();
  });

  it('null이면 기본 요약을 반환한다', () => {
    const result = createWorkoutSummary(null as unknown as []);

    expect(result.workoutCount).toBe(0);
  });

  it('오늘 완료된 운동만 집계한다', () => {
    const now = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(now);

    const logs = [
      { completed_at: '2024-01-15T08:00:00', actual_duration: 30, actual_calories: 200 },
      { completed_at: '2024-01-15T18:00:00', actual_duration: 45, actual_calories: 300 },
      { completed_at: '2024-01-14T10:00:00', actual_duration: 60, actual_calories: 400 }, // 어제
    ];

    const result = createWorkoutSummary(logs);

    expect(result.workoutCount).toBe(2);
    expect(result.totalDuration).toBe(75); // 30 + 45
    expect(result.totalCaloriesBurned).toBe(500); // 200 + 300
  });

  it('마지막 운동 시간을 반환한다', () => {
    const now = new Date('2024-01-15T20:00:00');
    vi.setSystemTime(now);

    const logs = [
      { completed_at: '2024-01-15T08:00:00', actual_duration: 30, actual_calories: 200 },
      { completed_at: '2024-01-15T18:00:00', actual_duration: 45, actual_calories: 300 },
    ];

    const result = createWorkoutSummary(logs);

    expect(result.lastWorkoutTime).toEqual(new Date('2024-01-15T18:00:00'));
  });

  it('completed_at이 null인 운동은 제외한다', () => {
    const now = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(now);

    const logs = [
      { completed_at: '2024-01-15T08:00:00', actual_duration: 30, actual_calories: 200 },
      { completed_at: null, actual_duration: 45, actual_calories: 300 }, // 완료 안됨
    ];

    const result = createWorkoutSummary(logs);

    expect(result.workoutCount).toBe(1);
    expect(result.totalDuration).toBe(30);
  });

  it('actual_duration/actual_calories가 null이면 0으로 처리한다', () => {
    const now = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(now);

    const logs = [
      { completed_at: '2024-01-15T08:00:00', actual_duration: null, actual_calories: null },
    ];

    const result = createWorkoutSummary(logs);

    expect(result.workoutCount).toBe(1);
    expect(result.totalDuration).toBe(0);
    expect(result.totalCaloriesBurned).toBe(0);
  });
});

describe('getWorkoutMealMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('운동 전이면 탄수화물 식사 추천 메시지를 반환한다', () => {
    const message = getWorkoutMealMessage(null, true);

    expect(message).toContain('운동 2시간 전');
    expect(message).toContain('탄수화물');
  });

  it('운동 직후(2시간 이내)면 회복식 추천 메시지를 반환한다', () => {
    const now = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(now);

    const lastWorkoutTime = new Date('2024-01-15T09:00:00'); // 1시간 전

    const message = getWorkoutMealMessage(lastWorkoutTime);

    expect(message).toContain('운동 직후');
    expect(message).toContain('단백질');
    expect(message).toContain('💪');
  });

  it('운동 후 2시간 이상 지나면 빈 메시지를 반환한다', () => {
    const now = new Date('2024-01-15T12:00:00');
    vi.setSystemTime(now);

    const lastWorkoutTime = new Date('2024-01-15T09:00:00'); // 3시간 전

    const message = getWorkoutMealMessage(lastWorkoutTime);

    expect(message).toBe('');
  });

  it('lastWorkoutTime이 null이면 빈 메시지를 반환한다', () => {
    const message = getWorkoutMealMessage(null);

    expect(message).toBe('');
  });
});

describe('상수', () => {
  describe('CALORIES_PER_MINUTE', () => {
    it('운동 강도별 분당 칼로리가 정의되어 있다', () => {
      expect(CALORIES_PER_MINUTE.light).toBeDefined();
      expect(CALORIES_PER_MINUTE.moderate).toBeDefined();
      expect(CALORIES_PER_MINUTE.intense).toBeDefined();
      expect(CALORIES_PER_MINUTE.strength).toBeDefined();
    });

    it('강도가 높을수록 칼로리가 높다', () => {
      expect(CALORIES_PER_MINUTE.intense).toBeGreaterThan(CALORIES_PER_MINUTE.moderate);
      expect(CALORIES_PER_MINUTE.moderate).toBeGreaterThan(CALORIES_PER_MINUTE.light);
    });
  });

  describe('CALORIE_THRESHOLDS', () => {
    it('deficit/surplus 임계값이 정의되어 있다', () => {
      expect(CALORIE_THRESHOLDS.deficit).toBeDefined();
      expect(CALORIE_THRESHOLDS.surplus).toBeDefined();
    });

    it('deficit은 음수, surplus는 양수다', () => {
      expect(CALORIE_THRESHOLDS.deficit).toBeLessThan(0);
      expect(CALORIE_THRESHOLDS.surplus).toBeGreaterThan(0);
    });
  });
});
