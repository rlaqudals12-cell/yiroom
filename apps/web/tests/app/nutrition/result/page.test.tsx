/**
 * N-1 Task 1.18: 결과 페이지 데이터 처리 테스트
 * - BMR/TDEE 계산 로직 검증
 * - Store 데이터 구성 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';
import { calculateAll } from '@/lib/nutrition/calculateBMR';
import { act } from '@testing-library/react';

describe('NutritionResult 데이터 처리', () => {
  beforeEach(() => {
    // Store 초기화 후 테스트 데이터 설정
    act(() => {
      const store = useNutritionInputStore.getState();
      store.resetAll();
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
    });
  });

  describe('BMR/TDEE 계산', () => {
    it('입력 데이터로 BMR 계산', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      expect(result.bmr).toBeGreaterThan(1200);
      expect(result.bmr).toBeLessThan(1600);
    });

    it('TDEE가 BMR보다 큼', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      expect(result.tdee).toBeGreaterThan(result.bmr);
    });

    it('체중 감량 목표 시 칼로리 적자 적용', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      expect(result.dailyCalorieTarget).toBeLessThan(result.tdee);
      expect(result.dailyCalorieTarget).toBeGreaterThanOrEqual(1200);
    });

    it('영양소 목표가 계산됨', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      expect(result.proteinTarget).toBeGreaterThan(0);
      expect(result.carbsTarget).toBeGreaterThan(0);
      expect(result.fatTarget).toBeGreaterThan(0);
    });
  });

  describe('Store 업데이트', () => {
    it('계산 결과를 Store에 저장', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      act(() => {
        const store = useNutritionInputStore.getState();
        store.setBMR(result.bmr);
        store.setTDEE(result.tdee);
        store.setDailyCalorieTarget(result.dailyCalorieTarget);
        store.setMacroTargets(
          result.proteinTarget,
          result.carbsTarget,
          result.fatTarget
        );
      });

      const state = useNutritionInputStore.getState();
      expect(state.bmr).toBe(result.bmr);
      expect(state.tdee).toBe(result.tdee);
      expect(state.dailyCalorieTarget).toBe(result.dailyCalorieTarget);
      expect(state.proteinTarget).toBe(result.proteinTarget);
      expect(state.carbsTarget).toBe(result.carbsTarget);
      expect(state.fatTarget).toBe(result.fatTarget);
    });
  });

  describe('API 데이터 구성', () => {
    it('getInputData에 모든 필드 포함', () => {
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
    });

    it('BMR/TDEE 저장 후 getInputData에 포함', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      act(() => {
        const store = useNutritionInputStore.getState();
        store.setBMR(result.bmr);
        store.setTDEE(result.tdee);
        store.setDailyCalorieTarget(result.dailyCalorieTarget);
        store.setMacroTargets(
          result.proteinTarget,
          result.carbsTarget,
          result.fatTarget
        );
      });

      const updatedInputData = useNutritionInputStore.getState().getInputData();

      expect(updatedInputData.bmr).toBe(result.bmr);
      expect(updatedInputData.tdee).toBe(result.tdee);
      expect(updatedInputData.dailyCalorieTarget).toBe(result.dailyCalorieTarget);
      expect(updatedInputData.proteinTarget).toBe(result.proteinTarget);
      expect(updatedInputData.carbsTarget).toBe(result.carbsTarget);
      expect(updatedInputData.fatTarget).toBe(result.fatTarget);
    });
  });

  describe('필수 데이터 검증', () => {
    it('필수 필드 누락 감지', () => {
      act(() => {
        useNutritionInputStore.getState().resetAll();
      });

      const inputData = useNutritionInputStore.getState().getInputData();

      const hasRequiredFields =
        inputData.goal &&
        inputData.gender &&
        inputData.birthDate &&
        inputData.height &&
        inputData.weight &&
        inputData.activityLevel;

      expect(hasRequiredFields).toBeFalsy();
    });

    it('필수 필드 모두 있을 때 검증 통과', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const hasRequiredFields =
        inputData.goal &&
        inputData.gender &&
        inputData.birthDate &&
        inputData.height &&
        inputData.weight &&
        inputData.activityLevel;

      expect(hasRequiredFields).toBeTruthy();
    });
  });

  describe('한 끼당 칼로리 계산', () => {
    it('식사 횟수로 한 끼 칼로리 계산', () => {
      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      const mealCount = inputData.mealCount;
      const perMealCalories = Math.round(result.dailyCalorieTarget / mealCount);

      expect(perMealCalories).toBeGreaterThan(300);
      expect(perMealCalories).toBeLessThan(800);
    });
  });

  describe('목표별 계산 검증', () => {
    it('근육 증가 목표 시 칼로리 잉여', () => {
      act(() => {
        useNutritionInputStore.getState().setGoal('muscle');
      });

      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      expect(result.dailyCalorieTarget).toBeGreaterThan(result.tdee);
    });

    it('유지 목표 시 TDEE 유지', () => {
      act(() => {
        useNutritionInputStore.getState().setGoal('maintain');
      });

      const inputData = useNutritionInputStore.getState().getInputData();

      const result = calculateAll(
        inputData.gender!,
        inputData.weight!,
        inputData.height!,
        inputData.birthDate!,
        inputData.activityLevel!,
        inputData.goal!
      );

      expect(result.dailyCalorieTarget).toBe(result.tdee);
    });
  });
});
