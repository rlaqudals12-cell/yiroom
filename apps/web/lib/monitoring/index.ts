/**
 * 모니터링 모듈
 * @module lib/monitoring
 *
 * API 타이밍, 헬스체크 집계, 시스템 모니터링 기능 제공.
 *
 * @example
 * import { withApiTiming, getTimingStats } from '@/lib/monitoring';
 */

export {
  withApiTiming,
  recordTiming,
  getTimings,
  getTimingStats,
  clearTimings,
} from './api-timing';
export { fetchSystemHealth } from './health-aggregator';
export type {
  ServiceStatus,
  ServiceHealth,
  SystemHealthSnapshot,
  ApiTimingEntry,
  ApiTimingStats,
  VitalsReport,
  VitalMetric,
} from './types';
