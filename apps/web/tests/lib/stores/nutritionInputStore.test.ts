/**
 * N-1 Task 1.20: Zustand Store 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';

describe('useNutritionInputStore', () => {
  beforeEach(() => {
    // 각 테스트 전 store 초기화
    act(() => {
      useNutritionInputStore.getState().resetAll();
    });
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
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

  describe('Step 1: Goal', () => {
    it('sets goal correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setGoal('weight_loss');
      });

      expect(useNutritionInputStore.getState().goal).toBe('weight_loss');
    });

    it('can clear goal', () => {
      act(() => {
        useNutritionInputStore.getState().setGoal('muscle');
        useNutritionInputStore.getState().setGoal(null);
      });

      expect(useNutritionInputStore.getState().goal).toBeNull();
    });
  });

  describe('Step 2: Basic Info', () => {
    it('sets gender correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setGender('female');
      });

      expect(useNutritionInputStore.getState().gender).toBe('female');
    });

    it('sets birth date correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setBirthDate('1995-06-15');
      });

      expect(useNutritionInputStore.getState().birthDate).toBe('1995-06-15');
    });

    it('sets height correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setHeight(165);
      });

      expect(useNutritionInputStore.getState().height).toBe(165);
    });

    it('sets weight correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setWeight(55);
      });

      expect(useNutritionInputStore.getState().weight).toBe(55);
    });

    it('sets activity level correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setActivityLevel('moderate');
      });

      expect(useNutritionInputStore.getState().activityLevel).toBe('moderate');
    });
  });

  describe('Step 3: Meal Style', () => {
    it('sets meal style correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setMealStyle('korean');
      });

      expect(useNutritionInputStore.getState().mealStyle).toBe('korean');
    });
  });

  describe('Step 4: Cooking Skill', () => {
    it('sets cooking skill correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setCookingSkill('intermediate');
      });

      expect(useNutritionInputStore.getState().cookingSkill).toBe('intermediate');
    });
  });

  describe('Step 5: Budget', () => {
    it('sets budget correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setBudget('moderate');
      });

      expect(useNutritionInputStore.getState().budget).toBe('moderate');
    });
  });

  describe('Step 6: Allergies', () => {
    it('sets allergies correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setAllergies(['dairy', 'nuts']);
      });

      expect(useNutritionInputStore.getState().allergies).toEqual(['dairy', 'nuts']);
    });

    it('sets disliked foods correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setDislikedFoods(['간', '순대']);
      });

      expect(useNutritionInputStore.getState().dislikedFoods).toEqual(['간', '순대']);
    });
  });

  describe('Step 7: Meal Count', () => {
    it('sets meal count correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setMealCount(4);
      });

      expect(useNutritionInputStore.getState().mealCount).toBe(4);
    });
  });

  describe('BMR/TDEE values', () => {
    it('sets BMR correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setBMR(1500);
      });

      expect(useNutritionInputStore.getState().bmr).toBe(1500);
    });

    it('sets TDEE correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setTDEE(2000);
      });

      expect(useNutritionInputStore.getState().tdee).toBe(2000);
    });

    it('sets daily calorie target correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setDailyCalorieTarget(1800);
      });

      expect(useNutritionInputStore.getState().dailyCalorieTarget).toBe(1800);
    });

    it('sets macro targets correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setMacroTargets(120, 200, 60);
      });

      const state = useNutritionInputStore.getState();
      expect(state.proteinTarget).toBe(120);
      expect(state.carbsTarget).toBe(200);
      expect(state.fatTarget).toBe(60);
    });
  });

  describe('step navigation', () => {
    it('sets current step correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setStep(3);
      });

      expect(useNutritionInputStore.getState().currentStep).toBe(3);
    });
  });

  describe('getInputData', () => {
    it('returns complete input data object', () => {
      act(() => {
        const store = useNutritionInputStore.getState();
        store.setGoal('weight_loss');
        store.setGender('female');
        store.setBirthDate('1995-06-15');
        store.setHeight(160);
        store.setWeight(55);
        store.setActivityLevel('moderate');
        store.setMealStyle('korean');
        store.setCookingSkill('intermediate');
        store.setBudget('moderate');
        store.setAllergies(['dairy']);
        store.setDislikedFoods(['간']);
        store.setMealCount(3);
        store.setBMR(1350);
        store.setTDEE(2000);
        store.setDailyCalorieTarget(1500);
        store.setMacroTargets(88, 150, 55);
      });

      const inputData = useNutritionInputStore.getState().getInputData();

      expect(inputData.goal).toBe('weight_loss');
      expect(inputData.gender).toBe('female');
      expect(inputData.birthDate).toBe('1995-06-15');
      expect(inputData.height).toBe(160);
      expect(inputData.weight).toBe(55);
      expect(inputData.activityLevel).toBe('moderate');
      expect(inputData.mealStyle).toBe('korean');
      expect(inputData.cookingSkill).toBe('intermediate');
      expect(inputData.budget).toBe('moderate');
      expect(inputData.allergies).toEqual(['dairy']);
      expect(inputData.dislikedFoods).toEqual(['간']);
      expect(inputData.mealCount).toBe(3);
      expect(inputData.bmr).toBe(1350);
      expect(inputData.tdee).toBe(2000);
      expect(inputData.dailyCalorieTarget).toBe(1500);
      expect(inputData.proteinTarget).toBe(88);
      expect(inputData.carbsTarget).toBe(150);
      expect(inputData.fatTarget).toBe(55);
    });
  });

  describe('resetAll', () => {
    it('resets all values to initial state', () => {
      // 모든 값 설정
      act(() => {
        const store = useNutritionInputStore.getState();
        store.setStep(5);
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
        store.setDislikedFoods(['브로콜리']);
        store.setMealCount(5);
      });

      // 리셋
      act(() => {
        useNutritionInputStore.getState().resetAll();
      });

      // 초기 상태 확인
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

  describe('C-1 integration', () => {
    it('sets body type data correctly', () => {
      const bodyData = {
        type: 'X' as const,
        proportions: { shoulder: 40, waist: 28, hip: 38 },
        height: 165,
        weight: 55,
      };

      act(() => {
        useNutritionInputStore.getState().setBodyTypeData(bodyData);
      });

      expect(useNutritionInputStore.getState().bodyTypeData).toEqual(bodyData);
    });

    it('sets personal color correctly', () => {
      act(() => {
        useNutritionInputStore.getState().setPersonalColor('Spring');
      });

      expect(useNutritionInputStore.getState().personalColor).toBe('Spring');
    });
  });
});
