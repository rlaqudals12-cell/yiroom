import { describe, it, expect } from 'vitest';
import {
  calculateBMRWithBodyType,
  BODY_TYPE_BMR_CORRECTION,
  calculateBMR,
} from '@/lib/nutrition/bmr-calculator';
import type { UserProfile } from '@/lib/nutrition/bmr-calculator';

const TEST_PROFILE: UserProfile = {
  gender: 'male',
  weightKg: 70,
  heightCm: 175,
  age: 30,
};

describe('calculateBMRWithBodyType - 체형 보정 BMR', () => {
  it('체형 없으면 표준 BMR과 동일', () => {
    const standard = calculateBMR(TEST_PROFILE);
    const withoutType = calculateBMRWithBodyType(TEST_PROFILE);
    expect(withoutType).toBe(standard);
  });

  it('V형(역삼각) +3% 보정', () => {
    const standard = calculateBMR(TEST_PROFILE);
    const corrected = calculateBMRWithBodyType(TEST_PROFILE, 'V');
    expect(corrected).toBe(Math.round(standard * 1.03));
    expect(corrected).toBeGreaterThan(standard);
  });

  it('O형(원형) -2% 보정', () => {
    const standard = calculateBMR(TEST_PROFILE);
    const corrected = calculateBMRWithBodyType(TEST_PROFILE, 'O');
    expect(corrected).toBe(Math.round(standard * 0.98));
    expect(corrected).toBeLessThan(standard);
  });

  it('H형(직사각) 보정 없음 (기준선)', () => {
    const standard = calculateBMR(TEST_PROFILE);
    const corrected = calculateBMRWithBodyType(TEST_PROFILE, 'H');
    expect(corrected).toBe(standard);
  });

  it('알 수 없는 체형은 표준 BMR 반환', () => {
    const standard = calculateBMR(TEST_PROFILE);
    expect(calculateBMRWithBodyType(TEST_PROFILE, 'Z')).toBe(standard);
    expect(calculateBMRWithBodyType(TEST_PROFILE, 'unknown')).toBe(standard);
  });

  it('모든 8-Type에 보정계수 존재', () => {
    const types = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];
    for (const t of types) {
      expect(BODY_TYPE_BMR_CORRECTION[t]).toBeDefined();
      expect(BODY_TYPE_BMR_CORRECTION[t]).toBeGreaterThan(0);
      expect(BODY_TYPE_BMR_CORRECTION[t]).toBeLessThanOrEqual(1.05);
    }
  });

  it('여성 프로필에서도 보정 적용', () => {
    const femaleProfile: UserProfile = {
      gender: 'female',
      weightKg: 55,
      heightCm: 162,
      age: 25,
    };
    const standard = calculateBMR(femaleProfile);
    const corrected = calculateBMRWithBodyType(femaleProfile, 'V');
    expect(corrected).toBe(Math.round(standard * 1.03));
  });

  it('유효하지 않은 프로필은 0 반환', () => {
    const invalidProfile: UserProfile = {
      gender: 'male',
      weightKg: 0,
      heightCm: 175,
      age: 30,
    };
    expect(calculateBMRWithBodyType(invalidProfile, 'V')).toBe(0);
  });
});
