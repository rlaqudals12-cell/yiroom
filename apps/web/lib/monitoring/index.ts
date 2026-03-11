/**
 * 모니터링 모듈
 * @module lib/monitoring
 *
 * API 타이밍, 헬스체크 집계, Sentry 트레이싱, 시스템 모니터링 기능 제공.
 *
 * @example
 * import { withApiTiming, getTimingStats, traceAiAnalysis } from '@/lib/monitoring';
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
