'use client';

/**
 * 이탈한 통합 분석 요청의 세션 조회 훅 (상관 ID 기반)
 *
 * @module hooks/usePendingIntegratedSession
 * @description
 *   제출 시 클라이언트가 만든 요청 ID(`clientRequestId`)로 **그 요청의 세션만** 찾는다.
 *
 *   왜 시각 비교가 아니라 ID인가: 예전 복구 배너는 "최신 세션의 created_at이 제출
 *   시각 −2분 이후인가"로 판정했다. 제출 직전(2분 이내)에 만든 다른 세션이 있으면
 *   그 세션을 이번 분석으로 오인해 엉뚱한 결과로 보냈다. ID는 오인이 불가능하다.
 *
 *   status 필터를 걸지 않는 이유: finalize가 실패한 세션(pending)도 축 결과는 저장돼
 *   있으므로 "저장 여부"를 정직하게 구분해 알려야 한다 (호출부가 status로 분기).
 *
 * @see lib/analysis/integrated/types.ts CLIENT_REQUEST_ID_KEY
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { CLIENT_REQUEST_ID_KEY, type IntegratedSessionRow } from '@/lib/analysis/integrated';

export interface UsePendingIntegratedSessionResult {
  session: IntegratedSessionRow | null;
  isLoading: boolean;
  error: Error | null;
  recoveryState:
    | 'checking'
    | 'not_found'
    | 'error'
    | 'pending'
    | 'completed'
    | 'failed'
    | 'stalled';
  /** 자동 확인이 끝났거나 사용자가 즉시 확인하고 싶을 때 새 bounded 조회 창을 시작한다. */
  refetch: () => void;
}

/** Vercel 함수 상한(60초)보다 길게 기다리되 무한 폴링하지 않는다. */
export const PENDING_POLL_MAX_MS = 90_000;
const POLL_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 15_000] as const;

export function usePendingIntegratedSession(
  clientRequestId: string | null
): UsePendingIntegratedSessionResult {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [session, setSession] = useState<IntegratedSessionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recoveryState, setRecoveryState] =
    useState<UsePendingIntegratedSessionResult['recoveryState']>('checking');
  const [retryToken, setRetryToken] = useState(0);

  const refetch = useCallback(() => setRetryToken((value) => value + 1), []);

  useEffect(() => {
    if (!isLoaded) return;
    // 상관 ID가 없으면 조회하지 않는다 — 추측으로 아무 세션이나 붙이지 않는다
    if (!isSignedIn || !clientRequestId) {
      setSession(null);
      setIsLoading(false);
      setError(null);
      setRecoveryState('not_found');
      return;
    }

    let cancelled = false;
    let waitTimer: ReturnType<typeof setTimeout> | null = null;
    let queryTimer: ReturnType<typeof setTimeout> | null = null;
    let releaseTimer: (() => void) | null = null;
    let releaseQuery: (() => void) | null = null;
    let activeController: AbortController | null = null;
    let deadlineReached = false;
    const deadlineAt = performance.now() + PENDING_POLL_MAX_MS;

    setIsLoading(true);
    setError(null);
    setRecoveryState('checking');

    // polling의 어느 단계(DB 조회·대기)에 있든 실제 벽시계 상한에서 종료한다.
    const hardDeadlineTimer = setTimeout(() => {
      if (cancelled) return;
      deadlineReached = true;
      setRecoveryState('stalled');
      setIsLoading(false);
      releaseTimer?.();
      releaseQuery?.();
      activeController?.abort();
    }, PENDING_POLL_MAX_MS);

    const wait = (delayMs: number): Promise<void> =>
      new Promise((resolve) => {
        releaseTimer = resolve;
        waitTimer = setTimeout(() => {
          waitTimer = null;
          releaseTimer = null;
          resolve();
        }, delayMs);
      });

    const queryOnce = async () => {
      const remainingMs = Math.max(0, deadlineAt - performance.now());
      if (remainingMs === 0) return { kind: 'deadline' as const };

      const controller = new AbortController();
      activeController = controller;
      const query = supabase
        .from('integrated_analysis_sessions')
        // 상관 ID는 questionnaire JSONB의 예약 키에 저장된다 (전용 컬럼 없음)
        .select('*')
        .eq(`questionnaire->>${CLIENT_REQUEST_ID_KEY}`, clientRequestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .abortSignal(controller.signal)
        .maybeSingle();

      const outcome = await Promise.race([
        query.then(
          (value) => ({ kind: 'result' as const, value }),
          (caught: unknown) => ({ kind: 'error' as const, caught })
        ),
        new Promise<{ kind: 'deadline' }>((resolve) => {
          const reachDeadline = (): void => {
            // race를 먼저 확정해야 abort rejection을 DB 오류로 오인하지 않는다.
            resolve({ kind: 'deadline' });
            controller.abort();
          };
          releaseQuery = reachDeadline;
          queryTimer = setTimeout(reachDeadline, remainingMs);
        }),
      ]);

      if (queryTimer) clearTimeout(queryTimer);
      queryTimer = null;
      releaseQuery = null;
      if (activeController === controller) activeController = null;
      return outcome;
    };

    (async () => {
      let attempt = 0;
      while (!cancelled) {
        if (deadlineReached || performance.now() >= deadlineAt) {
          setRecoveryState('stalled');
          setIsLoading(false);
          return;
        }

        try {
          const outcome = await queryOnce();

          if (cancelled) return;
          if (deadlineReached) return;
          if (outcome.kind === 'deadline') {
            setRecoveryState('stalled');
            setIsLoading(false);
            return;
          }
          if (outcome.kind === 'error') throw outcome.caught;

          const { data, error: dbError } = outcome.value;

          if (dbError) {
            setError(new Error(dbError.message));
            setSession(null);
            setRecoveryState('error');
          } else {
            const nextSession = (data as IntegratedSessionRow | null) ?? null;
            setSession(nextSession);
            setError(null);
            if (!nextSession) {
              setRecoveryState('not_found');
            } else if (nextSession.status === 'pending') {
              setRecoveryState('pending');
            } else if (nextSession.status === 'completed' || nextSession.status === 'partial') {
              setRecoveryState('completed');
              setIsLoading(false);
              return;
            } else {
              setRecoveryState('failed');
              setIsLoading(false);
              return;
            }
          }
        } catch (caught) {
          if (cancelled) return;
          setError(caught instanceof Error ? caught : new Error(String(caught)));
          setSession(null);
          setRecoveryState('error');
        }

        setIsLoading(false);
        const remaining = Math.max(0, deadlineAt - performance.now());
        if (remaining <= 0) {
          setRecoveryState('stalled');
          return;
        }
        const configuredDelay = POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)];
        attempt += 1;
        const actualDelay = Math.min(configuredDelay, remaining);
        await wait(actualDelay);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(hardDeadlineTimer);
      if (waitTimer) clearTimeout(waitTimer);
      if (queryTimer) clearTimeout(queryTimer);
      releaseTimer?.();
      releaseQuery?.();
      activeController?.abort();
    };
  }, [isLoaded, isSignedIn, supabase, clientRequestId, retryToken]);

  return { session, isLoading, error, recoveryState, refetch };
}
