/**
 * Analytics 이벤트 트래커
 * @description 사용자 행동 이벤트 수집 및 전송
 */

import * as Updates from 'expo-updates';

import { getApiBaseUrl, hasConfiguredApiBaseUrl } from '@/lib/api/base-url';
import { analyticsLogger } from '@/lib/utils/logger';
import type { AnalyticsEventType, AnalyticsEventInput } from '@/types/analytics';

import {
  endSession,
  getOrCreateSession,
  refreshSession,
  detectDeviceType,
  detectBrowser,
  detectOS,
} from './session';

// 전송에 실패한 이벤트도 사용자 흐름을 막지 않고 다음 flush에서 재시도한다.
let eventQueue: AnalyticsEventInput[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let queueGeneration = 0;

// 설정
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000; // 5초
const MAX_DELIVERY_ATTEMPTS = 3;

export type MobileAnalysisType =
  | 'integrated'
  | 'personal-color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup';

const ANALYSIS_RESULT_PATHS: Record<MobileAnalysisType, string> = {
  integrated: '/(analysis)/integrated/result',
  'personal-color': '/(analysis)/personal-color/result',
  skin: '/(analysis)/skin/result',
  body: '/(analysis)/body/result',
  hair: '/(analysis)/hair/result',
  makeup: '/(analysis)/makeup/result',
};

interface TrackEventOptions {
  /** 모바일 Clerk JWT. 이벤트 데이터에는 넣지 않고 Authorization 헤더로만 전송한다. */
  clerkToken?: string | null;
  /** 핵심 여정 이벤트는 앱 종료 전에 잃지 않도록 즉시 전송한다. */
  flush?: boolean;
}

function canDeliver(clerkToken: string | null | undefined): clerkToken is string {
  if (!clerkToken) return false;
  // 명시 URL은 dev/preview QA 서버를 허용한다. 폴백 prod URL은 production 채널만 허용한다.
  return hasConfiguredApiBaseUrl() || Updates.channel === 'production';
}

/**
 * 이벤트 트래킹
 */
export async function trackEvent(
  input: AnalyticsEventInput,
  options: TrackEventOptions = {}
): Promise<void> {
  // analytics route는 인증 경로다. 토큰 없는 이벤트는 큐에도 남기지 않는다.
  if (!canDeliver(options.clerkToken)) return;

  // 세션 갱신
  refreshSession();

  // 큐에 추가
  eventQueue.push(input);

  // 배치 크기 도달 시 즉시 전송
  if (options.flush || eventQueue.length >= BATCH_SIZE) {
    await flushEvents(options.clerkToken);
    return;
  }

  // 타이머 설정
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      void flushEvents(options.clerkToken);
    }, FLUSH_INTERVAL_MS);
  }
}

/**
 * 이벤트 배치 전송
 */
async function flushEventsWithAttempt(
  clerkToken: string | null | undefined,
  attempt: number
): Promise<void> {
  // 토큰 없는 flush는 기존 인증 이벤트 큐와 재시도 타이머를 건드리지 않는다.
  if (!canDeliver(clerkToken)) return;

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];
  const deliveryGeneration = queueGeneration;

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
    const response = await fetch(`${getApiBaseUrl()}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analytics API responded with ${response.status}`);
    }
  } catch (error) {
    // 로그아웃·계정 전환 뒤 도착한 이전 계정 요청 실패는 새 큐에 되살리지 않는다.
    if (deliveryGeneration !== queueGeneration) return;

    // 실패 시 큐에 다시 추가 (재시도)
    analyticsLogger.error('Failed to send events:', error);
    eventQueue = [...events, ...eventQueue].slice(0, 100); // 최대 100개
    if (!flushTimeout && attempt < MAX_DELIVERY_ATTEMPTS) {
      flushTimeout = setTimeout(() => {
        void flushEventsWithAttempt(clerkToken, attempt + 1);
      }, FLUSH_INTERVAL_MS);
    }
  }
}

/** 명시적 flush는 새 전송 주기로 시작한다. 최대 재시도 뒤 남은 큐도 다음 호출에서 다시 보낸다. */
export async function flushEvents(clerkToken?: string | null): Promise<void> {
  await flushEventsWithAttempt(clerkToken, 1);
}

/** 로그아웃·계정 전환 시 이전 계정의 큐와 세션을 함께 폐기한다. */
export function resetAnalyticsIdentity(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  eventQueue = [];
  queueGeneration += 1;
  endSession();
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
  analysisType: MobileAnalysisType,
  details: {
    status?: 'completed' | 'partial' | 'failed';
    axesCompletedCount?: number;
    usedFallback?: boolean;
  } = {},
  clerkToken?: string | null
): Promise<void> {
  await trackEvent(
    {
      eventType: 'analysis_complete',
      eventName: 'Analysis Completed',
      eventData: { analysisType, ...details },
    },
    { clerkToken, flush: true }
  );
}

export async function trackAppStarted(clerkToken?: string | null): Promise<void> {
  await trackEvent(
    {
      eventType: 'session_start',
      eventName: 'Mobile App Started',
      eventData: { platform: 'mobile' },
    },
    { clerkToken, flush: true }
  );
}

/** 유효 입력·인증을 통과해 실제 분석 API를 호출하기 직전에 기록한다. */
export async function trackAnalysisStart(
  analysisType: MobileAnalysisType,
  mode: 'full' | 'update',
  clerkToken?: string | null
): Promise<void> {
  await trackEvent(
    {
      eventType: 'feature_use',
      eventName: 'Analysis Started',
      eventData: { featureId: 'analysis', analysisType, mode },
    },
    { clerkToken, flush: true }
  );
}

/** 결과가 실제로 화면에 준비된 시점만 기록한다. 세션 ID는 전송하지 않는다. */
export async function trackAnalysisResultView(
  analysisType: MobileAnalysisType,
  source: 'fresh' | 'history' | 'result-screen',
  clerkToken?: string | null
): Promise<void> {
  await trackEvent(
    {
      eventType: 'page_view',
      eventName: 'Analysis Result Viewed',
      eventData: { analysisType, source },
      pagePath: ANALYSIS_RESULT_PATHS[analysisType],
    },
    { clerkToken, flush: true }
  );
}

/** 네이티브 공유 시트를 연 행동. 공유 카드 내용·사용자 문구는 수집하지 않는다. */
export async function trackAnalysisShare(
  analysisType: MobileAnalysisType,
  method: 'image' | 'link',
  clerkToken?: string | null
): Promise<void> {
  await trackEvent(
    {
      eventType: 'button_click',
      eventName: 'Analysis Shared',
      eventData: { buttonId: 'analysis_share', analysisType, method },
    },
    { clerkToken, flush: true }
  );
}

/** 코디 저장 성공 후 집계 가능한 출처·아이템 수만 기록한다. */
export async function trackOutfitSaved(
  source: 'recommendation' | 'builder',
  itemCount: number,
  clerkToken?: string | null
): Promise<void> {
  await trackEvent(
    {
      eventType: 'button_click',
      eventName: 'Outfit Saved',
      eventData: { buttonId: 'outfit_save', source, itemCount },
    },
    { clerkToken, flush: true }
  );
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
 * 쇼핑 링크 클릭 트래킹
 * @param platform 쇼핑 플랫폼 (coupang, musinsa, iherb 등)
 * @param category 상품 카테고리 (workout-top, workout-bottom, accessory)
 * @param context 추가 컨텍스트 (personalColor, bodyType 등)
 */
export async function trackShoppingClick(
  platform: string,
  category: string,
  context?: {
    personalColor?: string;
    bodyType?: string;
    source?: string;
  }
): Promise<void> {
  await trackEvent({
    eventType: 'button_click',
    eventName: `Shopping Click: ${platform}`,
    eventData: { platform, category, ...context },
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
