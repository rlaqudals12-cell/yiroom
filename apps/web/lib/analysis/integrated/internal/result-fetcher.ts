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

/**
 * 세션에 퍼스널컬러 축이 없을 때의 프로필 폴백 — 사용자의 최신 퍼컬 진단 레코드.
 *
 * 왜: 축 결과는 session_id FK로만 조회되므로, 단독 퍼컬 진단을 이미 마친 사용자도
 * 해당 세션에 퍼컬이 없으면 리포트·공유카드가 "퍼컬 없음"으로 퇴화(빈 카드)했다.
 * 실측된 본인 진단만 반영한다(지어내지 않음). RLS로 본인 행만 반환.
 */
export async function fetchLatestPersonalColor(): Promise<AxisDbRecord | null> {
  const supabase = await createClerkSupabaseClient();
  const { data, error } = await supabase
    .from('personal_color_assessments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[ResultFetcher] pc profile fallback fetch error:', error.message);
    return null;
  }
  return (data as AxisDbRecord | null) ?? null;
}
