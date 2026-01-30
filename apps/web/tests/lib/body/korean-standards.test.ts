/**
 * 한국인 체형 표준 데이터 테스트
 *
 * @description P2 검증: docs/principles/body-mechanics.md 섹션 6 데이터 일치 확인
 */

import { describe, it, expect } from 'vitest';
import {
  KOREAN_STANDARDS,
  STD_DEV,
  normalizeToKorean,
  ageToAgeGroup,
  getStandardWHR,
  isWithinNormalRange,
} from '@/lib/body';

describe('KOREAN_STANDARDS', () => {
  it('should have correct male 20s data', () => {
    // 원리 문서 섹션 6.1 표 데이터
    const data = KOREAN_STANDARDS.male['20s'];
    expect(data.height).toBe(174.4);
    expect(data.shoulder).toBe(401);
    expect(data.waist).toBe(78.4);
    expect(data.hip).toBe(94.3);
  });

  it('should have correct female 20s data', () => {
    const data = KOREAN_STANDARDS.female['20s'];
    expect(data.height).toBe(161.1);
    expect(data.shoulder).toBe(357);
    expect(data.waist).toBe(68.0);
    expect(data.hip).toBe(91.0);
  });

  it('should have all age groups for both genders', () => {
    const ageGroups = ['20s', '30s', '40s', '50s'] as const;

    for (const group of ageGroups) {
      expect(KOREAN_STANDARDS.male[group]).toBeDefined();
      expect(KOREAN_STANDARDS.female[group]).toBeDefined();
    }
  });
});

describe('STD_DEV', () => {
  it('should have correct male standard deviation', () => {
    // 원리 문서 섹션 6.3 데이터
    expect(STD_DEV.male.height).toBe(5.8);
    expect(STD_DEV.male.shoulder).toBe(21);
    expect(STD_DEV.male.waist).toBe(8.5);
    expect(STD_DEV.male.hip).toBe(5.2);
  });

  it('should have correct female standard deviation', () => {
    expect(STD_DEV.female.height).toBe(5.2);
    expect(STD_DEV.female.shoulder).toBe(18);
    expect(STD_DEV.female.waist).toBe(7.0);
    expect(STD_DEV.female.hip).toBe(5.0);
  });
});

describe('normalizeToKorean', () => {
  it('should return z-score 0 for average value', () => {
    // 평균값 입력 시 z-score = 0
    const result = normalizeToKorean(78.4, 'waist', 'male', '20s');
    expect(result.zScore).toBe(0);
    expect(result.percentile).toBe(50);
  });

  it('should return positive z-score for above average', () => {
    // 평균보다 높은 값
    const result = normalizeToKorean(90, 'waist', 'male', '20s');
    expect(result.zScore).toBeGreaterThan(0);
    expect(result.percentile).toBeGreaterThan(50);
  });

  it('should return negative z-score for below average', () => {
    // 평균보다 낮은 값
    const result = normalizeToKorean(65, 'waist', 'male', '20s');
    expect(result.zScore).toBeLessThan(0);
    expect(result.percentile).toBeLessThan(50);
  });

  it('should calculate correct percentile for 1 sigma', () => {
    // +1 표준편차 → 약 84 백분위
    // male waist: mean=78.4, std=8.5
    const result = normalizeToKorean(78.4 + 8.5, 'waist', 'male', '20s');
    expect(result.zScore).toBe(1);
    expect(result.percentile).toBeGreaterThanOrEqual(82);
    expect(result.percentile).toBeLessThanOrEqual(86);
  });

  it('should handle different genders correctly', () => {
    // 같은 허리 둘레도 성별에 따라 다른 z-score
    const maleResult = normalizeToKorean(75, 'waist', 'male', '20s');
    const femaleResult = normalizeToKorean(75, 'waist', 'female', '20s');

    // 남성 평균 78.4, 여성 평균 68.0 → 같은 75cm도 다른 위치
    expect(maleResult.zScore).toBeLessThan(0); // 남성 평균 이하
    expect(femaleResult.zScore).toBeGreaterThan(0); // 여성 평균 이상
  });
});

describe('ageToAgeGroup', () => {
  it('should return correct age group', () => {
    expect(ageToAgeGroup(25)).toBe('20s');
    expect(ageToAgeGroup(29)).toBe('20s');
    expect(ageToAgeGroup(30)).toBe('30s');
    expect(ageToAgeGroup(35)).toBe('30s');
    expect(ageToAgeGroup(40)).toBe('40s');
    expect(ageToAgeGroup(45)).toBe('40s');
    expect(ageToAgeGroup(50)).toBe('50s');
    expect(ageToAgeGroup(60)).toBe('50s');
  });
});

describe('getStandardWHR', () => {
  it('should return correct WHR for male 20s', () => {
    // 78.4 / 94.3 = 0.83
    const whr = getStandardWHR('male', '20s');
    expect(whr).toBe(0.83);
  });

  it('should return correct WHR for female 20s', () => {
    // 68.0 / 91.0 = 0.75
    const whr = getStandardWHR('female', '20s');
    expect(whr).toBe(0.75);
  });

  it('should show increasing WHR with age for male', () => {
    // 원리 문서: 나이 들수록 WHR 증가
    const whr20s = getStandardWHR('male', '20s');
    const whr30s = getStandardWHR('male', '30s');
    const whr40s = getStandardWHR('male', '40s');
    const whr50s = getStandardWHR('male', '50s');

    expect(whr30s).toBeGreaterThan(whr20s);
    expect(whr40s).toBeGreaterThan(whr30s);
    expect(whr50s).toBeGreaterThan(whr40s);
  });
});

describe('isWithinNormalRange', () => {
  it('should return true for average value', () => {
    const result = isWithinNormalRange(78.4, 'waist', 'male', '20s');
    expect(result).toBe(true);
  });

  it('should return true within 2 sigma', () => {
    // 78.4 + 2*8.5 = 95.4
    const result = isWithinNormalRange(95, 'waist', 'male', '20s');
    expect(result).toBe(true);
  });

  it('should return false outside 2 sigma', () => {
    // 78.4 + 3*8.5 = 103.9
    const result = isWithinNormalRange(105, 'waist', 'male', '20s');
    expect(result).toBe(false);
  });

  it('should respect custom tolerance', () => {
    // 1 sigma 범위 테스트
    // 78.4 + 1*8.5 = 86.9
    const within1Sigma = isWithinNormalRange(85, 'waist', 'male', '20s', 1);
    expect(within1Sigma).toBe(true);

    const outside1Sigma = isWithinNormalRange(90, 'waist', 'male', '20s', 1);
    expect(outside1Sigma).toBe(false);
  });
});
