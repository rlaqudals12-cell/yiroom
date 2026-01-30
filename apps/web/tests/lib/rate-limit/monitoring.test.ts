/**
 * Rate Limit Monitoring 테스트
 *
 * @see SDD-RATE-LIMITING.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logRateLimitExceeded,
  logRateLimitUsage,
  logFallbackUsed,
} from '@/lib/rate-limit/monitoring';
import { RateLimitResult } from '@/types/rate-limit';

describe('Rate Limit Monitoring', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('logRateLimitExceeded', () => {
    it('should log when rate limit is exceeded', () => {
      const result: RateLimitResult = {
        success: false,
        minuteLimit: 10,
        minuteRemaining: 0,
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitExceeded('user:test123', 'analyze', result);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logMessage = consoleWarnSpy.mock.calls[0][1];
      expect(logMessage).toBe('Rate limit exceeded');
    });

    it('should determine limit type as minute when minuteRemaining is 0', () => {
      const result: RateLimitResult = {
        success: false,
        minuteLimit: 10,
        minuteRemaining: 0,
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitExceeded('user:test', 'analyze', result);

      const logData = consoleWarnSpy.mock.calls[0][2] as Record<string, unknown>;
      expect(logData.limitType).toBe('minute');
    });

    it('should determine limit type as daily when dailyRemaining is 0', () => {
      const result: RateLimitResult = {
        success: false,
        minuteLimit: 10,
        minuteRemaining: 5,
        dailyLimit: 50,
        dailyRemaining: 0,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitExceeded('user:test', 'analyze', result);

      const logData = consoleWarnSpy.mock.calls[0][2] as Record<string, unknown>;
      expect(logData.limitType).toBe('daily');
    });

    it('should sanitize IP address in logs', () => {
      const result: RateLimitResult = {
        success: false,
        minuteLimit: 10,
        minuteRemaining: 0,
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitExceeded('ip:192.168.1.100', 'auth', result);

      const logData = consoleWarnSpy.mock.calls[0][2] as Record<string, unknown>;
      expect(logData.identifier).toBe('ip:192.168.x.x');
    });

    it('should sanitize user ID in logs', () => {
      const result: RateLimitResult = {
        success: false,
        minuteLimit: 10,
        minuteRemaining: 0,
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitExceeded('user:user_abc123def456789', 'analyze', result);

      const logData = consoleWarnSpy.mock.calls[0][2] as Record<string, unknown>;
      expect(logData.identifier).toBe('user:user_abc...789');
    });
  });

  describe('logRateLimitUsage', () => {
    it('should log when usage exceeds 80%', () => {
      const result: RateLimitResult = {
        success: true,
        minuteLimit: 10,
        minuteRemaining: 1, // 90% 사용
        dailyLimit: 50,
        dailyRemaining: 45,
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitUsage('user:test', 'analyze', result);

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should not log when usage is below 80%', () => {
      const result: RateLimitResult = {
        success: true,
        minuteLimit: 10,
        minuteRemaining: 5, // 50% 사용
        dailyLimit: 50,
        dailyRemaining: 40, // 20% 사용
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitUsage('user:test', 'analyze', result);

      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should log when daily usage exceeds 80%', () => {
      const result: RateLimitResult = {
        success: true,
        minuteLimit: 10,
        minuteRemaining: 8,
        dailyLimit: 50,
        dailyRemaining: 5, // 90% 사용
        resetMinute: Date.now() + 60000,
        resetDaily: Date.now() + 86400000,
        headers: {},
      };

      logRateLimitUsage('user:test', 'analyze', result);

      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('logFallbackUsed', () => {
    it('should log fallback usage', () => {
      logFallbackUsed('Redis connection failed');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logMessage = consoleWarnSpy.mock.calls[0][1];
      expect(logMessage).toBe('Using in-memory fallback');
    });

    it('should include reason in log', () => {
      logFallbackUsed('Upstash not configured');

      const logData = consoleWarnSpy.mock.calls[0][2] as Record<string, unknown>;
      expect(logData.reason).toBe('Upstash not configured');
    });
  });
});
