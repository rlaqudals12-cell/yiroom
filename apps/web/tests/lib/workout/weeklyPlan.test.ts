/**
 * W-1 주간 플랜 생성 로직 테스트 (Task 4.6)
 */

import { describe, it, expect } from 'vitest';
import {
  getWeeklySplitTemplate,
  filterExercises,
  selectExercisesForBodyParts,
  calculateExerciseDetails,
  generateDayPlan,
  generateWeeklyPlan,
  createWeeklyPlanFromInput,
  countWorkoutDays,
  calculateBodyPartDistribution,
  generatePlanSummary,
  type WeeklyPlanInput,
} from '@/lib/workout/weeklyPlan';
import { getAllExercises } from '@/lib/workout/exercises';
import type { WorkoutInputData } from '@/types/workout';

describe('주간 플랜 생성 로직 (Task 4.6)', () => {
  // ============================================
  // getWeeklySplitTemplate 테스트
  // ============================================
  describe('getWeeklySplitTemplate', () => {
    it('주 1-2회 템플릿 반환', () => {
      const template = getWeeklySplitTemplate('1-2');
      expect(template).toHaveLength(7);

      // 운동일 확인 (월, 목)
      const workoutDays = template.filter((d) => !d.isRestDay);
      expect(workoutDays.length).toBe(2);
    });

    it('주 3-4회 템플릿 반환', () => {
      const template = getWeeklySplitTemplate('3-4');
      expect(template).toHaveLength(7);

      const workoutDays = template.filter((d) => !d.isRestDay);
      expect(workoutDays.length).toBe(4);
    });

    it('주 5-6회 템플릿 반환', () => {
      const template = getWeeklySplitTemplate('5-6');
      expect(template).toHaveLength(7);

      const workoutDays = template.filter((d) => !d.isRestDay);
      expect(workoutDays.length).toBe(6);
    });

    it('매일 템플릿 반환', () => {
      const template = getWeeklySplitTemplate('daily');
      expect(template).toHaveLength(7);

      const workoutDays = template.filter((d) => !d.isRestDay);
      expect(workoutDays.length).toBe(7);
    });

    it('알 수 없는 빈도는 기본값(3-4) 반환', () => {
      const template = getWeeklySplitTemplate('unknown');
      expect(template).toHaveLength(7);

      const workoutDays = template.filter((d) => !d.isRestDay);
      expect(workoutDays.length).toBe(4);
    });

    it('각 요일에 올바른 레이블 포함', () => {
      const template = getWeeklySplitTemplate('3-4');
      expect(template[0].dayLabel).toBe('월요일');
      expect(template[6].dayLabel).toBe('일요일');
    });

    it('휴식일에는 bodyParts가 비어있음', () => {
      const template = getWeeklySplitTemplate('3-4');
      const restDays = template.filter((d) => d.isRestDay);

      restDays.forEach((day) => {
        expect(day.bodyParts).toHaveLength(0);
        expect(day.categories).toHaveLength(0);
      });
    });
  });

  // ============================================
  // filterExercises 테스트
  // ============================================
  describe('filterExercises', () => {
    const exercises = getAllExercises();

    it('홈트레이닝 장비로 필터링', () => {
      const filtered = filterExercises(exercises, 'home', ['bodyweight', 'dumbbell'], []);

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThanOrEqual(exercises.length);
    });

    it('헬스장 장비로 필터링', () => {
      const filtered = filterExercises(exercises, 'gym', ['barbell', 'machine'], []);

      expect(filtered.length).toBeGreaterThan(0);
    });

    it('맨몸 운동만 필터링', () => {
      const filtered = filterExercises(exercises, 'home', ['bodyweight'], []);

      filtered.forEach((ex) => {
        const hasBodyweight = ex.equipment.length === 0 || ex.equipment.includes('bodyweight');
        expect(hasBodyweight).toBe(true);
      });
    });

    it('부상 부위 운동 제외', () => {
      const filtered = filterExercises(exercises, 'gym', ['barbell', 'machine'], ['back']);

      // 등 부상 관련 운동이 제외되어야 함
      filtered.forEach((ex) => {
        if (ex.suitableFor?.injuries) {
          expect(ex.suitableFor.injuries).not.toContain('back');
        }
      });
    });

    it('빈 장비 목록으로도 맨몸 운동 반환', () => {
      const filtered = filterExercises(exercises, 'home', [], []);

      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // selectExercisesForBodyParts 테스트
  // ============================================
  describe('selectExercisesForBodyParts', () => {
    const exercises = getAllExercises();

    it('상체 부위 운동 선택', () => {
      const selected = selectExercisesForBodyParts(
        exercises,
        ['chest', 'shoulder'],
        ['upper'],
        'toner',
        5
      );

      expect(selected.length).toBeLessThanOrEqual(5);
      expect(selected.length).toBeGreaterThan(0);

      // 선택된 운동들이 상체 관련인지 확인
      selected.forEach((ex) => {
        const hasUpperParts = ex.bodyParts.some((p) => ['chest', 'shoulder', 'arm', 'back'].includes(p));
        expect(hasUpperParts).toBe(true);
      });
    });

    it('하체 부위 운동 선택', () => {
      const selected = selectExercisesForBodyParts(
        exercises,
        ['thigh', 'hip'],
        ['lower'],
        'builder',
        5
      );

      expect(selected.length).toBeGreaterThan(0);

      selected.forEach((ex) => {
        const hasLowerParts = ex.bodyParts.some((p) => ['thigh', 'hip', 'calf'].includes(p));
        expect(hasLowerParts).toBe(true);
      });
    });

    it('코어 운동 선택', () => {
      const selected = selectExercisesForBodyParts(
        exercises,
        ['abs', 'waist'],
        ['core'],
        'toner',
        5
      );

      expect(selected.length).toBeGreaterThan(0);
    });

    it('운동 타입별 우선순위 적용', () => {
      const burnerExercises = selectExercisesForBodyParts(
        exercises,
        ['thigh'],
        ['lower', 'cardio'],
        'burner',
        10
      );

      // burner 타입은 유산소를 우선시함 - 운동이 반환되어야 함
      expect(burnerExercises.length).toBeGreaterThan(0);
    });

    it('요청한 개수 이하로 반환', () => {
      const selected = selectExercisesForBodyParts(
        exercises,
        ['chest'],
        ['upper'],
        'builder',
        3
      );

      expect(selected.length).toBeLessThanOrEqual(3);
    });
  });

  // ============================================
  // calculateExerciseDetails 테스트
  // ============================================
  describe('calculateExerciseDetails', () => {
    const exercises = getAllExercises();
    const testExercise = exercises[0];

    it('세트/횟수/휴식시간 계산', () => {
      const details = calculateExerciseDetails(testExercise, 'toner', 60);

      expect(details.sets).toBeGreaterThan(0);
      expect(details.reps).toBeGreaterThan(0);
      expect(details.restSeconds).toBeGreaterThan(0);
    });

    it('칼로리 계산', () => {
      const details = calculateExerciseDetails(testExercise, 'burner', 70);

      expect(details.estimatedCalories).toBeGreaterThan(0);
    });

    it('운동 시간 계산', () => {
      const details = calculateExerciseDetails(testExercise, 'builder', 65);

      expect(details.estimatedMinutes).toBeGreaterThan(0);
    });

    it('운동 타입별 세트/횟수 차이', () => {
      const tonerDetails = calculateExerciseDetails(testExercise, 'toner', 60);
      const burnerDetails = calculateExerciseDetails(testExercise, 'burner', 60);

      // burner는 더 많은 반복을 수행 (근지구력)
      expect(burnerDetails.reps).toBeGreaterThanOrEqual(tonerDetails.reps);
    });

    it('체중에 따른 칼로리 변화', () => {
      const light = calculateExerciseDetails(testExercise, 'toner', 50);
      const heavy = calculateExerciseDetails(testExercise, 'toner', 80);

      // 체중이 높을수록 더 많은 칼로리 소모
      expect(heavy.estimatedCalories).toBeGreaterThan(light.estimatedCalories);
    });
  });

  // ============================================
  // generateDayPlan 테스트
  // ============================================
  describe('generateDayPlan', () => {
    const allExercises = getAllExercises();
    const baseInput: WeeklyPlanInput = {
      workoutType: 'toner',
      frequency: '3-4',
      concerns: ['belly'],
      location: 'home',
      equipment: ['bodyweight', 'dumbbell'],
      injuries: [],
      userWeight: 60,
    };

    it('휴식일 생성', () => {
      const restDayFocus = {
        day: 'sun' as const,
        dayLabel: '일요일',
        isRestDay: true,
        bodyParts: [],
        categories: [],
      };

      const dayPlan = generateDayPlan(restDayFocus, allExercises, baseInput);

      expect(dayPlan.isRestDay).toBe(true);
      expect(dayPlan.exercises).toHaveLength(0);
      expect(dayPlan.estimatedMinutes).toBe(0);
      expect(dayPlan.estimatedCalories).toBe(0);
    });

    it('운동일 생성', () => {
      const workoutDayFocus = {
        day: 'mon' as const,
        dayLabel: '월요일',
        isRestDay: false,
        bodyParts: ['chest', 'shoulder', 'arm'] as ('chest' | 'shoulder' | 'arm')[],
        categories: ['upper'] as ('upper')[],
      };

      const dayPlan = generateDayPlan(workoutDayFocus, allExercises, {
        ...baseInput,
        concerns: [],
      });

      expect(dayPlan.isRestDay).toBe(false);
      expect(dayPlan.exercises.length).toBeGreaterThan(0);
      expect(dayPlan.estimatedMinutes).toBeGreaterThan(0);
    });

    it('고민 부위 반영', () => {
      const workoutDayFocus = {
        day: 'mon' as const,
        dayLabel: '월요일',
        isRestDay: false,
        bodyParts: ['chest'] as ('chest')[],
        categories: ['upper'] as ('upper')[],
      };

      const dayPlan = generateDayPlan(workoutDayFocus, allExercises, {
        ...baseInput,
        concerns: ['belly', 'arm'],
      });

      expect(dayPlan.exercises.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // generateWeeklyPlan 테스트
  // ============================================
  describe('generateWeeklyPlan', () => {
    const baseInput: WeeklyPlanInput = {
      workoutType: 'toner',
      frequency: '3-4',
      concerns: ['belly'],
      location: 'home',
      equipment: ['bodyweight', 'dumbbell'],
      injuries: [],
      userWeight: 60,
    };

    it('7일 플랜 생성', () => {
      const plan = generateWeeklyPlan(baseInput);

      expect(plan).toHaveLength(7);
    });

    it('빈도에 맞는 운동일 수', () => {
      const plan = generateWeeklyPlan({ ...baseInput, frequency: '3-4' });
      const workoutDays = plan.filter((d) => !d.isRestDay);

      expect(workoutDays.length).toBe(4);
    });

    it('각 요일 레이블 확인', () => {
      const plan = generateWeeklyPlan(baseInput);

      expect(plan[0].day).toBe('mon');
      expect(plan[0].dayLabel).toBe('월요일');
      expect(plan[6].day).toBe('sun');
    });

    it('운동일에 운동 포함', () => {
      const plan = generateWeeklyPlan(baseInput);
      const workoutDays = plan.filter((d) => !d.isRestDay);

      workoutDays.forEach((day) => {
        expect(day.exercises.length).toBeGreaterThan(0);
      });
    });

    it('매일 운동 플랜 생성', () => {
      const plan = generateWeeklyPlan({ ...baseInput, frequency: 'daily' });
      const workoutDays = plan.filter((d) => !d.isRestDay);

      expect(workoutDays.length).toBe(7);
    });
  });

  // ============================================
  // createWeeklyPlanFromInput 테스트
  // ============================================
  describe('createWeeklyPlanFromInput', () => {
    const inputData: WorkoutInputData = {
      bodyTypeData: { type: 'X', proportions: { shoulder: 40, waist: 60, hip: 90 } },
      goals: ['weight_loss'],
      concerns: ['belly', 'thigh'],
      frequency: '3-4',
      location: 'home',
      equipment: ['bodyweight', 'dumbbell'],
      injuries: [],
    };

    it('WorkoutPlan 객체 생성', () => {
      const plan = createWeeklyPlanFromInput(inputData, 'burner');

      expect(plan.id).toBeDefined();
      expect(plan.workoutType).toBe('burner');
      expect(plan.frequency).toBe('3-4');
      expect(plan.days).toHaveLength(7);
    });

    it('총계 계산', () => {
      const plan = createWeeklyPlanFromInput(inputData, 'toner');

      expect(plan.totalMinutes).toBeGreaterThan(0);
      expect(plan.totalCalories).toBeGreaterThan(0);
    });

    it('주 시작일 설정', () => {
      const plan = createWeeklyPlanFromInput(inputData, 'toner');

      expect(plan.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('생성일/수정일 설정', () => {
      const plan = createWeeklyPlanFromInput(inputData, 'toner');

      expect(plan.createdAt).toBeDefined();
      expect(plan.updatedAt).toBeDefined();
    });
  });

  // ============================================
  // countWorkoutDays 테스트
  // ============================================
  describe('countWorkoutDays', () => {
    it('운동일 수 계산', () => {
      const input: WeeklyPlanInput = {
        workoutType: 'toner',
        frequency: '3-4',
        concerns: [],
        location: 'home',
        equipment: ['bodyweight'],
        injuries: [],
      };
      const plan = generateWeeklyPlan(input);
      const count = countWorkoutDays(plan);

      expect(count).toBe(4);
    });

    it('빈 플랜은 0 반환', () => {
      const count = countWorkoutDays([]);
      expect(count).toBe(0);
    });
  });

  // ============================================
  // calculateBodyPartDistribution 테스트
  // ============================================
  describe('calculateBodyPartDistribution', () => {
    it('부위 분포 계산', () => {
      const input: WeeklyPlanInput = {
        workoutType: 'toner',
        frequency: '3-4',
        concerns: [],
        location: 'gym',
        equipment: ['barbell', 'dumbbell', 'machine'],
        injuries: [],
      };
      const plan = generateWeeklyPlan(input);
      const distribution = calculateBodyPartDistribution(plan);

      expect(distribution.upper).toBeGreaterThanOrEqual(0);
      expect(distribution.lower).toBeGreaterThanOrEqual(0);
      expect(distribution.core).toBeGreaterThanOrEqual(0);
    });

    it('총합이 1 이하', () => {
      const input: WeeklyPlanInput = {
        workoutType: 'builder',
        frequency: '5-6',
        concerns: ['belly'],
        location: 'gym',
        equipment: ['barbell', 'dumbbell'],
        injuries: [],
      };
      const plan = generateWeeklyPlan(input);
      const distribution = calculateBodyPartDistribution(plan);

      const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
      expect(total).toBeLessThanOrEqual(1.01); // 반올림 오차 허용
    });
  });

  // ============================================
  // generatePlanSummary 테스트
  // ============================================
  describe('generatePlanSummary', () => {
    const inputData: WorkoutInputData = {
      bodyTypeData: { type: 'H', proportions: { shoulder: 38, waist: 65, hip: 85 } },
      goals: ['strength'],
      concerns: ['arm'],
      frequency: '5-6',
      location: 'gym',
      equipment: ['barbell', 'dumbbell', 'machine'],
      injuries: [],
    };

    it('플랜 요약 생성', () => {
      const plan = createWeeklyPlanFromInput(inputData, 'builder');
      const summary = generatePlanSummary(plan);

      expect(summary.workoutDays).toBe(6);
      expect(summary.restDays).toBe(1);
      expect(summary.totalMinutes).toBeGreaterThan(0);
      expect(summary.totalCalories).toBeGreaterThan(0);
    });

    it('평균값 계산', () => {
      const plan = createWeeklyPlanFromInput(inputData, 'builder');
      const summary = generatePlanSummary(plan);

      expect(summary.avgMinutesPerDay).toBeGreaterThan(0);
      expect(summary.avgCaloriesPerDay).toBeGreaterThan(0);
    });

    it('부위 분포 포함', () => {
      const plan = createWeeklyPlanFromInput(inputData, 'builder');
      const summary = generatePlanSummary(plan);

      expect(summary.bodyPartDistribution).toBeDefined();
      expect(typeof summary.bodyPartDistribution.upper).toBe('number');
    });
  });

  // ============================================
  // 통합 테스트
  // ============================================
  describe('통합 테스트', () => {
    it('홈트레이닝 toner 플랜', () => {
      const inputData: WorkoutInputData = {
        bodyTypeData: { type: 'A', proportions: { shoulder: 36, waist: 60, hip: 95 } },
        goals: ['toning'],
        concerns: ['hip', 'thigh'],
        frequency: '3-4',
        location: 'home',
        equipment: ['bodyweight', 'band', 'mat'],
        injuries: [],
      };

      const plan = createWeeklyPlanFromInput(inputData, 'toner');
      const summary = generatePlanSummary(plan);

      expect(plan.workoutType).toBe('toner');
      expect(summary.workoutDays).toBe(4);

      // 홈트레이닝 운동만 포함되어야 함
      plan.days.forEach((day) => {
        if (!day.isRestDay) {
          day.exercises.forEach((ex) => {
            const hasHomeEquipment = ex.equipment.length === 0 ||
              ex.equipment.some((eq) =>
                ['bodyweight', 'dumbbell', 'band', 'mat'].includes(eq)
              );
            expect(hasHomeEquipment).toBe(true);
          });
        }
      });
    });

    it('헬스장 builder 플랜', () => {
      const inputData: WorkoutInputData = {
        bodyTypeData: { type: 'I', proportions: { shoulder: 42, waist: 70, hip: 88 } },
        goals: ['strength'],
        concerns: ['chest', 'arm'],
        frequency: '5-6',
        location: 'gym',
        equipment: ['barbell', 'dumbbell', 'machine', 'cable'],
        injuries: [],
      };

      const plan = createWeeklyPlanFromInput(inputData, 'builder');
      const summary = generatePlanSummary(plan);

      expect(plan.workoutType).toBe('builder');
      expect(summary.workoutDays).toBe(6);
    });

    it('부상 고려 플랜', () => {
      const inputData: WorkoutInputData = {
        bodyTypeData: { type: 'X', proportions: { shoulder: 40, waist: 58, hip: 90 } },
        goals: ['weight_loss'],
        concerns: ['belly'],
        frequency: '3-4',
        location: 'home',
        equipment: ['bodyweight', 'dumbbell'],
        injuries: ['back', 'knee'],
      };

      const plan = createWeeklyPlanFromInput(inputData, 'burner');

      // 부상 부위 관련 운동이 제외되어야 함
      plan.days.forEach((day) => {
        if (!day.isRestDay) {
          day.exercises.forEach((ex) => {
            if (ex.suitableFor?.injuries) {
              expect(ex.suitableFor.injuries).not.toContain('back');
              expect(ex.suitableFor.injuries).not.toContain('knee');
            }
          });
        }
      });
    });
  });
});
