/**
 * lib/consent 모듈 테스트
 *
 * 동의 버전 관리, 재동의 판단, 미성년자 검증
 */

import {
  shouldRequestReconsent,
  getVersionChanges,
  calculateRetentionUntil,
  getDaysUntilExpiry,
  checkConsentEligibility,
  LATEST_CONSENT_VERSION,
  CONSENT_VERSIONS,
  type ImageConsent,
} from '../../../lib/consent';

describe('shouldRequestReconsent', () => {
  it('동의가 없으면 재동의 불필요', () => {
    expect(shouldRequestReconsent(null)).toBe(false);
  });

  it('동의 거부 상태면 재동의 불필요', () => {
    const consent: ImageConsent = {
      consent_given: false,
      consent_version: 'v0.1',
    };
    expect(shouldRequestReconsent(consent)).toBe(false);
  });

  it('동의 버전이 최신이면 재동의 불필요', () => {
    const consent: ImageConsent = {
      consent_given: true,
      consent_version: LATEST_CONSENT_VERSION,
    };
    expect(shouldRequestReconsent(consent)).toBe(false);
  });

  it('동의 버전이 구버전이면 재동의 필요', () => {
    const consent: ImageConsent = {
      consent_given: true,
      consent_version: 'v0.1',
    };
    expect(shouldRequestReconsent(consent)).toBe(true);
  });
});

describe('getVersionChanges', () => {
  it('유효하지 않은 버전 범위는 빈 배열 반환', () => {
    expect(getVersionChanges('invalid', 'v1.0')).toEqual([]);
    expect(getVersionChanges('v1.0', 'invalid')).toEqual([]);
  });

  it('동일 버전이면 빈 배열 반환', () => {
    expect(getVersionChanges('v1.0', 'v1.0')).toEqual([]);
  });
});

describe('calculateRetentionUntil', () => {
  it('동의일 + 1년 ISO 문자열 반환', () => {
    const date = new Date('2026-03-01T00:00:00.000Z');
    const result = calculateRetentionUntil(date);
    expect(result).toContain('2027-03-01');
  });

  it('기본값으로 현재 날짜 사용', () => {
    const result = calculateRetentionUntil();
    const parsed = new Date(result);
    // 1년 후여야 함
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    // 1일 이내 차이
    const diff = Math.abs(parsed.getTime() - oneYearFromNow.getTime());
    expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
  });
});

describe('getDaysUntilExpiry', () => {
  it('만료일이 없으면 null 반환', () => {
    expect(getDaysUntilExpiry(null)).toBeNull();
  });

  it('미래 날짜면 양수 반환', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const result = getDaysUntilExpiry(future.toISOString());
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(31);
  });

  it('과거 날짜면 음수 반환', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const result = getDaysUntilExpiry(past.toISOString());
    expect(result).toBeLessThan(0);
  });
});

describe('checkConsentEligibility', () => {
  it('생년월일 없으면 동의 허용 + ageUnverified', () => {
    const result = checkConsentEligibility(null);
    expect(result.canConsent).toBe(true);
    expect(result.ageUnverified).toBe(true);
  });

  it('undefined 생년월일도 동의 허용', () => {
    const result = checkConsentEligibility(undefined);
    expect(result.canConsent).toBe(true);
    expect(result.ageUnverified).toBe(true);
  });

  it('14세 이상이면 동의 가능', () => {
    const birthdate = new Date();
    birthdate.setFullYear(birthdate.getFullYear() - 20);
    const result = checkConsentEligibility(birthdate.toISOString());
    expect(result.canConsent).toBe(true);
    expect(result.ageUnverified).toBeUndefined();
  });

  it('14세 미만이면 동의 불가', () => {
    const birthdate = new Date();
    birthdate.setFullYear(birthdate.getFullYear() - 10);
    const result = checkConsentEligibility(birthdate.toISOString());
    expect(result.canConsent).toBe(false);
    expect(result.reason).toBe('under_age');
    expect(result.requiredAction).toBeDefined();
  });
});

describe('CONSENT_VERSIONS', () => {
  it('최소 1개 버전이 정의됨', () => {
    expect(Object.keys(CONSENT_VERSIONS).length).toBeGreaterThanOrEqual(1);
  });

  it('LATEST_CONSENT_VERSION이 CONSENT_VERSIONS에 포함됨', () => {
    expect(LATEST_CONSENT_VERSION in CONSENT_VERSIONS).toBe(true);
  });
});
