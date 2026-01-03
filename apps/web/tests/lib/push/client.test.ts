/**
 * Web Push Client 테스트
 * Phase L: L-1 Web Push 알림
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Push 클라이언트 함수들을 테스트
describe('lib/push/client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isPushSupported', () => {
    it('should return false when window is undefined', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - 테스트용 undefined 설정
      global.window = undefined;

      const { isPushSupported } = await import('@/lib/push/client');
      expect(isPushSupported()).toBe(false);

      global.window = originalWindow;
    });

    it('should return false when serviceWorker is not in navigator', async () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error - 테스트용 모킹
      global.navigator = {};

      const { isPushSupported } = await import('@/lib/push/client');
      expect(isPushSupported()).toBe(false);

      global.navigator = originalNavigator;
    });
  });

  describe('getPushSubscriptionStatus', () => {
    it('should return not supported status when push is not supported', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - 테스트용 undefined 설정
      global.window = undefined;

      const { getPushSubscriptionStatus } = await import('@/lib/push/client');
      const status = await getPushSubscriptionStatus();

      expect(status).toEqual({
        isSupported: false,
        isSubscribed: false,
        permission: 'default',
        subscription: null,
      });

      global.window = originalWindow;
    });
  });

  describe('requestPushPermission', () => {
    it('should return denied when push is not supported', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - 테스트용 undefined 설정
      global.window = undefined;

      const { requestPushPermission } = await import('@/lib/push/client');
      const result = await requestPushPermission();

      expect(result).toBe('denied');

      global.window = originalWindow;
    });
  });
});
