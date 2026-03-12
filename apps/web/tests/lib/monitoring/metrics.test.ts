/**
 * 통합 성능 메트릭 모듈 테스트
 *
 * 캐시 적중률 추적, 통합 리포트 생성, API 임계값 체크를 검증한다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  startSpan: vi.fn((_options: unknown, callback: () => unknown) => callback()),
}));

import {
  recordCacheHit,
  recordCacheMiss,
  getCacheStats,
  clearCacheStats,
  getPerformanceReport,
  clearTimings,
  clearMetrics,
  recordTiming,
  traceAiAnalysis,
  traceDbQuery,
} from '@/lib/monitoring';

describe('metrics', () => {
  beforeEach(() => {
    clearCacheStats();
    clearTimings();
    clearMetrics();
  });

  // --- 캐시 메트릭 ---

  describe('cache metrics', () => {
    it('캐시 적중을 기록한다', () => {
      recordCacheHit('memory');
      recordCacheHit('memory');
      recordCacheMiss('memory');

      const stats = getCacheStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].layer).toBe('memory');
      expect(stats[0].hits).toBe(2);
      expect(stats[0].misses).toBe(1);
      expect(stats[0].hitRate).toBeCloseTo(0.67, 1);
    });

    it('여러 레이어를 독립적으로 추적한다', () => {
      recordCacheHit('memory');
      recordCacheMiss('redis');
      recordCacheHit('cdn');

      const stats = getCacheStats();
      expect(stats).toHaveLength(3);

      const memoryStat = stats.find((s) => s.layer === 'memory');
      expect(memoryStat?.hitRate).toBe(1);

      const redisStat = stats.find((s) => s.layer === 'redis');
      expect(redisStat?.hitRate).toBe(0);
    });

    it('데이터 없는 레이어는 hitRate 0을 반환한다', () => {
      expect(getCacheStats()).toEqual([]);
    });

    it('clearCacheStats가 모든 카운터를 초기화한다', () => {
      recordCacheHit('memory');
      recordCacheMiss('redis');

      clearCacheStats();
      expect(getCacheStats()).toEqual([]);
    });

    it('hit만 있으면 hitRate 1.0이다', () => {
      recordCacheHit('cdn');
      recordCacheHit('cdn');
      recordCacheHit('cdn');

      const stats = getCacheStats();
      expect(stats[0].hitRate).toBe(1);
    });

    it('miss만 있으면 hitRate 0이다', () => {
      recordCacheMiss('cdn');
      recordCacheMiss('cdn');

      const stats = getCacheStats();
      expect(stats[0].hitRate).toBe(0);
    });
  });

  // --- 통합 리포트 ---

  describe('getPerformanceReport', () => {
    it('빈 상태에서 healthy 리포트를 반환한다', () => {
      const report = getPerformanceReport();

      expect(report.timestamp).toBeDefined();
      expect(report.api).toEqual([]);
      expect(report.ai).toEqual([]);
      expect(report.db).toEqual([]);
      expect(report.cache).toEqual([]);
      expect(report.alerts).toEqual([]);
      expect(report.summary.status).toBe('healthy');
      expect(report.summary.alertCount).toBe(0);
    });

    it('API/AI/DB/캐시 메트릭을 모두 포함한다', async () => {
      recordTiming({
        route: '/api/test',
        method: 'GET',
        statusCode: 200,
        durationMs: 100,
        timestamp: Date.now(),
      });
      await traceAiAnalysis('skin', 'gemini', async () => 'ok');
      await traceDbQuery('users', 'select', async () => null);
      recordCacheHit('memory');

      const report = getPerformanceReport();

      expect(report.api).toHaveLength(1);
      expect(report.ai).toHaveLength(1);
      expect(report.db).toHaveLength(1);
      expect(report.cache).toHaveLength(1);
    });

    it('API 에러율 5% 초과 시 알림을 포함한다', () => {
      // 10건 중 2건 에러 = 20% > 5%
      for (let i = 0; i < 8; i++) {
        recordTiming({
          route: '/api/users',
          method: 'GET',
          statusCode: 200,
          durationMs: 50,
          timestamp: Date.now(),
        });
      }
      for (let i = 0; i < 2; i++) {
        recordTiming({
          route: '/api/users',
          method: 'GET',
          statusCode: 500,
          durationMs: 50,
          timestamp: Date.now(),
        });
      }

      const report = getPerformanceReport();
      const errorAlert = report.alerts.find((a) => a.message.includes('에러율'));
      expect(errorAlert).toBeDefined();
    });

    it('10건 미만이면 에러율 알림을 생성하지 않는다', () => {
      // 5건 중 3건 에러 = 60%, 하지만 건수 부족
      for (let i = 0; i < 2; i++) {
        recordTiming({
          route: '/api/users',
          method: 'GET',
          statusCode: 200,
          durationMs: 50,
          timestamp: Date.now(),
        });
      }
      for (let i = 0; i < 3; i++) {
        recordTiming({
          route: '/api/users',
          method: 'GET',
          statusCode: 500,
          durationMs: 50,
          timestamp: Date.now(),
        });
      }

      const report = getPerformanceReport();
      const errorAlert = report.alerts.find((a) => a.message.includes('에러율'));
      expect(errorAlert).toBeUndefined();
    });

    it('/analyze/ 라우트는 API p95 알림에서 제외된다', () => {
      // AI 분석 라우트는 별도 임계값 (3000ms)
      for (let i = 0; i < 10; i++) {
        recordTiming({
          route: '/api/analyze/skin',
          method: 'POST',
          statusCode: 200,
          durationMs: 2000, // > 500ms but < 3000ms
          timestamp: Date.now(),
        });
      }

      const report = getPerformanceReport();
      const apiSlowAlert = report.alerts.find(
        (a) => a.type === 'api_slow' && a.message.includes('p95')
      );
      expect(apiSlowAlert).toBeUndefined();
    });

    it('summary.status가 알림 수준에 따라 결정된다', () => {
      // 에러율 높은 API → critical
      for (let i = 0; i < 10; i++) {
        recordTiming({
          route: '/api/critical',
          method: 'GET',
          statusCode: i < 4 ? 500 : 200,
          durationMs: 50,
          timestamp: Date.now(),
        });
      }

      const report = getPerformanceReport();
      expect(report.summary.status).toBe('critical');
    });

    it('summary에 가중 평균을 포함한다', () => {
      recordTiming({
        route: '/api/a',
        method: 'GET',
        statusCode: 200,
        durationMs: 100,
        timestamp: Date.now(),
      });
      recordTiming({
        route: '/api/a',
        method: 'GET',
        statusCode: 200,
        durationMs: 300,
        timestamp: Date.now(),
      });

      const report = getPerformanceReport();
      expect(report.summary.apiAvgMs).toBe(200);
    });

    it('메트릭 없으면 summary 수치가 모두 0이다', () => {
      const report = getPerformanceReport();

      expect(report.summary.apiAvgMs).toBe(0);
      expect(report.summary.aiAvgMs).toBe(0);
      expect(report.summary.dbAvgMs).toBe(0);
      expect(report.summary.aiFallbackRate).toBe(0);
      expect(report.summary.apiErrorRate).toBe(0);
    });
  });
});
