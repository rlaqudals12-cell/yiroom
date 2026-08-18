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
import {
  fetchIntegratedProfileSnapshot,
  type AxisProvenance,
} from '@/lib/analysis/integrated/profile-snapshot';
import type { AxisCode, IntegratedSessionRow } from '../types';

export interface AxisDbRecord {
  id: string;
  [key: string]: unknown;
}

/** 결과 페이지가 다루는 축 키 (DB 테이블 매핑은 AXIS_TABLES) */
const AXIS_KEY_BY_CODE = {
  personal_color: 'personalColor',
  skin: 'skin',
  body: 'body',
  hair: 'hair',
  makeup: 'makeup',
} as const satisfies Record<AxisCode, string>;

export type ResultAxisKey = (typeof AXIS_KEY_BY_CODE)[AxisCode];

export interface ResultPageData {
  session: IntegratedSessionRow;
  axes: Record<ResultAxisKey, AxisDbRecord | null>;
  /**
   * 이번 세션엔 없어서 사용자의 최신 진단으로 채운 축.
   * 결과 페이지는 이 목록을 사용자에게 고지해야 한다 (지어낸 값이 아님을 명시).
   */
  axesFromProfile: AxisCode[];
  /**
   * 조회 자체가 실패한 축 (미분석 아님).
   * "결과 없음"으로 위장하면 사용자는 하지도 않은 분석을 다시 하게 된다 — 구분해서 노출한다.
   */
  axesFetchFailed: AxisCode[];
  /** 확인된 Mock과 출처 불명을 섞지 않는 공용 provenance 결과. */
  fallbackAxes: AxisCode[];
  unknownAxes: AxisCode[];
  axisProvenance: Record<AxisCode, AxisProvenance | null>;
}

/**
 * 세션 ID로 통합 분석 결과 전체를 조회.
 * 본인 소유가 아니거나 존재하지 않으면 null 반환 (RLS).
 *
 * @throws 세션 조회 자체가 실패하면 throw — "없음"으로 위장하면 404(존재하지 않는 페이지)로
 *   퇴화해, 일시적 DB 장애가 "당신의 분석은 없다"는 거짓말이 된다.
 */
export async function fetchIntegratedResult(sessionId: string): Promise<ResultPageData | null> {
  const supabase = await createClerkSupabaseClient();

  // 1. 세션 조회 (RLS로 권한 검증)
  const { data: session, error: sessionError } = await supabase
    .from('integrated_analysis_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    console.error('[ResultFetcher] session fetch error:', sessionError.message);
    throw new Error(`[ResultFetcher] session fetch failed: ${sessionError.message}`);
  }
  if (!session) {
    return null;
  }

  // 2. 소유자·공개 공유가 같은 cutoff/폴백 해석을 쓰는 공용 프로필 스냅샷.
  // 세션 생성 이후의 새 진단은 과거 partial 세션에 끼워 넣지 않는다.
  const snapshot = await fetchIntegratedProfileSnapshot(supabase, {
    sessionId,
    clerkUserId: String(session.clerk_user_id),
    sessionUsedFallback: session.used_fallback,
    sessionCreatedAt: String(session.created_at),
  });
  const axes = {} as Record<ResultAxisKey, AxisDbRecord | null>;
  for (const [axis, key] of Object.entries(AXIS_KEY_BY_CODE) as Array<[AxisCode, ResultAxisKey]>) {
    axes[key] = snapshot.axes[axis] as AxisDbRecord | null;
  }

  return {
    session: session as IntegratedSessionRow,
    axes,
    axesFromProfile: snapshot.axesFromProfile,
    axesFetchFailed: snapshot.axesFetchFailed,
    fallbackAxes: snapshot.fallbackAxes,
    unknownAxes: snapshot.unknownAxes,
    axisProvenance: snapshot.provenance,
  };
}
