/** 통합 분석 이탈 복구의 상태 구분·bounded polling 회귀 테스트. */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type DbResult = { data: unknown; error: { message: string } | null };

const scenario = vi.hoisted(() => ({
  queue: [] as DbResult[],
  fallback: { data: null, error: null } as DbResult,
  queryCount: 0,
  hang: false,
  signals: [] as AbortSignal[],
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: (() => {
    const client = {
      from: () => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: () => chain,
          limit: () => chain,
          abortSignal: (signal: AbortSignal) => {
            scenario.signals.push(signal);
            return chain;
          },
          maybeSingle: async () => {
            scenario.queryCount += 1;
            if (scenario.hang) return new Promise<DbResult>(() => {});
            return scenario.queue.shift() ?? scenario.fallback;
          },
        };
        return chain;
      },
    };
    return () => client;
  })(),
}));

import {
  PENDING_POLL_MAX_MS,
  usePendingIntegratedSession,
} from '@/hooks/usePendingIntegratedSession';

const REQUEST_ID = '11111111-2222-4333-8444-555555555555';
const pendingSession = { id: 'session-1', status: 'pending' };
const completedSession = { id: 'session-1', status: 'completed' };

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('usePendingIntegratedSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    scenario.queue = [];
    scenario.fallback = { data: null, error: null };
    scenario.queryCount = 0;
    scenario.hang = false;
    scenario.signals = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('not-found → pending → completed를 구분하며 완료까지 bounded polling한다', async () => {
    scenario.queue = [
      { data: null, error: null },
      { data: pendingSession, error: null },
      { data: completedSession, error: null },
    ];
    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));

    await flush();
    expect(result.current.recoveryState).toBe('not_found');

    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(result.current.recoveryState).toBe('pending');

    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(result.current.recoveryState).toBe('completed');
    expect(result.current.session?.id).toBe('session-1');
  });

  it('DB 오류를 not-found로 위장하지 않고 error 상태로 노출한다', async () => {
    scenario.queue = [{ data: null, error: { message: 'db unavailable' } }];
    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));

    await flush();

    expect(result.current.recoveryState).toBe('error');
    expect(result.current.error?.message).toContain('db unavailable');
  });

  it('서버 60초 상한보다 길게 확인하되 유한 횟수 뒤 stalled로 멈춘다', async () => {
    scenario.fallback = { data: pendingSession, error: null };
    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));
    await flush();

    await act(async () => vi.advanceTimersByTimeAsync(61_000));
    expect(result.current.recoveryState).toBe('pending');

    await act(async () => vi.advanceTimersByTimeAsync(PENDING_POLL_MAX_MS));
    expect(result.current.recoveryState).toBe('stalled');
    expect(scenario.queryCount).toBeLessThanOrEqual(10);
  });

  it('DB 조회가 영구 대기해도 벽시계 상한에서 중단하고 stalled로 전환한다', async () => {
    scenario.hang = true;
    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));
    await flush();

    await act(async () => vi.advanceTimersByTimeAsync(PENDING_POLL_MAX_MS + 1));

    expect(result.current.recoveryState).toBe('stalled');
    expect(scenario.signals.at(-1)?.aborted).toBe(true);
  });

  it('자동 확인이 멈춘 뒤 수동 재확인으로 새 조회 창을 시작한다', async () => {
    scenario.fallback = { data: pendingSession, error: null };
    const { result } = renderHook(() => usePendingIntegratedSession(REQUEST_ID));
    await flush();
    await act(async () => vi.advanceTimersByTimeAsync(PENDING_POLL_MAX_MS + 1));
    expect(result.current.recoveryState).toBe('stalled');

    scenario.queue = [{ data: completedSession, error: null }];
    act(() => result.current.refetch());
    await flush();

    expect(result.current.recoveryState).toBe('completed');
  });
});
