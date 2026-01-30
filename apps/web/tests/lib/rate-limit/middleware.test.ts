/**
 * Rate Limit Middleware 테스트
 *
 * @see SDD-RATE-LIMITING.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { applyRateLimitMiddleware, addRateLimitHeaders } from '@/lib/rate-limit/middleware';
import { clearMemoryStore } from '@/lib/rate-limit/fallback';
import { NextResponse } from 'next/server';

// Upstash 모킹 - 인메모리 폴백 사용
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
    checkRateLimit: vi.fn().mockResolvedValue(null),
  };
});

// 로깅 모킹
vi.mock('@/lib/rate-limit/monitoring', () => ({
  logRateLimitExceeded: vi.fn(),
  logRateLimitUsage: vi.fn(),
  logFallbackUsed: vi.fn(),
}));

function createMockRequest(pathname: string, headers?: Record<string, string>): NextRequest {
  const url = `https://example.com${pathname}`;
  const request = new NextRequest(url, {
    headers: headers ?? {},
  });
  return request;
}

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    clearMemoryStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearMemoryStore();
  });

  describe('applyRateLimitMiddleware', () => {
    it('should allow non-API paths without rate limiting', async () => {
      const request = createMockRequest('/dashboard');
      const result = await applyRateLimitMiddleware(request);

      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
      expect(Object.keys(result.headers)).toHaveLength(0);
    });

    it('should allow webhook paths without rate limiting', async () => {
      const request = createMockRequest('/api/webhooks/clerk');
      const result = await applyRateLimitMiddleware(request);

      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should allow health check paths without rate limiting', async () => {
      const request = createMockRequest('/api/health');
      const result = await applyRateLimitMiddleware(request);

      expect(result.allowed).toBe(true);
    });

    it('should apply rate limiting to API paths', async () => {
      const request = createMockRequest('/api/analyze/skin', {
        'x-forwarded-for': '1.2.3.4',
      });
      const result = await applyRateLimitMiddleware(request, 'user_123');

      expect(result.allowed).toBe(true);
      expect(result.headers['X-RateLimit-Limit-Minute']).toBeDefined();
      expect(result.headers['X-RateLimit-Remaining-Minute']).toBeDefined();
    });

    it('should block requests exceeding rate limit', async () => {
      const request = createMockRequest('/api/analyze/skin', {
        'x-forwarded-for': '1.2.3.4',
      });

      // 분당 10회 한도 초과
      for (let i = 0; i < 10; i++) {
        await applyRateLimitMiddleware(request, 'user_block_test');
      }

      const result = await applyRateLimitMiddleware(request, 'user_block_test');

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(429);
    });

    it('should return proper 429 response format', async () => {
      const request = createMockRequest('/api/upload/image', {
        'x-forwarded-for': '1.2.3.4',
      });

      // 분당 5회 한도 초과 (upload 카테고리)
      for (let i = 0; i < 5; i++) {
        await applyRateLimitMiddleware(request, 'user_429_test');
      }

      const result = await applyRateLimitMiddleware(request, 'user_429_test');

      expect(result.response).toBeDefined();
      const body = await result.response!.json();

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RATE_LIMIT_ERROR');
      expect(body.error.message).toBeDefined();
      expect(body.error.retryAfter).toBeGreaterThan(0);
      expect(body.error.limitType).toBe('minute');
    });

    it('should use IP for auth category', async () => {
      const request1 = createMockRequest('/api/auth/login', {
        'x-forwarded-for': '1.1.1.1',
      });
      const request2 = createMockRequest('/api/auth/login', {
        'x-forwarded-for': '2.2.2.2',
      });

      // 다른 IP는 별도 카운트
      const result1 = await applyRateLimitMiddleware(request1, 'user_a');
      const result2 = await applyRateLimitMiddleware(request2, 'user_a');

      // 둘 다 첫 요청이므로 remaining이 동일해야 함
      expect(result1.headers['X-RateLimit-Remaining-Minute']).toBe(
        result2.headers['X-RateLimit-Remaining-Minute']
      );
    });

    it('should use userId for analyze category', async () => {
      const request = createMockRequest('/api/analyze/skin', {
        'x-forwarded-for': '1.2.3.4',
      });

      // 같은 사용자, 다른 IP여도 같은 카운트
      await applyRateLimitMiddleware(request, 'user_same');
      const result = await applyRateLimitMiddleware(request, 'user_same');

      expect(result.headers['X-RateLimit-Remaining-Minute']).toBe('8');
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add headers to response', () => {
      const response = NextResponse.next();
      const headers = {
        'X-RateLimit-Limit-Minute': '10',
        'X-RateLimit-Remaining-Minute': '9',
      };

      const result = addRateLimitHeaders(response, headers);

      expect(result.headers.get('X-RateLimit-Limit-Minute')).toBe('10');
      expect(result.headers.get('X-RateLimit-Remaining-Minute')).toBe('9');
    });

    it('should preserve existing headers', () => {
      const response = NextResponse.next();
      response.headers.set('X-Custom-Header', 'value');

      const headers = {
        'X-RateLimit-Limit-Minute': '10',
      };

      const result = addRateLimitHeaders(response, headers);

      expect(result.headers.get('X-Custom-Header')).toBe('value');
      expect(result.headers.get('X-RateLimit-Limit-Minute')).toBe('10');
    });
  });

  describe('Different Categories', () => {
    it('should apply correct limits for analyze category', async () => {
      const request = createMockRequest('/api/analyze/skin');
      const result = await applyRateLimitMiddleware(request, 'user_cat_analyze');

      expect(result.headers['X-RateLimit-Limit-Minute']).toBe('10');
      expect(result.headers['X-RateLimit-Limit-Day']).toBe('50');
    });

    it('should apply correct limits for coach category', async () => {
      const request = createMockRequest('/api/coach/message');
      const result = await applyRateLimitMiddleware(request, 'user_cat_coach');

      expect(result.headers['X-RateLimit-Limit-Minute']).toBe('30');
      expect(result.headers['X-RateLimit-Limit-Day']).toBe('200');
    });

    it('should apply correct limits for nutrition category', async () => {
      const request = createMockRequest('/api/nutrition/log');
      const result = await applyRateLimitMiddleware(request, 'user_cat_nutrition');

      expect(result.headers['X-RateLimit-Limit-Minute']).toBe('30');
      expect(result.headers['X-RateLimit-Limit-Day']).toBe('300');
    });

    it('should apply correct limits for default category', async () => {
      const request = createMockRequest('/api/unknown');
      const result = await applyRateLimitMiddleware(request, 'user_cat_default');

      expect(result.headers['X-RateLimit-Limit-Minute']).toBe('100');
      expect(result.headers['X-RateLimit-Limit-Day']).toBe('1000');
    });
  });
});
