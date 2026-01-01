/**
 * 모니터링 모듈
 * Sentry 크래시 리포팅 + Analytics
 */

// 타입
export * from './types';

// Sentry
export {
  initSentry,
  captureError,
  captureMessage,
  setUser as setSentryUser,
  addBreadcrumb,
  setTag,
  setContext,
} from './sentry';

// Analytics
export {
  initAnalytics,
  logEvent,
  logScreenView,
  logWorkoutStarted,
  logWorkoutCompleted,
  logMealRecorded,
  logWaterAdded,
  logProductViewed,
  logAnalysisCompleted,
  setUserProperties,
  setUserId,
} from './analytics';

// 통합 초기화
export async function initMonitoring(): Promise<void> {
  const { initSentry } = await import('./sentry');
  const { initAnalytics } = await import('./analytics');

  await Promise.all([initSentry(), initAnalytics()]);
}
