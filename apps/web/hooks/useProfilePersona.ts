'use client';

/**
 * 최신 통합 분석 세션의 페르소나 한 줄("당신은 ○○한 사람") 조회 (ADR-109 Phase 2 / A-visual).
 *
 * 프로필 홈 상단에 "살아있는 나"를 노출하기 위함. persona는 integrated_analysis_sessions.persona(JSONB)에 저장됨.
 * 가벼운 단발 조회 — useAnalysisStatus(축 집계)와 분리해 캐시/책임을 단순하게 유지.
 */

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export function useProfilePersona(): string | null {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [oneLine, setOneLine] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let active = true;

    async function fetchPersona(): Promise<void> {
      try {
        // RLS가 clerk_user_id로 필터 → 본인 최신 세션. persona 있는 행만.
        const { data } = await supabase
          .from('integrated_analysis_sessions')
          .select('persona')
          .not('persona', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const line = (data?.persona as { oneLine?: string } | null)?.oneLine;
        if (active && line) setOneLine(line);
      } catch {
        // 페르소나 없음/실패는 무시 — 프로필 카드는 페르소나 없이도 정상 동작
      }
    }

    fetchPersona();
    return () => {
      active = false;
    };
  }, [user?.id, isLoaded, supabase]);

  return oneLine;
}
