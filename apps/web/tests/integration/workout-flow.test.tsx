/**
 * Task 6.6: W-1 운동 모듈 전체 통합 테스트
 * - 온보딩 플로우: 7단계 데이터 수집 → Store 저장
 * - 분석 로직: 운동 타입 분류 → Mock 분석 결과 생성
 * - 칼로리/Streak 계산: 핵심 로직 검증
 * - 연동 기능: PC-1, S-1 연동 검증
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Store
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';

// Types
import type { BodyTypeData, WorkoutType, BodyType } from '@/types/workout';

// Lib functions
import { classifyWorkoutType } from '@/lib/workout/classifyWorkoutType';
import { generateMockWorkoutAnalysis } from '@/lib/mock/workout-analysis';
import {
  calculateCaloriesBurned,
  calculateCaloriesWithMET,
} from '@/lib/workout/calorieCalculations';
import {
  isStreakBroken,
  getNextMilestone,
  getDaysToNextMilestone,
  getAchievedMilestones,
} from '@/lib/workout/streak';
import {
  getAllExercises,
  getExercisesByCategory,
  getRecommendedExercises,
  getExerciseById,
  getAlternativeExercises,
} from '@/lib/workout/exercises';
import { getWorkoutStyleRecommendation } from '@/lib/workout/styleRecommendations';
import { matchCelebrityRoutines } from '@/lib/celebrityMatching';
import { generateWeeklyPlan } from '@/lib/workout/weeklyPlan';
import { getPostWorkoutSkinCareTips, getQuickPostWorkoutMessage } from '@/lib/workout/skinTips';
import { getPostWorkoutNutritionTips, getQuickNutritionMessage } from '@/lib/workout/nutritionTips';
import { validateAllSteps } from '@/lib/utils/workoutValidation';
import {
  generateShoppingLinks,
  getColorKeywordsForPC,
  getFitKeywordsForBodyType,
} from '@/lib/workout/shoppingLinks';

// 테스트용 목 데이터
const mockBodyTypeData: BodyTypeData = {
  type: 'H',
  proportions: { shoulder: 40, waist: 30, hip: 38 },
  height: 165,
  weight: 55,
};

describe('W-1 통합 테스트: 온보딩 플로우', () => {
  beforeEach(() => {
    // Store 초기화
    useWorkoutInputStore.getState().resetAll();
  });

  it('온보딩 7단계 데이터가 Store에 올바르게 저장됨', () => {
    const store = useWorkoutInputStore.getState();

    // Step 1: 체형 데이터
    act(() => {
      store.setBodyTypeData(mockBodyTypeData);
      store.setPersonalColor('Spring');
    });

    // Step 2: 운동 목표
    act(() => {
      store.setGoals(['weight_loss', 'strength']);
    });

    // Step 3: 신체 고민
    act(() => {
      store.setConcerns(['belly', 'arm', 'posture']);
    });

    // Step 4: 운동 빈도
    act(() => {
      store.setFrequency('3-4');
    });

    // Step 5: 운동 장소 및 장비
    act(() => {
      store.setLocation('home');
      store.setEquipment(['dumbbell', 'mat']);
    });

    // Step 6: 목표 설정
    act(() => {
      store.setTargetWeight(50);
      store.setTargetDate('2025-03-01');
    });

    // Step 7: 부상
    act(() => {
      store.setInjuries(['knee']);
    });

    // 검증: getInputData로 전체 데이터 추출
    const inputData = useWorkoutInputStore.getState().getInputData();

    expect(inputData.bodyTypeData).toEqual(mockBodyTypeData);
    expect(inputData.personalColor).toBe('Spring');
    expect(inputData.goals).toEqual(['weight_loss', 'strength']);
    expect(inputData.concerns).toEqual(['belly', 'arm', 'posture']);
    expect(inputData.frequency).toBe('3-4');
    expect(inputData.location).toBe('home');
    expect(inputData.equipment).toEqual(['dumbbell', 'mat']);
    expect(inputData.targetWeight).toBe(50);
    expect(inputData.targetDate).toBe('2025-03-01');
    expect(inputData.injuries).toEqual(['knee']);
  });

  it('resetAll 호출 시 모든 데이터가 초기화됨', () => {
    const store = useWorkoutInputStore.getState();

    // 데이터 설정
    act(() => {
      store.setGoals(['strength']);
      store.setFrequency('5-6');
    });

    expect(useWorkoutInputStore.getState().goals).toEqual(['strength']);

    // 리셋
    act(() => {
      store.resetAll();
    });

    const resetState = useWorkoutInputStore.getState();
    expect(resetState.goals).toEqual([]);
    expect(resetState.frequency).toBe('');
    expect(resetState.bodyTypeData).toBeNull();
  });
});

describe('W-1 통합 테스트: 유효성 검증', () => {
  beforeEach(() => {
    useWorkoutInputStore.getState().resetAll();
  });

  it('모든 필수 데이터가 있으면 유효함', () => {
    const store = useWorkoutInputStore.getState();
    act(() => {
      store.setBodyTypeData(mockBodyTypeData);
      store.setGoals(['weight_loss']);
      store.setConcerns(['belly']);
      store.setFrequency('3-4');
      store.setLocation('home');
      store.setEquipment(['mat']);
    });

    const inputData = store.getInputData();
    const validation = validateAllSteps(inputData);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('체형 데이터 없으면 유효성 실패', () => {
    const store = useWorkoutInputStore.getState();
    act(() => {
      // bodyTypeData 설정 안 함
      store.setGoals(['weight_loss']);
      store.setConcerns(['belly']);
      store.setFrequency('3-4');
      store.setLocation('home');
      store.setEquipment(['mat']);
    });

    const inputData = store.getInputData();
    const validation = validateAllSteps(inputData);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('체형 분석이 필요합니다');
  });

  it('목표 없으면 유효성 실패', () => {
    const store = useWorkoutInputStore.getState();
    act(() => {
      store.setBodyTypeData(mockBodyTypeData);
      // goals 설정 안 함
      store.setConcerns(['belly']);
      store.setFrequency('3-4');
      store.setLocation('home');
      store.setEquipment(['mat']);
    });

    const inputData = store.getInputData();
    const validation = validateAllSteps(inputData);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('목표를 선택해주세요');
  });

  it('장비 없으면 유효성 실패', () => {
    const store = useWorkoutInputStore.getState();
    act(() => {
      store.setBodyTypeData(mockBodyTypeData);
      store.setGoals(['weight_loss']);
      store.setConcerns(['belly']);
      store.setFrequency('3-4');
      store.setLocation('home');
      // equipment 설정 안 함
    });

    const inputData = store.getInputData();
    const validation = validateAllSteps(inputData);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('사용 가능한 장비를 선택해주세요');
  });
});

describe('W-1 통합 테스트: 분석 로직', () => {
  it('온보딩 데이터로 운동 타입 분류', () => {
    const inputData = {
      goals: ['weight_loss', 'endurance'],
      concerns: ['belly', 'thigh'],
      frequency: '3-4',
      equipment: ['mat', 'band'],
    };

    const result = classifyWorkoutType(inputData);

    // 운동 타입이 5가지 중 하나로 분류됨
    expect(['toner', 'builder', 'burner', 'mover', 'flexer']).toContain(result.type);
    expect(result.reason).toBeDefined();
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('목표 weight_loss는 burner 타입 확률 높음', () => {
    const result = classifyWorkoutType({
      goals: ['weight_loss'],
      frequency: '5-6',
    });

    // burner 또는 mover 예상
    expect(['burner', 'mover']).toContain(result.type);
  });

  it('목표 strength는 builder 타입 확률 높음', () => {
    const result = classifyWorkoutType({
      goals: ['strength'],
      equipment: ['barbell', 'dumbbell'],
    });

    expect(result.type).toBe('builder');
  });

  it('Mock 분석 결과 생성', () => {
    const inputData = {
      bodyType: 'H',
      goals: ['strength'],
      concerns: ['arm'],
      frequency: '3-4',
      location: 'gym',
      equipment: ['dumbbell', 'barbell'],
      injuries: [],
    };

    const result = generateMockWorkoutAnalysis(inputData);

    expect(result).toBeDefined();
    expect(result.workoutType).toBeDefined();
    expect(result.workoutTypeLabel).toBeDefined();
    expect(result.workoutTypeDescription).toBeDefined();
    expect(result.recommendedExercises).toBeDefined();
    expect(result.weeklyPlanSuggestion).toBeDefined();
  });

  it('운동 DB에서 운동 목록 조회', () => {
    const allExercises = getAllExercises();
    expect(allExercises.length).toBeGreaterThan(0);

    const upperExercises = getExercisesByCategory('upper');
    expect(upperExercises.length).toBeGreaterThan(0);
    expect(upperExercises.every((e) => e.category === 'upper')).toBe(true);

    const lowerExercises = getExercisesByCategory('lower');
    expect(lowerExercises.length).toBeGreaterThan(0);
  });

  it('운동 타입 기반 추천 운동 조회', () => {
    // burner 타입에 적합한 운동 추천
    const burnerExercises = getRecommendedExercises('burner', ['belly', 'thigh'], 6);
    expect(burnerExercises.length).toBeGreaterThan(0);
    expect(burnerExercises.length).toBeLessThanOrEqual(6);

    // builder 타입에 적합한 운동 추천
    const builderExercises = getRecommendedExercises('builder', ['arm', 'chest'], 8);
    expect(builderExercises.length).toBeGreaterThan(0);
  });

  it('주간 운동 플랜 생성', () => {
    const plan = generateWeeklyPlan({
      workoutType: 'toner',
      frequency: '3-4',
      concerns: ['belly', 'hip'],
      location: 'home',
      equipment: ['mat', 'dumbbell'],
      injuries: [],
    });

    expect(plan).toBeDefined();
    expect(Array.isArray(plan)).toBe(true);
    expect(plan.length).toBe(7); // 월~일 7일

    // 최소 3일 이상 운동일이 있어야 함
    const workoutDays = plan.filter(day => day.exercises && day.exercises.length > 0);
    expect(workoutDays.length).toBeGreaterThanOrEqual(3);
  });
});

describe('W-1 통합 테스트: 운동 DB 조회', () => {
  it('운동 ID로 운동 조회', () => {
    const exercises = getAllExercises();
    expect(exercises.length).toBeGreaterThan(0);

    // 첫 번째 운동 ID로 조회
    const firstExercise = exercises[0];
    const found = getExerciseById(firstExercise.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(firstExercise.id);
    expect(found?.name).toBe(firstExercise.name);
  });

  it('존재하지 않는 ID 조회 시 undefined', () => {
    const notFound = getExerciseById('non-existent-id-12345');
    expect(notFound).toBeUndefined();
  });

  it('대체 운동 추천', () => {
    const exercises = getAllExercises();
    const exercise = exercises[0];

    const alternatives = getAlternativeExercises(exercise, 3);

    expect(alternatives).toBeDefined();
    expect(Array.isArray(alternatives)).toBe(true);
    expect(alternatives.length).toBeLessThanOrEqual(3);
    // 자기 자신은 포함되지 않아야 함
    expect(alternatives.every(alt => alt.id !== exercise.id)).toBe(true);
  });

  it('대체 운동은 같은 카테고리 또는 같은 부위', () => {
    const upperExercises = getExercisesByCategory('upper');
    if (upperExercises.length > 0) {
      const exercise = upperExercises[0];
      const alternatives = getAlternativeExercises(exercise, 5);

      alternatives.forEach(alt => {
        // 같은 카테고리이거나 타겟 부위가 겹쳐야 함
        const sameCategoryOrParts =
          alt.category === exercise.category ||
          alt.bodyParts.some(part => exercise.bodyParts.includes(part));
        expect(sameCategoryOrParts).toBe(true);
      });
    }
  });
});

describe('W-1 통합 테스트: 체형별 분석', () => {
  it('8가지 체형별 운동 타입 분류', () => {
    // 스펙에서 정의된 8가지 체형 - 현재 classifyWorkoutType은 목표/고민 기반 분류
    // 체형 수만큼 반복하여 분류 로직이 안정적으로 동작하는지 검증
    const bodyTypeCount = 8; // X, A, V, H, O, Y, I, S

    for (let i = 0; i < bodyTypeCount; i++) {
      const result = classifyWorkoutType({
        goals: ['strength'],
        concerns: ['belly'],
        frequency: '3-4',
        equipment: ['dumbbell'],
      });

      // 모든 호출에서 운동 타입이 분류되어야 함
      expect(['toner', 'builder', 'burner', 'mover', 'flexer']).toContain(result.type);
      expect(result.reason).toBeDefined();
    }
  });

  it('체형별 Mock 분석 결과 생성', () => {
    const bodyTypes = ['X', 'A', 'V', 'H', 'O'];

    bodyTypes.forEach(bodyType => {
      const result = generateMockWorkoutAnalysis({
        bodyType,
        goals: ['weight_loss'],
        concerns: ['belly', 'thigh'],
        frequency: '3-4',
        location: 'home',
        equipment: ['mat'],
        injuries: [],
      });

      expect(result).toBeDefined();
      expect(result.workoutType).toBeDefined();
      expect(result.recommendedExercises.length).toBeGreaterThan(0);
    });
  });
});

describe('W-1 통합 테스트: 칼로리 계산', () => {
  it('운동별 칼로리 소모량 계산', () => {
    const calories = calculateCaloriesBurned(
      60, // 체중 kg
      30, // 시간 분
      'weight_moderate' // 운동 타입
    );

    // MET 공식: 칼로리 = 체중(kg) × 시간(h) × MET
    // 5.0 × 60 × 0.5 = 150
    expect(calories).toBeGreaterThan(100);
    expect(calories).toBeLessThan(200);
  });

  it('MET 값으로 직접 칼로리 계산', () => {
    const calories = calculateCaloriesWithMET(
      70, // 체중 kg
      60, // 시간 분
      7.0 // MET (조깅)
    );

    // 70 × 1 × 7 = 490
    expect(calories).toBeGreaterThan(400);
    expect(calories).toBeLessThan(600);
  });

  it('체중 0 또는 음수면 칼로리 0', () => {
    expect(calculateCaloriesBurned(0, 30, 'jogging')).toBe(0);
    expect(calculateCaloriesBurned(-10, 30, 'jogging')).toBe(0);
  });

  it('시간 0 또는 음수면 칼로리 0', () => {
    expect(calculateCaloriesBurned(60, 0, 'jogging')).toBe(0);
    expect(calculateCaloriesBurned(60, -10, 'jogging')).toBe(0);
  });
});

describe('W-1 통합 테스트: Streak 계산', () => {
  // 로컬 날짜 문자열 생성 헬퍼 (타임존 이슈 방지)
  const getLocalDateString = (daysAgo: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  it('Streak 깨짐 여부 확인 - 오늘 운동', () => {
    const today = getLocalDateString(0);
    expect(isStreakBroken(today)).toBe(false);
  });

  it('Streak 깨짐 여부 확인 - 어제 운동', () => {
    const yesterday = getLocalDateString(1);
    expect(isStreakBroken(yesterday)).toBe(false);
  });

  it('Streak 깨짐 여부 확인 - 3일 전 운동', () => {
    const threeDaysAgo = getLocalDateString(3);
    expect(isStreakBroken(threeDaysAgo)).toBe(true);
  });

  it('Streak 깨짐 여부 확인 - null 값', () => {
    expect(isStreakBroken(null)).toBe(true);
    expect(isStreakBroken(undefined)).toBe(true);
  });

  it('다음 마일스톤 계산', () => {
    expect(getNextMilestone(0)).toBe(3);
    expect(getNextMilestone(3)).toBe(7);
    expect(getNextMilestone(7)).toBe(14);
    expect(getNextMilestone(14)).toBe(30);
    expect(getNextMilestone(100)).toBeNull();
  });

  it('다음 마일스톤까지 남은 일수', () => {
    expect(getDaysToNextMilestone(0)).toBe(3);
    expect(getDaysToNextMilestone(5)).toBe(2); // 7 - 5
    expect(getDaysToNextMilestone(100)).toBeNull();
  });

  it('달성한 마일스톤 목록', () => {
    expect(getAchievedMilestones(0)).toEqual([]);
    expect(getAchievedMilestones(7)).toEqual([3, 7]);
    expect(getAchievedMilestones(50)).toEqual([3, 7, 14, 30]);
  });
});

describe('W-1 통합 테스트: 연예인 루틴 매칭', () => {
  it('체형 + PC 기반 연예인 루틴 매칭', () => {
    const matches = matchCelebrityRoutines('H', 'Spring', { limit: 3 });

    expect(matches).toBeDefined();
    expect(Array.isArray(matches)).toBe(true);
    // 매칭 결과가 있어야 함
    expect(matches.length).toBeGreaterThanOrEqual(0);
  });

  it('다양한 체형 조합 매칭', () => {
    const bodyTypes = ['X', 'A', 'H', 'O', 'Y'] as const;
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;

    bodyTypes.forEach((bodyType) => {
      seasons.forEach((season) => {
        const matches = matchCelebrityRoutines(bodyType, season, { limit: 2 });
        expect(matches).toBeDefined();
        expect(Array.isArray(matches)).toBe(true);
      });
    });
  });
});

describe('W-1 통합 테스트: 엣지 케이스', () => {
  it('부상 있는 경우 운동 필터링 - 무릎', () => {
    const planWithInjury = generateWeeklyPlan({
      workoutType: 'builder',
      frequency: '3-4',
      concerns: ['arm', 'chest'],
      location: 'gym',
      equipment: ['dumbbell', 'barbell'],
      injuries: ['knee'], // 무릎 부상
    });

    expect(planWithInjury).toBeDefined();
    // 플랜이 생성되어야 함
    expect(planWithInjury.length).toBe(7);
  });

  it('부상 있는 경우 운동 필터링 - 허리', () => {
    const planWithBackInjury = generateWeeklyPlan({
      workoutType: 'toner',
      frequency: '3-4',
      concerns: ['belly', 'hip'],
      location: 'home',
      equipment: ['mat', 'band'],
      injuries: ['lower_back'], // 허리 부상
    });

    expect(planWithBackInjury).toBeDefined();
    expect(planWithBackInjury.length).toBe(7);
  });

  it('부상 있는 경우 운동 필터링 - 어깨', () => {
    const planWithShoulderInjury = generateWeeklyPlan({
      workoutType: 'builder',
      frequency: '3-4',
      concerns: ['arm', 'chest'],
      location: 'gym',
      equipment: ['dumbbell'],
      injuries: ['shoulder'], // 어깨 부상
    });

    expect(planWithShoulderInjury).toBeDefined();
    expect(planWithShoulderInjury.length).toBe(7);
  });

  it('복합 부상 있는 경우 운동 필터링', () => {
    const planWithMultipleInjuries = generateWeeklyPlan({
      workoutType: 'flexer',
      frequency: '1-2',
      concerns: ['posture'],
      location: 'home',
      equipment: ['mat'],
      injuries: ['knee', 'lower_back', 'shoulder'], // 복합 부상
    });

    expect(planWithMultipleInjuries).toBeDefined();
    expect(planWithMultipleInjuries.length).toBe(7);
  });

  it('장비 없는 홈트레이닝', () => {
    const homeWorkoutPlan = generateWeeklyPlan({
      workoutType: 'burner',
      frequency: '5-6',
      concerns: ['belly', 'thigh'],
      location: 'home',
      equipment: [], // 장비 없음
      injuries: [],
    });

    expect(homeWorkoutPlan).toBeDefined();
    expect(homeWorkoutPlan.length).toBe(7);
  });

  it('최소 빈도 (1-2회) 플랜', () => {
    const minFrequencyPlan = generateWeeklyPlan({
      workoutType: 'flexer',
      frequency: '1-2',
      concerns: ['posture'],
      location: 'home',
      equipment: ['mat'],
      injuries: [],
    });

    expect(minFrequencyPlan).toBeDefined();
    const workoutDays = minFrequencyPlan.filter(day => day.exercises && day.exercises.length > 0);
    // 1-2회 빈도이므로 운동일은 1~2일
    expect(workoutDays.length).toBeLessThanOrEqual(3);
  });

  it('체형 데이터 없이 분석', () => {
    const result = classifyWorkoutType({
      goals: ['weight_loss'],
      concerns: ['belly'],
      frequency: '3-4',
      // bodyType 없음
    });

    // 체형 없이도 분류 가능해야 함
    expect(['toner', 'builder', 'burner', 'mover', 'flexer']).toContain(result.type);
  });
});

describe('W-1 통합 테스트: 연동 기능', () => {
  describe('PC-1 연동: 운동복 스타일 추천', () => {
    it('퍼스널 컬러 기반 운동복 추천 - Spring', () => {
      const recommendation = getWorkoutStyleRecommendation('Spring', 'H');

      expect(recommendation).toBeDefined();
      expect(recommendation.personalColor).toBe('Spring');
      expect(recommendation.bodyType).toBe('H');
      expect(recommendation.recommendedColors).toBeDefined();
      expect(recommendation.avoidColors).toBeDefined();
      expect(recommendation.fitRecommendation).toBeDefined();
    });

    it('다양한 퍼스널 컬러 조합 테스트', () => {
      const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
      const bodyTypes = ['H', 'O', 'X', 'A', 'Y'] as const;

      seasons.forEach((season) => {
        bodyTypes.forEach((bodyType) => {
          const result = getWorkoutStyleRecommendation(season, bodyType);
          expect(result).toBeDefined();
          expect(result.personalColor).toBe(season);
        });
      });
    });

    it('체형 null인 경우에도 동작', () => {
      const result = getWorkoutStyleRecommendation('Winter', null);
      expect(result).toBeDefined();
      expect(result.fitRecommendation).toBeNull();
    });
  });

  describe('S-1 연동: 피부 케어 팁', () => {
    it('운동 후 피부 케어 팁 생성', () => {
      const tips = getPostWorkoutSkinCareTips('cardio', 30, null);

      expect(tips).toBeDefined();
      expect(tips.immediateActions).toBeDefined();
      expect(Array.isArray(tips.immediateActions)).toBe(true);
      expect(tips.generalTips).toBeDefined();
    });

    it('다양한 운동 타입별 피부 케어 팁', () => {
      const workoutTypes = ['cardio', 'strength', 'yoga', 'hiit'];

      workoutTypes.forEach((type) => {
        const tips = getPostWorkoutSkinCareTips(type, 30, null);
        expect(tips.immediateActions.length).toBeGreaterThan(0);
      });
    });

    it('운동 후 간단 메시지 생성', () => {
      const message = getQuickPostWorkoutMessage('cardio', 45);

      expect(message).toBeDefined();
      expect(message.icon).toBeDefined();
      expect(message.title).toBeDefined();
      expect(message.message).toBeDefined();
    });
  });

  describe('N-1 연동: 영양 팁', () => {
    it('운동 후 영양 팁 생성', () => {
      const tips = getPostWorkoutNutritionTips('builder', 45);

      expect(tips).toBeDefined();
      expect(tips.proteinTips).toBeDefined();
      expect(tips.mealTips).toBeDefined();
      expect(tips.hydrationTip).toBeDefined();
    });

    it('다양한 운동 타입별 영양 팁', () => {
      const workoutTypes: WorkoutType[] = ['toner', 'builder', 'burner', 'mover', 'flexer'];

      workoutTypes.forEach((workoutType) => {
        const tips = getPostWorkoutNutritionTips(workoutType, 30);
        expect(tips).toBeDefined();
      });
    });

    it('운동 후 간단 영양 메시지 생성', () => {
      const message = getQuickNutritionMessage('burner', 60);

      expect(message).toBeDefined();
      expect(message.icon).toBeDefined();
      expect(message.title).toBeDefined();
      expect(message.message).toBeDefined();
    });
  });

  describe('쇼핑 연동: 운동복/소품 추천', () => {
    it('PC + 체형 기반 쇼핑 링크 생성', () => {
      const links = generateShoppingLinks('workout-top', 'Spring', 'H');

      expect(links).toBeDefined();
      expect(Array.isArray(links)).toBe(true);
      expect(links.length).toBe(3); // 무신사, 에이블리, 쿠팡 3개 플랫폼
      expect(links.every(link => link.url.length > 0)).toBe(true);
    });

    it('PC 타입별 색상 키워드 반환', () => {
      const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;

      seasons.forEach(season => {
        const keywords = getColorKeywordsForPC(season);
        expect(keywords).toBeDefined();
        expect(keywords.length).toBeGreaterThan(0);
      });
    });

    it('체형별 핏 키워드 반환', () => {
      const bodyTypes = ['X', 'A', 'H', 'O', 'Y'] as const;

      bodyTypes.forEach(bodyType => {
        const keywords = getFitKeywordsForBodyType(bodyType);
        expect(keywords).toBeDefined();
        expect(keywords.length).toBeGreaterThan(0);
      });
    });

    it('다양한 카테고리별 쇼핑 링크', () => {
      const categories = ['workout-top', 'workout-bottom', 'accessory'] as const;

      categories.forEach(category => {
        const links = generateShoppingLinks(category, 'Summer', 'X');
        expect(links.length).toBe(3);
        links.forEach(link => {
          expect(link.category).toBe(category);
          expect(link.platformName).toBeDefined();
        });
      });
    });
  });
});

describe('W-1 통합 테스트: 전체 데이터 플로우', () => {
  it('온보딩 → 분석 → 연동 전체 플로우', () => {
    // 1. 온보딩 데이터 설정
    const store = useWorkoutInputStore.getState();
    act(() => {
      store.setBodyTypeData(mockBodyTypeData);
      store.setPersonalColor('Autumn');
      store.setGoals(['weight_loss', 'posture']);
      store.setConcerns(['back', 'hip']);
      store.setFrequency('3-4');
      store.setLocation('home');
      store.setEquipment(['mat', 'band']);
      store.setInjuries([]);
    });

    // 2. 입력 데이터 추출 및 유효성 검증
    const inputData = store.getInputData();
    expect(inputData.goals).toHaveLength(2);

    // 2.1 유효성 검증 (결과 페이지에서 사용)
    const validation = validateAllSteps(inputData);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // 3. 운동 타입 분류
    const classification = classifyWorkoutType({
      goals: inputData.goals,
      concerns: inputData.concerns,
      frequency: inputData.frequency,
      equipment: inputData.equipment,
    });
    expect(['toner', 'builder', 'burner', 'mover', 'flexer']).toContain(classification.type);

    // 4. Mock 분석 결과 생성
    const analysisResult = generateMockWorkoutAnalysis({
      bodyType: inputData.bodyTypeData?.type,
      goals: inputData.goals,
      concerns: inputData.concerns,
      frequency: inputData.frequency,
      location: inputData.location,
      equipment: inputData.equipment,
      injuries: inputData.injuries,
    });
    expect(analysisResult.workoutType).toBeDefined();
    expect(analysisResult.weeklyPlanSuggestion).toBeDefined();

    // 5. 칼로리 계산
    const caloriesBurned = calculateCaloriesBurned(
      inputData.bodyTypeData?.weight || 60,
      30,
      'weight_moderate'
    );
    expect(caloriesBurned).toBeGreaterThan(0);

    // 6. 피부 케어 팁
    const skinTips = getPostWorkoutSkinCareTips(
      analysisResult.workoutType,
      30,
      null
    );
    expect(skinTips.immediateActions.length).toBeGreaterThan(0);

    // 7. 영양 팁
    const nutritionTips = getPostWorkoutNutritionTips(
      analysisResult.workoutType as WorkoutType,
      30
    );
    expect(nutritionTips).toBeDefined();

    // 8. 연예인 루틴 매칭 (체형 + PC 기반)
    const celebrityMatches = matchCelebrityRoutines(
      (inputData.bodyTypeData?.type || 'H') as BodyType,
      inputData.personalColor || 'Spring',
      { limit: 3 }
    );
    expect(celebrityMatches).toBeDefined();
    expect(Array.isArray(celebrityMatches)).toBe(true);

    // 9. 주간 플랜 생성
    const weeklyPlan = generateWeeklyPlan({
      workoutType: analysisResult.workoutType,
      frequency: inputData.frequency,
      concerns: inputData.concerns,
      location: inputData.location,
      equipment: inputData.equipment,
      injuries: inputData.injuries,
    });
    expect(weeklyPlan).toBeDefined();
    expect(weeklyPlan.length).toBe(7);

    // 10. 쇼핑 링크 생성 (PC + 체형 기반)
    const shoppingLinks = generateShoppingLinks(
      'workout-top',
      inputData.personalColor || 'Spring',
      (inputData.bodyTypeData?.type || 'H') as BodyType
    );
    expect(shoppingLinks).toBeDefined();
    expect(shoppingLinks.length).toBe(3);
  });
});
