/**
 * 연령 검증 모듈 테스트
 */

import {
  calculateAge,
  isMinor,
  verifyAge,
  isValidBirthDate,
  parseBirthDate,
  isAgeVerificationRequiredRoute,
  formatAge,
  getAgeGroup,
  MINIMUM_AGE,
} from '../../lib/age-verification';

describe('age-verification', () => {
  describe('calculateAge', () => {
    it('생일 전 나이 계산', () => {
      const birth = new Date(2000, 11, 25); // 12월 25일
      const ref = new Date(2020, 5, 15);     // 6월 15일
      expect(calculateAge(birth, ref)).toBe(19);
    });

    it('생일 후 나이 계산', () => {
      const birth = new Date(2000, 0, 15);  // 1월 15일
      const ref = new Date(2020, 5, 15);     // 6월 15일
      expect(calculateAge(birth, ref)).toBe(20);
    });

    it('생일 당일', () => {
      const birth = new Date(2000, 5, 15);
      const ref = new Date(2020, 5, 15);
      expect(calculateAge(birth, ref)).toBe(20);
    });
  });

  describe('isMinor', () => {
    it('만 14세 미만은 미성년자', () => {
      const birth = new Date();
      birth.setFullYear(birth.getFullYear() - 10);
      expect(isMinor(birth)).toBe(true);
    });

    it('만 14세 이상은 성인', () => {
      const birth = new Date();
      birth.setFullYear(birth.getFullYear() - 20);
      expect(isMinor(birth)).toBe(false);
    });
  });

  describe('verifyAge', () => {
    it('미성년자는 검증 실패', () => {
      const birth = new Date();
      birth.setFullYear(birth.getFullYear() - 10);
      const result = verifyAge(birth);

      expect(result.isVerified).toBe(false);
      expect(result.isMinor).toBe(true);
      expect(result.message).toContain(String(MINIMUM_AGE));
    });

    it('성인은 검증 성공', () => {
      const birth = new Date();
      birth.setFullYear(birth.getFullYear() - 25);
      const result = verifyAge(birth);

      expect(result.isVerified).toBe(true);
      expect(result.isMinor).toBe(false);
      expect(result.age).toBe(25);
    });
  });

  describe('isValidBirthDate', () => {
    it('유효한 날짜', () => {
      expect(isValidBirthDate('2000-06-15')).toBe(true);
    });

    it('잘못된 형식', () => {
      expect(isValidBirthDate('20000615')).toBe(false);
      expect(isValidBirthDate('2000/06/15')).toBe(false);
    });

    it('존재하지 않는 날짜', () => {
      expect(isValidBirthDate('2000-02-30')).toBe(false);
      expect(isValidBirthDate('2000-13-01')).toBe(false);
    });

    it('미래 날짜', () => {
      expect(isValidBirthDate('2099-01-01')).toBe(false);
    });

    it('윤년 2월 29일', () => {
      expect(isValidBirthDate('2000-02-29')).toBe(true);
      expect(isValidBirthDate('2001-02-29')).toBe(false);
    });
  });

  describe('parseBirthDate', () => {
    it('유효한 날짜 파싱', () => {
      const date = parseBirthDate('2000-06-15');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2000);
      expect(date?.getMonth()).toBe(5); // 0-indexed
      expect(date?.getDate()).toBe(15);
    });

    it('잘못된 날짜는 null', () => {
      expect(parseBirthDate('invalid')).toBeNull();
    });
  });

  describe('isAgeVerificationRequiredRoute', () => {
    it('분석 라우트는 검증 필요', () => {
      expect(isAgeVerificationRequiredRoute('/(analysis)/skin')).toBe(true);
    });

    it('탭 라우트는 검증 필요', () => {
      expect(isAgeVerificationRequiredRoute('/(tabs)/workout')).toBe(true);
    });

    it('인증 라우트는 면제', () => {
      expect(isAgeVerificationRequiredRoute('/(auth)/sign-in')).toBe(false);
    });

    it('로그인 라우트는 면제', () => {
      expect(isAgeVerificationRequiredRoute('/sign-in')).toBe(false);
    });
  });

  describe('formatAge', () => {
    it('만 나이 포맷', () => {
      const birth = new Date();
      birth.setFullYear(birth.getFullYear() - 25);
      expect(formatAge(birth)).toBe('만 25세');
    });
  });

  describe('getAgeGroup', () => {
    it('연령대 분류', () => {
      expect(getAgeGroup(15)).toBe('10대');
      expect(getAgeGroup(25)).toBe('20대');
      expect(getAgeGroup(35)).toBe('30대');
      expect(getAgeGroup(45)).toBe('40대');
      expect(getAgeGroup(55)).toBe('50대 이상');
    });
  });

  describe('MINIMUM_AGE 상수', () => {
    it('최소 연령 14세', () => {
      expect(MINIMUM_AGE).toBe(14);
    });
  });
});
