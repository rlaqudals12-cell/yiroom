/**
 * N-1 Task 1.20: BMR/TDEE 계산 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateAll,
} from '@/lib/nutrition/calculateBMR';

describe('calculateAge', () => {
  it('calculates age correctly for past birthday this year', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const birthMonth = today.getMonth(); // 이번 달
    const birthDay = 1; // 이미 지난 날

    const birthDate = `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    const age = calculateAge(birthDate);

    expect(age).toBeGreaterThanOrEqual(29);
    expect(age).toBeLessThanOrEqual(30);
  });

  it('calculates age correctly for future birthday this year', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    // 12월 31일 생일 (아직 안 지남)
    const birthDate = `${birthYear}-12-31`;
    const age = calculateAge(birthDate);

    // 현재 날짜가 12월 31일이 아니면 24살
    if (today.getMonth() < 11 || (today.getMonth() === 11 && today.getDate() < 31)) {
      expect(age).toBe(24);
    } else {
      expect(age).toBe(25);
    }
  });
});

describe('calculateBMR', () => {
  it('calculates BMR for male correctly', () => {
    // 남성, 70kg, 175cm, 30세
    // BMR = 88.362 + (13.397 × 70) + (4.799 × 175) - (5.677 × 30)
    // BMR = 88.362 + 937.79 + 839.825 - 170.31 = 1695.667
    const bmr = calculateBMR('male', 70, 175, 30);
    expect(bmr).toBeCloseTo(1696, 0);
  });

  it('calculates BMR for female correctly', () => {
    // 여성, 55kg, 160cm, 25세
    // BMR = 447.593 + (9.247 × 55) + (3.098 × 160) - (4.330 × 25)
    // BMR = 447.593 + 508.585 + 495.68 - 108.25 = 1343.608
    const bmr = calculateBMR('female', 55, 160, 25);
    expect(bmr).toBeCloseTo(1344, 0);
  });

  it('returns 0 for invalid inputs', () => {
    expect(calculateBMR('male', 0, 175, 30)).toBe(0);
    expect(calculateBMR('male', 70, 0, 30)).toBe(0);
    expect(calculateBMR('male', 70, 175, 0)).toBe(0);
    expect(calculateBMR('male', -70, 175, 30)).toBe(0);
  });
});

describe('calculateTDEE', () => {
  it('calculates TDEE with sedentary activity', () => {
    const bmr = 1500;
    const tdee = calculateTDEE(bmr, 'sedentary');
    expect(tdee).toBe(1800); // 1500 * 1.2
  });

  it('calculates TDEE with moderate activity', () => {
    const bmr = 1500;
    const tdee = calculateTDEE(bmr, 'moderate');
    expect(tdee).toBe(2325); // 1500 * 1.55
  });

  it('calculates TDEE with very_active activity', () => {
    const bmr = 1500;
    const tdee = calculateTDEE(bmr, 'very_active');
    expect(tdee).toBe(2850); // 1500 * 1.9
  });

  it('returns 0 for invalid BMR', () => {
    expect(calculateTDEE(0, 'moderate')).toBe(0);
    expect(calculateTDEE(-100, 'moderate')).toBe(0);
  });
});

describe('calculateDailyCalorieTarget', () => {
  it('calculates weight_loss target (-500 deficit)', () => {
    const target = calculateDailyCalorieTarget(2000, 'weight_loss');
    expect(target).toBe(1500);
  });

  it('calculates maintain target (no change)', () => {
    const target = calculateDailyCalorieTarget(2000, 'maintain');
    expect(target).toBe(2000);
  });

  it('calculates muscle target (+300 surplus)', () => {
    const target = calculateDailyCalorieTarget(2000, 'muscle');
    expect(target).toBe(2300);
  });

  it('ensures minimum 1200 calories for safety', () => {
    const target = calculateDailyCalorieTarget(1500, 'weight_loss');
    expect(target).toBe(1200); // 1500 - 500 = 1000, but minimum is 1200
  });

  it('returns 0 for invalid TDEE', () => {
    expect(calculateDailyCalorieTarget(0, 'maintain')).toBe(0);
  });
});

describe('calculateMacroTargets', () => {
  it('calculates macros for maintain goal', () => {
    const macros = calculateMacroTargets(2000, 70, 'maintain');

    // 단백질: 70 * 1.6 = 112g
    expect(macros.protein).toBe(112);

    // 지방: 2000 * 0.25 / 9 = 55.6g
    expect(macros.fat).toBe(56);

    // 탄수화물: (2000 - 112*4 - 55.6*9) / 4
    expect(macros.carbs).toBeGreaterThan(0);
  });

  it('calculates higher protein for muscle goal', () => {
    const macros = calculateMacroTargets(2500, 70, 'muscle');

    // 단백질: 70 * 2.0 = 140g (근육 증가 목표)
    expect(macros.protein).toBe(140);
  });

  it('returns zeros for invalid inputs', () => {
    const macros = calculateMacroTargets(0, 70, 'maintain');
    expect(macros.protein).toBe(0);
    expect(macros.carbs).toBe(0);
    expect(macros.fat).toBe(0);
  });
});

describe('calculateAll', () => {
  it('calculates complete BMR result', () => {
    const result = calculateAll(
      'male',
      70,
      175,
      '1995-06-15',
      'moderate',
      'maintain'
    );

    expect(result.bmr).toBeGreaterThan(1500);
    expect(result.bmr).toBeLessThan(2000);
    expect(result.tdee).toBeGreaterThan(result.bmr);
    expect(result.dailyCalorieTarget).toBe(result.tdee); // maintain = no change
    expect(result.proteinTarget).toBeGreaterThan(0);
    expect(result.carbsTarget).toBeGreaterThan(0);
    expect(result.fatTarget).toBeGreaterThan(0);
  });

  it('applies weight loss deficit correctly', () => {
    const result = calculateAll(
      'female',
      55,
      160,
      '2000-01-01',
      'light',
      'weight_loss'
    );

    // TDEE보다 500 적거나, 최소 1200
    expect(result.dailyCalorieTarget).toBeLessThanOrEqual(result.tdee);
    expect(result.dailyCalorieTarget).toBeGreaterThanOrEqual(1200);
  });

  it('handles edge case with young age', () => {
    const result = calculateAll(
      'female',
      50,
      155,
      '2005-01-01', // ~20세
      'sedentary',
      'health'
    );

    expect(result.bmr).toBeGreaterThan(1000);
    expect(result.tdee).toBeGreaterThan(result.bmr);
  });
});
