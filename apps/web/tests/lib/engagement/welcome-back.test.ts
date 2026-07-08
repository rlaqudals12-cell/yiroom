import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  calculateAbsentDays,
  generateWelcomeBackMessage,
  isDismissed,
  dismissWelcomeBack,
} from '@/lib/engagement/welcome-back';

describe('welcome-back', () => {
  describe('calculateAbsentDays', () => {
    it('should return 0 for null input', () => {
      expect(calculateAbsentDays(null)).toBe(0);
    });

    it('should return correct days for string date', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(calculateAbsentDays(threeDaysAgo.toISOString())).toBe(3);
    });

    it('should return correct days for Date object', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      expect(calculateAbsentDays(sevenDaysAgo)).toBe(7);
    });

    it('should return 0 for today', () => {
      expect(calculateAbsentDays(new Date().toISOString())).toBe(0);
    });
  });

  describe('generateWelcomeBackMessage', () => {
    it('should return null for less than 3 days absence', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(generateWelcomeBackMessage(twoDaysAgo.toISOString())).toBeNull();
    });

    it('should return null for null lastActiveAt', () => {
      expect(generateWelcomeBackMessage(null)).toBeNull();
    });

    it('should return short message for 3-6 days absence', () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      const msg = generateWelcomeBackMessage(fourDaysAgo.toISOString());
      expect(msg).not.toBeNull();
      expect(msg!.title).toBe('다시 오셨네요!');
      expect(msg!.absentDays).toBe(4);
    });

    it('should include insight count in short message', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const msg = generateWelcomeBackMessage(fiveDaysAgo.toISOString(), 3);
      expect(msg!.description).toContain('3개');
    });

    it('should return medium message with CTA for 7-13 days', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const msg = generateWelcomeBackMessage(tenDaysAgo.toISOString());
      expect(msg).not.toBeNull();
      expect(msg!.title).toContain('10일 만에');
      // CTA는 /dashboard(배너 표시 위치 자기 자신) 대신 통합 분석으로 유도 (ADR-111)
      expect(msg!.ctaText).toBe('다시 분석하기');
      expect(msg!.ctaHref).toBe('/analysis/integrated');
    });

    it('should return long message with analysis CTA for 14+ days', () => {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const msg = generateWelcomeBackMessage(twentyDaysAgo.toISOString());
      expect(msg).not.toBeNull();
      expect(msg!.title).toContain('보고 싶었어요');
      expect(msg!.ctaText).toBe('다시 분석하기');
      expect(msg!.ctaHref).toBe('/analysis/skin');
    });
  });

  describe('isDismissed / dismissWelcomeBack', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should return false when not dismissed', () => {
      expect(isDismissed()).toBe(false);
    });

    it('should return true after dismiss', () => {
      dismissWelcomeBack();
      expect(isDismissed()).toBe(true);
    });

    it('should return false after 24 hours', () => {
      // 25시간 전에 닫은 것으로 설정
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      localStorage.setItem('yiroom-welcome-back-dismissed', twentyFiveHoursAgo.toISOString());
      expect(isDismissed()).toBe(false);
    });
  });
});
