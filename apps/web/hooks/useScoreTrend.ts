'use client';

/**
 * 결과 페이지 "직전 분석 대비" 추이 훅
 *
 * @description
 *   변화 추적의 결과 페이지 확장 (Phase 4). 홈 변동 뱃지는 2026-07-04 결정으로
 *   양 극단(PC·피부)만 유지 — 그 결정과 충돌하지 않도록 나머지 축의 변화는
 *   해당 축 "결과 페이지"에서만 보여준다 (결과를 보는 맥락 = 변화가 궁금한 맥락).
 *
 *   직전 레코드가 없으면(첫 분석) null — 칩 미노출.
 */

import { useState, useEffect } from 'react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { computeSkinTrend } from '@yiroom/shared';

export type TrendTable = 'skin_analyses' | 'hair_analyses' | 'makeup_analyses';

export interface ScoreTrend {
  delta: number;
  trend: 'up' | 'down' | 'flat';
  prevScore: number;
  prevDate: string;
}

export function useScoreTrend(
  table: TrendTable,
  /** 현재 결과의 생성 시각 (이보다 이전 레코드에서 직전 분석을 찾음) */
  currentCreatedAt: string | Date | null | undefined,
  /** 현재 결과의 종합 점수 */
  currentScore: number | null | undefined
): ScoreTrend | null {
  const supabase = useClerkSupabaseClient();
  const [trend, setTrend] = useState<ScoreTrend | null>(null);

  useEffect(() => {
    if (!supabase || !currentCreatedAt || typeof currentScore !== 'number') return;

    let cancelled = false;
    const before =
      currentCreatedAt instanceof Date ? currentCreatedAt.toISOString() : currentCreatedAt;

    (async () => {
      try {
        // RLS가 본인 데이터로 스코프 — 직전 1건만
        const { data } = await supabase
          .from(table)
          .select('overall_score, created_at')
          .lt('created_at', before)
          .not('overall_score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled || !data || typeof data.overall_score !== 'number') return;

        const { delta, trend: direction } = computeSkinTrend(currentScore, data.overall_score);
        setTrend({
          delta,
          trend: direction,
          prevScore: data.overall_score,
          prevDate: data.created_at as string,
        });
      } catch {
        /* 추이는 부가 정보 — 실패 시 조용히 미노출 */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, table, currentCreatedAt, currentScore]);

  return trend;
}
