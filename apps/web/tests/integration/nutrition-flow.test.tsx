/**
 * Task 1.20: N-1 영양 모듈 통합 테스트
 * - 온보딩 플로우: 7단계 데이터 수집 → Store 저장
 * - BMR/TDEE 계산: 핵심 로직 검증
 * - 연동 기능: C-1 데이터 연동 검증
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Store
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';

// Lib functions
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateAll,
} from '@/lib/nutrition/calculateBMR';

// Types
import type { BodyTypeData } from '@/types/nutrition';

// 테스트용 목 데이터
const mockBodyTypeData: BodyTypeData = {
  type: 'X',
  proportions: { shoulder: 40, waist: 28, hip: 38 },
  height: 165,
  weight: 55,
};

describe('N-1 통합 테스트: 온보딩 플로우', () => {
  beforeEach(() => {
    // Store 초기화
    useNutritionInputStore.getState().resetAll();
  });

  it('온보딩 7단계 데이터가 Store에 올바르게 저장됨', () => {
    const store = useNutritionInputStore.getState();

    // Step 1: 식사 목표
    act(() => {
      store.setGoal('weight_loss');
    });

    // Step 2: 기본 정보 (C-1 연동)
    act(() => {
      store.setGender('female');
      store.setBirthDate('1995-06-15');
      store.setHeight(165);
      store.setWeight(55);
      store.setActivityLevel('moderate');
      store.setBodyTypeData(mockBodyTypeData);
      store.setPersonalColor('Spring');
    });

    // Step 3: 식사 스타일
    act(() => {
      store.setMealStyle('korean');
    });

    // Step 4: 요리 스킬
    act(() => {
      store.setCookingSkill('intermediate');
    });

    // Step 5: 예산
    act(() => {
      store.setBudget('moderate');
    });

    // Step 6: 알레르기/기피 음식
    act(() => {
      store.setAllergies(['dairy', 'nuts']);
      store.setDislikedFoods(['간', '순대']);
    });

    // Step 7: 식사 횟수
    act(() => {
      store.setMealCount(3);
    });

    // 검증
    const state = useNutritionInputStore.getState();
    expect(state.goal).toBe('weight_loss');
    expect(state.gender).toBe('female');
    expect(state.birthDate).toBe('1995-06-15');
    expect(state.height).toBe(165);
    expect(state.weight).toBe(55);
    expect(state.activityLevel).toBe('moderate');
    expect(state.mealStyle).toBe('korean');
    expect(state.cookingSkill).toBe('intermediate');
    expect(state.budget).toBe('moderate');
    expect(state.allergies).toEqual(['dairy', 'nuts']);
    expect(state.dislikedFoods).toEqual(['간', '순대']);
    expect(state.mealCount).toBe(3);
    expect(state.bodyTypeData).toEqual(mockBodyTypeData);
    expect(state.personalColor).toBe('Spring');
  });

  it('getInputData()가 올바른 구조로 데이터를 반환함', () => {
    const store = useNutritionInputStore.getState();

    // 모든 데이터 설정
    act(() => {
      store.setGoal('muscle');
      store.setGender('male');
      store.setBirthDate('1990-01-15');
      store.setHeight(175);
      store.setWeight(70);
      store.setActivityLevel('active');
      store.setMealStyle('western');
      store.setCookingSkill('advanced');
      store.setBudget('premium');
      store.setAllergies(['seafood']);
      store.setDislikedFoods(['브로콜리']);
      store.setMealCount(5);
      store.setBMR(1700);
      store.setTDEE(2500);
      store.setDailyCalorieTarget(2800);
      store.setMacroTargets(140, 350, 80);
    });

    const inputData = useNutritionInputStore.getState().getInputData();

    expect(inputData).toMatchObject({
      goal: 'muscle',
      gender: 'male',
      birthDate: '1990-01-15',
      height: 175,
      weight: 70,
      activityLevel: 'active',
      mealStyle: 'western',
      cookingSkill: 'advanced',
      budget: 'premium',
      allergies: ['seafood'],
      dislikedFoods: ['브로콜리'],
      mealCount: 5,
      bmr: 1700,
      tdee: 2500,
      dailyCalorieTarget: 2800,
      proteinTarget: 140,
      carbsTarget: 350,
      fatTarget: 80,
    });
  });

  it('단계 진행이 올바르게 추적됨', () => {
    const store = useNutritionInputStore.getState();

    expect(store.currentStep).toBe(1);

    act(() => {
      store.setStep(2);
    });
    expect(useNutritionInputStore.getState().currentStep).toBe(2);

    act(() => {
      store.setStep(7);
    });
    expect(useNutritionInputStore.getState().currentStep).toBe(7);
  });
});

describe('N-1 통합 테스트: BMR/TDEE 계산', () => {
  it('전체 플로우: 사용자 입력 → BMR → TDEE → 목표 칼로리 → 매크로', () => {
    // 사용자 입력
    const gender = 'female' as const;
    const weight = 55;
    const height = 160;
    const birthDate = '1995-06-15';
    const activityLevel = 'moderate' as const;
    const goal = 'weight_loss' as const;

    // 계산 플로우
    const result = calculateAll(gender, weight, height, birthDate, activityLevel, goal);

    // 검증
    expect(result.bmr).toBeGreaterThan(1200);
    expect(result.bmr).toBeLessThan(1600);
    expect(result.tdee).toBeGreaterThan(result.bmr);
    expect(result.dailyCalorieTarget).toBeLessThan(result.tdee); // weight_loss = 적자
    expect(result.dailyCalorieTarget).toBeGreaterThanOrEqual(1200); // 최소 안전 칼로리
    expect(result.proteinTarget).toBeGreaterThan(0);
    expect(result.carbsTarget).toBeGreaterThan(0);
    expect(result.fatTarget).toBeGreaterThan(0);
  });

  it('목표별 칼로리 조정이 올바르게 적용됨', () => {
    const tdee = 2000;

    const weightLoss = calculateDailyCalorieTarget(tdee, 'weight_loss');
    const maintain = calculateDailyCalorieTarget(tdee, 'maintain');
    const muscle = calculateDailyCalorieTarget(tdee, 'muscle');

    expect(weightLoss).toBe(1500); // -500
    expect(maintain).toBe(2000); // 유지
    expect(muscle).toBe(2300); // +300
  });

  it('활동 레벨별 TDEE 배수가 올바르게 적용됨', () => {
    const bmr = 1500;

    const sedentary = calculateTDEE(bmr, 'sedentary');
    const light = calculateTDEE(bmr, 'light');
    const moderate = calculateTDEE(bmr, 'moderate');
    const active = calculateTDEE(bmr, 'active');
    const veryActive = calculateTDEE(bmr, 'very_active');

    expect(sedentary).toBe(1800); // 1.2
    expect(light).toBe(2063); // 1.375
    expect(moderate).toBe(2325); // 1.55
    expect(active).toBe(2588); // 1.725
    expect(veryActive).toBe(2850); // 1.9
  });

  it('목표별 단백질 배수가 올바르게 적용됨', () => {
    const weight = 60;
    const calories = 2000;

    const maintainMacros = calculateMacroTargets(calories, weight, 'maintain');
    const muscleMacros = calculateMacroTargets(calories, weight, 'muscle');
    const weightLossMacros = calculateMacroTargets(calories, weight, 'weight_loss');

    // 유지: 1.6g/kg
    expect(maintainMacros.protein).toBe(96);

    // 근육: 2.0g/kg
    expect(muscleMacros.protein).toBe(120);

    // 감량: 1.6g/kg (근육 목표 외 모두 동일)
    expect(weightLossMacros.protein).toBe(96);
  });
});

describe('N-1 통합 테스트: C-1 연동', () => {
  beforeEach(() => {
    useNutritionInputStore.getState().resetAll();
  });

  it('C-1 체형 데이터가 Store에 올바르게 저장됨', () => {
    const store = useNutritionInputStore.getState();

    act(() => {
      store.setBodyTypeData(mockBodyTypeData);
    });

    const state = useNutritionInputStore.getState();
    expect(state.bodyTypeData).toEqual(mockBodyTypeData);
    expect(state.bodyTypeData?.height).toBe(165);
    expect(state.bodyTypeData?.weight).toBe(55);
    expect(state.bodyTypeData?.type).toBe('X');
  });

  it('C-1에서 가져온 키/체중이 BMR 계산에 사용됨', () => {
    const store = useNutritionInputStore.getState();

    // C-1 데이터 설정
    act(() => {
      store.setBodyTypeData(mockBodyTypeData);
      store.setHeight(mockBodyTypeData.height ?? null);
      store.setWeight(mockBodyTypeData.weight ?? null);
    });

    const state = useNutritionInputStore.getState();

    // C-1 데이터로 BMR 계산
    const bmr = calculateBMR('female', state.weight!, state.height!, 25);
    expect(bmr).toBeGreaterThan(1200);
    expect(bmr).toBeLessThan(1500);
  });

  it('퍼스널 컬러 데이터가 Store에 올바르게 저장됨', () => {
    const store = useNutritionInputStore.getState();

    act(() => {
      store.setPersonalColor('Summer');
    });

    expect(useNutritionInputStore.getState().personalColor).toBe('Summer');
  });
});

describe('N-1 통합 테스트: 엣지 케이스', () => {
  beforeEach(() => {
    useNutritionInputStore.getState().resetAll();
  });

  it('최소 안전 칼로리(1200) 보장', () => {
    // 매우 낮은 TDEE에서도 1200 이하로 내려가지 않음
    const lowTDEE = 1500;
    const target = calculateDailyCalorieTarget(lowTDEE, 'weight_loss');

    expect(target).toBe(1200); // 1500 - 500 = 1000이지만 최소 1200
  });

  it('유효하지 않은 입력값 처리', () => {
    expect(calculateBMR('male', 0, 175, 30)).toBe(0);
    expect(calculateBMR('male', 70, 0, 30)).toBe(0);
    expect(calculateTDEE(0, 'moderate')).toBe(0);
    expect(calculateDailyCalorieTarget(0, 'maintain')).toBe(0);
  });

  it('알레르기 여러 개 선택 가능', () => {
    const store = useNutritionInputStore.getState();

    act(() => {
      store.setAllergies(['dairy', 'nuts', 'eggs', 'seafood', 'gluten']);
    });

    expect(useNutritionInputStore.getState().allergies).toHaveLength(5);
  });

  it('기피 음식 한글 입력 처리', () => {
    const store = useNutritionInputStore.getState();

    act(() => {
      store.setDislikedFoods(['간', '순대', '내장류', '생선회']);
    });

    const foods = useNutritionInputStore.getState().dislikedFoods;
    expect(foods).toContain('간');
    expect(foods).toContain('순대');
    expect(foods).toHaveLength(4);
  });

  it('식사 횟수 기본값이 3임', () => {
    const state = useNutritionInputStore.getState();
    expect(state.mealCount).toBe(3);
  });

  it('resetAll이 모든 상태를 초기화함', () => {
    const store = useNutritionInputStore.getState();

    // 모든 값 설정
    act(() => {
      store.setGoal('muscle');
      store.setGender('male');
      store.setBirthDate('1990-01-01');
      store.setHeight(180);
      store.setWeight(80);
      store.setActivityLevel('active');
      store.setMealStyle('western');
      store.setCookingSkill('advanced');
      store.setBudget('premium');
      store.setAllergies(['seafood']);
      store.setDislikedFoods(['간']);
      store.setMealCount(5);
      store.setStep(7);
    });

    // 초기화
    act(() => {
      useNutritionInputStore.getState().resetAll();
    });

    // 검증
    const state = useNutritionInputStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.goal).toBeNull();
    expect(state.gender).toBeNull();
    expect(state.birthDate).toBeNull();
    expect(state.height).toBeNull();
    expect(state.weight).toBeNull();
    expect(state.activityLevel).toBeNull();
    expect(state.mealStyle).toBeNull();
    expect(state.cookingSkill).toBeNull();
    expect(state.budget).toBeNull();
    expect(state.allergies).toEqual([]);
    expect(state.dislikedFoods).toEqual([]);
    expect(state.mealCount).toBe(3);
  });
});

describe('N-1 통합 테스트: 전체 데이터 플로우', () => {
  beforeEach(() => {
    useNutritionInputStore.getState().resetAll();
  });

  it('온보딩 완료 → BMR 계산 → Store 저장 → API 데이터 구성', () => {
    const store = useNutritionInputStore.getState();

    // Step 1-7: 온보딩 데이터 수집
    act(() => {
      store.setGoal('weight_loss');
      store.setGender('female');
      store.setBirthDate('1995-06-15');
      store.setHeight(165);
      store.setWeight(55);
      store.setActivityLevel('moderate');
      store.setMealStyle('korean');
      store.setCookingSkill('intermediate');
      store.setBudget('moderate');
      store.setAllergies(['dairy']);
      store.setDislikedFoods(['간']);
      store.setMealCount(3);
    });

    // BMR/TDEE 계산
    const state = useNutritionInputStore.getState();
    const age = calculateAge(state.birthDate!);
    const bmr = calculateBMR(state.gender!, state.weight!, state.height!, age);
    const tdee = calculateTDEE(bmr, state.activityLevel!);
    const dailyCalorieTarget = calculateDailyCalorieTarget(tdee, state.goal!);
    const macros = calculateMacroTargets(dailyCalorieTarget, state.weight!, state.goal!);

    // 계산값 Store에 저장
    act(() => {
      store.setBMR(bmr);
      store.setTDEE(tdee);
      store.setDailyCalorieTarget(dailyCalorieTarget);
      store.setMacroTargets(macros.protein, macros.carbs, macros.fat);
    });

    // API 데이터 구성 (getInputData)
    const apiData = useNutritionInputStore.getState().getInputData();

    // 검증: 모든 필드가 올바르게 포함됨
    expect(apiData.goal).toBe('weight_loss');
    expect(apiData.bmr).toBeGreaterThan(1200);
    expect(apiData.tdee).toBeGreaterThan(apiData.bmr!);
    expect(apiData.dailyCalorieTarget).toBeLessThan(apiData.tdee!);
    expect(apiData.dailyCalorieTarget).toBeGreaterThanOrEqual(1200);
    expect(apiData.proteinTarget).toBeGreaterThan(0);
    expect(apiData.carbsTarget).toBeGreaterThan(0);
    expect(apiData.fatTarget).toBeGreaterThan(0);
    expect(apiData.mealStyle).toBe('korean');
    expect(apiData.allergies).toContain('dairy');
  });
});
