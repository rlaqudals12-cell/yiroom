/**
 * 영양 온보딩 입력 스토어
 * @description 다단계 폼 상태 관리 (AsyncStorage 영속)
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 타입 정의
export type NutritionGoal = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health';
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type MealStyle = 'korean' | 'western' | 'mixed' | 'vegetarian';
export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type AllergyType =
  | 'dairy'
  | 'eggs'
  | 'gluten'
  | 'nuts'
  | 'seafood'
  | 'soy'
  | 'shellfish';

interface NutritionInputState {
  // 현재 단계 (1-7)
  currentStep: number;

  // Step 1: 목표
  goal: NutritionGoal | null;

  // Step 2: 기본 정보
  gender: Gender | null;
  birthDate: string | null;
  height: number | null;
  weight: number | null;
  activityLevel: ActivityLevel | null;

  // Step 3: 식사 스타일
  mealStyle: MealStyle | null;

  // Step 4: 요리 스킬
  cookingSkill: CookingSkill | null;

  // Step 5: 예산
  budget: BudgetLevel | null;

  // Step 6: 알레르기/기피
  allergies: AllergyType[];
  dislikedFoods: string[];

  // Step 7: 식사 횟수
  mealCount: number;

  // 계산값
  bmr: number | null;
  tdee: number | null;
  dailyCalorieTarget: number | null;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;

  // Actions
  setStep: (step: number) => void;
  setGoal: (goal: NutritionGoal | null) => void;
  setGender: (gender: Gender | null) => void;
  setBirthDate: (birthDate: string | null) => void;
  setHeight: (height: number | null) => void;
  setWeight: (weight: number | null) => void;
  setActivityLevel: (level: ActivityLevel | null) => void;
  setMealStyle: (style: MealStyle | null) => void;
  setCookingSkill: (skill: CookingSkill | null) => void;
  setBudget: (budget: BudgetLevel | null) => void;
  setAllergies: (allergies: AllergyType[]) => void;
  setDislikedFoods: (foods: string[]) => void;
  setMealCount: (count: number) => void;
  setCalculatedValues: (values: {
    bmr: number;
    tdee: number;
    dailyCalorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
  }) => void;
  resetAll: () => void;
  applyDefaults: () => void;
  isStepComplete: (step: number) => boolean;
}

const initialState = {
  currentStep: 1,
  goal: null as NutritionGoal | null,
  gender: null as Gender | null,
  birthDate: null as string | null,
  height: null as number | null,
  weight: null as number | null,
  activityLevel: null as ActivityLevel | null,
  mealStyle: null as MealStyle | null,
  cookingSkill: null as CookingSkill | null,
  budget: null as BudgetLevel | null,
  allergies: [] as AllergyType[],
  dislikedFoods: [] as string[],
  mealCount: 3,
  bmr: null as number | null,
  tdee: null as number | null,
  dailyCalorieTarget: null as number | null,
  proteinTarget: null as number | null,
  carbsTarget: null as number | null,
  fatTarget: null as number | null,
};

export const useNutritionInputStore = create<NutritionInputState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (currentStep) => set({ currentStep }),
      setGoal: (goal) => set({ goal }),
      setGender: (gender) => set({ gender }),
      setBirthDate: (birthDate) => set({ birthDate }),
      setHeight: (height) => set({ height }),
      setWeight: (weight) => set({ weight }),
      setActivityLevel: (activityLevel) => set({ activityLevel }),
      setMealStyle: (mealStyle) => set({ mealStyle }),
      setCookingSkill: (cookingSkill) => set({ cookingSkill }),
      setBudget: (budget) => set({ budget }),
      setAllergies: (allergies) => set({ allergies }),
      setDislikedFoods: (dislikedFoods) => set({ dislikedFoods }),
      setMealCount: (mealCount) => set({ mealCount }),

      setCalculatedValues: (values) =>
        set({
          bmr: values.bmr,
          tdee: values.tdee,
          dailyCalorieTarget: values.dailyCalorieTarget,
          proteinTarget: values.proteinTarget,
          carbsTarget: values.carbsTarget,
          fatTarget: values.fatTarget,
        }),

      resetAll: () => set(initialState),

      applyDefaults: () => {
        set({
          allergies: [],
          dislikedFoods: [],
          mealCount: 3,
        });
      },

      isStepComplete: (step) => {
        const state = get();
        switch (step) {
          case 1:
            return state.goal !== null;
          case 2:
            return (
              state.gender !== null &&
              state.birthDate !== null &&
              state.height !== null &&
              state.weight !== null &&
              state.activityLevel !== null
            );
          case 3:
            return state.mealStyle !== null;
          case 4:
            return state.cookingSkill !== null;
          case 5:
            return state.budget !== null;
          case 6:
            return true; // 알레르기는 선택사항
          case 7:
            return state.mealCount > 0;
          default:
            return false;
        }
      },
    }),
    {
      name: 'yiroom-nutrition-input',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * 온보딩 완료 여부 확인
 */
export function isNutritionOnboardingComplete(): boolean {
  const state = useNutritionInputStore.getState();
  return (
    state.goal !== null &&
    state.gender !== null &&
    state.height !== null &&
    state.weight !== null
  );
}
