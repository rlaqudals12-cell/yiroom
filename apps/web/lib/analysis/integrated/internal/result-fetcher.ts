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
import { AXIS_TABLES } from '../types';
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
}

const ALL_AXES: AxisCode[] = ['personal_color', 'skin', 'body', 'hair', 'makeup'];

/** 조회 결과 한 축분 — 레코드와 조회 실패를 구분해서 담는다 */
interface AxisFetch {
  record: AxisDbRecord | null;
  failed: boolean;
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

  // 2. 5축 결과 병렬 조회 (session_id FK 기반)
  const settled = await Promise.all(
    ALL_AXES.map(async (axis): Promise<AxisFetch> => {
      const { data, error } = await supabase
        .from(AXIS_TABLES[axis])
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        // 오류를 "미분석"으로 접지 않는다 — 축별 조회 실패를 그대로 표면화
        console.error(`[ResultFetcher] ${axis} fetch error:`, error.message);
        return { record: null, failed: true };
      }
      return { record: (data as AxisDbRecord | null) ?? null, failed: false };
    })
  );

  const axes = {} as Record<ResultAxisKey, AxisDbRecord | null>;
  const axesFetchFailed: AxisCode[] = [];
  const missingAxes: AxisCode[] = [];

  ALL_AXES.forEach((axis, i) => {
    const { record, failed } = settled[i];
    axes[AXIS_KEY_BY_CODE[axis]] = record;
    if (failed) axesFetchFailed.push(axis);
    else if (!record) missingAxes.push(axis);
  });

  // 3. 프로필 폴백 — 이번 세션에 없는 축을 사용자의 최신 진단으로 채운다.
  //
  // 왜: ADR-109 선택 재분석은 "고른 축만 다시 분석하고 나머지는 프로필 최신값 유지"를
  // 약속한다. 그런데 축 결과는 session_id FK로만 조회되므로, 재분석에서 제외한 축은
  // 새 세션에 행이 없어 결과 화면에서 통째로 사라졌다(= 약속 위반). 조회 실패 축은
  // 채우지 않는다 — 일시적 장애를 옛 데이터로 덮으면 이번 회차 결과로 오인된다.
  const axesFromProfile: AxisCode[] = [];
  if (missingAxes.length > 0) {
    const fallbacks = await Promise.all(missingAxes.map((axis) => fetchLatestAxisRecord(axis)));
    missingAxes.forEach((axis, i) => {
      const record = fallbacks[i];
      if (record) {
        axes[AXIS_KEY_BY_CODE[axis]] = record;
        axesFromProfile.push(axis);
      }
    });
  }

  return {
    session: session as IntegratedSessionRow,
    axes,
    axesFromProfile,
    axesFetchFailed,
  };
}

/**
 * 사용자의 최신 축 진단 1건 (RLS로 본인 행만 반환).
 *
 * 실측된 본인 진단만 반영한다(지어내지 않음). 조회 실패는 null — 폴백을 포기할 뿐
 * 결과 페이지 전체를 깨뜨리지 않는다.
 */
export async function fetchLatestAxisRecord(axis: AxisCode): Promise<AxisDbRecord | null> {
  const supabase = await createClerkSupabaseClient();
  const { data, error } = await supabase
    .from(AXIS_TABLES[axis])
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[ResultFetcher] ${axis} profile fallback fetch error:`, error.message);
    return null;
  }
  return (data as AxisDbRecord | null) ?? null;
}
