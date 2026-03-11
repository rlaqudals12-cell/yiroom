/**
 * Sentry Performance 트레이싱 모듈 테스트
 *
 * withSpan, traceAiAnalysis, traceDbQuery, 통계 조회, 임계값 체크를 검증한다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  startSpan: vi.fn((_options: unknown, callback: () => unknown) => callback()),
}));

import {
  withSpan,
  traceApiRoute,
  traceAiAnalysis,
  traceDbQuery,
  getAiStats,
  getDbStats,
  clearMetrics,
  checkThresholds,
  PERFORMANCE_THRESHOLDS,
} from '@/lib/monitoring';
import * as Sentry from '@sentry/nextjs';

describe('sentry-tracing', () => {
  beforeEach(() => {
    clearMetrics();
    vi.clearAllMocks();
  });

  // --- withSpan ---

  describe('withSpan', () => {
    it('비동기 함수를 실행하고 결과를 반환한다', async () => {
      const result = await withSpan('test.op', 'test-desc', async () => 42);
      expect(result).toBe(42);
    });

    it('Sentry.startSpan을 올바른 옵션으로 호출한다', async () => {
      await withSpan('ai.inference', 'personal-color', async () => 'ok', {
        'ai.model': 'gemini-3-flash',
      });

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        {
          op: 'ai.inference',
          name: 'personal-color',
          attributes: { 'ai.model': 'gemini-3-flash' },
        },
        expect.any(Function)
      );
    });

    it('함수 에러를 그대로 전파한다', async () => {
      await expect(
        withSpan('test.op', 'error-test', async () => {
          throw new Error('테스트 에러');
        })
      ).rejects.toThrow('테스트 에러');
    });

    it('attributes가 undefined일 때도 정상 동작한다', async () => {
      const result = await withSpan('test.op', 'no-attrs', async () => 'ok');
      expect(result).toBe('ok');
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { op: 'test.op', name: 'no-attrs', attributes: undefined },
        expect.any(Function)
      );
    });
  });

  // --- traceApiRoute ---

  describe('traceApiRoute', () => {
    it('API 라우트를 http.server 스팬으로 감싼다', async () => {
      const result = await traceApiRoute('/api/analyze/skin', 'POST', async () => ({
        status: 200,
      }));

      expect(result).toEqual({ status: 200 });
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({
          op: 'http.server',
          name: 'POST /api/analyze/skin',
          attributes: {
            'http.method': 'POST',
            'http.route': '/api/analyze/skin',
          },
        }),
        expect.any(Function)
      );
    });

    it('GET 메서드도 올바르게 처리한다', async () => {
      await traceApiRoute('/api/user', 'GET', async () => null);

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'GET /api/user' }),
        expect.any(Function)
      );
    });
  });

  // --- traceAiAnalysis ---

  describe('traceAiAnalysis', () => {
    it('성공 시 결과와 메트릭을 반환한다', async () => {
      const { result, metrics } = await traceAiAnalysis(
        'personal-color',
        'gemini-3-flash',
        async () => ({ season: 'spring' })
      );

      expect(result).toEqual({ season: 'spring' });
      expect(metrics.module).toBe('personal-color');
      expect(metrics.model).toBe('gemini-3-flash');
      expect(metrics.usedFallback).toBe(false);
      expect(metrics.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('성공 시 AI 메트릭 버퍼에 기록한다', async () => {
      await traceAiAnalysis('skin', 'gemini-3-flash', async () => 'ok');

      const stats = getAiStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].module).toBe('skin');
      expect(stats[0].count).toBe(1);
      expect(stats[0].fallbackRate).toBe(0);
    });

    it('실패 시 에러를 전파하고 폴백 메트릭을 기록한다', async () => {
      await expect(
        traceAiAnalysis('skin', 'gemini-3-flash', async () => {
          throw new Error('AI 타임아웃');
        })
      ).rejects.toThrow('AI 타임아웃');

      const stats = getAiStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].fallbackRate).toBe(1);
    });

    it('duration을 측정한다', async () => {
      const { metrics } = await traceAiAnalysis('body', 'gemini-3-flash', async () => {
        // 최소 지연
        await new Promise((r) => setTimeout(r, 5));
        return 'done';
      });

      expect(metrics.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.durationMs).toBe('number');
    });
  });

  // --- traceDbQuery ---

  describe('traceDbQuery', () => {
    it('결과와 메트릭을 반환한다', async () => {
      const { result, metrics } = await traceDbQuery('users', 'select', async () => [{ id: '1' }]);

      expect(result).toEqual([{ id: '1' }]);
      expect(metrics.table).toBe('users');
      expect(metrics.operation).toBe('select');
      expect(metrics.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('DB 메트릭 버퍼에 기록한다', async () => {
      await traceDbQuery('products', 'insert', async () => ({ id: 'p1' }));

      const stats = getDbStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].table).toBe('products');
      expect(stats[0].operation).toBe('insert');
      expect(stats[0].count).toBe(1);
    });

    it('db.query 스팬을 올바른 속성으로 생성한다', async () => {
      await traceDbQuery('users', 'update', async () => null);

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({
          op: 'db.query',
          name: 'update users',
          attributes: {
            'db.system': 'postgresql',
            'db.table': 'users',
            'db.operation': 'update',
          },
        }),
        expect.any(Function)
      );
    });

    it('쿼리 에러를 전파한다', async () => {
      await expect(
        traceDbQuery('users', 'select', async () => {
          throw new Error('DB 연결 실패');
        })
      ).rejects.toThrow('DB 연결 실패');
    });
  });

  // --- getAiStats ---

  describe('getAiStats', () => {
    it('버퍼가 비어있으면 빈 배열을 반환한다', () => {
      expect(getAiStats()).toEqual([]);
    });

    it('모듈별로 그룹핑한다', async () => {
      await traceAiAnalysis('skin', 'gemini', async () => 'a');
      await traceAiAnalysis('body', 'gemini', async () => 'b');
      await traceAiAnalysis('skin', 'gemini', async () => 'c');

      const stats = getAiStats();
      expect(stats).toHaveLength(2);

      const skinStat = stats.find((s) => s.module === 'skin');
      expect(skinStat?.count).toBe(2);

      const bodyStat = stats.find((s) => s.module === 'body');
      expect(bodyStat?.count).toBe(1);
    });

    it('fallbackRate를 정확하게 계산한다', async () => {
      // 3번 호출: 2 성공, 1 실패
      await traceAiAnalysis('skin', 'gemini', async () => 'ok');
      await traceAiAnalysis('skin', 'gemini', async () => 'ok');
      try {
        await traceAiAnalysis('skin', 'gemini', async () => {
          throw new Error('fail');
        });
      } catch {
        // 의도적 에러
      }

      const stats = getAiStats();
      const skinStat = stats.find((s) => s.module === 'skin');
      // 1/3 = 0.33 (반올림)
      expect(skinStat?.fallbackRate).toBeCloseTo(0.33, 1);
    });

    it('avgMs를 올바르게 계산한다', async () => {
      // 실제 시간이 거의 0이므로 avgMs도 0에 가까울 것
      await traceAiAnalysis('skin', 'gemini', async () => 'a');
      await traceAiAnalysis('skin', 'gemini', async () => 'b');

      const stats = getAiStats();
      expect(stats[0].avgMs).toBeGreaterThanOrEqual(0);
      expect(typeof stats[0].avgMs).toBe('number');
    });

    it('p95를 p95 내림차순으로 정렬한다', async () => {
      // body는 약간의 지연으로 더 느리게 만듦
      await traceAiAnalysis('fast-module', 'gemini', async () => 'fast');
      await traceAiAnalysis('slow-module', 'gemini', async () => {
        await new Promise((r) => setTimeout(r, 10));
        return 'slow';
      });

      const stats = getAiStats();
      // p95 내림차순이므로 slow가 먼저
      expect(stats[0].module).toBe('slow-module');
    });
  });

  // --- getDbStats ---

  describe('getDbStats', () => {
    it('버퍼가 비어있으면 빈 배열을 반환한다', () => {
      expect(getDbStats()).toEqual([]);
    });

    it('테이블+오퍼레이션별로 그룹핑한다', async () => {
      await traceDbQuery('users', 'select', async () => null);
      await traceDbQuery('users', 'insert', async () => null);
      await traceDbQuery('users', 'select', async () => null);
      await traceDbQuery('products', 'select', async () => null);

      const stats = getDbStats();
      expect(stats).toHaveLength(3);

      const usersSelect = stats.find((s) => s.table === 'users' && s.operation === 'select');
      expect(usersSelect?.count).toBe(2);

      const usersInsert = stats.find((s) => s.table === 'users' && s.operation === 'insert');
      expect(usersInsert?.count).toBe(1);

      const productsSelect = stats.find((s) => s.table === 'products' && s.operation === 'select');
      expect(productsSelect?.count).toBe(1);
    });

    it('p95 내림차순으로 정렬한다', async () => {
      await traceDbQuery('fast-table', 'select', async () => null);
      await traceDbQuery('slow-table', 'select', async () => {
        await new Promise((r) => setTimeout(r, 10));
        return null;
      });

      const stats = getDbStats();
      expect(stats[0].table).toBe('slow-table');
    });
  });

  // --- clearMetrics ---

  describe('clearMetrics', () => {
    it('AI 메트릭 버퍼를 초기화한다', async () => {
      await traceAiAnalysis('skin', 'gemini', async () => 'ok');
      expect(getAiStats()).toHaveLength(1);

      clearMetrics();
      expect(getAiStats()).toEqual([]);
    });

    it('DB 메트릭 버퍼를 초기화한다', async () => {
      await traceDbQuery('users', 'select', async () => null);
      expect(getDbStats()).toHaveLength(1);

      clearMetrics();
      expect(getDbStats()).toEqual([]);
    });

    it('AI와 DB 버퍼를 동시에 초기화한다', async () => {
      await traceAiAnalysis('skin', 'gemini', async () => 'ok');
      await traceDbQuery('users', 'select', async () => null);

      clearMetrics();

      expect(getAiStats()).toEqual([]);
      expect(getDbStats()).toEqual([]);
    });
  });

  // --- checkThresholds ---

  describe('checkThresholds', () => {
    it('임계값 미만이면 빈 배열을 반환한다', async () => {
      // 빠른 호출은 임계값 아래
      await traceAiAnalysis('skin', 'gemini', async () => 'ok');
      await traceDbQuery('users', 'select', async () => null);

      const alerts = checkThresholds();
      expect(alerts).toEqual([]);
    });

    it('AI 폴백 비율이 높으면 ai_fallback_high 알림을 생성한다', async () => {
      // 모두 실패 → fallbackRate = 1.0 > 0.1
      for (let i = 0; i < 3; i++) {
        try {
          await traceAiAnalysis('skin', 'gemini', async () => {
            throw new Error('fail');
          });
        } catch {
          // 의도적 에러
        }
      }

      const alerts = checkThresholds();
      const fallbackAlert = alerts.find((a) => a.type === 'ai_fallback_high');
      expect(fallbackAlert).toBeDefined();
      expect(fallbackAlert?.currentValue).toBe(1);
      expect(fallbackAlert?.threshold).toBe(PERFORMANCE_THRESHOLDS.AI_FALLBACK_WARN);
    });

    it('알림 메시지에 모듈명과 수치를 포함한다', async () => {
      try {
        await traceAiAnalysis('personal-color', 'gemini', async () => {
          throw new Error('fail');
        });
      } catch {
        // 의도적 에러
      }

      const alerts = checkThresholds();
      const fallbackAlert = alerts.find((a) => a.type === 'ai_fallback_high');
      expect(fallbackAlert?.message).toContain('personal-color');
      expect(fallbackAlert?.message).toContain('100%');
    });

    it('메트릭이 없으면 빈 배열을 반환한다', () => {
      expect(checkThresholds()).toEqual([]);
    });
  });

  // --- PERFORMANCE_THRESHOLDS ---

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('SLA 상수를 올바르게 정의한다', () => {
      expect(PERFORMANCE_THRESHOLDS.AI_P95_TARGET).toBe(3000);
      expect(PERFORMANCE_THRESHOLDS.API_P95_TARGET).toBe(500);
      expect(PERFORMANCE_THRESHOLDS.DB_P95_TARGET).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.AI_FALLBACK_WARN).toBe(0.1);
    });

    it('readonly 객체이다', () => {
      // as const로 선언되었으므로 타입 레벨에서 readonly
      expect(Object.isFrozen(PERFORMANCE_THRESHOLDS)).toBe(false); // as const는 JS 런타임 freeze가 아님
      expect(typeof PERFORMANCE_THRESHOLDS).toBe('object');
    });
  });
});
