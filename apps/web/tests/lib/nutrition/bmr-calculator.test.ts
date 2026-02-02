/**
 * BMR/TDEE 계산기 테스트
 *
 * @module tests/lib/nutrition/bmr-calculator
 * @description Mifflin-St Jeor 공식 기반 BMR/TDEE 계산 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateEnergyExpenditure,
  validateProfile,
  verifyMifflinStJeorFormula,
  ACTIVITY_MULTIPLIERS,
  ACTIVITY_LEVEL_LABELS,
  type UserProfile,
  type ActivityLevel,
} from '@/lib/nutrition/bmr-calculator';

describe('lib/nutrition/bmr-calculator', () => {
  // =========================================
  // 상수 테스트
  // =========================================

  describe('ACTIVITY_MULTIPLIERS', () => {
    it('모든 활동 수준에 대한 계수가 정의되어 있다', () => {
      expect(ACTIVITY_MULTIPLIERS.sedentary).toBe(1.2);
      expect(ACTIVITY_MULTIPLIERS.light).toBe(1.375);
      expect(ACTIVITY_MULTIPLIERS.moderate).toBe(1.55);
      expect(ACTIVITY_MULTIPLIERS.active).toBe(1.725);
      expect(ACTIVITY_MULTIPLIERS.very_active).toBe(1.9);
    });

    it('활동 계수는 좌식에서 매우 활동적으로 갈수록 증가한다', () => {
      const levels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      for (let i = 0; i < levels.length - 1; i++) {
        expect(ACTIVITY_MULTIPLIERS[levels[i]]).toBeLessThan(
          ACTIVITY_MULTIPLIERS[levels[i + 1]]
        );
      }
    });
  });

  describe('ACTIVITY_LEVEL_LABELS', () => {
    it('모든 활동 수준에 한글 라벨이 있다', () => {
      const levels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      for (const level of levels) {
        expect(ACTIVITY_LEVEL_LABELS[level].label).toBeDefined();
        expect(ACTIVITY_LEVEL_LABELS[level].description).toBeDefined();
        expect(typeof ACTIVITY_LEVEL_LABELS[level].label).toBe('string');
      }
    });
  });

  // =========================================
  // calculateBMR 테스트
  // =========================================

  describe('calculateBMR', () => {
    it('30세 남성 70kg 175cm의 BMR을 올바르게 계산한다', () => {
      // Mifflin-St Jeor: 10 × 70 + 6.25 × 175 - 5 × 30 + 5 = 1649
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 30,
      };
      expect(calculateBMR(profile)).toBe(1649);
    });

    it('30세 여성 60kg 165cm의 BMR을 올바르게 계산한다', () => {
      // Mifflin-St Jeor: 10 × 60 + 6.25 × 165 - 5 × 30 - 161 = 1320
      // 600 + 1031.25 - 150 - 161 = 1320.25 ≈ 1320
      const profile: UserProfile = {
        gender: 'female',
        weightKg: 60,
        heightCm: 165,
        age: 30,
      };
      expect(calculateBMR(profile)).toBe(1320);
    });

    it('같은 체중/키/나이에서 남성이 여성보다 BMR이 높다', () => {
      const maleProfile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 30,
      };
      const femaleProfile: UserProfile = {
        gender: 'female',
        weightKg: 70,
        heightCm: 175,
        age: 30,
      };
      // 남성-여성 차이는 5 - (-161) = 166
      expect(calculateBMR(maleProfile)).toBe(calculateBMR(femaleProfile) + 166);
    });

    it('체중이 증가하면 BMR이 증가한다', () => {
      const lighter: UserProfile = {
        gender: 'male',
        weightKg: 60,
        heightCm: 175,
        age: 30,
      };
      const heavier: UserProfile = {
        gender: 'male',
        weightKg: 80,
        heightCm: 175,
        age: 30,
      };
      // 10kg 차이 = 100kcal 차이
      expect(calculateBMR(heavier) - calculateBMR(lighter)).toBe(200);
    });

    it('나이가 증가하면 BMR이 감소한다', () => {
      const younger: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 20,
      };
      const older: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 40,
      };
      // 20년 차이 = 100kcal 차이
      expect(calculateBMR(younger) - calculateBMR(older)).toBe(100);
    });

    it('유효하지 않은 입력에서 0을 반환한다', () => {
      expect(
        calculateBMR({ gender: 'male', weightKg: 0, heightCm: 175, age: 30 })
      ).toBe(0);
      expect(
        calculateBMR({ gender: 'male', weightKg: 70, heightCm: 0, age: 30 })
      ).toBe(0);
      expect(
        calculateBMR({ gender: 'male', weightKg: 70, heightCm: 175, age: 0 })
      ).toBe(0);
      expect(
        calculateBMR({ gender: 'male', weightKg: -10, heightCm: 175, age: 30 })
      ).toBe(0);
    });
  });

  // =========================================
  // calculateTDEE 테스트
  // =========================================

  describe('calculateTDEE', () => {
    const bmr = 1649; // 30세 남성 70kg 175cm

    it('좌식 생활의 TDEE를 계산한다', () => {
      expect(calculateTDEE(bmr, 'sedentary')).toBe(Math.round(1649 * 1.2));
    });

    it('가벼운 활동의 TDEE를 계산한다', () => {
      expect(calculateTDEE(bmr, 'light')).toBe(Math.round(1649 * 1.375));
    });

    it('보통 활동의 TDEE를 계산한다', () => {
      expect(calculateTDEE(bmr, 'moderate')).toBe(Math.round(1649 * 1.55));
    });

    it('활동적인 경우의 TDEE를 계산한다', () => {
      expect(calculateTDEE(bmr, 'active')).toBe(Math.round(1649 * 1.725));
    });

    it('매우 활동적인 경우의 TDEE를 계산한다', () => {
      expect(calculateTDEE(bmr, 'very_active')).toBe(Math.round(1649 * 1.9));
    });

    it('BMR이 0이면 TDEE도 0이다', () => {
      expect(calculateTDEE(0, 'moderate')).toBe(0);
    });

    it('BMR이 음수면 TDEE는 0이다', () => {
      expect(calculateTDEE(-100, 'moderate')).toBe(0);
    });
  });

  // =========================================
  // calculateEnergyExpenditure 테스트
  // =========================================

  describe('calculateEnergyExpenditure', () => {
    it('BMR과 TDEE를 함께 계산한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 30,
      };
      const result = calculateEnergyExpenditure(profile, 'moderate');

      expect(result.bmr).toBe(1649);
      expect(result.tdee).toBe(Math.round(1649 * 1.55));
      expect(result.formula).toBe('mifflin-st-jeor');
      expect(result.activityLevel).toBe('moderate');
      expect(result.activityMultiplier).toBe(1.55);
    });

    it('유효하지 않은 프로필에서 BMR과 TDEE가 0이다', () => {
      const invalidProfile: UserProfile = {
        gender: 'male',
        weightKg: 0,
        heightCm: 175,
        age: 30,
      };
      const result = calculateEnergyExpenditure(invalidProfile, 'moderate');

      expect(result.bmr).toBe(0);
      expect(result.tdee).toBe(0);
    });
  });

  // =========================================
  // validateProfile 테스트
  // =========================================

  describe('validateProfile', () => {
    it('유효한 프로필을 통과시킨다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 30,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('체중이 0이하면 에러를 반환한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 0,
        heightCm: 175,
        age: 30,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('체중이 500kg 초과면 에러를 반환한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 501,
        heightCm: 175,
        age: 30,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
    });

    it('키가 0이하면 에러를 반환한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 0,
        age: 30,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
    });

    it('키가 300cm 초과면 에러를 반환한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 301,
        age: 30,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
    });

    it('나이가 0이하면 에러를 반환한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 0,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
    });

    it('나이가 150세 초과면 에러를 반환한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 70,
        heightCm: 175,
        age: 151,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
    });

    it('여러 에러가 있으면 모두 반환한다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 0,
        heightCm: 0,
        age: 0,
      };
      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================
  // verifyMifflinStJeorFormula 테스트
  // =========================================

  describe('verifyMifflinStJeorFormula', () => {
    it('Mifflin-St Jeor 공식이 올바르게 구현되었다', () => {
      expect(verifyMifflinStJeorFormula()).toBe(true);
    });
  });

  // =========================================
  // 실제 시나리오 테스트
  // =========================================

  describe('실제 시나리오', () => {
    it('다이어트 목표: TDEE의 80%를 계산할 수 있다', () => {
      const profile: UserProfile = {
        gender: 'female',
        weightKg: 65,
        heightCm: 162,
        age: 28,
      };
      const result = calculateEnergyExpenditure(profile, 'light');
      const deficitCalories = Math.round(result.tdee * 0.8);

      expect(deficitCalories).toBeLessThan(result.tdee);
      expect(deficitCalories).toBeGreaterThan(result.bmr);
    });

    it('벌크업 목표: TDEE의 110%를 계산할 수 있다', () => {
      const profile: UserProfile = {
        gender: 'male',
        weightKg: 75,
        heightCm: 178,
        age: 25,
      };
      const result = calculateEnergyExpenditure(profile, 'active');
      const surplusCalories = Math.round(result.tdee * 1.1);

      expect(surplusCalories).toBeGreaterThan(result.tdee);
    });
  });
});
