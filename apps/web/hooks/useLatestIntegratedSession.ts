'use client';

/**
 * 최신 통합 분석 세션 조회 훅
 *
 * @module hooks/useLatestIntegratedSession
 * @description
 *   현재 사용자의 가장 최근 통합 분석 세션(`integrated_analysis_sessions`)을 조회.
 *   상태가 `completed` 또는 `partial`인 세션만 대상 (실패 세션 제외).
 *
 * @see docs/adr/ADR-101-integrated-cta-unification.md §2.3
 * @see docs/specs/SDD-PHASE-C-CTA-UNIFICATION.md §2.3
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { IntegratedSessionRow } from '@/lib/analysis/integrated';

export interface UseLatestIntegratedSessionResult {
  session: IntegratedSessionRow | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 최신 통합 분석 세션 1건 조회.
 * - status: 'completed' | 'partial' (failed 제외)
 * - order: created_at DESC, limit 1
 * - RLS로 본인 세션만 접근 가능
 */
export function useLatestIntegratedSession(): UseLatestIntegratedSessionResult {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [session, setSession] = useState<IntegratedSessionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 왜: Clerk 인증 로드 전이면 대기. 비로그인이면 빈 결과 유지
    if (!isLoaded) return;
    if (!isSignedIn) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('integrated_analysis_sessions')
          .select('*')
          .in('status', ['completed', 'partial'])
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
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, supabase]);

  return { session, isLoading, error };
}
