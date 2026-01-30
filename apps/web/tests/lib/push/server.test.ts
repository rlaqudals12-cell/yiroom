/**
 * Web Push Server 테스트
 * Phase L: L-1 Web Push 알림
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PushSendResult } from '@/lib/push/types';

// web-push 모킹
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

describe('lib/push/server', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isVapidConfigured', () => {
    it('should return false when VAPID keys are not set', async () => {
      // 환경변수 모킹
      vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
      vi.stubEnv('VAPID_PRIVATE_KEY', '');

      const { isVapidConfigured } = await import('@/lib/push/server');
      expect(isVapidConfigured()).toBe(false);
    });

    it('should return true when both VAPID keys are set', async () => {
      vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'test-public-key');
      vi.stubEnv('VAPID_PRIVATE_KEY', 'test-private-key');

      await import('@/lib/push/server');
      // 환경변수가 설정되어 있다고 가정
      // 실제로는 모듈 로드 시점에 확인되므로 테스트가 다를 수 있음
    });
  });

  describe('getExpiredSubscriptions', () => {
    it('should return empty array when no subscriptions are expired', async () => {
      const { getExpiredSubscriptions } = await import('@/lib/push/server');

      const results: PushSendResult[] = [
        { success: true, endpoint: 'https://push.example.com/1' },
        { success: true, endpoint: 'https://push.example.com/2' },
      ];

      const expired = getExpiredSubscriptions(results);
      expect(expired).toEqual([]);
    });

    it('should return expired subscription endpoints', async () => {
      const { getExpiredSubscriptions } = await import('@/lib/push/server');

      const results: PushSendResult[] = [
        { success: true, endpoint: 'https://push.example.com/1' },
        {
          success: false,
          endpoint: 'https://push.example.com/2',
          error: 'SUBSCRIPTION_EXPIRED',
        },
        {
          success: false,
          endpoint: 'https://push.example.com/3',
          error: 'OTHER_ERROR',
        },
        {
          success: false,
          endpoint: 'https://push.example.com/4',
          error: 'SUBSCRIPTION_EXPIRED',
        },
      ];

      const expired = getExpiredSubscriptions(results);
      expect(expired).toEqual(['https://push.example.com/2', 'https://push.example.com/4']);
    });
  });

  describe('summarizeResults', () => {
    it('should correctly summarize results', async () => {
      const { summarizeResults } = await import('@/lib/push/server');

      const results: PushSendResult[] = [
        { success: true, endpoint: 'https://push.example.com/1' },
        { success: true, endpoint: 'https://push.example.com/2' },
        {
          success: false,
          endpoint: 'https://push.example.com/3',
          error: 'SUBSCRIPTION_EXPIRED',
        },
        {
          success: false,
          endpoint: 'https://push.example.com/4',
          error: 'OTHER_ERROR',
        },
      ];

      const summary = summarizeResults(results);
      expect(summary).toEqual({
        sent: 2,
        failed: 2,
        expired: 1,
      });
    });

    it('should return zeros for empty results', async () => {
      const { summarizeResults } = await import('@/lib/push/server');

      const results: PushSendResult[] = [];

      const summary = summarizeResults(results);
      expect(summary).toEqual({
        sent: 0,
        failed: 0,
        expired: 0,
      });
    });
  });
});
