/**
 * 건강 데이터 동의 관리 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  createConsent,
  isConsentValid,
  hasConsentForScope,
  revokeConsent,
  updateConsentScopes,
  getRetentionRemainingDays,
  getDataDeletionDeadline,
  DEFAULT_RETENTION_DAYS,
  CONSENT_SCOPE_DESCRIPTIONS,
} from '@/lib/health-device/consent';
import type { HealthDataConsent, ConsentScope } from '@/lib/health-device/types';

function mockConsent(overrides: Partial<HealthDataConsent> = {}): HealthDataConsent {
  return {
    userId: 'user-123',
    platform: 'apple_health',
    scopes: ['sleep', 'heart_rate'],
    consentedAt: '2026-03-01T00:00:00Z',
    revokedAt: null,
    retentionDays: 365,
    ...overrides,
  };
}

describe('consent', () => {
  // ============================================
  // createConsent
  // ============================================
  describe('createConsent', () => {
    it('기본 동의 생성', () => {
      const consent = createConsent('user-1', 'google_health_connect', ['sleep', 'steps']);
      expect(consent.userId).toBe('user-1');
      expect(consent.platform).toBe('google_health_connect');
      expect(consent.scopes).toEqual(['sleep', 'steps']);
      expect(consent.revokedAt).toBeNull();
      expect(consent.retentionDays).toBe(DEFAULT_RETENTION_DAYS);
    });

    it('커스텀 보관 기간', () => {
      const consent = createConsent('user-1', 'apple_health', ['sleep'], 180);
      expect(consent.retentionDays).toBe(180);
    });

    it('중복 scope 제거', () => {
      const consent = createConsent('user-1', 'apple_health', ['sleep', 'sleep', 'steps']);
      expect(consent.scopes).toEqual(['sleep', 'steps']);
    });

    it('consentedAt 자동 설정', () => {
      const consent = createConsent('user-1', 'apple_health', ['sleep']);
      expect(consent.consentedAt).toBeTruthy();
      // ISO 날짜 형식 검증
      expect(() => new Date(consent.consentedAt)).not.toThrow();
    });
  });

  // ============================================
  // isConsentValid
  // ============================================
  describe('isConsentValid', () => {
    it('유효한 동의 → true', () => {
      const consent = mockConsent({
        consentedAt: new Date().toISOString(),
      });
      expect(isConsentValid(consent)).toBe(true);
    });

    it('철회된 동의 → false', () => {
      const consent = mockConsent({
        revokedAt: '2026-03-10T00:00:00Z',
      });
      expect(isConsentValid(consent)).toBe(false);
    });

    it('보관 기간 만료 → false', () => {
      const consent = mockConsent({
        consentedAt: '2024-01-01T00:00:00Z', // 2년 전
        retentionDays: 365,
      });
      expect(isConsentValid(consent)).toBe(false);
    });

    it('보관 기간 내 → true', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 30); // 30일 전
      const consent = mockConsent({
        consentedAt: recent.toISOString(),
        retentionDays: 365,
      });
      expect(isConsentValid(consent)).toBe(true);
    });
  });

  // ============================================
  // hasConsentForScope
  // ============================================
  describe('hasConsentForScope', () => {
    it('포함된 scope → true', () => {
      const consent = mockConsent({
        consentedAt: new Date().toISOString(),
        scopes: ['sleep', 'heart_rate'],
      });
      expect(hasConsentForScope(consent, 'sleep')).toBe(true);
    });

    it('미포함 scope → false', () => {
      const consent = mockConsent({
        consentedAt: new Date().toISOString(),
        scopes: ['sleep'],
      });
      expect(hasConsentForScope(consent, 'steps')).toBe(false);
    });

    it('철회된 동의 → false', () => {
      const consent = mockConsent({
        consentedAt: new Date().toISOString(),
        revokedAt: new Date().toISOString(),
        scopes: ['sleep'],
      });
      expect(hasConsentForScope(consent, 'sleep')).toBe(false);
    });
  });

  // ============================================
  // revokeConsent
  // ============================================
  describe('revokeConsent', () => {
    it('철회 시 revokedAt 설정', () => {
      const consent = mockConsent();
      const revoked = revokeConsent(consent);
      expect(revoked.revokedAt).not.toBeNull();
      expect(revoked.userId).toBe(consent.userId);
      expect(revoked.scopes).toEqual(consent.scopes);
    });

    it('원본 변경 없음 (불변)', () => {
      const consent = mockConsent();
      revokeConsent(consent);
      expect(consent.revokedAt).toBeNull();
    });
  });

  // ============================================
  // updateConsentScopes
  // ============================================
  describe('updateConsentScopes', () => {
    it('새 scope로 업데이트', () => {
      const consent = mockConsent({ scopes: ['sleep'] });
      const updated = updateConsentScopes(consent, ['sleep', 'steps', 'activity']);
      expect(updated.scopes).toEqual(['sleep', 'steps', 'activity']);
    });

    it('재동의 시 consentedAt 갱신', () => {
      const consent = mockConsent({
        consentedAt: '2026-01-01T00:00:00Z',
      });
      const updated = updateConsentScopes(consent, ['sleep']);
      expect(updated.consentedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('철회 상태 초기화', () => {
      const consent = mockConsent({
        revokedAt: '2026-03-10T00:00:00Z',
      });
      const updated = updateConsentScopes(consent, ['sleep']);
      expect(updated.revokedAt).toBeNull();
    });

    it('중복 scope 제거', () => {
      const consent = mockConsent();
      const updated = updateConsentScopes(consent, ['sleep', 'sleep']);
      expect(updated.scopes).toEqual(['sleep']);
    });
  });

  // ============================================
  // getRetentionRemainingDays
  // ============================================
  describe('getRetentionRemainingDays', () => {
    it('철회된 동의 → 0일', () => {
      const consent = mockConsent({
        revokedAt: '2026-03-10T00:00:00Z',
      });
      expect(getRetentionRemainingDays(consent)).toBe(0);
    });

    it('최근 동의 → 양수', () => {
      const consent = mockConsent({
        consentedAt: new Date().toISOString(),
        retentionDays: 365,
      });
      const remaining = getRetentionRemainingDays(consent);
      expect(remaining).toBeGreaterThan(360);
      expect(remaining).toBeLessThanOrEqual(365);
    });

    it('만료된 동의 → 0', () => {
      const consent = mockConsent({
        consentedAt: '2024-01-01T00:00:00Z',
        retentionDays: 30,
      });
      expect(getRetentionRemainingDays(consent)).toBe(0);
    });
  });

  // ============================================
  // getDataDeletionDeadline
  // ============================================
  describe('getDataDeletionDeadline', () => {
    it('미철회 → null', () => {
      const consent = mockConsent();
      expect(getDataDeletionDeadline(consent)).toBeNull();
    });

    it('철회 후 30일 기한', () => {
      const revokedAt = '2026-03-10T00:00:00Z';
      const consent = mockConsent({ revokedAt });
      const deadline = getDataDeletionDeadline(consent);
      expect(deadline).not.toBeNull();

      const deadlineDate = new Date(deadline!);
      const revokedDate = new Date(revokedAt);
      const diffDays = Math.round(
        (deadlineDate.getTime() - revokedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(30);
    });
  });

  // ============================================
  // CONSENT_SCOPE_DESCRIPTIONS
  // ============================================
  describe('CONSENT_SCOPE_DESCRIPTIONS', () => {
    it('모든 scope에 설명 존재', () => {
      const scopes: ConsentScope[] = ['sleep', 'heart_rate', 'steps', 'activity', 'stress'];
      for (const scope of scopes) {
        const desc = CONSENT_SCOPE_DESCRIPTIONS[scope];
        expect(desc.title).toBeTruthy();
        expect(desc.description).toBeTruthy();
        expect(desc.purpose).toBeTruthy();
      }
    });
  });
});
