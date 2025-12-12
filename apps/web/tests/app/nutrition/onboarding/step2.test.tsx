/**
 * N-1 Task 1.10: 온보딩 Step 2 Store 상호작용 테스트
 * - 기본 정보 설정 테스트
 * - C-1 연동 데이터 테스트
 * - 진행 조건 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';
import { act } from '@testing-library/react';
import { ACTIVITY_LEVEL_LABELS } from '@/lib/nutrition/calculateBMR';

describe('NutritionStep2 Store 상호작용', () => {
  beforeEach(() => {
    // Store 초기화
    act(() => {
      useNutritionInputStore.getState().resetAll();
    });
  });

  describe('기본 정보 설정', () => {
    it('성별 설정', () => {
      act(() => {
        useNutritionInputStore.getState().setGender('female');
      });
      expect(useNutritionInputStore.getState().gender).toBe('female');
    });

    it('생년월일 설정', () => {
      act(() => {
        useNutritionInputStore.getState().setBirthDate('1995-06-15');
      });
      expect(useNutritionInputStore.getState().birthDate).toBe('1995-06-15');
    });

    it('키 설정', () => {
      act(() => {
        useNutritionInputStore.getState().setHeight(165);
      });
      expect(useNutritionInputStore.getState().height).toBe(165);
    });

    it('체중 설정', () => {
      act(() => {
        useNutritionInputStore.getState().setWeight(55);
      });
      expect(useNutritionInputStore.getState().weight).toBe(55);
    });

    it('활동 수준 설정', () => {
      act(() => {
        useNutritionInputStore.getState().setActivityLevel('moderate');
      });
      expect(useNutritionInputStore.getState().activityLevel).toBe('moderate');
    });
  });

  describe('C-1 연동 데이터', () => {
    it('체형 데이터 설정', () => {
      const bodyData = {
        type: 'X' as const,
        proportions: { shoulder: 40, waist: 28, hip: 38 },
        height: 165,
        weight: 55,
      };

      act(() => {
        useNutritionInputStore.getState().setBodyTypeData(bodyData);
      });

      const state = useNutritionInputStore.getState();
      expect(state.bodyTypeData).toEqual(bodyData);
    });

    it('C-1에서 키/체중 가져오기', () => {
      const bodyData = {
        type: 'H' as const,
        proportions: { shoulder: 40, waist: 30, hip: 38 },
        height: 170,
        weight: 65,
      };

      act(() => {
        const store = useNutritionInputStore.getState();
        store.setBodyTypeData(bodyData);
        store.setHeight(bodyData.height);
        store.setWeight(bodyData.weight);
      });

      const state = useNutritionInputStore.getState();
      expect(state.height).toBe(170);
      expect(state.weight).toBe(65);
    });
  });

  describe('Step 2 진행 조건', () => {
    it('모든 필수 필드 입력 시 진행 가능', () => {
      act(() => {
        const store = useNutritionInputStore.getState();
        store.setGender('female');
        store.setBirthDate('1995-06-15');
        store.setHeight(160);
        store.setWeight(55);
        store.setActivityLevel('moderate');
      });

      const state = useNutritionInputStore.getState();
      const canProceed =
        state.gender &&
        state.birthDate &&
        state.height &&
        state.weight &&
        state.activityLevel;

      expect(canProceed).toBeTruthy();
    });

    it('필수 필드 누락 시 진행 불가', () => {
      act(() => {
        const store = useNutritionInputStore.getState();
        store.setGender('female');
        // birthDate 누락
        store.setHeight(160);
        store.setWeight(55);
        store.setActivityLevel('moderate');
      });

      const state = useNutritionInputStore.getState();
      const canProceed =
        state.gender &&
        state.birthDate &&
        state.height &&
        state.weight &&
        state.activityLevel;

      expect(canProceed).toBeFalsy();
    });

    it('키만 누락 시 진행 불가', () => {
      act(() => {
        const store = useNutritionInputStore.getState();
        store.setGender('male');
        store.setBirthDate('1990-01-01');
        // height 누락
        store.setWeight(70);
        store.setActivityLevel('active');
      });

      const state = useNutritionInputStore.getState();
      const canProceed =
        state.gender &&
        state.birthDate &&
        state.height &&
        state.weight &&
        state.activityLevel;

      expect(canProceed).toBeFalsy();
    });
  });

  describe('활동 수준 레이블', () => {
    it('모든 활동 수준에 레이블이 정의됨', () => {
      const levels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;

      levels.forEach((level) => {
        expect(ACTIVITY_LEVEL_LABELS[level]).toBeDefined();
        expect(ACTIVITY_LEVEL_LABELS[level].label).toBeTruthy();
        expect(ACTIVITY_LEVEL_LABELS[level].description).toBeTruthy();
      });
    });

    it('활동 수준 레이블에 설명 포함', () => {
      expect(ACTIVITY_LEVEL_LABELS.sedentary.description).toBeTruthy();
      expect(ACTIVITY_LEVEL_LABELS.moderate.description).toBeTruthy();
      expect(ACTIVITY_LEVEL_LABELS.very_active.description).toBeTruthy();
    });
  });

  describe('단계 네비게이션', () => {
    it('Step 2로 이동', () => {
      act(() => {
        useNutritionInputStore.getState().setStep(2);
      });
      expect(useNutritionInputStore.getState().currentStep).toBe(2);
    });

    it('Step 1로 돌아가기', () => {
      act(() => {
        useNutritionInputStore.getState().setStep(2);
        useNutritionInputStore.getState().setStep(1);
      });
      expect(useNutritionInputStore.getState().currentStep).toBe(1);
    });

    it('Step 3으로 이동', () => {
      act(() => {
        useNutritionInputStore.getState().setStep(3);
      });
      expect(useNutritionInputStore.getState().currentStep).toBe(3);
    });
  });

  describe('성별 옵션', () => {
    it('male 설정', () => {
      act(() => {
        useNutritionInputStore.getState().setGender('male');
      });
      expect(useNutritionInputStore.getState().gender).toBe('male');
    });

    it('female 설정', () => {
      act(() => {
        useNutritionInputStore.getState().setGender('female');
      });
      expect(useNutritionInputStore.getState().gender).toBe('female');
    });

    it('성별 변경', () => {
      act(() => {
        useNutritionInputStore.getState().setGender('male');
        useNutritionInputStore.getState().setGender('female');
      });
      expect(useNutritionInputStore.getState().gender).toBe('female');
    });
  });
});
