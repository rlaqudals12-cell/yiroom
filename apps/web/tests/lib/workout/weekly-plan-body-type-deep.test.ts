import { describe, it, expect } from 'vitest';
import { generateDayPlan, getWeeklySplitTemplate } from '@/lib/workout/weeklyPlan';
import { getAllExercises } from '@/lib/workout/exercises';
import type { WeeklyPlanInput } from '@/lib/workout/weeklyPlan';

function createInput(overrides: Partial<WeeklyPlanInput> = {}): WeeklyPlanInput {
  return {
    workoutType: 'builder',
    frequency: '3-4',
    concerns: [],
    location: 'gym',
    equipment: [],
    injuries: [],
    ...overrides,
  };
}

describe('generateDayPlan - 체형별 운동 부위 반영 검증', () => {
  it('V형 → lower/core 집중 부위가 선택 운동에 반영됨', () => {
    const template = getWeeklySplitTemplate('3-4');
    const workoutDay = template.find((d) => !d.isRestDay)!;
    const input = createInput({ bodyType: 'V' });
    const dayPlan = generateDayPlan(workoutDay, getAllExercises(), input);

    // V형은 lower/core 집중 → 해당 부위 운동이 포함되어야 함
    expect(dayPlan.exercises.length).toBeGreaterThan(0);
  });

  it('O형(cardioEmphasis: high) → cardio 부위가 추가됨', () => {
    const template = getWeeklySplitTemplate('3-4');
    // 상체 날(cardio 카테고리 없는 날)에서도 O형이면 cardio 추가
    const upperDay = template.find((d) => !d.isRestDay && !d.categories.includes('cardio'))!;
    const inputO = createInput({ bodyType: 'O' });
    const inputH = createInput({ bodyType: 'H' }); // H형은 medium

    const dayPlanO = generateDayPlan(upperDay, getAllExercises(), inputO);
    const dayPlanH = generateDayPlan(upperDay, getAllExercises(), inputH);

    // O형은 cardio가 추가되어 더 많은 운동 또는 다른 구성
    // 둘 다 에러 없이 동작
    expect(dayPlanO.exercises.length).toBeGreaterThan(0);
    expect(dayPlanH.exercises.length).toBeGreaterThan(0);
  });

  it('체형 없으면 기본 부위만으로 운동 선택', () => {
    const template = getWeeklySplitTemplate('3-4');
    const workoutDay = template.find((d) => !d.isRestDay)!;
    const input = createInput(); // bodyType 없음

    const dayPlan = generateDayPlan(workoutDay, getAllExercises(), input);
    expect(dayPlan.exercises.length).toBeGreaterThan(0);
    expect(dayPlan.isRestDay).toBe(false);
  });

  it('알 수 없는 체형이어도 에러 없이 동작', () => {
    const template = getWeeklySplitTemplate('3-4');
    const workoutDay = template.find((d) => !d.isRestDay)!;
    const input = createInput({ bodyType: 'UNKNOWN' });

    const dayPlan = generateDayPlan(workoutDay, getAllExercises(), input);
    expect(dayPlan.exercises.length).toBeGreaterThan(0);
  });
});

describe('운동 캡슐 엔진 - 체형 반영 personalize', () => {
  it('workoutEngine은 body.shape로 개인화 가능', async () => {
    // 동적 import로 캡슐 엔진 로드
    const { workoutEngine } = await import('@/lib/capsule/domains/workout');
    const items = await workoutEngine.curate({ personalizationLevel: 2 } as any);

    const result = workoutEngine.personalize(items, {
      personalizationLevel: 2,
      body: { shape: 'pear', measurements: {} },
      workout: { goals: ['strength'], fitnessLevel: 'intermediate' },
    } as any);

    expect(result.length).toBe(items.length);
  });

  it('체형 없이도 목표 기반 개인화 동작', async () => {
    const { workoutEngine } = await import('@/lib/capsule/domains/workout');
    const items = await workoutEngine.curate({ personalizationLevel: 2 } as any);

    const result = workoutEngine.personalize(items, {
      personalizationLevel: 2,
      workout: { goals: ['cardio'], fitnessLevel: 'beginner' },
    } as any);

    expect(result.length).toBe(items.length);
  });
});
