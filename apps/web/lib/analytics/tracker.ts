/**
 * Analytics 이벤트 트래커
 * @description 사용자 행동 이벤트 수집 및 전송
 */

import { analyticsLogger } from '@/lib/utils/logger';
import type { AnalyticsEventType, AnalyticsEventInput } from '@/types/analytics';
import {
  getOrCreateSession,
  refreshSession,
  detectDeviceType,
  detectBrowser,
  detectOS,
} from './session';

// 이벤트 배치 큐
let eventQueue: AnalyticsEventInput[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// 설정
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000; // 5초

/**
 * 이벤트 트래킹
 */
export async function trackEvent(input: AnalyticsEventInput): Promise<void> {
  // 세션 갱신
  refreshSession();

  // 큐에 추가
  eventQueue.push(input);

  // 배치 크기 도달 시 즉시 전송
  if (eventQueue.length >= BATCH_SIZE) {
    await flushEvents();
    return;
  }

  // 타이머 설정
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushEvents();
    }, FLUSH_INTERVAL_MS);
  }
}

/**
 * 이벤트 배치 전송
 */
export async function flushEvents(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  // 세션 및 디바이스 정보 추가
  const sessionId = getOrCreateSession();
  const deviceType = detectDeviceType();
  const browser = detectBrowser();
  const os = detectOS();

  const payload = {
    sessionId,
    deviceType,
    browser,
    os,
    events,
  };

  try {
    // API 전송 (Mock 모드에서는 로깅만)
    if (process.env.NODE_ENV === 'development') {
      analyticsLogger.debug('Events:', payload);
      return;
    }

    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // 실패 시 큐에 다시 추가 (재시도)
    analyticsLogger.error('Failed to send events:', error);
    eventQueue = [...events, ...eventQueue].slice(0, 100); // 최대 100개
  }
}

/**
 * 페이지뷰 트래킹
 */
export async function trackPageView(path: string, duration?: number): Promise<void> {
  await trackEvent({
    eventType: 'page_view',
    eventName: `Page View: ${path}`,
    eventData: { duration },
    pagePath: path,
  });
}

/**
 * 기능 사용 트래킹
 */
export async function trackFeatureUse(featureId: string, featureName: string): Promise<void> {
  await trackEvent({
    eventType: 'feature_use',
    eventName: featureName,
    eventData: { featureId },
  });
}

/**
 * 분석 완료 트래킹
 */
export async function trackAnalysisComplete(
  analysisType: 'personal-color' | 'skin' | 'body'
): Promise<void> {
  await trackEvent({
    eventType: 'analysis_complete',
    eventName: `Analysis Complete: ${analysisType}`,
    eventData: { analysisType },
  });
}

/**
 * 운동 시작 트래킹
 */
export async function trackWorkoutStart(workoutPlanId: string): Promise<void> {
  await trackEvent({
    eventType: 'workout_start',
    eventName: 'Workout Started',
    eventData: { workoutPlanId },
  });
}

/**
 * 운동 완료 트래킹
 */
export async function trackWorkoutComplete(
  workoutPlanId: string,
  durationMin: number
): Promise<void> {
  await trackEvent({
    eventType: 'workout_complete',
    eventName: 'Workout Completed',
    eventData: { workoutPlanId, durationMin },
  });
}

/**
 * 식단 기록 트래킹
 */
export async function trackMealRecord(mealType: string, calories: number): Promise<void> {
  await trackEvent({
    eventType: 'meal_record',
    eventName: `Meal Record: ${mealType}`,
    eventData: { mealType, calories },
  });
}

/**
 * 제품 조회 트래킹
 */
export async function trackProductView(productId: string, category: string): Promise<void> {
  await trackEvent({
    eventType: 'product_view',
    eventName: 'Product View',
    eventData: { productId, category },
  });
}

/**
 * 제품 클릭 (어필리에이트) 트래킹
 */
export async function trackProductClick(productId: string, partnerId: string): Promise<void> {
  await trackEvent({
    eventType: 'product_click',
    eventName: 'Product Click',
    eventData: { productId, partnerId },
  });
}

/**
 * 검색 트래킹
 */
export async function trackSearch(query: string, resultsCount: number): Promise<void> {
  await trackEvent({
    eventType: 'search',
    eventName: 'Search',
    eventData: { query, resultsCount },
  });
}

/**
 * 버튼 클릭 트래킹
 */
export async function trackButtonClick(buttonId: string, context?: string): Promise<void> {
  await trackEvent({
    eventType: 'button_click',
    eventName: `Button Click: ${buttonId}`,
    eventData: { buttonId, context },
  });
}

/**
 * 회원가입 완료 트래킹
 */
export async function trackSignupComplete(method: string): Promise<void> {
  await trackEvent({
    eventType: 'signup_complete',
    eventName: 'Signup Complete',
    eventData: { method },
  });
}

/**
 * 온보딩 완료 트래킹
 */
export async function trackOnboardingComplete(stepsCompleted: number): Promise<void> {
  await trackEvent({
    eventType: 'onboarding_complete',
    eventName: 'Onboarding Complete',
    eventData: { stepsCompleted },
  });
}

/**
 * 어필리에이트 전환 트래킹
 */
export async function trackAffiliateConversion(productId: string, revenue: number): Promise<void> {
  await trackEvent({
    eventType: 'affiliate_conversion',
    eventName: 'Affiliate Conversion',
    eventData: { productId, revenue },
  });
}

/**
 * 커스텀 이벤트 트래킹
 */
export async function trackCustomEvent(
  eventType: AnalyticsEventType,
  eventName: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    eventType,
    eventName,
    eventData,
  });
}

// 페이지 언로드 시 남은 이벤트 전송
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0) {
      // sendBeacon 사용 (더 안정적)
      const sessionId = getOrCreateSession();
      const payload = JSON.stringify({
        sessionId,
        events: eventQueue,
      });

      navigator.sendBeacon?.('/api/analytics/events', payload);
    }
  });
}
