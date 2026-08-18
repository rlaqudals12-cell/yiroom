/**
 * 통합 분석의 현재 세션 축과 프로필 승계 축을 같은 규칙으로 조립한다.
 *
 * 왜: 결과 페이지와 공개 공유가 서로 다른 조회 규칙을 쓰면 같은 세션이 다른
 * 진단처럼 보인다. 폴백 표식도 신규/레거시/무표식을 tri-state로 구분해야 한다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AXIS_CODES, AXIS_TABLES, type AxisCode, type AxisFallbackState } from './types';

export const PROFILE_SNAPSHOT_AXES: readonly AxisCode[] = AXIS_CODES;

export type AxisRecord = Record<string, unknown> & { id: string };
export type AxisSource = 'session' | 'profile';
export interface AxisProvenance {
  source: AxisSource;
  fallbackState: AxisFallbackState;
  confidence: 'normal' | 'low';
  recordId: string | null;
  sourceSessionId: string | null;
  sourceCreatedAt: string | null;
}

export interface IntegratedProfileSnapshot {
  axes: Record<AxisCode, AxisRecord | null>;
  provenance: Record<AxisCode, AxisProvenance | null>;
  axesFromProfile: AxisCode[];
  axesFetchFailed: AxisCode[];
  fallbackAxes: AxisCode[];
  unknownAxes: AxisCode[];
}

const FLAG_CONTAINER: Record<AxisCode, string> = {
  personal_color: 'image_analysis',
  skin: 'recommendations',
  body: 'style_recommendations',
  hair: 'recommendations',
  makeup: 'recommendations',
};

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readFallbackState(value: unknown): AxisFallbackState | undefined {
  return value === 'used' || value === 'not_used' || value === 'unknown' ? value : undefined;
}

/** 신규 tri-state/usedFallback을 우선하되 레거시 usedMock도 읽는다. */
function readStoredFallbackEvidence(
  axis: AxisCode,
  record: AxisRecord
): { flag: boolean | undefined; state: AxisFallbackState | undefined } {
  const container = record[FLAG_CONTAINER[axis]];
  const nested =
    typeof container === 'object' && container !== null
      ? (container as Record<string, unknown>)
      : null;
  // 신규 정본 usedFallback이 명시돼 있으면 true/false 모두 레거시 usedMock보다 우선한다.
  return {
    flag:
      readBoolean(record.usedFallback) ??
      readBoolean(nested?.usedFallback) ??
      readBoolean(record.usedMock) ??
      readBoolean(nested?.usedMock),
    // 왜: unknown은 boolean false로 표현할 수 없어 별도 tri-state로 저장한다.
    // 이를 다시 읽지 않으면 승계 축으로 만든 메이크업이 다음 조회에서 실측으로 위장된다.
    state: readFallbackState(record.fallbackState) ?? readFallbackState(nested?.fallbackState),
  };
}

export function resolveAxisProvenance(
  axis: AxisCode,
  record: AxisRecord,
  source: AxisSource,
  sourceSessionFallback: unknown
): AxisProvenance {
  const stored = readStoredFallbackEvidence(axis, record);
  const sessionFallback = Array.isArray(sourceSessionFallback)
    ? sourceSessionFallback.filter((value): value is string => typeof value === 'string')
    : null;

  let fallbackState: AxisFallbackState;
  // 확인된 true 증거는 상충하는 unknown/false보다 우선한다.
  if (sessionFallback?.includes(axis) || stored.flag === true || stored.state === 'used') {
    fallbackState = 'used';
  } else if (stored.state === 'unknown') {
    // unknown과 false는 같은 뜻이 아니다. false 미러는 레거시 boolean reader 호환용일 수 있다.
    fallbackState = 'unknown';
  } else if (stored.state === 'not_used' || sessionFallback !== null || stored.flag === false) {
    fallbackState = 'not_used';
  } else {
    fallbackState = 'unknown';
  }

  return {
    source,
    fallbackState,
    confidence: fallbackState === 'not_used' ? 'normal' : 'low',
    recordId: typeof record.id === 'string' ? record.id : null,
    sourceSessionId: typeof record.session_id === 'string' ? record.session_id : null,
    sourceCreatedAt: typeof record.created_at === 'string' ? record.created_at : null,
  };
}

interface SnapshotInput {
  sessionId: string;
  clerkUserId: string;
  sessionUsedFallback: unknown;
  /** 세션 이후에 생긴 진단이 과거 partial 결과에 끼어들지 않게 하는 고정 시각. */
  sessionCreatedAt: string;
  /** 공개 공유처럼 필요한 컬럼만 읽어야 하는 소비부의 축별 select 절. */
  selectColumns?: Partial<Record<AxisCode, string>>;
}

interface AxisFetchResult {
  axis: AxisCode;
  record: AxisRecord | null;
  failed: boolean;
}

async function fetchCurrentAxis(
  supabase: SupabaseClient,
  axis: AxisCode,
  input: SnapshotInput
): Promise<AxisFetchResult> {
  const { data, error } = await supabase
    .from(AXIS_TABLES[axis])
    .select(input.selectColumns?.[axis] ?? '*')
    .eq('session_id', input.sessionId)
    .eq('clerk_user_id', input.clerkUserId)
    .maybeSingle();

  if (error) {
    console.error(`[ProfileSnapshot] ${axis} session fetch error:`, error.message);
    return { axis, record: null, failed: true };
  }
  return { axis, record: (data as AxisRecord | null) ?? null, failed: false };
}

async function fetchLatestAxis(
  supabase: SupabaseClient,
  axis: AxisCode,
  input: SnapshotInput
): Promise<AxisFetchResult> {
  const { data, error } = await supabase
    .from(AXIS_TABLES[axis])
    .select(input.selectColumns?.[axis] ?? '*')
    .eq('clerk_user_id', input.clerkUserId)
    .lte('created_at', input.sessionCreatedAt)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[ProfileSnapshot] ${axis} profile fetch error:`, error.message);
    return { axis, record: null, failed: true };
  }
  return { axis, record: (data as AxisRecord | null) ?? null, failed: false };
}

async function fetchOriginFallbacks(
  supabase: SupabaseClient,
  clerkUserId: string,
  records: AxisRecord[]
): Promise<Map<string, unknown>> {
  const sessionIds = [
    ...new Set(
      records
        .map((record) => record.session_id)
        .filter((value): value is string => typeof value === 'string')
    ),
  ];
  if (sessionIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .select('id, used_fallback')
    .eq('clerk_user_id', clerkUserId)
    .in('id', sessionIds);

  if (error) {
    console.error('[ProfileSnapshot] origin session fetch error:', error.message);
    return new Map();
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; used_fallback: unknown }>).map((session) => [
      session.id,
      session.used_fallback,
    ])
  );
}

export async function fetchIntegratedProfileSnapshot(
  supabase: SupabaseClient,
  input: SnapshotInput
): Promise<IntegratedProfileSnapshot> {
  const currentResults = await Promise.all(
    PROFILE_SNAPSHOT_AXES.map((axis) => fetchCurrentAxis(supabase, axis, input))
  );

  const axes = Object.fromEntries(PROFILE_SNAPSHOT_AXES.map((axis) => [axis, null])) as Record<
    AxisCode,
    AxisRecord | null
  >;
  const source = new Map<AxisCode, AxisSource>();
  const axesFetchFailed: AxisCode[] = [];
  const missingAxes: AxisCode[] = [];

  for (const result of currentResults) {
    axes[result.axis] = result.record;
    if (result.failed) axesFetchFailed.push(result.axis);
    else if (result.record) source.set(result.axis, 'session');
    else missingAxes.push(result.axis);
  }

  const latestResults = await Promise.all(
    missingAxes.map((axis) => fetchLatestAxis(supabase, axis, input))
  );
  const axesFromProfile: AxisCode[] = [];
  for (const result of latestResults) {
    if (result.failed) {
      axesFetchFailed.push(result.axis);
    } else if (result.record) {
      axes[result.axis] = result.record;
      source.set(result.axis, 'profile');
      axesFromProfile.push(result.axis);
    }
  }

  const profileRecords = axesFromProfile
    .map((axis) => axes[axis])
    .filter((record): record is AxisRecord => record !== null);
  const originFallbacks = await fetchOriginFallbacks(supabase, input.clerkUserId, profileRecords);
  const provenance = Object.fromEntries(
    PROFILE_SNAPSHOT_AXES.map((axis) => {
      const record = axes[axis];
      const axisSource = source.get(axis);
      if (!record || !axisSource) return [axis, null];
      let originFallback: unknown;
      if (axisSource === 'session') {
        originFallback = input.sessionUsedFallback;
      } else if (typeof record.session_id === 'string') {
        originFallback = originFallbacks.get(record.session_id);
      }
      return [axis, resolveAxisProvenance(axis, record, axisSource, originFallback)];
    })
  ) as Record<AxisCode, AxisProvenance | null>;

  return {
    axes,
    provenance,
    axesFromProfile,
    axesFetchFailed: PROFILE_SNAPSHOT_AXES.filter((axis) => axesFetchFailed.includes(axis)),
    fallbackAxes: PROFILE_SNAPSHOT_AXES.filter(
      (axis) => provenance[axis]?.fallbackState === 'used'
    ),
    unknownAxes: PROFILE_SNAPSHOT_AXES.filter(
      (axis) => provenance[axis]?.fallbackState === 'unknown'
    ),
  };
}
