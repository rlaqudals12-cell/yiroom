/**
 * 통합 성능 메트릭 수집기
 *
 * API 타이밍, AI 분석, DB 쿼리, 캐시 적중률을 하나로 통합하여
 * 성능 리포트를 생성한다.
 *
 * @module lib/monitoring/metrics
 * @see performance-guidelines.md 성능 SLA 목표
 */

import { getTimingStats } from './api-timing';
import {
  getAiStats,
  getDbStats,
  checkThresholds as checkCoreThresholds,
  PERFORMANCE_THRESHOLDS,
} from './sentry-tracing';
import type { ApiTimingStats } from './types';
import type { AiPerformanceStats, DbPerformanceStats, PerformanceAlert } from './sentry-tracing';

// --- 캐시 메트릭 ---

/** 캐시 레이어 식별자 */
export type CacheLayer = 'memory' | 'redis' | 'cdn' | 'service-worker';

export interface CacheMetrics {
  layer: CacheLayer;
  hits: number;
  misses: number;
  hitRate: number;
}

/** 캐시 레이어별 적중/미스 카운터 */
const cacheCounters = new Map<CacheLayer, { hits: number; misses: number }>();

/** 캐시 적중 기록 */
export function recordCacheHit(layer: CacheLayer): void {
  const counter = cacheCounters.get(layer) ?? { hits: 0, misses: 0 };
  counter.hits++;
  cacheCounters.set(layer, counter);
}

/** 캐시 미스 기록 */
export function recordCacheMiss(layer: CacheLayer): void {
  const counter = cacheCounters.get(layer) ?? { hits: 0, misses: 0 };
  counter.misses++;
  cacheCounters.set(layer, counter);
}

/** 캐시 레이어별 적중률 통계 */
export function getCacheStats(): CacheMetrics[] {
  const stats: CacheMetrics[] = [];

  for (const [layer, counter] of cacheCounters) {
    const total = counter.hits + counter.misses;
    stats.push({
      layer,
      hits: counter.hits,
      misses: counter.misses,
      hitRate: total > 0 ? Math.round((counter.hits / total) * 100) / 100 : 0,
    });
  }

  return stats;
}

/** 캐시 카운터 초기화 (테스트용) */
export function clearCacheStats(): void {
  cacheCounters.clear();
}

// --- 통합 성능 리포트 ---

/** 전체 성능 리포트 */
export interface PerformanceReport {
  timestamp: string;
  api: ApiTimingStats[];
  ai: AiPerformanceStats[];
  db: DbPerformanceStats[];
  cache: CacheMetrics[];
  alerts: PerformanceAlert[];
  summary: PerformanceSummary;
}

/** 성능 요약 (전체 시스템 상태 한눈에) */
export interface PerformanceSummary {
  /** 전체 상태: healthy / warning / critical */
  status: 'healthy' | 'warning' | 'critical';
  /** 활성 알림 수 */
  alertCount: number;
  /** API 평균 응답시간 (ms) */
  apiAvgMs: number;
  /** AI 분석 평균 응답시간 (ms) */
  aiAvgMs: number;
  /** DB 쿼리 평균 응답시간 (ms) */
  dbAvgMs: number;
  /** AI 폴백 비율 (전체 평균) */
  aiFallbackRate: number;
  /** API 에러율 (전체 평균) */
  apiErrorRate: number;
}

/**
 * 통합 성능 리포트 생성
 *
 * 모든 메트릭 소스를 수집하고 SLA 임계값과 비교하여
 * 알림과 요약을 포함한 리포트를 반환한다.
 */
export function getPerformanceReport(): PerformanceReport {
  const api = getTimingStats();
  const ai = getAiStats();
  const db = getDbStats();
  const cache = getCacheStats();

  // API 에러율/p95 알림을 추가로 체크
  const coreAlerts = checkCoreThresholds();
  const apiAlerts = checkApiThresholds(api);
  const alerts = [...coreAlerts, ...apiAlerts];

  const summary = buildSummary(api, ai, db, alerts);

  return {
    timestamp: new Date().toISOString(),
    api,
    ai,
    db,
    cache,
    alerts,
    summary,
  };
}

// --- 확장 임계값 체크 ---

/**
 * API 라우트 임계값 체크
 * - 일반 API p95 > 500ms → warning
 * - 에러율 > 5% → critical
 *
 * Sentry Dashboard 알림 규칙 정의:
 *   - Alert: AI analysis p95 > 3000ms → warning (PERFORMANCE_THRESHOLDS.AI_P95_TARGET)
 *   - Alert: General API p95 > 500ms → warning (PERFORMANCE_THRESHOLDS.API_P95_TARGET)
 *   - Alert: DB query p95 > 100ms → warning (PERFORMANCE_THRESHOLDS.DB_P95_TARGET)
 *   - Alert: AI fallback rate > 10% → warning (PERFORMANCE_THRESHOLDS.AI_FALLBACK_WARN)
 *   - Alert: API error rate > 5% → critical (API_ERROR_RATE_CRITICAL)
 *   - Alert: AI fallback rate > 30% → critical
 */
const API_ERROR_RATE_CRITICAL = 0.05;

function checkApiThresholds(apiStats: ApiTimingStats[]): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  for (const stat of apiStats) {
    // 일반 API p95 초과 (AI 분석 라우트 제외 — 별도 임계값)
    if (!stat.route.includes('/analyze/') && stat.p95 > PERFORMANCE_THRESHOLDS.API_P95_TARGET) {
      alerts.push({
        type: 'api_slow',
        message: `API "${stat.route}" p95 ${stat.p95}ms > ${PERFORMANCE_THRESHOLDS.API_P95_TARGET}ms`,
        currentValue: stat.p95,
        threshold: PERFORMANCE_THRESHOLDS.API_P95_TARGET,
      });
    }

    // 에러율 5% 초과 → critical
    if (stat.errorRate > API_ERROR_RATE_CRITICAL && stat.count >= 10) {
      alerts.push({
        type: 'api_slow',
        message: `API "${stat.route}" 에러율 ${(stat.errorRate * 100).toFixed(1)}% > ${API_ERROR_RATE_CRITICAL * 100}% (${stat.count}건 중)`,
        currentValue: stat.errorRate,
        threshold: API_ERROR_RATE_CRITICAL,
      });
    }
  }

  return alerts;
}

// --- 요약 빌드 ---

function buildSummary(
  api: ApiTimingStats[],
  ai: AiPerformanceStats[],
  db: DbPerformanceStats[],
  alerts: PerformanceAlert[]
): PerformanceSummary {
  // 가중 평균 계산 (요청 수 기반)
  const apiAvgMs = weightedAverage(api.map((s) => ({ value: s.avgMs, weight: s.count })));
  const aiAvgMs = weightedAverage(ai.map((s) => ({ value: s.avgMs, weight: s.count })));
  const dbAvgMs = weightedAverage(db.map((s) => ({ value: s.avgMs, weight: s.count })));

  // AI 전체 폴백 비율
  const totalAiCalls = ai.reduce((sum, s) => sum + s.count, 0);
  const totalFallbacks = ai.reduce((sum, s) => sum + Math.round(s.fallbackRate * s.count), 0);
  const aiFallbackRate =
    totalAiCalls > 0 ? Math.round((totalFallbacks / totalAiCalls) * 100) / 100 : 0;

  // API 전체 에러율
  const totalApiCalls = api.reduce((sum, s) => sum + s.count, 0);
  const totalErrors = api.reduce((sum, s) => sum + Math.round(s.errorRate * s.count), 0);
  const apiErrorRate =
    totalApiCalls > 0 ? Math.round((totalErrors / totalApiCalls) * 100) / 100 : 0;

  // 상태 판정: critical 알림이 있으면 critical, 그 외 알림이 있으면 warning
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (alerts.length > 0) {
    // 에러율 초과 또는 폴백 비율 30%+ 이면 critical
    const hasCritical = alerts.some(
      (a) =>
        (a.type === 'api_slow' && a.threshold === API_ERROR_RATE_CRITICAL) ||
        (a.type === 'ai_fallback_high' && a.currentValue > 0.3)
    );
    status = hasCritical ? 'critical' : 'warning';
  }

  return {
    status,
    alertCount: alerts.length,
    apiAvgMs,
    aiAvgMs,
    dbAvgMs,
    aiFallbackRate,
    apiErrorRate,
  };
}

/** 가중 평균 (데이터 없으면 0) */
function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  if (totalWeight === 0) return 0;
  const sum = items.reduce((acc, i) => acc + i.value * i.weight, 0);
  return Math.round(sum / totalWeight);
}
