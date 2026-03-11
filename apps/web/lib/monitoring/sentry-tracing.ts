/**
 * Sentry Performance 트레이싱 유틸리티
 *
 * API 라우트, AI 분석, DB 쿼리에 대한 커스텀 스팬과 메트릭을 제공한다.
 * Sentry가 초기화되지 않은 환경(dev, test)에서는 자동으로 no-op 동작.
 *
 * @module lib/monitoring/sentry-tracing
 * @see ADR-020 API 설계, performance-guidelines.md
 */

import * as Sentry from '@sentry/nextjs';

// --- 스팬 래퍼 ---

/**
 * Sentry 스팬으로 비동기 함수를 감싼다.
 * Sentry가 비활성화된 환경에서는 fn만 실행.
 *
 * @example
 * const result = await withSpan('ai.analysis', 'personal-color', async () => {
 *   return await analyzeWithGemini(input);
 * });
 */
export async function withSpan<T>(
  op: string,
  description: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return Sentry.startSpan(
    {
      op,
      name: description,
      attributes,
    },
    async () => {
      return await fn();
    }
  );
}

// --- API 라우트 트레이싱 ---

/** API 라우트 핸들러를 Sentry 트랜잭션으로 감싼다 */
export async function traceApiRoute<T>(
  routeName: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan('http.server', `${method} ${routeName}`, fn, {
    'http.method': method,
    'http.route': routeName,
  });
}

// --- AI 분석 트레이싱 ---

export interface AiMetrics {
  model: string;
  module: string;
  durationMs: number;
  usedFallback: boolean;
  tokenEstimate?: number;
}

/**
 * AI 분석 호출을 트레이싱하고 메트릭을 기록한다.
 * 타임아웃/폴백 여부도 함께 추적.
 */
export async function traceAiAnalysis<T>(
  module: string,
  model: string,
  fn: () => Promise<T>
): Promise<{ result: T; metrics: AiMetrics }> {
  const startTime = performance.now();

  try {
    const result = await withSpan('ai.inference', `gemini.${module}`, fn, {
      'ai.model': model,
      'ai.module': module,
    });

    const durationMs = Math.round(performance.now() - startTime);
    const metrics: AiMetrics = { model, module, durationMs, usedFallback: false };

    // 커스텀 메트릭 기록
    recordAiMetric(metrics);

    return { result, metrics };
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);

    // 실패 메트릭 기록
    recordAiMetric({ model, module, durationMs, usedFallback: true });

    throw error;
  }
}

// --- DB 쿼리 트레이싱 ---

export interface DbMetrics {
  table: string;
  operation: string;
  durationMs: number;
  rowCount?: number;
}

/**
 * Supabase DB 쿼리를 트레이싱한다.
 *
 * @example
 * const { result } = await traceDbQuery('users', 'select', async () => {
 *   return await supabase.from('users').select('*').eq('id', userId);
 * });
 */
export async function traceDbQuery<T>(
  table: string,
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; metrics: DbMetrics }> {
  const startTime = performance.now();

  const result = await withSpan('db.query', `${operation} ${table}`, fn, {
    'db.system': 'postgresql',
    'db.table': table,
    'db.operation': operation,
  });

  const durationMs = Math.round(performance.now() - startTime);
  const metrics: DbMetrics = { table, operation, durationMs };

  recordDbMetric(metrics);

  return { result, metrics };
}

// --- 메트릭 링 버퍼 ---

const AI_METRICS_BUFFER_SIZE = 500;
const DB_METRICS_BUFFER_SIZE = 1000;

const aiMetricsBuffer: AiMetrics[] = [];
let aiBufferIndex = 0;

const dbMetricsBuffer: DbMetrics[] = [];
let dbBufferIndex = 0;

function recordAiMetric(metric: AiMetrics): void {
  if (aiMetricsBuffer.length < AI_METRICS_BUFFER_SIZE) {
    aiMetricsBuffer.push(metric);
  } else {
    aiMetricsBuffer[aiBufferIndex % AI_METRICS_BUFFER_SIZE] = metric;
  }
  aiBufferIndex++;
}

function recordDbMetric(metric: DbMetrics): void {
  if (dbMetricsBuffer.length < DB_METRICS_BUFFER_SIZE) {
    dbMetricsBuffer.push(metric);
  } else {
    dbMetricsBuffer[dbBufferIndex % DB_METRICS_BUFFER_SIZE] = metric;
  }
  dbBufferIndex++;
}

// --- 통계 조회 ---

export interface AiPerformanceStats {
  module: string;
  count: number;
  avgMs: number;
  p95Ms: number;
  fallbackRate: number;
}

export interface DbPerformanceStats {
  table: string;
  operation: string;
  count: number;
  avgMs: number;
  p95Ms: number;
}

/** AI 분석 모듈별 성능 통계 */
export function getAiStats(): AiPerformanceStats[] {
  const byModule = new Map<string, AiMetrics[]>();

  for (const m of aiMetricsBuffer) {
    const existing = byModule.get(m.module) ?? [];
    existing.push(m);
    byModule.set(m.module, existing);
  }

  const stats: AiPerformanceStats[] = [];

  for (const [module, entries] of byModule) {
    const durations = entries.map((e) => e.durationMs).sort((a, b) => a - b);
    const fallbacks = entries.filter((e) => e.usedFallback).length;

    stats.push({
      module,
      count: entries.length,
      avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p95Ms: percentile(durations, 95),
      fallbackRate: Math.round((fallbacks / entries.length) * 100) / 100,
    });
  }

  return stats.sort((a, b) => b.p95Ms - a.p95Ms);
}

/** DB 쿼리 테이블/오퍼레이션별 성능 통계 */
export function getDbStats(): DbPerformanceStats[] {
  const byKey = new Map<string, DbMetrics[]>();

  for (const m of dbMetricsBuffer) {
    const key = `${m.table}:${m.operation}`;
    const existing = byKey.get(key) ?? [];
    existing.push(m);
    byKey.set(key, existing);
  }

  const stats: DbPerformanceStats[] = [];

  for (const [, entries] of byKey) {
    const durations = entries.map((e) => e.durationMs).sort((a, b) => a - b);

    stats.push({
      table: entries[0].table,
      operation: entries[0].operation,
      count: entries.length,
      avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p95Ms: percentile(durations, 95),
    });
  }

  return stats.sort((a, b) => b.p95Ms - a.p95Ms);
}

/** 메트릭 버퍼 초기화 (테스트용) */
export function clearMetrics(): void {
  aiMetricsBuffer.length = 0;
  aiBufferIndex = 0;
  dbMetricsBuffer.length = 0;
  dbBufferIndex = 0;
}

// --- 임계값 체크 ---

/** SLA 임계값 */
export const PERFORMANCE_THRESHOLDS = {
  /** AI 분석 p95 목표 (ms) */
  AI_P95_TARGET: 3000,
  /** 일반 API p95 목표 (ms) */
  API_P95_TARGET: 500,
  /** DB 쿼리 p95 목표 (ms) */
  DB_P95_TARGET: 100,
  /** AI 폴백 비율 경고 (%) */
  AI_FALLBACK_WARN: 0.1,
} as const;

export interface PerformanceAlert {
  type: 'ai_slow' | 'api_slow' | 'db_slow' | 'ai_fallback_high';
  message: string;
  currentValue: number;
  threshold: number;
}

/** 임계값 초과 항목 감지 */
export function checkThresholds(): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  for (const stat of getAiStats()) {
    if (stat.p95Ms > PERFORMANCE_THRESHOLDS.AI_P95_TARGET) {
      alerts.push({
        type: 'ai_slow',
        message: `AI 모듈 "${stat.module}" p95 ${stat.p95Ms}ms > ${PERFORMANCE_THRESHOLDS.AI_P95_TARGET}ms`,
        currentValue: stat.p95Ms,
        threshold: PERFORMANCE_THRESHOLDS.AI_P95_TARGET,
      });
    }

    if (stat.fallbackRate > PERFORMANCE_THRESHOLDS.AI_FALLBACK_WARN) {
      alerts.push({
        type: 'ai_fallback_high',
        message: `AI 모듈 "${stat.module}" 폴백 비율 ${(stat.fallbackRate * 100).toFixed(0)}% > ${PERFORMANCE_THRESHOLDS.AI_FALLBACK_WARN * 100}%`,
        currentValue: stat.fallbackRate,
        threshold: PERFORMANCE_THRESHOLDS.AI_FALLBACK_WARN,
      });
    }
  }

  for (const stat of getDbStats()) {
    if (stat.p95Ms > PERFORMANCE_THRESHOLDS.DB_P95_TARGET) {
      alerts.push({
        type: 'db_slow',
        message: `DB "${stat.table}.${stat.operation}" p95 ${stat.p95Ms}ms > ${PERFORMANCE_THRESHOLDS.DB_P95_TARGET}ms`,
        currentValue: stat.p95Ms,
        threshold: PERFORMANCE_THRESHOLDS.DB_P95_TARGET,
      });
    }
  }

  return alerts;
}

// --- 유틸리티 ---

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}
