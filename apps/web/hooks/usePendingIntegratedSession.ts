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

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { CLIENT_REQUEST_ID_KEY, type IntegratedSessionRow } from '@/lib/analysis/integrated';

export interface UsePendingIntegratedSessionResult {
  session: IntegratedSessionRow | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePendingIntegratedSession(
  clientRequestId: string | null
): UsePendingIntegratedSessionResult {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [session, setSession] = useState<IntegratedSessionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    // 상관 ID가 없으면 조회하지 않는다 — 추측으로 아무 세션이나 붙이지 않는다
    if (!isSignedIn || !clientRequestId) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('integrated_analysis_sessions')
          // 상관 ID는 questionnaire JSONB의 예약 키에 저장된다 (전용 컬럼 없음)
          .select('*')
          .eq(`questionnaire->>${CLIENT_REQUEST_ID_KEY}`, clientRequestId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (dbError) {
          setError(new Error(dbError.message));
          setSession(null);
        } else {
          setSession((data as IntegratedSessionRow | null) ?? null);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setSession(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, supabase, clientRequestId]);

  return { session, isLoading, error };
}
