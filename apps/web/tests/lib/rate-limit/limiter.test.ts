/**
 * Rate Limiter 단위 테스트
 *
 * @see SDD-RATE-LIMITING.md
 */

import { describe, it, expect } from 'vitest';
import {
  getRateLimitCategory,
  getIdentifier,
  isRateLimitedPath,
  extractIpAddress,
  createRateLimitHeaders,
} from '@/lib/rate-limit/limiter';
import { RateLimitCategory } from '@/types/rate-limit';

describe('Rate Limiter', () => {
  describe('getRateLimitCategory', () => {
    it('should return "analyze" for /api/analyze/* paths', () => {
      expect(getRateLimitCategory('/api/analyze/skin')).toBe('analyze');
      expect(getRateLimitCategory('/api/analyze/personal-color')).toBe('analyze');
      expect(getRateLimitCategory('/api/analyze/body')).toBe('analyze');
    });

    it('should return "analyze" for /api/gemini/* paths', () => {
      expect(getRateLimitCategory('/api/gemini/chat')).toBe('analyze');
      expect(getRateLimitCategory('/api/gemini/analyze')).toBe('analyze');
    });

    it('should return "auth" for /api/auth/* paths', () => {
      expect(getRateLimitCategory('/api/auth/login')).toBe('auth');
      expect(getRateLimitCategory('/api/auth/register')).toBe('auth');
      expect(getRateLimitCategory('/api/auth/callback')).toBe('auth');
    });

    it('should return "upload" for /api/upload/* paths', () => {
      expect(getRateLimitCategory('/api/upload/image')).toBe('upload');
      expect(getRateLimitCategory('/api/upload/avatar')).toBe('upload');
    });

    it('should return "coach" for /api/coach/* and /api/chat/* paths', () => {
      expect(getRateLimitCategory('/api/coach/message')).toBe('coach');
      expect(getRateLimitCategory('/api/chat/stream')).toBe('coach');
    });

    it('should return "feedback" for /api/feedback/* paths', () => {
      expect(getRateLimitCategory('/api/feedback/submit')).toBe('feedback');
    });

    it('should return "nutrition" for /api/nutrition/* paths', () => {
      expect(getRateLimitCategory('/api/nutrition/log')).toBe('nutrition');
      expect(getRateLimitCategory('/api/nutrition/summary')).toBe('nutrition');
    });

    it('should return "workout" for /api/workout/* paths', () => {
      expect(getRateLimitCategory('/api/workout/session')).toBe('workout');
      expect(getRateLimitCategory('/api/workout/history')).toBe('workout');
    });

    it('should return "affiliate" for /api/affiliate/* paths', () => {
      expect(getRateLimitCategory('/api/affiliate/click')).toBe('affiliate');
      expect(getRateLimitCategory('/api/affiliate/conversion')).toBe('affiliate');
    });

    it('should return "default" for unknown paths', () => {
      expect(getRateLimitCategory('/api/unknown')).toBe('default');
      expect(getRateLimitCategory('/api/users')).toBe('default');
      expect(getRateLimitCategory('/api/products')).toBe('default');
    });
  });

  describe('getIdentifier', () => {
    const testUserId = 'user_test123';
    const testIp = '192.168.1.100';

    it('should use IP for auth category', () => {
      expect(getIdentifier('auth', testUserId, testIp)).toBe(`ip:${testIp}`);
      expect(getIdentifier('auth', null, testIp)).toBe(`ip:${testIp}`);
    });

    it('should use userId for analyze category when available', () => {
      expect(getIdentifier('analyze', testUserId, testIp)).toBe(`user:${testUserId}`);
    });

    it('should fallback to IP when userId is null', () => {
      expect(getIdentifier('analyze', null, testIp)).toBe(`ip:${testIp}`);
      expect(getIdentifier('default', null, testIp)).toBe(`ip:${testIp}`);
    });

    it('should use userId for all non-auth categories', () => {
      const categories: RateLimitCategory[] = [
        'analyze',
        'upload',
        'coach',
        'feedback',
        'nutrition',
        'workout',
        'affiliate',
        'default',
      ];

      categories.forEach((category) => {
        expect(getIdentifier(category, testUserId, testIp)).toBe(`user:${testUserId}`);
      });
    });
  });

  describe('isRateLimitedPath', () => {
    it('should return true for API paths', () => {
      expect(isRateLimitedPath('/api/analyze/skin')).toBe(true);
      expect(isRateLimitedPath('/api/users')).toBe(true);
      expect(isRateLimitedPath('/api/products')).toBe(true);
    });

    it('should return false for non-API paths', () => {
      expect(isRateLimitedPath('/')).toBe(false);
      expect(isRateLimitedPath('/dashboard')).toBe(false);
      expect(isRateLimitedPath('/analysis/skin')).toBe(false);
    });

    it('should return false for excluded paths', () => {
      expect(isRateLimitedPath('/api/webhooks/clerk')).toBe(false);
      expect(isRateLimitedPath('/api/cron/cleanup')).toBe(false);
      expect(isRateLimitedPath('/api/health')).toBe(false);
    });
  });

  describe('extractIpAddress', () => {
    it('should extract IP from cf-connecting-ip header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8',
        },
      });
      expect(extractIpAddress(request)).toBe('1.2.3.4');
    });

    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        },
      });
      expect(extractIpAddress(request)).toBe('1.2.3.4');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '1.2.3.4',
        },
      });
      expect(extractIpAddress(request)).toBe('1.2.3.4');
    });

    it('should return "unknown" when no IP headers', () => {
      const request = new Request('https://example.com');
      expect(extractIpAddress(request)).toBe('unknown');
    });
  });

  describe('createRateLimitHeaders', () => {
    it('should create standard rate limit headers', () => {
      const result = {
        minuteLimit: 10,
        minuteRemaining: 7,
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: 1706054460000,
        resetDaily: 1706140800000,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit-Minute']).toBe('10');
      expect(headers['X-RateLimit-Remaining-Minute']).toBe('7');
      expect(headers['X-RateLimit-Limit-Day']).toBe('50');
      expect(headers['X-RateLimit-Remaining-Day']).toBe('45');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include fallback header when usedFallback is true', () => {
      const result = {
        minuteLimit: 10,
        minuteRemaining: 7,
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
      };

      const headers = createRateLimitHeaders(result, true);

      expect(headers['X-RateLimit-Fallback']).toBe('true');
    });

    it('should not include fallback header when usedFallback is false', () => {
      const result = {
        minuteLimit: 10,
        minuteRemaining: 7,
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
      };

      const headers = createRateLimitHeaders(result, false);

      expect(headers['X-RateLimit-Fallback']).toBeUndefined();
    });
  });
});
