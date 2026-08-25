/**
 * Analytics 시스템 통합 Export
 * @description lib/analytics 모듈의 모든 함수/타입 re-export
 */

// Session
export {
  getSessionId,
  getOrCreateSession,
  refreshSession,
  endSession,
  getSessionStartTime,
  getSessionDuration,
  detectDeviceType,
  detectBrowser,
  detectOS,
} from './session';

// Tracker
export {
  trackEvent,
  flushEvents,
  setAnalyticsConsent,
  isAnalyticsConsentGranted,
  trackPageView,
  trackFeatureUse,
  trackAppStarted,
  trackAnalysisStart,
  trackAnalysisComplete,
  trackAnalysisResultView,
  trackAnalysisShare,
  trackOutfitSaved,
  trackWorkoutStart,
  trackWorkoutComplete,
  trackMealRecord,
  trackProductView,
  trackProductClick,
  trackSearch,
  trackButtonClick,
  trackSignupComplete,
  trackOnboardingComplete,
  trackAffiliateConversion,
  trackCustomEvent,
} from './tracker';
export type { MobileAnalysisType } from './tracker';

// App lifecycle
export { useAnalyticsLifecycle } from './lifecycle';

// Stats
export {
  getDateRange,
  getAnalyticsSummary,
  getTopPages,
  getTopFeatures,
  getDeviceBreakdown,
  getUserFlow,
  getRealtimeStats,
  getDailyTrend,
  getAnalyticsDashboardData,
} from './stats';

// Mock (개발용)
export {
  generateMockSummary,
  generateMockTopPages,
  generateMockTopFeatures,
  generateMockDeviceBreakdown,
  generateMockUserFlow,
  generateMockRealtimeStats,
  generateMockDailyTrend,
} from './mock';

// Funnel (퍼널 분석)
export {
  trackFunnelStep,
  onboardingFunnel,
  analysisFunnel,
  workoutFunnel,
  productFunnel,
  socialFunnel,
  calculateFunnelConversion,
} from './funnel';
export type { FunnelType, FunnelStep } from './funnel';

// Duration (사용 시간 트래킹)
export {
  startDurationTracking,
  stopDurationTracking,
  stopAllTimers,
  createPageDurationTracker,
  createFeatureDurationTracker,
  durationTrackers,
} from './duration';

// Web Vitals (Core Web Vitals 추적)
// web-vitals 사포크(웹 전용 @sentry/nextjs 의존)는 배럴에서 제외 — Metro가 웹 서버
// 코드를 모바일 번들로 끌고 들어와 번들링이 깨진다(S4 사포크 정리 대상, 소비처 0 확인).

// Types re-export
export type {
  AnalyticsEventType,
  DeviceType,
  AnalyticsEvent,
  AnalyticsEventInput,
  AnalyticsSession,
  DailyStats,
  AnalyticsSummary,
  TopPage,
  TopFeature,
  UserFlow,
  DeviceBreakdown,
  RealtimeStats,
  AnalyticsPeriod,
  AnalyticsStatsType,
} from '@/types/analytics';
