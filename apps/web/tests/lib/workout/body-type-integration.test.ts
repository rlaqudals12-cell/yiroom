import { describe, it, expect } from 'vitest';
import { generateBest5 } from '@/lib/workout/best5-generator';
import { generateWeeklyPlan } from '@/lib/workout/weekly-plan';
import { BODY_TYPE_EXERCISE_PRIORITIES } from '@/lib/body';

describe('Best5 Generator - 체형 연동', () => {
  it('bodyType 없이도 정상 동작', () => {
    const result = generateBest5('weight_loss');
    expect(result.exercises.length).toBeGreaterThanOrEqual(1);
    expect(result.goal).toBe('weight_loss');
  });

  it('bodyType 전달 시 정상 동작', () => {
    const result = generateBest5('weight_loss', {
      bodyType: 'A',
      fitnessLevel: 'beginner',
    });
    expect(result.exercises.length).toBeGreaterThanOrEqual(1);
  });

  it('하체 우세(A) 체형에서 상체 운동에 체형 추천 이유 포함', () => {
    const result = generateBest5('muscle_gain', {
      bodyType: 'A',
      fitnessLevel: 'intermediate',
    });

    // A타입은 upper가 focusArea이므로 상체 운동에 '체형에 맞는 부위 강화' 이유 포함
    const upperExercises = result.exercises.filter((rec) => rec.exercise.category === 'upper');

    if (upperExercises.length > 0) {
      const hasBodyTypeReason = upperExercises.some((rec) =>
        rec.reason.includes('체형에 맞는 부위 강화')
      );
      expect(hasBodyTypeReason).toBe(true);
    }
  });

  it('복부 중심(O) 체형에서 유산소 강조', () => {
    const priorities = BODY_TYPE_EXERCISE_PRIORITIES.O;
    expect(priorities.cardioEmphasis).toBe('high');
    expect(priorities.focusAreas).toContain('cardio');
  });
});

describe('Weekly Plan - 체형 파라미터', () => {
  it('bodyType 없이도 정상 동작', () => {
    const plan = generateWeeklyPlan({
      goal: 'weight_loss',
      fitnessLevel: 'beginner',
      weeklyFrequency: 3,
    });
    expect(plan.days).toHaveLength(7);
  });

  it('bodyType 전달 시 정상 동작', () => {
    const plan = generateWeeklyPlan({
      goal: 'weight_loss',
      fitnessLevel: 'beginner',
      weeklyFrequency: 3,
      bodyType: 'V',
    });
    expect(plan.days).toHaveLength(7);

    // 운동일이 3일 이상 존재
    const workoutDays = plan.days.filter((d) => !d.isRestDay);
    expect(workoutDays.length).toBeGreaterThanOrEqual(3);
  });

  it('WeeklyPlanParams에 bodyType 타입 허용', () => {
    // 타입 안전성 확인 — 컴파일 시 검증됨
    const params = {
      goal: 'hypertrophy' as const,
      fitnessLevel: 'intermediate' as const,
      weeklyFrequency: 4,
      bodyType: 'A' as const,
    };
    const plan = generateWeeklyPlan(params);
    expect(plan.days).toHaveLength(7);
  });
});
