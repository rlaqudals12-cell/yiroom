/** clientRequestId로 이탈한 통합분석 세션만 찾아 제한적으로 폴링한다. */
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import { useClerkSupabaseClient } from '@/lib/supabase';

export type PendingIntegratedRecoveryState =
  | 'checking'
  | 'not_found'
  | 'error'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'stalled';

export interface PendingIntegratedSession {
  id: string;
  status: 'pending' | 'partial' | 'completed' | 'failed';
}

export interface UsePendingIntegratedSessionResult {
  session: PendingIntegratedSession | null;
  isLoading: boolean;
  error: Error | null;
  recoveryState: PendingIntegratedRecoveryState;
  refetch: () => void;
}

/** 웹 함수 상한(60초)보다 길게 기다리되 무한 폴링하지 않는다. */
export const PENDING_POLL_MAX_MS = 90_000;
const POLL_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 15_000] as const;
const CLIENT_REQUEST_ID_QUERY_KEY = 'questionnaire->>_clientRequestId';

function isSession(value: unknown): value is PendingIntegratedSession {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    (record.status === 'pending' ||
      record.status === 'partial' ||
      record.status === 'completed' ||
      record.status === 'failed')
  );
}

/**
 * 웹 usePendingIntegratedSession과 같은 상관-ID 조회 계약의 모바일 포팅.
 * 90초 벽시계 상한 안에서 지수형 대기로 확인하고, 상한 뒤 사용자가 다시 확인할 수 있게 한다.
 */
export function usePendingIntegratedSession(
  clientRequestId: string | null
): UsePendingIntegratedSessionResult {
  const { isLoaded, isSignedIn } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [session, setSession] = useState<PendingIntegratedSession | null>(null);
  const [isLoading, setIsLoading] = useState(clientRequestId !== null);
  const [error, setError] = useState<Error | null>(null);
  const [recoveryState, setRecoveryState] = useState<PendingIntegratedRecoveryState>('checking');
  const [retryToken, setRetryToken] = useState(0);

  const refetch = useCallback(() => setRetryToken((value) => value + 1), []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !clientRequestId) {
      setSession(null);
      setError(null);
      setIsLoading(false);
      setRecoveryState('not_found');
      return;
    }

    let cancelled = false;
    let waitTimer: ReturnType<typeof setTimeout> | null = null;
    let queryTimer: ReturnType<typeof setTimeout> | null = null;
    let releaseWait: (() => void) | null = null;
    let releaseQuery: (() => void) | null = null;
    let activeController: AbortController | null = null;
    let deadlineReached = false;
    const deadlineAt = performance.now() + PENDING_POLL_MAX_MS;

    setIsLoading(true);
    setError(null);
    setRecoveryState('checking');

    const hardDeadlineTimer = setTimeout(() => {
      if (cancelled) return;
      deadlineReached = true;
      setRecoveryState('stalled');
      setIsLoading(false);
      releaseWait?.();
      releaseQuery?.();
      activeController?.abort();
    }, PENDING_POLL_MAX_MS);

    const wait = (delayMs: number): Promise<void> =>
      new Promise((resolve) => {
        releaseWait = resolve;
        waitTimer = setTimeout(() => {
          waitTimer = null;
          releaseWait = null;
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
        .select('id,status')
        .eq(CLIENT_REQUEST_ID_QUERY_KEY, clientRequestId)
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
          if (cancelled || deadlineReached) return;
          if (outcome.kind === 'deadline') {
            setRecoveryState('stalled');
            setIsLoading(false);
            return;
          }
          if (outcome.kind === 'error') throw outcome.caught;

          const { data, error: queryError } = outcome.value;
          if (queryError) throw new Error(queryError.message);

          const nextSession = isSession(data) ? data : null;
          setSession(nextSession);
          setError(null);
          if (nextSession?.status === 'completed' || nextSession?.status === 'partial') {
            setRecoveryState('completed');
            setIsLoading(false);
            return;
          }
          if (nextSession?.status === 'failed') {
            setRecoveryState('failed');
            setIsLoading(false);
            return;
          }
          setRecoveryState(nextSession?.status === 'pending' ? 'pending' : 'not_found');
        } catch (caught) {
          if (cancelled) return;
          setSession(null);
          setError(caught instanceof Error ? caught : new Error(String(caught)));
          setRecoveryState('error');
        }

        setIsLoading(false);
        const remainingMs = Math.max(0, deadlineAt - performance.now());
        if (remainingMs <= 0) {
          setRecoveryState('stalled');
          return;
        }
        const configuredDelay =
          POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)] ?? 15_000;
        attempt += 1;
        await wait(Math.min(configuredDelay, remainingMs));
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(hardDeadlineTimer);
      if (waitTimer) clearTimeout(waitTimer);
      if (queryTimer) clearTimeout(queryTimer);
      releaseWait?.();
      releaseQuery?.();
      activeController?.abort();
    };
  }, [clientRequestId, isLoaded, isSignedIn, retryToken, supabase]);

  return { session, isLoading, error, recoveryState, refetch };
}
