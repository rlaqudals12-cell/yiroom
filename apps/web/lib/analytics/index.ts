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
  trackPageView,
  trackFeatureUse,
  trackAnalysisComplete,
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
