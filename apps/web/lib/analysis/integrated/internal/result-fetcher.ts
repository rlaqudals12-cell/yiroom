/**
 * 통합 분석 결과 페이지용 데이터 페칭 (Server Component 전용)
 *
 * @module lib/analysis/integrated/internal/result-fetcher
 * @description
 *   세션 + 5축 결과를 병렬 조회. 권한 검증은 RLS에 위임
 *   (createClerkSupabaseClient 기반이라 본인 데이터만 반환됨).
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §3.3
 *
 * @internal — 외부 import 금지 (result page 전용)
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { IntegratedSessionRow } from '../types';

export interface AxisDbRecord {
  id: string;
  [key: string]: unknown;
}

export interface ResultPageData {
  session: IntegratedSessionRow;
  axes: {
    personalColor: AxisDbRecord | null;
    skin: AxisDbRecord | null;
    body: AxisDbRecord | null;
    hair: AxisDbRecord | null;
    makeup: AxisDbRecord | null;
  };
}

/**
 * 세션 ID로 통합 분석 결과 전체를 조회.
 * 본인 소유가 아니거나 존재하지 않으면 null 반환 (RLS).
 */
export async function fetchIntegratedResult(sessionId: string): Promise<ResultPageData | null> {
  const supabase = await createClerkSupabaseClient();

  // 1. 세션 조회 (RLS로 권한 검증)
  const { data: session, error: sessionError } = await supabase
    .from('integrated_analysis_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    if (sessionError) {
      console.error('[ResultFetcher] session fetch error:', sessionError.message);
    }
    return null;
  }

  // 2. 5축 결과 병렬 조회 (session_id FK 기반)
  const [pcRes, skinRes, bodyRes, hairRes, makeupRes] = await Promise.all([
    supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase.from('skin_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase.from('body_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase.from('hair_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase.from('makeup_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
  ]);

  return {
    session: session as IntegratedSessionRow,
    axes: {
      personalColor: (pcRes.data as AxisDbRecord | null) ?? null,
      skin: (skinRes.data as AxisDbRecord | null) ?? null,
      body: (bodyRes.data as AxisDbRecord | null) ?? null,
      hair: (hairRes.data as AxisDbRecord | null) ?? null,
      makeup: (makeupRes.data as AxisDbRecord | null) ?? null,
    },
  };
}
