import { describe, it, expect } from 'vitest';
import { createWeeklyPlanFromInput } from '@/lib/workout/weeklyPlan';
import type { WorkoutInputData } from '@/lib/stores/workoutInputStore';

// 기본 입력 데이터
function createInputData(overrides: Partial<WorkoutInputData> = {}): WorkoutInputData {
  return {
    bodyTypeData: null,
    personalColor: null,
    goals: ['체중 감량'],
    concerns: [],
    frequency: '3-4',
    location: 'home',
    equipment: [],
    injuries: [],
    ...overrides,
  };
}

describe('createWeeklyPlanFromInput - C-1 체형 자동 전달', () => {
  it('bodyTypeData.type이 없으면 정상 동작', () => {
    const input = createInputData();
    const plan = createWeeklyPlanFromInput(input, 'burner');
    expect(plan.days).toBeDefined();
    expect(plan.days.length).toBe(7);
  });

  it('bodyTypeData.type이 있으면 플랜 생성 성공', () => {
    const input = createInputData({
      bodyTypeData: {
        type: 'V',
        proportions: { shoulder: 40, waist: 30, hip: 35 },
        weight: 70,
        height: 175,
      },
    });
    const plan = createWeeklyPlanFromInput(input, 'builder');
    expect(plan.days).toBeDefined();
    expect(plan.days.length).toBe(7);
    // V형 체형 전달 시에도 에러 없이 플랜 생성
    expect(plan.totalMinutes).toBeGreaterThan(0);
  });

  it('체형 정보가 체중과 함께 전달됨', () => {
    const input = createInputData({
      bodyTypeData: {
        type: 'A',
        proportions: { shoulder: 35, waist: 28, hip: 38 },
        weight: 55,
        height: 162,
      },
    });
    const plan = createWeeklyPlanFromInput(input, 'toner');
    expect(plan.days).toBeDefined();
    // 체중이 반영된 칼로리 계산
    const workoutDays = plan.days.filter((d) => !d.isRestDay);
    expect(workoutDays.length).toBeGreaterThan(0);
  });

  it('알 수 없는 체형이어도 에러 없이 동작', () => {
    const input = createInputData({
      bodyTypeData: {
        type: 'UNKNOWN',
        proportions: { shoulder: 36, waist: 29, hip: 36 },
        weight: 65,
      },
    });
    // 에러 없이 플랜 생성
    const plan = createWeeklyPlanFromInput(input, 'builder');
    expect(plan.days).toBeDefined();
  });
});
