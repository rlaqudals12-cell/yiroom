import { describe, it, expect } from 'vitest';
import {
  shouldRequestReconsent,
  getVersionChanges,
  calculateRetentionUntil,
  getDaysUntilExpiry,
  checkConsentEligibility,
  LATEST_CONSENT_VERSION,
} from '@/lib/consent/version-check';
import type { ImageConsent } from '@/components/analysis/consent/types';

describe('version-check', () => {
  const mockConsent: ImageConsent = {
    id: '1',
    clerk_user_id: 'user_123',
    analysis_type: 'skin',
    consent_given: true,
    consent_version: 'v1.0',
    consent_at: '2026-01-08T00:00:00Z',
    withdrawal_at: null,
    retention_until: '2027-01-08T00:00:00Z',
    created_at: '2026-01-08T00:00:00Z',
    updated_at: '2026-01-08T00:00:00Z',
  };

  describe('shouldRequestReconsent', () => {
    it('동의가 null일 때 재동의 불필요', () => {
      const result = shouldRequestReconsent(null);
      expect(result).toBe(false);
    });

    it('동의하지 않은 경우 재동의 불필요', () => {
      const consent = { ...mockConsent, consent_given: false };
      const result = shouldRequestReconsent(consent);
      expect(result).toBe(false);
    });

    it('버전이 같을 때 재동의 불필요', () => {
      const consent = { ...mockConsent, consent_version: 'v1.0' };
      const result = shouldRequestReconsent(consent, 'v1.0');
      expect(result).toBe(false);
    });

    it('버전이 다를 때 재동의 필요', () => {
      const consent = { ...mockConsent, consent_version: 'v0.9' };
      const result = shouldRequestReconsent(consent, 'v1.0');
      expect(result).toBe(true);
    });

    it('최신 버전을 기본값으로 사용', () => {
      const consent = { ...mockConsent, consent_version: 'v0.9' };
      const result = shouldRequestReconsent(consent);
      expect(result).toBe(true);
    });
  });

  describe('getVersionChanges', () => {
    it('버전 변경 사항을 반환한다', () => {
      const changes = getVersionChanges('v0.9', 'v1.0');
      expect(changes).toBeInstanceOf(Array);
    });

    it('fromVersion이 없을 때 빈 배열을 반환', () => {
      const changes = getVersionChanges('v999.0', 'v1.0');
      expect(changes).toEqual([]);
    });

    it('toVersion이 없을 때 빈 배열을 반환', () => {
      const changes = getVersionChanges('v1.0', 'v999.0');
      expect(changes).toEqual([]);
    });

    it('fromVersion이 toVersion보다 클 때 빈 배열을 반환', () => {
      const changes = getVersionChanges('v1.0', 'v0.9');
      expect(changes).toEqual([]);
    });

    it('동일 버전일 때 빈 배열을 반환', () => {
      const changes = getVersionChanges('v1.0', 'v1.0');
      expect(changes).toEqual([]);
    });
  });

  describe('calculateRetentionUntil', () => {
    it('동의일로부터 1년 후 날짜를 반환한다', () => {
      const consentDate = new Date('2026-01-08T00:00:00Z');
      const retentionUntil = calculateRetentionUntil(consentDate);

      const expected = new Date('2027-01-08T00:00:00Z');
      expect(new Date(retentionUntil).getTime()).toBe(expected.getTime());
    });

    it('인자가 없을 때 현재 날짜 기준으로 계산', () => {
      const before = new Date();
      const retentionUntil = calculateRetentionUntil();

      const retention = new Date(retentionUntil);
      const expectedYear = before.getFullYear() + 1;

      expect(retention.getFullYear()).toBe(expectedYear);
    });

    it('윤년을 올바르게 처리한다', () => {
      const consentDate = new Date('2024-02-29T00:00:00Z');
      const retentionUntil = calculateRetentionUntil(consentDate);

      // 2025년은 윤년이 아니므로 JS는 자동으로 2025-03-01로 조정함
      const expected = new Date('2025-03-01T00:00:00Z');
      expect(new Date(retentionUntil).getTime()).toBe(expected.getTime());
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('만료일까지 남은 일수를 반환한다', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);

      const days = getDaysUntilExpiry(futureDate.toISOString());
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('만료일이 지났을 때 음수를 반환한다', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const days = getDaysUntilExpiry(pastDate.toISOString());
      expect(days).toBeLessThan(0);
    });

    it('retentionUntil이 null일 때 null을 반환', () => {
      const days = getDaysUntilExpiry(null);
      expect(days).toBe(null);
    });

    it('오늘이 만료일일 때 0 또는 1을 반환', () => {
      const today = new Date();
      const days = getDaysUntilExpiry(today.toISOString());
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(1);
    });
  });

  describe('checkConsentEligibility', () => {
    describe('생년월일 없음 (묵시적 성인 확인)', () => {
      it('생년월일이 null일 때 동의 가능 (묵시적 성인 확인)', () => {
        const result = checkConsentEligibility(null);

        expect(result.canConsent).toBe(true);
        expect(result.ageUnverified).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('생년월일이 undefined일 때 동의 가능 (묵시적 성인 확인)', () => {
        const result = checkConsentEligibility(undefined);

        expect(result.canConsent).toBe(true);
        expect(result.ageUnverified).toBe(true);
      });
    });

    describe('미성년자 (14세 미만)', () => {
      it('13세일 때 동의 불가', () => {
        const today = new Date();
        const birthdate = new Date(today);
        birthdate.setFullYear(today.getFullYear() - 13);

        const result = checkConsentEligibility(birthdate.toISOString().split('T')[0]);

        expect(result.canConsent).toBe(false);
        expect(result.reason).toBe('under_age');
        expect(result.requiredAction).toBe('14세 미만은 이미지 저장 기능을 이용할 수 없어요');
      });

      it('10세일 때 동의 불가', () => {
        const today = new Date();
        const birthdate = new Date(today);
        birthdate.setFullYear(today.getFullYear() - 10);

        const result = checkConsentEligibility(birthdate.toISOString().split('T')[0]);

        expect(result.canConsent).toBe(false);
        expect(result.reason).toBe('under_age');
      });
    });

    describe('14세 이상', () => {
      it('14세일 때 동의 가능', () => {
        const today = new Date();
        const birthdate = new Date(today);
        birthdate.setFullYear(today.getFullYear() - 14);

        const result = checkConsentEligibility(birthdate.toISOString().split('T')[0]);

        expect(result.canConsent).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.requiredAction).toBeUndefined();
      });

      it('20세일 때 동의 가능', () => {
        const today = new Date();
        const birthdate = new Date(today);
        birthdate.setFullYear(today.getFullYear() - 20);

        const result = checkConsentEligibility(birthdate.toISOString().split('T')[0]);

        expect(result.canConsent).toBe(true);
      });

      it('30세일 때 동의 가능', () => {
        const birthdate = '1996-01-01';
        const result = checkConsentEligibility(birthdate);

        expect(result.canConsent).toBe(true);
      });
    });

    describe('생일이 지나지 않은 경우', () => {
      it('생일 전이면 나이를 1살 줄여서 계산', () => {
        const today = new Date();
        const birthdate = new Date(today);
        birthdate.setFullYear(today.getFullYear() - 14);
        birthdate.setMonth(today.getMonth() + 1); // 다음 달이 생일

        const result = checkConsentEligibility(birthdate.toISOString().split('T')[0]);

        // 아직 14살이 되지 않았으므로 13살로 계산되어 동의 불가
        expect(result.canConsent).toBe(false);
        expect(result.reason).toBe('under_age');
      });
    });
  });

  describe('LATEST_CONSENT_VERSION', () => {
    it('최신 동의 버전이 정의되어 있다', () => {
      expect(LATEST_CONSENT_VERSION).toBeDefined();
      expect(typeof LATEST_CONSENT_VERSION).toBe('string');
    });

    it('최신 동의 버전이 v1.0이다', () => {
      expect(LATEST_CONSENT_VERSION).toBe('v1.0');
    });
  });
});
