import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUpstashRedisClient } from '@/lib/security/rate-limit';
import {
  reserveCoachTurn,
  settleCoachTurn,
  getCoachQuotaPeriods,
} from '@/lib/security/coach-turn-quota';

vi.mock('@/lib/security/rate-limit', () => ({ getUpstashRedisClient: vi.fn() }));
const NOW = new Date('2026-09-08T04:00:00Z');
beforeEach(() => {
  vi.mocked(getUpstashRedisClient).mockReturnValue(null);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('코치 웹/모바일 공통 예약', () => {
  it('동시 웹/모바일 21턴 중 20턴만 허용한다', async () => {
    const results = await Promise.all(
      Array.from({ length: 21 }, (_, i) =>
        reserveCoachTurn('concurrent-user', {
          now: NOW,
          requestId: `${i % 2 ? 'web' : 'mobile'}-${i}`,
        })
      )
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(20);
    expect(results[20]).toMatchObject({ allowed: false, reason: 'daily_limit', dailyRemaining: 0 });
    expect((await reserveCoachTurn('different-user', { now: NOW })).allowed).toBe(true);
  });

  it('KST 일 경계에서는 일 한도만, 월 경계에서는 두 한도를 초기화한다', async () => {
    const beforeMidnight = new Date('2026-09-30T14:59:59Z');
    const afterMidnight = new Date('2026-09-30T15:00:00Z');
    const first = await reserveCoachTurn('boundary-user', { now: beforeMidnight });
    const next = await reserveCoachTurn('boundary-user', { now: afterMidnight });
    expect(first).toMatchObject({ dailyRemaining: 19, monthlyRemaining: 99 });
    expect(next).toMatchObject({ dailyRemaining: 19, monthlyRemaining: 99 });
    expect(
      await reserveCoachTurn('boundary-user', { now: new Date('2026-10-01T15:00:00Z') })
    ).toMatchObject({ dailyRemaining: 19, monthlyRemaining: 98 });
  });

  it('날짜가 달라도 월 100턴을 넘기지 않는다', async () => {
    for (let day = 1; day <= 5; day++) {
      const now = new Date(`2026-11-0${day}T00:00:00Z`);
      const results = await Promise.all(
        Array.from({ length: 20 }, () => reserveCoachTurn('monthly-user', { now }))
      );
      expect(results.every((result) => result.allowed)).toBe(true);
    }
    expect(
      await reserveCoachTurn('monthly-user', { now: new Date('2026-11-06T00:00:00Z') })
    ).toMatchObject({ allowed: false, reason: 'monthly_limit', monthlyRemaining: 0 });
    expect(
      await reserveCoachTurn('monthly-user', { now: new Date('2026-12-01T00:00:00Z') })
    ).toMatchObject({ allowed: true, monthlyRemaining: 99 });
  });

  it('미호출 예약만 한 번 환급하며 모델 호출 후 abort/오류는 소진 유지한다', async () => {
    const unused = await reserveCoachTurn('settle-user', { now: NOW });
    await settleCoachTurn(unused, { modelCalled: false });
    await settleCoachTurn(unused, { modelCalled: false });
    const started = await reserveCoachTurn('settle-user', { now: NOW });
    expect(started.dailyRemaining).toBe(19);
    await settleCoachTurn(started, { modelCalled: true });
    await settleCoachTurn(started, { modelCalled: false });
    expect((await reserveCoachTurn('settle-user', { now: NOW })).dailyRemaining).toBe(18);
  });

  it('이전 월의 늦은 미호출 정산은 새 월 카운터를 환급하지 않는다', async () => {
    const old = await reserveCoachTurn('late-user', { now: new Date('2026-09-30T14:59:59Z') });
    await reserveCoachTurn('late-user', { now: new Date('2026-09-30T15:00:00Z') });
    await settleCoachTurn(old, { modelCalled: false });
    expect(
      await reserveCoachTurn('late-user', { now: new Date('2026-09-30T15:00:01Z') })
    ).toMatchObject({ dailyRemaining: 18, monthlyRemaining: 98 });
  });

  it('같은 요청 ID를 중복 생성하지 않는다', async () => {
    await reserveCoachTurn('duplicate-user', { now: NOW, requestId: 'same' });
    expect(await reserveCoachTurn('duplicate-user', { now: NOW, requestId: 'same' })).toMatchObject(
      { allowed: false, reason: 'duplicate_request', dailyRemaining: 19 }
    );
  });

  it('KST 달력과 윤년 월말을 UTC 서버 시각에서 계산한다', () => {
    expect(getCoachQuotaPeriods(new Date('2028-02-29T15:00:00Z'))).toEqual({
      day: '2028-03-01',
      month: '2028-03',
      dayReset: new Date('2028-03-01T15:00:00Z').getTime(),
      monthReset: new Date('2028-03-31T15:00:00Z').getTime(),
    });
  });
});

describe('분산 저장소 계약', () => {
  it('운영 Redis 미설정/오류/잘못된 응답에서는 메모리로 우회하지 않는다', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(await reserveCoachTurn('production-user')).toMatchObject({
      allowed: false,
      reason: 'quota_unavailable',
    });
    const evalMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.mocked(getUpstashRedisClient).mockReturnValue({ eval: evalMock });
    expect((await reserveCoachTurn('production-user')).allowed).toBe(false);
    evalMock.mockResolvedValue(null);
    expect((await reserveCoachTurn('production-user')).allowed).toBe(false);
  });

  it('한 번의 EVAL에 일/월/영수증을 넣고 usage와 모델버전을 정산한다', async () => {
    const evalMock = vi.fn().mockResolvedValueOnce([1, 'reserved', 1, 1]).mockResolvedValue(1);
    vi.mocked(getUpstashRedisClient).mockReturnValue({ eval: evalMock });
    const result = await reserveCoachTurn('redis-user', { now: NOW, requestId: 'server-request' });
    expect(result).toMatchObject({ allowed: true, backend: 'redis' });
    expect(evalMock).toHaveBeenCalledTimes(1);
    const [script, keys, args] = evalMock.mock.calls[0];
    expect(script).toContain("redis.call('INCR', KEYS[1])");
    expect(keys).toHaveLength(3);
    expect(keys[0]).not.toContain('redis-user');
    expect(keys[0].match(/\{[^}]+\}/)[0]).toBe(keys[1].match(/\{[^}]+\}/)[0]);
    expect(args.slice(0, 2)).toEqual([20, 100]);
    await settleCoachTurn(result, {
      modelCalled: true,
      usage: { totalTokenCount: 80, cachedContentTokenCount: 10 },
      modelVersion: 'gemini-3.5-flash',
    });
    expect(evalMock.mock.calls[1][1]).toEqual(keys);
    expect(evalMock.mock.calls[1][2]).toEqual([
      '1',
      '{"totalTokenCount":80,"cachedContentTokenCount":10}',
      'gemini-3.5-flash',
    ]);
  });

  it('예약 중 abort되면 모델 시작 없이 정산하고 후속 호출을 허용하지 않는다', async () => {
    const abort = new AbortController();
    const evalMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        abort.abort();
        return [1, 'reserved', 1, 1];
      })
      .mockResolvedValue(1);
    vi.mocked(getUpstashRedisClient).mockReturnValue({ eval: evalMock });
    expect((await reserveCoachTurn('abort-user', { signal: abort.signal })).allowed).toBe(false);
    expect(evalMock.mock.calls[1][2][0]).toBe('0');
  });

  it('응답 없는 Redis는 1초에 차단하고 타이머를 정리한다', async () => {
    vi.useFakeTimers();
    vi.mocked(getUpstashRedisClient).mockReturnValue({
      eval: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const pending = reserveCoachTurn('timeout-user');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(await pending).toMatchObject({ allowed: false, reason: 'quota_unavailable' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
