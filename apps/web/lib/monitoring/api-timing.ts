/**
 * API 응답 시간 측정 미들웨어
 * - 링 버퍼로 최근 1000건 저장
 * - Server-Timing 헤더 추가
 * - p50/p95/p99 통계 계산
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiTimingEntry, ApiTimingStats } from './types';

/** 링 버퍼 최대 크기 */
const BUFFER_SIZE = 1000;

/** 타이밍 링 버퍼 */
const timingBuffer: ApiTimingEntry[] = [];
let bufferIndex = 0;

/**
 * API 타이밍 미들웨어 래퍼
 * route handler를 감싸서 응답 시간을 측정하고 Server-Timing 헤더를 추가
 */
export function withApiTiming<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  routeName: string
): (req: NextRequest) => Promise<NextResponse<T>> {
  return async (req: NextRequest): Promise<NextResponse<T>> => {
    const startTime = performance.now();

    const response = await handler(req);

    const durationMs = Math.round(performance.now() - startTime);

    // 타이밍 기록
    recordTiming({
      route: routeName,
      method: req.method,
      statusCode: response.status,
      durationMs,
      timestamp: Date.now(),
    });

    // Server-Timing 헤더 추가
    response.headers.set('Server-Timing', `total;dur=${durationMs}`);

    return response;
  };
}

/**
 * 타이밍 항목 기록 (링 버퍼)
 */
export function recordTiming(entry: ApiTimingEntry): void {
  if (timingBuffer.length < BUFFER_SIZE) {
    timingBuffer.push(entry);
  } else {
    timingBuffer[bufferIndex % BUFFER_SIZE] = entry;
  }
  bufferIndex++;
}

/**
 * 전체 타이밍 항목 조회
 */
export function getTimings(): ApiTimingEntry[] {
  return [...timingBuffer];
}

/**
 * 라우트별 타이밍 통계 계산
 */
export function getTimingStats(): ApiTimingStats[] {
  const byRoute = new Map<string, ApiTimingEntry[]>();

  for (const entry of timingBuffer) {
    const existing = byRoute.get(entry.route) ?? [];
    existing.push(entry);
    byRoute.set(entry.route, existing);
  }

  const stats: ApiTimingStats[] = [];

  for (const [route, entries] of byRoute) {
    const durations = entries.map((e) => e.durationMs).sort((a, b) => a - b);
    const errors = entries.filter((e) => e.statusCode >= 400).length;

    stats.push({
      route,
      count: entries.length,
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
      avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      errorRate: Math.round((errors / entries.length) * 100) / 100,
    });
  }

  return stats.sort((a, b) => b.p95 - a.p95);
}

/**
 * 타이밍 버퍼 초기화 (테스트용)
 */
export function clearTimings(): void {
  timingBuffer.length = 0;
  bufferIndex = 0;
}

/**
 * 퍼센타일 계산
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}
