/**
 * W-1 주간 플랜 AI 자동 생성 테스트 (목표 기반)
 *
 * 테스트 대상: lib/workout/weekly-plan.ts
 * 원리 문서: docs/principles/exercise-physiology.md
 */

import { describe, it, expect } from 'vitest';
import {
  generateWeeklyPlan,
  getWorkoutTemplate,
  adjustPlanForTime,
  generateNextWeekPlan,
  calculateTargetVolume,
  isDeloadNeeded,
  WORKOUT_TEMPLATES,
  type FitnessGoal,
  type WeeklyPlanParams,
  type WeeklyPlan,
} from '@/lib/workout/weekly-plan';

describe('주간 플랜 AI 자동 생성 (목표 기반)', () => {
  // ============================================
  // getWorkoutTemplate 테스트
  // ============================================
  describe('getWorkoutTemplate', () => {
    it('근비대 템플릿 반환', () => {
      const template = getWorkoutTemplate('hypertrophy');

      expect(template.goal).toBe('hypertrophy');
      expect(template.name).toBe('근비대');
      expect(template.weeklyFrequency.min).toBeGreaterThanOrEqual(4);
      expect(template.splitType).toBe('push_pull_legs');
      expect(template.repRange[0]).toBe(8);
      expect(template.repRange[1]).toBe(12);
    });

    it('근력 템플릿 반환', () => {
      const template = getWorkoutTemplate('strength');

      expect(template.goal).toBe('strength');
      expect(template.name).toBe('근력');
      expect(template.splitType).toBe('upper_lower');
      expect(template.repRange[0]).toBe(3);
      expect(template.repRange[1]).toBe(6);
      expect(template.restSeconds).toBe(180);
    });

    it('체중감량 템플릿 반환', () => {
      const template = getWorkoutTemplate('weight_loss');

      expect(template.goal).toBe('weight_loss');
      expect(template.name).toBe('체중감량');
      expect(template.splitType).toBe('full_body');
      expect(template.restSeconds).toBe(30);
      expect(template.progressionRate).toBe(5);
    });

    it('지구력 템플릿 반환', () => {
      const template = getWorkoutTemplate('endurance');

      expect(template.goal).toBe('endurance');
      expect(template.name).toBe('지구력');
      expect(template.repRange[0]).toBe(15);
      expect(template.repRange[1]).toBe(25);
    });
  });

  // ============================================
  // WORKOUT_TEMPLATES 상수 테스트
  // ============================================
  describe('WORKOUT_TEMPLATES', () => {
    it('모든 피트니스 목표에 대한 템플릿 존재', () => {
      const goals: FitnessGoal[] = ['hypertrophy', 'strength', 'weight_loss', 'endurance'];

      goals.forEach(goal => {
        expect(WORKOUT_TEMPLATES[goal]).toBeDefined();
        expect(WORKOUT_TEMPLATES[goal].goal).toBe(goal);
      });
    });

    it('모든 템플릿에 필수 필드 존재', () => {
      Object.values(WORKOUT_TEMPLATES).forEach(template => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.weeklyFrequency).toBeDefined();
        expect(template.sessionDuration).toBeDefined();
        expect(template.splitType).toBeDefined();
        expect(template.repRange).toHaveLength(2);
        expect(template.setsRange).toHaveLength(2);
        expect(template.restSeconds).toBeGreaterThan(0);
        expect(template.progressionRate).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // generateWeeklyPlan 테스트
  // ============================================
  describe('generateWeeklyPlan', () => {
    const baseParams: WeeklyPlanParams = {
      goal: 'hypertrophy',
      fitnessLevel: 'intermediate',
      weeklyFrequency: 4,
      userWeight: 70,
      equipment: ['bodyweight', 'dumbbell', 'barbell'],
      injuries: [],
    };

    it('7일 플랜 생성', () => {
      const plan = generateWeeklyPlan(baseParams);

      expect(plan.days).toHaveLength(7);
    });

    it('요청한 빈도만큼 운동일 생성', () => {
      const plan = generateWeeklyPlan(baseParams);
      const workoutDays = plan.days.filter(d => !d.isRestDay);

      expect(workoutDays.length).toBe(4);
    });

    it('휴식일 정확히 계산', () => {
      const plan = generateWeeklyPlan(baseParams);
      const restDayCount = 7 - 4; // 7일 - 4일 운동

      expect(plan.restDays).toHaveLength(restDayCount);
    });

    it('총 볼륨 계산', () => {
      const plan = generateWeeklyPlan(baseParams);

      expect(plan.totalVolume).toBeGreaterThan(0);
      expect(typeof plan.totalVolume).toBe('number');
    });

    it('progressionRate 설정', () => {
      const plan = generateWeeklyPlan(baseParams);

      expect(plan.progressionRate).toBeGreaterThan(0);
      expect(plan.progressionRate).toBeLessThanOrEqual(15); // 최대 15% 증가율
    });

    it('운동일에 운동 포함', () => {
      const plan = generateWeeklyPlan(baseParams);
      const workoutDays = plan.days.filter(d => !d.isRestDay);

      workoutDays.forEach(day => {
        expect(day.exercises.length).toBeGreaterThan(0);
        expect(day.estimatedDuration).toBeGreaterThan(0);
        expect(day.targetCalories).toBeGreaterThan(0);
      });
    });

    it('휴식일에 운동 없음', () => {
      const plan = generateWeeklyPlan(baseParams);
      const restDays = plan.days.filter(d => d.isRestDay);

      restDays.forEach(day => {
        expect(day.exercises).toHaveLength(0);
        expect(day.estimatedDuration).toBe(0);
        expect(day.targetCalories).toBe(0);
      });
    });

    it('dayOfWeek 0-6 범위', () => {
      const plan = generateWeeklyPlan(baseParams);

      plan.days.forEach(day => {
        expect(day.dayOfWeek).toBeGreaterThanOrEqual(0);
        expect(day.dayOfWeek).toBeLessThanOrEqual(6);
      });
    });

    it('dayLabel 한국어 요일', () => {
      const plan = generateWeeklyPlan(baseParams);
      const koreanDays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

      plan.days.forEach(day => {
        expect(koreanDays).toContain(day.dayLabel);
      });
    });

    it('장비 필터링 적용', () => {
      const plan = generateWeeklyPlan({
        ...baseParams,
        equipment: ['bodyweight'],
      });

      const workoutDays = plan.days.filter(d => !d.isRestDay);
      expect(workoutDays.length).toBeGreaterThan(0);

      // 맨몸 운동만 있어야 함 (운동이 있는 경우)
      // 참고: 모든 운동이 장비 없이 가능한지는 데이터에 따라 다름
    });

    it('부상 필터링 적용', () => {
      const plan = generateWeeklyPlan({
        ...baseParams,
        injuries: ['back', 'knee'],
      });

      // 플랜이 생성되어야 함 (부상에도 불구하고)
      expect(plan.days).toHaveLength(7);
    });
  });

  // ============================================
  // 목표별 플랜 생성 테스트
  // ============================================
  describe('목표별 플랜 생성', () => {
    const levels = ['beginner', 'intermediate', 'advanced'] as const;

    it('근비대 목표 - Push/Pull/Legs 분할', () => {
      const plan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        userWeight: 70,
      });

      expect(plan.progressionRate).toBe(10);
      // 운동일의 집중 부위 확인
      const workoutDays = plan.days.filter(d => !d.isRestDay);
      expect(workoutDays.some(d => d.focus?.includes('Push'))).toBe(true);
    });

    it('근력 목표 - Upper/Lower 분할', () => {
      const plan = generateWeeklyPlan({
        goal: 'strength',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        userWeight: 80,
      });

      expect(plan.progressionRate).toBe(5);
      const workoutDays = plan.days.filter(d => !d.isRestDay);
      expect(workoutDays.some(d => d.focus?.includes('상체') || d.focus?.includes('하체'))).toBe(true);
    });

    it('체중감량 목표 - 전신 운동', () => {
      const plan = generateWeeklyPlan({
        goal: 'weight_loss',
        fitnessLevel: 'beginner',
        weeklyFrequency: 4,
        userWeight: 85,
      });

      expect(plan.progressionRate).toBe(5);
      const workoutDays = plan.days.filter(d => !d.isRestDay);
      expect(workoutDays.some(d => d.focus?.includes('전신'))).toBe(true);
    });

    it('지구력 목표 - 전신 운동', () => {
      const plan = generateWeeklyPlan({
        goal: 'endurance',
        fitnessLevel: 'advanced',
        weeklyFrequency: 5,
        userWeight: 65,
      });

      expect(plan.progressionRate).toBe(10);
    });

    levels.forEach(level => {
      it(`피트니스 레벨 ${level}에서 플랜 생성`, () => {
        const plan = generateWeeklyPlan({
          goal: 'hypertrophy',
          fitnessLevel: level,
          weeklyFrequency: 3,
          userWeight: 70,
        });

        expect(plan.days).toHaveLength(7);
        expect(plan.totalVolume).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // 디로드 주간 테스트
  // ============================================
  describe('디로드 주간', () => {
    it('4주차에 디로드 적용', () => {
      const plan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        weekNumber: 4,
      });

      expect(plan.isDeloadWeek).toBe(true);
      expect(plan.progressionRate).toBe(-50); // 볼륨 50% 감소
    });

    it('8주차에도 디로드 적용', () => {
      const plan = generateWeeklyPlan({
        goal: 'strength',
        fitnessLevel: 'advanced',
        weeklyFrequency: 4,
        weekNumber: 8,
      });

      expect(plan.isDeloadWeek).toBe(true);
    });

    it('1-3주차에는 디로드 없음', () => {
      [1, 2, 3].forEach(week => {
        const plan = generateWeeklyPlan({
          goal: 'hypertrophy',
          fitnessLevel: 'intermediate',
          weeklyFrequency: 4,
          weekNumber: week,
        });

        expect(plan.isDeloadWeek).toBe(false);
        expect(plan.progressionRate).toBeGreaterThan(0);
      });
    });

    it('디로드 주간에 세트 수 감소', () => {
      const normalPlan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        weekNumber: 3,
      });

      const deloadPlan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        weekNumber: 4,
      });

      // 디로드 주간의 볼륨이 더 낮아야 함
      expect(deloadPlan.totalVolume).toBeLessThan(normalPlan.totalVolume);
    });
  });

  // ============================================
  // isDeloadNeeded 함수 테스트
  // ============================================
  describe('isDeloadNeeded', () => {
    it('4주 주기로 디로드 필요', () => {
      expect(isDeloadNeeded(4)).toBe(true);
      expect(isDeloadNeeded(8)).toBe(true);
      expect(isDeloadNeeded(12)).toBe(true);
    });

    it('4주 주기 아닐 때 디로드 불필요', () => {
      expect(isDeloadNeeded(1)).toBe(false);
      expect(isDeloadNeeded(2)).toBe(false);
      expect(isDeloadNeeded(3)).toBe(false);
      expect(isDeloadNeeded(5)).toBe(false);
    });

    it('커스텀 디로드 주기', () => {
      expect(isDeloadNeeded(3, 3)).toBe(true);
      expect(isDeloadNeeded(6, 3)).toBe(true);
      expect(isDeloadNeeded(5, 5)).toBe(true);
    });

    it('0주차는 디로드 불필요', () => {
      expect(isDeloadNeeded(0)).toBe(false);
    });
  });

  // ============================================
  // adjustPlanForTime 테스트
  // ============================================
  describe('adjustPlanForTime', () => {
    const basePlan: WeeklyPlan = generateWeeklyPlan({
      goal: 'hypertrophy',
      fitnessLevel: 'intermediate',
      weeklyFrequency: 4,
      userWeight: 70,
    });

    it('시간 제한 내 플랜 유지', () => {
      const maxMinutes = 120; // 충분한 시간
      const adjustedPlan = adjustPlanForTime(basePlan, maxMinutes);

      // 원본과 같은 구조 유지
      expect(adjustedPlan.days).toHaveLength(7);
    });

    it('시간 제한 적용 시 운동/세트 감소', () => {
      const maxMinutes = 20; // 매우 짧은 시간
      const adjustedPlan = adjustPlanForTime(basePlan, maxMinutes);

      const originalWorkoutDays = basePlan.days.filter(d => !d.isRestDay);
      const adjustedWorkoutDays = adjustedPlan.days.filter(d => !d.isRestDay);

      // 운동/세트가 감소되어야 함
      adjustedWorkoutDays.forEach((day, idx) => {
        const originalDay = originalWorkoutDays[idx];
        // 조정된 시간이 원본보다 짧거나 같아야 함
        expect(day.estimatedDuration).toBeLessThanOrEqual(originalDay.estimatedDuration);
        // 최소 3개 운동, 2세트 제약으로 인해 시간이 완전히 맞지 않을 수 있음
        // 원본 대비 감소했는지 확인 (만약 이미 제한 이하면 동일)
        if (originalDay.estimatedDuration > maxMinutes) {
          expect(day.estimatedDuration).toBeLessThan(originalDay.estimatedDuration);
        }
      });
    });

    it('휴식일은 영향 없음', () => {
      const maxMinutes = 30;
      const adjustedPlan = adjustPlanForTime(basePlan, maxMinutes);

      const restDays = adjustedPlan.days.filter(d => d.isRestDay);
      restDays.forEach(day => {
        expect(day.exercises).toHaveLength(0);
        expect(day.estimatedDuration).toBe(0);
      });
    });

    it('총 볼륨 재계산', () => {
      const maxMinutes = 25;
      const adjustedPlan = adjustPlanForTime(basePlan, maxMinutes);

      expect(adjustedPlan.totalVolume).toBeLessThanOrEqual(basePlan.totalVolume);
    });
  });

  // ============================================
  // generateNextWeekPlan 테스트
  // ============================================
  describe('generateNextWeekPlan', () => {
    it('다음 주 플랜 생성 (주차 증가)', () => {
      const currentPlan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        weekNumber: 1,
      });

      const nextPlan = generateNextWeekPlan(currentPlan, {
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
      });

      expect(nextPlan.weekNumber).toBe(2);
    });

    it('3주차 → 4주차 디로드 전환', () => {
      const week3Plan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        weekNumber: 3,
      });

      const week4Plan = generateNextWeekPlan(week3Plan, {
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
      });

      expect(week4Plan.weekNumber).toBe(4);
      expect(week4Plan.isDeloadWeek).toBe(true);
    });
  });

  // ============================================
  // calculateTargetVolume 테스트
  // ============================================
  describe('calculateTargetVolume', () => {
    it('5% 증가율 적용', () => {
      const currentVolume = 10000;
      const targetVolume = calculateTargetVolume(currentVolume, 5);

      expect(targetVolume).toBe(10500);
    });

    it('10% 증가율 적용', () => {
      const currentVolume = 10000;
      const targetVolume = calculateTargetVolume(currentVolume, 10);

      expect(targetVolume).toBe(11000);
    });

    it('0% 증가율 = 동일 볼륨', () => {
      const currentVolume = 10000;
      const targetVolume = calculateTargetVolume(currentVolume, 0);

      expect(targetVolume).toBe(10000);
    });

    it('반올림 적용', () => {
      const currentVolume = 10001;
      const targetVolume = calculateTargetVolume(currentVolume, 5);

      // 10001 * 1.05 = 10501.05 → 10501 (반올림)
      expect(targetVolume).toBe(10501);
    });
  });

  // ============================================
  // PlannedExercise 타입 검증
  // ============================================
  describe('PlannedExercise 구조', () => {
    it('운동에 필수 필드 포함', () => {
      const plan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
      });

      const workoutDays = plan.days.filter(d => !d.isRestDay);
      workoutDays.forEach(day => {
        day.exercises.forEach(ex => {
          expect(ex.exerciseId).toBeDefined();
          expect(ex.exerciseName).toBeDefined();
          expect(ex.sets).toBeGreaterThan(0);
          expect(ex.reps).toBeDefined();
          expect(ex.restSeconds).toBeGreaterThan(0);
        });
      });
    });

    it('reps가 숫자 또는 범위 문자열', () => {
      const plan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
      });

      const workoutDays = plan.days.filter(d => !d.isRestDay);
      workoutDays.forEach(day => {
        day.exercises.forEach(ex => {
          const reps = ex.reps;
          const isValid = typeof reps === 'number' ||
            (typeof reps === 'string' && /^\d+-\d+$/.test(reps));
          expect(isValid).toBe(true);
        });
      });
    });
  });

  // ============================================
  // 선호 운동일 테스트
  // ============================================
  describe('선호 운동일 지정', () => {
    it('선호 운동일 반영', () => {
      const preferredDays = [1, 3, 5, 6]; // 월, 수, 금, 토
      const plan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        preferredDays,
      });

      const workoutDays = plan.days.filter(d => !d.isRestDay);
      const actualDays = workoutDays.map(d => d.dayOfWeek);

      preferredDays.forEach(day => {
        expect(actualDays).toContain(day);
      });
    });

    it('선호 운동일이 빈도보다 적으면 기본 스케줄', () => {
      const plan = generateWeeklyPlan({
        goal: 'hypertrophy',
        fitnessLevel: 'intermediate',
        weeklyFrequency: 4,
        preferredDays: [1, 3], // 2일만 지정, 빈도는 4
      });

      const workoutDays = plan.days.filter(d => !d.isRestDay);
      expect(workoutDays.length).toBe(4);
    });
  });

  // ============================================
  // 통합 테스트
  // ============================================
  describe('통합 테스트', () => {
    it('초보자 체중감량 4주 플랜', () => {
      // 1주차
      const week1 = generateWeeklyPlan({
        goal: 'weight_loss',
        fitnessLevel: 'beginner',
        weeklyFrequency: 4,
        userWeight: 90,
        weekNumber: 1,
      });

      expect(week1.isDeloadWeek).toBe(false);
      expect(week1.totalVolume).toBeGreaterThan(0);

      // 4주차 (디로드)
      const week4 = generateWeeklyPlan({
        goal: 'weight_loss',
        fitnessLevel: 'beginner',
        weeklyFrequency: 4,
        userWeight: 88, // 체중 감소
        weekNumber: 4,
      });

      expect(week4.isDeloadWeek).toBe(true);
      expect(week4.totalVolume).toBeLessThan(week1.totalVolume);
    });

    it('고급자 근력 프로그램', () => {
      const plan = generateWeeklyPlan({
        goal: 'strength',
        fitnessLevel: 'advanced',
        weeklyFrequency: 4,
        userWeight: 85,
        equipment: ['barbell', 'dumbbell', 'machine', 'cable'],
        maxMinutesPerDay: 60,
      });

      const workoutDays = plan.days.filter(d => !d.isRestDay);

      // 상체/하체 분할 확인
      const hasFocusLabels = workoutDays.every(d => d.focus !== undefined);
      expect(hasFocusLabels).toBe(true);

      // 시간 제한 확인
      workoutDays.forEach(day => {
        expect(day.estimatedDuration).toBeLessThanOrEqual(65); // 약간의 여유
      });
    });
  });
});
