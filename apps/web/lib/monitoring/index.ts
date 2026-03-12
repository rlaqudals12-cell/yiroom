/**
 * 모니터링 모듈
 * @module lib/monitoring
 *
 * API 타이밍, 헬스체크 집계, Sentry 트레이싱, 캐시 메트릭, 통합 리포트 제공.
 *
 * @example
 * import { withApiTiming, getTimingStats, traceAiAnalysis, getPerformanceReport } from '@/lib/monitoring';
 */

export {
  withApiTiming,
  recordTiming,
  getTimings,
  getTimingStats,
  clearTimings,
} from './api-timing';
export { fetchSystemHealth } from './health-aggregator';
export {
  withSpan,
  traceApiRoute,
  traceAiAnalysis,
  traceDbQuery,
  getAiStats,
  getDbStats,
  clearMetrics,
  checkThresholds,
  PERFORMANCE_THRESHOLDS,
} from './sentry-tracing';
export {
  recordCacheHit,
  recordCacheMiss,
  getCacheStats,
  clearCacheStats,
  getPerformanceReport,
} from './metrics';
export type {
  ServiceStatus,
  ServiceHealth,
  SystemHealthSnapshot,
  ApiTimingEntry,
  ApiTimingStats,
  VitalsReport,
  VitalMetric,
} from './types';
export type {
  AiMetrics,
  DbMetrics,
  AiPerformanceStats,
  DbPerformanceStats,
  PerformanceAlert,
} from './sentry-tracing';
export type { CacheLayer, CacheMetrics, PerformanceReport, PerformanceSummary } from './metrics';
