/**
 * Rate Limit Fallback 테스트
 *
 * @see SDD-RATE-LIMITING.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  checkRateLimitWithFallback,
  clearMemoryStore,
  getMemoryStoreSize,
} from '@/lib/rate-limit/fallback';
import { RATE_LIMIT_CONFIGS } from '@/types/rate-limit';

// Upstash 모킹 - Redis 비활성화로 인메모리 폴백 테스트
vi.mock('@/lib/rate-limit/upstash', () => ({
  isUpstashAvailable: () => false,
  UPSTASH_ENABLED: false,
  getMinuteLimiter: () => null,
  getDailyLimiter: () => null,
  getRedisClient: () => null,
}));

vi.mock('@/lib/rate-limit/limiter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit/limiter')>();
  return {
    ...actual,
    checkRateLimit: vi.fn().mockResolvedValue(null), // Redis 실패 시뮬레이션
  };
});

describe('Rate Limit Fallback', () => {
  beforeEach(() => {
    clearMemoryStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearMemoryStore();
  });

  describe('checkRateLimitWithFallback', () => {
    it('should allow requests within minute limit', async () => {
      const identifier = 'user:test123';
      const category = 'analyze';
      const config = RATE_LIMIT_CONFIGS[category];

      // 한도 내 요청
      for (let i = 0; i < config.minuteLimit; i++) {
        const result = await checkRateLimitWithFallback(identifier, category);
        expect(result.success).toBe(true);
        expect(result.usedFallback).toBe(true);
      }
    });

    it('should block requests exceeding minute limit', async () => {
      const identifier = 'user:test_minute_exceed';
      const category = 'analyze';
      const config = RATE_LIMIT_CONFIGS[category];

      // 한도까지 요청
      for (let i = 0; i < config.minuteLimit; i++) {
        await checkRateLimitWithFallback(identifier, category);
      }

      // 한도 초과 요청
      const result = await checkRateLimitWithFallback(identifier, category);
      expect(result.success).toBe(false);
      expect(result.minuteRemaining).toBe(0);
    });

    it('should block requests exceeding daily limit', async () => {
      const identifier = 'user:test_daily_exceed';
      const category = 'feedback'; // 일일 20회
      const config = RATE_LIMIT_CONFIGS[category];

      // 일일 한도까지 요청 (분당 한도보다 많을 수 있음)
      for (let i = 0; i < config.dailyLimit; i++) {
        await checkRateLimitWithFallback(identifier, category);
      }

      // 한도 초과 요청
      const result = await checkRateLimitWithFallback(identifier, category);
      expect(result.success).toBe(false);
      expect(result.dailyRemaining).toBe(0);
    });

    it('should include usedFallback flag', async () => {
      const result = await checkRateLimitWithFallback('user:test', 'default');
      expect(result.usedFallback).toBe(true);
      expect(result.headers['X-RateLimit-Fallback']).toBe('true');
    });

    it('should track remaining requests correctly', async () => {
      const identifier = 'user:test_remaining';
      const category = 'upload'; // 분당 5회

      const result1 = await checkRateLimitWithFallback(identifier, category);
      expect(result1.minuteRemaining).toBe(4);

      const result2 = await checkRateLimitWithFallback(identifier, category);
      expect(result2.minuteRemaining).toBe(3);

      const result3 = await checkRateLimitWithFallback(identifier, category);
      expect(result3.minuteRemaining).toBe(2);
    });

    it('should use correct limits for different categories', async () => {
      const analyzeResult = await checkRateLimitWithFallback('user:a', 'analyze');
      expect(analyzeResult.minuteLimit).toBe(RATE_LIMIT_CONFIGS.analyze.minuteLimit);
      expect(analyzeResult.dailyLimit).toBe(RATE_LIMIT_CONFIGS.analyze.dailyLimit);

      const authResult = await checkRateLimitWithFallback('ip:1.2.3.4', 'auth');
      expect(authResult.minuteLimit).toBe(RATE_LIMIT_CONFIGS.auth.minuteLimit);
      expect(authResult.dailyLimit).toBe(RATE_LIMIT_CONFIGS.auth.dailyLimit);

      const defaultResult = await checkRateLimitWithFallback('user:b', 'default');
      expect(defaultResult.minuteLimit).toBe(RATE_LIMIT_CONFIGS.default.minuteLimit);
      expect(defaultResult.dailyLimit).toBe(RATE_LIMIT_CONFIGS.default.dailyLimit);
    });
  });

  describe('Memory Store', () => {
    it('should store entries correctly', async () => {
      expect(getMemoryStoreSize()).toBe(0);

      await checkRateLimitWithFallback('user:test1', 'default');
      expect(getMemoryStoreSize()).toBe(1);

      await checkRateLimitWithFallback('user:test2', 'default');
      expect(getMemoryStoreSize()).toBe(2);

      // 같은 사용자는 증가하지 않음
      await checkRateLimitWithFallback('user:test1', 'default');
      expect(getMemoryStoreSize()).toBe(2);
    });

    it('should clear store correctly', async () => {
      await checkRateLimitWithFallback('user:test1', 'default');
      await checkRateLimitWithFallback('user:test2', 'default');
      expect(getMemoryStoreSize()).toBe(2);

      clearMemoryStore();
      expect(getMemoryStoreSize()).toBe(0);
    });

    it('should separate entries by category', async () => {
      const identifier = 'user:same_user';

      await checkRateLimitWithFallback(identifier, 'analyze');
      await checkRateLimitWithFallback(identifier, 'upload');

      // 다른 카테고리는 별도 엔트리
      expect(getMemoryStoreSize()).toBe(2);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include all required headers', async () => {
      const result = await checkRateLimitWithFallback('user:test', 'default');

      expect(result.headers['X-RateLimit-Limit-Minute']).toBeDefined();
      expect(result.headers['X-RateLimit-Remaining-Minute']).toBeDefined();
      expect(result.headers['X-RateLimit-Limit-Day']).toBeDefined();
      expect(result.headers['X-RateLimit-Remaining-Day']).toBeDefined();
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
      expect(result.headers['X-RateLimit-Fallback']).toBe('true');
    });

    it('should update remaining counts in headers', async () => {
      const identifier = 'user:header_test';
      const category = 'coach'; // 분당 30회

      const result1 = await checkRateLimitWithFallback(identifier, category);
      expect(result1.headers['X-RateLimit-Remaining-Minute']).toBe('29');

      const result2 = await checkRateLimitWithFallback(identifier, category);
      expect(result2.headers['X-RateLimit-Remaining-Minute']).toBe('28');
    });
  });
});
