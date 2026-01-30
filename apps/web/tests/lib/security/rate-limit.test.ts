/**
 * lib/security/rate-limit.ts 단위 테스트
 *
 * @description 분당/일일 Rate Limiting 로직 테스트
 * @see SDD-RATE-LIMITING.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// 테스트 전 환경변수 초기화
vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

import {
  checkRateLimit,
  checkRateLimitAsync,
  getRateLimitHeaders,
  getIdentifier,
  applyRateLimit,
  getConfigForEndpoint,
  rateLimitConfigs,
  type RateLimitConfig,
} from '@/lib/security/rate-limit';

// Mock NextRequest 생성 헬퍼
function createMockRequest(
  url: string,
  options: { ip?: string; userId?: string; forwardedFor?: string } = {}
): NextRequest {
  const headers = new Headers();
  if (options.forwardedFor) {
    headers.set('x-forwarded-for', options.forwardedFor);
  }
  if (options.ip) {
    headers.set('x-real-ip', options.ip);
  }

  return {
    url: `http://localhost:3000${url}`,
    headers,
  } as unknown as NextRequest;
}

describe('lib/security/rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getConfigForEndpoint', () => {
    it('should return analyze config for /api/analyze paths', () => {
      const config = getConfigForEndpoint('/api/analyze/skin');
      expect(config.maxRequests).toBe(10);
      expect(config.dailyMaxRequests).toBe(50);
    });

    it('should return coach config for /api/coach paths', () => {
      const config = getConfigForEndpoint('/api/coach/chat');
      expect(config.maxRequests).toBe(30);
      expect(config.dailyMaxRequests).toBe(200);
    });

    it('should return auth config for /api/auth paths', () => {
      const config = getConfigForEndpoint('/api/auth/login');
      expect(config.maxRequests).toBe(20);
    });

    it('should return default config for unknown paths', () => {
      const config = getConfigForEndpoint('/api/unknown/endpoint');
      expect(config.maxRequests).toBe(100);
      expect(config.dailyMaxRequests).toBeUndefined();
    });

    it('should match exact path before prefix', () => {
      const config = getConfigForEndpoint('/api/affiliate/click');
      expect(config.maxRequests).toBe(50);
    });
  });

  describe('getIdentifier', () => {
    it('should return user identifier when userId is provided', () => {
      const request = createMockRequest('/api/test');
      const identifier = getIdentifier(request, 'user_123');
      expect(identifier).toBe('user:user_123');
    });

    it('should return IP identifier from x-forwarded-for header', () => {
      const request = createMockRequest('/api/test', {
        forwardedFor: '192.168.1.1, 10.0.0.1',
      });
      const identifier = getIdentifier(request, null);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should return IP identifier from x-real-ip header', () => {
      const request = createMockRequest('/api/test', { ip: '10.0.0.5' });
      const identifier = getIdentifier(request, null);
      expect(identifier).toBe('ip:10.0.0.5');
    });

    it('should return unknown when no IP headers present', () => {
      const request = createMockRequest('/api/test');
      const identifier = getIdentifier(request, null);
      expect(identifier).toBe('ip:unknown');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-user-1', '/api/nutrition/search');
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(29); // 30 - 1
    });

    it('should decrement remaining count on subsequent requests', () => {
      const identifier = 'test-user-2';
      const endpoint = '/api/nutrition/list';

      checkRateLimit(identifier, endpoint);
      checkRateLimit(identifier, endpoint);
      const result = checkRateLimit(identifier, endpoint);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(27); // 30 - 3
    });

    it('should block requests when limit exceeded', () => {
      const identifier = 'test-user-3';
      const endpoint = '/api/feedback/submit'; // maxRequests: 5

      // 5회 요청 (허용)
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier, endpoint);
      }

      // 6번째 요청 (차단)
      const result = checkRateLimit(identifier, endpoint);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should include daily limit info for analyze endpoints', () => {
      const result = checkRateLimit('test-user-4', '/api/analyze/skin');
      expect(result.dailyRemaining).toBeDefined();
      expect(result.dailyRemaining).toBe(49); // 50 - 1
      expect(result.dailyResetTime).toBeDefined();
    });

    it('should not include daily limit for endpoints without dailyMaxRequests', () => {
      const result = checkRateLimit('test-user-5', '/api/nutrition/search');
      expect(result.dailyRemaining).toBeUndefined();
      expect(result.dailyResetTime).toBeUndefined();
    });
  });

  describe('checkRateLimitAsync', () => {
    it('should work the same as sync version without Redis', async () => {
      const result = await checkRateLimitAsync('async-user-1', '/api/analyze/body');
      expect(result.success).toBe(true);
      expect(result.dailyRemaining).toBeDefined();
    });

    it('should block when limit exceeded', async () => {
      const identifier = 'async-user-2';
      const endpoint = '/api/feedback/submit';

      // 5회 요청
      for (let i = 0; i < 5; i++) {
        await checkRateLimitAsync(identifier, endpoint);
      }

      // 6번째 차단
      const result = await checkRateLimitAsync(identifier, endpoint);
      expect(result.success).toBe(false);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return basic rate limit headers', () => {
      const headers = getRateLimitHeaders(50, Date.now() + 60000, 100);

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('50');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include daily headers when provided', () => {
      const headers = getRateLimitHeaders(
        50,
        Date.now() + 60000,
        100,
        25, // dailyRemaining
        50, // dailyLimit
        Date.now() + 86400000 // dailyResetTime
      );

      expect(headers['X-RateLimit-Daily-Limit']).toBe('50');
      expect(headers['X-RateLimit-Daily-Remaining']).toBe('25');
      expect(headers['X-RateLimit-Daily-Reset']).toBeDefined();
    });
  });

  describe('applyRateLimit', () => {
    it('should return success for allowed request', () => {
      const request = createMockRequest('/api/nutrition/search', { ip: '1.2.3.4' });
      const result = applyRateLimit(request, 'apply-user-1');

      expect(result.success).toBe(true);
      expect(result.response).toBeUndefined();
      expect(result.headers).toBeDefined();
    });

    it('should return 429 response when rate limited', () => {
      const request = createMockRequest('/api/feedback/submit', { ip: '1.2.3.5' });
      const identifier = 'apply-user-2';

      // 초과 요청
      for (let i = 0; i < 5; i++) {
        applyRateLimit(request, identifier);
      }

      const result = applyRateLimit(request, identifier);

      expect(result.success).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(429);
    });

    it('should use custom config for limit header', () => {
      // NOTE: customConfig는 X-RateLimit-Limit 헤더에만 영향
      // 실제 rate limit 로직 및 daily limit은 endpoint config 사용 (구현 갭)
      const request = createMockRequest('/api/custom', { ip: '1.2.3.6' });
      const customConfig: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 2,
      };

      const result = applyRateLimit(request, 'custom-config-user', customConfig);

      // X-RateLimit-Limit 헤더에 customConfig.maxRequests 반영 확인
      expect(result.headers['X-RateLimit-Limit']).toBe('2');
    });
  });

  describe('rateLimitConfigs', () => {
    it('should have analyze config with daily limit', () => {
      expect(rateLimitConfigs['/api/analyze']).toBeDefined();
      expect(rateLimitConfigs['/api/analyze'].dailyMaxRequests).toBe(50);
    });

    it('should have coach config with daily limit', () => {
      expect(rateLimitConfigs['/api/coach']).toBeDefined();
      expect(rateLimitConfigs['/api/coach'].dailyMaxRequests).toBe(200);
    });

    it('should have default config', () => {
      expect(rateLimitConfigs.default).toBeDefined();
      expect(rateLimitConfigs.default.maxRequests).toBe(100);
    });
  });

  describe('window reset behavior', () => {
    it('should reset count after window expires', () => {
      const identifier = 'window-user-1';
      const endpoint = '/api/feedback/submit';

      // 5회 요청 (한도 도달)
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier, endpoint);
      }

      // 한도 초과 확인
      let result = checkRateLimit(identifier, endpoint);
      expect(result.success).toBe(false);

      // 1분 경과 시뮬레이션
      vi.advanceTimersByTime(61000);

      // 새 윈도우에서 다시 허용
      result = checkRateLimit(identifier, endpoint);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('daily limit behavior', () => {
    it('should track daily usage separately from minute window', () => {
      const identifier = 'daily-user-1';
      const endpoint = '/api/analyze/personal-color';

      // 첫 요청
      const result1 = checkRateLimit(identifier, endpoint);
      expect(result1.dailyRemaining).toBe(49);

      // 1분 경과 (분당 윈도우 리셋)
      vi.advanceTimersByTime(61000);

      // 두 번째 요청 - 분당 카운트는 리셋, 일일 카운트는 유지
      const result2 = checkRateLimit(identifier, endpoint);
      expect(result2.remaining).toBe(9); // 분당 새 윈도우
      expect(result2.dailyRemaining).toBe(48); // 일일 누적
    });
  });
});
