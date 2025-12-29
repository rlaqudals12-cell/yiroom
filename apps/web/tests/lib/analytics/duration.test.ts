/**
 * 사용 시간 트래커 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startDurationTracking,
  stopDurationTracking,
  stopAllTimers,
  createPageDurationTracker,
  createFeatureDurationTracker,
  durationTrackers,
} from '@/lib/analytics/duration';
import * as tracker from '@/lib/analytics/tracker';

// trackEvent 모킹
vi.mock('@/lib/analytics/tracker', () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Duration Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startDurationTracking / stopDurationTracking', () => {
    it('시작 후 종료 시 시간을 트래킹한다', async () => {
      startDurationTracking('test-feature');

      // 5초 경과
      vi.advanceTimersByTime(5000);

      const duration = await stopDurationTracking('test-feature');

      expect(duration).toBe(5);
      expect(tracker.trackEvent).toHaveBeenCalledWith({
        eventType: 'feature_use',
        eventName: 'Duration: test-feature',
        eventData: {
          feature: 'test-feature',
          durationMs: 5000,
          durationSec: 5,
        },
      });
    });

    it('1초 미만은 무시한다', async () => {
      startDurationTracking('quick-feature');

      // 400ms만 경과 (Math.round(400/1000) = 0)
      vi.advanceTimersByTime(400);

      const duration = await stopDurationTracking('quick-feature');

      expect(duration).toBeNull();
      expect(tracker.trackEvent).not.toHaveBeenCalled();
    });

    it('시작하지 않은 타이머 종료 시 null 반환', async () => {
      const duration = await stopDurationTracking('nonexistent');

      expect(duration).toBeNull();
      expect(tracker.trackEvent).not.toHaveBeenCalled();
    });

    it('메타데이터를 포함하여 트래킹한다', async () => {
      startDurationTracking('product-view', { productId: 'prod-123' });

      vi.advanceTimersByTime(10000);

      await stopDurationTracking('product-view');

      expect(tracker.trackEvent).toHaveBeenCalledWith({
        eventType: 'feature_use',
        eventName: 'Duration: product-view',
        eventData: {
          feature: 'product-view',
          durationMs: 10000,
          durationSec: 10,
          productId: 'prod-123',
        },
      });
    });

    it('이미 진행 중인 타이머가 있으면 종료 후 새로 시작', async () => {
      startDurationTracking('feature-a');
      vi.advanceTimersByTime(3000);

      // 같은 이름으로 다시 시작
      startDurationTracking('feature-a');
      vi.advanceTimersByTime(2000);

      const duration = await stopDurationTracking('feature-a');

      // 두 번째 시작 이후의 시간만 측정
      expect(duration).toBe(2);
    });
  });

  describe('stopAllTimers', () => {
    it('모든 활성 타이머를 종료한다', async () => {
      startDurationTracking('feature-1');
      startDurationTracking('feature-2');
      startDurationTracking('feature-3');

      vi.advanceTimersByTime(5000);

      await stopAllTimers();

      expect(tracker.trackEvent).toHaveBeenCalledTimes(3);
    });

    it('빈 상태에서도 에러 없이 동작', async () => {
      await expect(stopAllTimers()).resolves.toBeUndefined();
    });
  });

  describe('createPageDurationTracker', () => {
    it('페이지 체류 시간 트래커를 생성한다', async () => {
      const pageTracker = createPageDurationTracker('/products');

      pageTracker.start();
      vi.advanceTimersByTime(30000);
      await pageTracker.stop();

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'Duration: page:/products',
          eventData: expect.objectContaining({
            feature: 'page:/products',
            pagePath: '/products',
            durationSec: 30,
          }),
        })
      );
    });
  });

  describe('createFeatureDurationTracker', () => {
    it('기능 사용 시간 트래커를 생성한다', async () => {
      const featureTracker = createFeatureDurationTracker('workout-session', {
        planId: 'plan-123',
      });

      featureTracker.start();
      vi.advanceTimersByTime(1800000); // 30분
      await featureTracker.stop();

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'Duration: feature:workout-session',
          eventData: expect.objectContaining({
            feature: 'feature:workout-session',
            featureId: 'workout-session',
            planId: 'plan-123',
            durationSec: 1800,
          }),
        })
      );
    });
  });

  describe('durationTrackers', () => {
    it('사전 정의된 분석 트래커가 있다', () => {
      expect(durationTrackers.personalColorAnalysis).toBeDefined();
      expect(durationTrackers.skinAnalysis).toBeDefined();
      expect(durationTrackers.bodyAnalysis).toBeDefined();
    });

    it('사전 정의된 운동 트래커가 있다', () => {
      expect(durationTrackers.workoutOnboarding).toBeDefined();
      expect(durationTrackers.workoutSession).toBeDefined();
      expect(durationTrackers.exerciseDetail).toBeDefined();
    });

    it('사전 정의된 영양 트래커가 있다', () => {
      expect(durationTrackers.mealRecord).toBeDefined();
      expect(durationTrackers.nutritionDashboard).toBeDefined();
    });

    it('사전 정의된 제품 트래커가 있다', () => {
      expect(durationTrackers.productBrowse).toBeDefined();
      expect(durationTrackers.productDetail).toBeDefined();
    });

    it('사전 정의된 소셜 트래커가 있다', () => {
      expect(durationTrackers.leaderboard).toBeDefined();
      expect(durationTrackers.friendsFeed).toBeDefined();
    });

    it('트래커가 정상 동작한다', async () => {
      durationTrackers.productDetail.start();
      vi.advanceTimersByTime(15000);
      await durationTrackers.productDetail.stop();

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            featureId: 'product-detail',
            durationSec: 15,
          }),
        })
      );
    });
  });
});
