import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  NutritionGoal,
  Gender,
  ActivityLevel,
  MealStyle,
  CookingSkill,
  BudgetLevel,
  AllergyType,
  BodyTypeData,
  PersonalColorSeason,
  NutritionInputData,
} from '@/types/nutrition';

// Re-export types for convenience
export type {
  NutritionGoal,
  Gender,
  ActivityLevel,
  MealStyle,
  CookingSkill,
  BudgetLevel,
  AllergyType,
} from '@/types/nutrition';

// Store State 타입
interface NutritionInputState {
  // 현재 단계
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

  // 연동 데이터 (C-1, PC-1)
  bodyTypeData: BodyTypeData | null;
  personalColor: PersonalColorSeason | null;

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
  setBMR: (bmr: number | null) => void;
  setTDEE: (tdee: number | null) => void;
  setDailyCalorieTarget: (target: number | null) => void;
  setMacroTargets: (protein: number | null, carbs: number | null, fat: number | null) => void;
  setBodyTypeData: (data: BodyTypeData | null) => void;
  setPersonalColor: (color: PersonalColorSeason | null) => void;
  resetAll: () => void;
  getInputData: () => NutritionInputData;
  // P0-2: 간소화 지원 메서드
  applyDefaults: () => void;
}

// 초기 상태
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
  bodyTypeData: null as BodyTypeData | null,
  personalColor: null as PersonalColorSeason | null,
};

export const useNutritionInputStore = create<NutritionInputState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setGoal: (goal) => set({ goal }),

      setGender: (gender) => set({ gender }),

      setBirthDate: (birthDate) => set({ birthDate }),

      setHeight: (height) => set({ height }),

      setWeight: (weight) => set({ weight }),

      setActivityLevel: (level) => set({ activityLevel: level }),

      setMealStyle: (style) => set({ mealStyle: style }),

      setCookingSkill: (skill) => set({ cookingSkill: skill }),

      setBudget: (budget) => set({ budget }),

      setAllergies: (allergies) => set({ allergies }),

      setDislikedFoods: (foods) => set({ dislikedFoods: foods }),

      setMealCount: (count) => set({ mealCount: count }),

      setBMR: (bmr) => set({ bmr }),

      setTDEE: (tdee) => set({ tdee }),

      setDailyCalorieTarget: (target) => set({ dailyCalorieTarget: target }),

      setMacroTargets: (protein, carbs, fat) =>
        set({ proteinTarget: protein, carbsTarget: carbs, fatTarget: fat }),

      setBodyTypeData: (data) => set({ bodyTypeData: data }),

      setPersonalColor: (color) => set({ personalColor: color }),

      resetAll: () => set(initialState),

      // P0-2: 선택사항 기본값 적용 (건너뛰기 시)
      applyDefaults: () => {
        set({
          allergies: [],
          dislikedFoods: [],
          mealCount: 3, // 기본값 3끼
        });
      },

      getInputData: () => {
        const state = get();
        return {
          goal: state.goal,
          gender: state.gender,
          birthDate: state.birthDate,
          height: state.height,
          weight: state.weight,
          activityLevel: state.activityLevel,
          mealStyle: state.mealStyle,
          cookingSkill: state.cookingSkill,
          budget: state.budget,
          allergies: state.allergies,
          dislikedFoods: state.dislikedFoods,
          mealCount: state.mealCount,
          bmr: state.bmr,
          tdee: state.tdee,
          dailyCalorieTarget: state.dailyCalorieTarget,
          proteinTarget: state.proteinTarget,
          carbsTarget: state.carbsTarget,
          fatTarget: state.fatTarget,
          bodyTypeData: state.bodyTypeData,
          personalColor: state.personalColor,
        };
      },
    }),
    {
      name: 'nutrition-input-storage',
    }
  )
);
