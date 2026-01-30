/**
 * 연령 검증 모듈 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateAge,
  isMinor,
  verifyAge,
  isValidBirthDate,
  MINIMUM_AGE,
} from '@/lib/age-verification';

describe('age-verification', () => {
  // 테스트용 고정 날짜 (2026-01-16)
  const mockDate = new Date('2026-01-16');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateAge', () => {
    it('should calculate age correctly for adult', () => {
      // 2000년 1월 1일생 → 26세
      expect(calculateAge('2000-01-01')).toBe(26);
    });

    it('should calculate age correctly when birthday has passed this year', () => {
      // 2012년 1월 1일생 → 14세 (생일 지남)
      expect(calculateAge('2012-01-01')).toBe(14);
    });

    it('should calculate age correctly when birthday has not passed yet', () => {
      // 2012년 6월 1일생 → 13세 (생일 안 지남)
      expect(calculateAge('2012-06-01')).toBe(13);
    });

    it('should handle Date object input', () => {
      const birthDate = new Date('2000-01-01');
      expect(calculateAge(birthDate)).toBe(26);
    });

    it('should calculate age on exact birthday', () => {
      // 2012년 1월 16일생 → 14세 (오늘 생일)
      expect(calculateAge('2012-01-16')).toBe(14);
    });

    it('should calculate age one day before birthday', () => {
      // 2012년 1월 17일생 → 13세 (내일 생일)
      expect(calculateAge('2012-01-17')).toBe(13);
    });
  });

  describe('isMinor', () => {
    it('should return true for under 14 years old', () => {
      // 2013년생 → 12~13세
      expect(isMinor('2013-06-01')).toBe(true);
    });

    it('should return false for exactly 14 years old', () => {
      // 2012년 1월 1일생 → 14세
      expect(isMinor('2012-01-01')).toBe(false);
    });

    it('should return false for over 14 years old', () => {
      // 2000년생 → 26세
      expect(isMinor('2000-01-01')).toBe(false);
    });

    it('should return false for null birthdate', () => {
      expect(isMinor(null)).toBe(false);
    });

    it('should return false for undefined birthdate', () => {
      expect(isMinor(undefined)).toBe(false);
    });

    it('should return true for 13 years old turning 14 later this year', () => {
      // 2012년 6월 1일생 → 13세 (6월에 14세 됨)
      expect(isMinor('2012-06-01')).toBe(true);
    });
  });

  describe('verifyAge', () => {
    it('should require birthdate when null', () => {
      const result = verifyAge(null);
      expect(result.canUseService).toBe(false);
      expect(result.needsBirthDate).toBe(true);
      expect(result.isMinor).toBe(false);
    });

    it('should require birthdate when undefined', () => {
      const result = verifyAge(undefined);
      expect(result.canUseService).toBe(false);
      expect(result.needsBirthDate).toBe(true);
    });

    it('should deny service for minor', () => {
      const result = verifyAge('2013-06-01');
      expect(result.canUseService).toBe(false);
      expect(result.needsBirthDate).toBe(false);
      expect(result.isMinor).toBe(true);
      expect(result.age).toBeLessThan(MINIMUM_AGE);
    });

    it('should allow service for exactly 14 years old', () => {
      const result = verifyAge('2012-01-01');
      expect(result.canUseService).toBe(true);
      expect(result.isMinor).toBe(false);
      expect(result.age).toBe(14);
    });

    it('should allow service for adult', () => {
      const result = verifyAge('1990-01-01');
      expect(result.canUseService).toBe(true);
      expect(result.needsBirthDate).toBe(false);
      expect(result.isMinor).toBe(false);
    });

    it('should include message for minor', () => {
      const result = verifyAge('2015-01-01');
      expect(result.message).toContain('14세');
    });
  });

  describe('isValidBirthDate', () => {
    it('should accept valid YYYY-MM-DD format', () => {
      expect(isValidBirthDate('2000-01-15')).toBe(true);
    });

    it('should reject invalid format', () => {
      expect(isValidBirthDate('01-15-2000')).toBe(false);
      expect(isValidBirthDate('2000/01/15')).toBe(false);
      expect(isValidBirthDate('20000115')).toBe(false);
    });

    it('should reject future dates', () => {
      expect(isValidBirthDate('2027-01-01')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(isValidBirthDate('2000-13-01')).toBe(false);
      expect(isValidBirthDate('2000-02-30')).toBe(false);
    });

    it('should reject dates too far in the past', () => {
      expect(isValidBirthDate('1800-01-01')).toBe(false);
    });

    it('should accept edge case dates', () => {
      expect(isValidBirthDate('1900-01-01')).toBe(true);
      expect(isValidBirthDate('2026-01-16')).toBe(true); // 오늘
    });
  });
});
