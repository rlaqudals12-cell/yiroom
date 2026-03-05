/**
 * API 타이밍 모듈 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { recordTiming, getTimings, getTimingStats, clearTimings } from '@/lib/monitoring';

describe('api-timing', () => {
  beforeEach(() => {
    clearTimings();
  });

  describe('recordTiming', () => {
    it('should record a timing entry', () => {
      recordTiming({
        route: '/api/test',
        method: 'GET',
        statusCode: 200,
        durationMs: 150,
        timestamp: Date.now(),
      });

      const timings = getTimings();
      expect(timings).toHaveLength(1);
      expect(timings[0].route).toBe('/api/test');
      expect(timings[0].durationMs).toBe(150);
    });

    it('should record multiple entries', () => {
      for (let i = 0; i < 5; i++) {
        recordTiming({
          route: `/api/route-${i}`,
          method: 'GET',
          statusCode: 200,
          durationMs: 100 + i * 50,
          timestamp: Date.now(),
        });
      }

      expect(getTimings()).toHaveLength(5);
    });

    it('should use ring buffer when exceeding max size', () => {
      // 1001개 기록하면 버퍼가 1000개로 유지되어야 함
      for (let i = 0; i < 1001; i++) {
        recordTiming({
          route: `/api/route-${i}`,
          method: 'GET',
          statusCode: 200,
          durationMs: i,
          timestamp: Date.now(),
        });
      }

      const timings = getTimings();
      expect(timings).toHaveLength(1000);
    });

    it('should overwrite oldest entries in ring buffer', () => {
      // 1000개 채움
      for (let i = 0; i < 1000; i++) {
        recordTiming({
          route: '/api/old',
          method: 'GET',
          statusCode: 200,
          durationMs: i,
          timestamp: Date.now(),
        });
      }

      // 1001번째: 인덱스 0 덮어쓰기
      recordTiming({
        route: '/api/new',
        method: 'POST',
        statusCode: 201,
        durationMs: 999,
        timestamp: Date.now(),
      });

      const timings = getTimings();
      // 첫 번째 항목이 새 항목으로 교체됨
      expect(timings[0].route).toBe('/api/new');
      expect(timings[0].method).toBe('POST');
    });
  });

  describe('clearTimings', () => {
    it('should clear all entries', () => {
      recordTiming({
        route: '/api/test',
        method: 'GET',
        statusCode: 200,
        durationMs: 100,
        timestamp: Date.now(),
      });

      expect(getTimings()).toHaveLength(1);
      clearTimings();
      expect(getTimings()).toHaveLength(0);
    });
  });

  describe('getTimingStats', () => {
    it('should return empty array when no entries', () => {
      expect(getTimingStats()).toEqual([]);
    });

    it('should group by route', () => {
      recordTiming({
        route: '/api/a',
        method: 'GET',
        statusCode: 200,
        durationMs: 100,
        timestamp: Date.now(),
      });
      recordTiming({
        route: '/api/b',
        method: 'GET',
        statusCode: 200,
        durationMs: 200,
        timestamp: Date.now(),
      });
      recordTiming({
        route: '/api/a',
        method: 'GET',
        statusCode: 200,
        durationMs: 150,
        timestamp: Date.now(),
      });

      const stats = getTimingStats();
      expect(stats).toHaveLength(2);

      const routeA = stats.find((s) => s.route === '/api/a');
      expect(routeA?.count).toBe(2);

      const routeB = stats.find((s) => s.route === '/api/b');
      expect(routeB?.count).toBe(1);
    });

    it('should calculate percentiles correctly', () => {
      // 10개 항목: 100~1000ms
      for (let i = 1; i <= 10; i++) {
        recordTiming({
          route: '/api/test',
          method: 'GET',
          statusCode: 200,
          durationMs: i * 100,
          timestamp: Date.now(),
        });
      }

      const stats = getTimingStats();
      expect(stats).toHaveLength(1);

      const stat = stats[0];
      expect(stat.route).toBe('/api/test');
      expect(stat.count).toBe(10);
      expect(stat.p50).toBe(500); // 50th percentile
      expect(stat.p95).toBeGreaterThanOrEqual(900);
      expect(stat.p99).toBeGreaterThanOrEqual(900);
      expect(stat.avgMs).toBe(550); // (100+200+...+1000) / 10 = 550
    });

    it('should calculate error rate', () => {
      // 4 성공, 1 에러
      for (let i = 0; i < 4; i++) {
        recordTiming({
          route: '/api/test',
          method: 'GET',
          statusCode: 200,
          durationMs: 100,
          timestamp: Date.now(),
        });
      }
      recordTiming({
        route: '/api/test',
        method: 'GET',
        statusCode: 500,
        durationMs: 100,
        timestamp: Date.now(),
      });

      const stats = getTimingStats();
      expect(stats[0].errorRate).toBe(0.2); // 1/5
    });

    it('should count 4xx as errors', () => {
      recordTiming({
        route: '/api/test',
        method: 'GET',
        statusCode: 400,
        durationMs: 50,
        timestamp: Date.now(),
      });
      recordTiming({
        route: '/api/test',
        method: 'GET',
        statusCode: 200,
        durationMs: 50,
        timestamp: Date.now(),
      });

      const stats = getTimingStats();
      expect(stats[0].errorRate).toBe(0.5);
    });

    it('should sort by p95 descending', () => {
      recordTiming({
        route: '/api/fast',
        method: 'GET',
        statusCode: 200,
        durationMs: 50,
        timestamp: Date.now(),
      });
      recordTiming({
        route: '/api/slow',
        method: 'GET',
        statusCode: 200,
        durationMs: 3000,
        timestamp: Date.now(),
      });
      recordTiming({
        route: '/api/mid',
        method: 'GET',
        statusCode: 200,
        durationMs: 500,
        timestamp: Date.now(),
      });

      const stats = getTimingStats();
      expect(stats[0].route).toBe('/api/slow');
      expect(stats[1].route).toBe('/api/mid');
      expect(stats[2].route).toBe('/api/fast');
    });

    it('should handle single entry per route', () => {
      recordTiming({
        route: '/api/single',
        method: 'POST',
        statusCode: 201,
        durationMs: 250,
        timestamp: Date.now(),
      });

      const stats = getTimingStats();
      expect(stats[0].p50).toBe(250);
      expect(stats[0].p95).toBe(250);
      expect(stats[0].p99).toBe(250);
      expect(stats[0].avgMs).toBe(250);
      expect(stats[0].errorRate).toBe(0);
    });
  });
});
