/**
 * 기능별 사용 시간 트래커
 * @description 페이지/기능 체류 시간 측정
 */

import { trackEvent } from './tracker';

// 활성 타이머 저장
interface ActiveTimer {
  feature: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

const activeTimers: Map<string, ActiveTimer> = new Map();

/**
 * 사용 시간 측정 시작
 */
export function startDurationTracking(
  feature: string,
  metadata?: Record<string, unknown>
): void {
  // 이미 진행 중인 타이머가 있으면 종료
  if (activeTimers.has(feature)) {
    stopDurationTracking(feature);
  }

  activeTimers.set(feature, {
    feature,
    startTime: Date.now(),
    metadata,
  });
}

/**
 * 사용 시간 측정 종료 및 전송
 */
export async function stopDurationTracking(feature: string): Promise<number | null> {
  const timer = activeTimers.get(feature);
  if (!timer) return null;

  const durationMs = Date.now() - timer.startTime;
  const durationSec = Math.round(durationMs / 1000);

  activeTimers.delete(feature);

  // 1초 미만은 무시
  if (durationSec < 1) return null;

  await trackEvent({
    eventType: 'feature_use',
    eventName: `Duration: ${feature}`,
    eventData: {
      feature,
      durationMs,
      durationSec,
      ...timer.metadata,
    },
  });

  return durationSec;
}

/**
 * 모든 활성 타이머 종료 (페이지 언로드 시)
 */
export async function stopAllTimers(): Promise<void> {
  const features = Array.from(activeTimers.keys());
  await Promise.all(features.map((f) => stopDurationTracking(f)));
}

/**
 * 페이지 체류 시간 트래커
 */
export function createPageDurationTracker(pagePath: string) {
  return {
    start: () => startDurationTracking(`page:${pagePath}`, { pagePath }),
    stop: () => stopDurationTracking(`page:${pagePath}`),
  };
}

/**
 * 기능 사용 시간 트래커 (분석, 운동 등)
 */
export function createFeatureDurationTracker(
  featureId: string,
  metadata?: Record<string, unknown>
) {
  return {
    start: () => startDurationTracking(`feature:${featureId}`, { featureId, ...metadata }),
    stop: () => stopDurationTracking(`feature:${featureId}`),
  };
}

// 사전 정의된 기능 트래커
export const durationTrackers = {
  // 분석 페이지
  personalColorAnalysis: createFeatureDurationTracker('personal-color-analysis'),
  skinAnalysis: createFeatureDurationTracker('skin-analysis'),
  bodyAnalysis: createFeatureDurationTracker('body-analysis'),

  // 운동
  workoutOnboarding: createFeatureDurationTracker('workout-onboarding'),
  workoutSession: createFeatureDurationTracker('workout-session'),
  exerciseDetail: createFeatureDurationTracker('exercise-detail'),

  // 영양
  mealRecord: createFeatureDurationTracker('meal-record'),
  nutritionDashboard: createFeatureDurationTracker('nutrition-dashboard'),

  // 제품
  productBrowse: createFeatureDurationTracker('product-browse'),
  productDetail: createFeatureDurationTracker('product-detail'),

  // 소셜
  leaderboard: createFeatureDurationTracker('leaderboard'),
  friendsFeed: createFeatureDurationTracker('friends-feed'),
};

// 페이지 언로드 시 남은 타이머 종료
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // sendBeacon으로 남은 데이터 전송
    const features = Array.from(activeTimers.keys());
    features.forEach((feature) => {
      const timer = activeTimers.get(feature);
      if (timer) {
        const durationMs = Date.now() - timer.startTime;
        const durationSec = Math.round(durationMs / 1000);

        if (durationSec >= 1) {
          const payload = JSON.stringify({
            events: [
              {
                eventType: 'feature_use',
                eventName: `Duration: ${feature}`,
                eventData: {
                  feature,
                  durationMs,
                  durationSec,
                  ...timer.metadata,
                },
              },
            ],
          });
          navigator.sendBeacon?.('/api/analytics/events', payload);
        }
      }
    });
  });
}
