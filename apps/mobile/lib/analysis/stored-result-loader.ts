/**
 * 저장된 5축 분석 결과 조회 경계.
 *
 * 새 분석 직후에는 각 결과 화면이 기존 이미지 기반 API 경로를 그대로 사용한다.
 * 이미지 파라미터 없이 재방문하면 이 모듈이 historyId의 정확한 행(없으면 최신 행)을
 * RLS가 적용된 Clerk Supabase 클라이언트로 읽는다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type StoredAnalysisAxis = 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup';

interface StoredResultConfig {
  table: string;
  columns: string;
  evidenceColumn: 'image_analysis' | 'recommendations' | 'style_recommendations';
  sessionAxis: 'personal_color' | 'skin' | 'body' | 'hair' | 'makeup';
}

const STORED_RESULT_CONFIG: Record<StoredAnalysisAxis, StoredResultConfig> = {
  'personal-color': {
    table: 'personal_color_assessments',
    columns:
      'id, season, undertone, confidence, season_subtype, best_colors, worst_colors, image_analysis, session_id, created_at',
    evidenceColumn: 'image_analysis',
    sessionAxis: 'personal_color',
  },
  skin: {
    table: 'skin_analyses',
    columns:
      'id, skin_type, hydration, oil_level, pores, pigmentation, wrinkles, sensitivity, overall_score, recommendations, session_id, created_at',
    evidenceColumn: 'recommendations',
    sessionAxis: 'skin',
  },
  body: {
    table: 'body_analyses',
    columns:
      'id, body_type, height, weight, strengths, style_recommendations, measurement_source, session_id, created_at',
    evidenceColumn: 'style_recommendations',
    sessionAxis: 'body',
  },
  hair: {
    table: 'hair_analyses',
    columns:
      'id, hair_type, hair_thickness, scalp_type, scalp_health, damage_level, density, elasticity, shine, overall_score, concerns, recommendations, session_id, created_at',
    evidenceColumn: 'recommendations',
    sessionAxis: 'hair',
  },
  makeup: {
    table: 'makeup_analyses',
    columns:
      'id, undertone, eye_shape, lip_shape, face_shape, skin_tone_uniformity, overall_score, recommendations, session_id, created_at',
    evidenceColumn: 'recommendations',
    sessionAxis: 'makeup',
  },
};

export class StoredResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoredResultError';
  }
}

export interface StoredAnalysisRecord {
  row: Record<string, unknown>;
  /** undefined는 구 데이터라 출처를 판별할 수 없다는 뜻이다. false로 덮지 않는다. */
  usedFallback: boolean | undefined;
}

export type StoredFallbackSessionMap = ReadonlyMap<string, readonly string[] | undefined>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/** JSONB에 저장된 신·구 폴백 표식을 삼상태로 보존한다. */
export function readStoredFallbackFlag(value: unknown): boolean | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  if (typeof record.usedFallback === 'boolean') return record.usedFallback;
  if (typeof record.usedMock === 'boolean') return record.usedMock;
  return undefined;
}

/**
 * 여러 축이 같은 통합 세션을 가리킬 때 세션 출처를 한 번에 조회한다.
 * 조회 실패도 실제 분석으로 추정하지 않고 각 세션을 undefined로 유지한다.
 */
export async function loadStoredFallbackSessions(
  supabase: SupabaseClient,
  rows: readonly (Record<string, unknown> | null | undefined)[]
): Promise<StoredFallbackSessionMap> {
  const sessionIds = Array.from(
    new Set(
      rows
        .map((row) => row?.session_id)
        .filter((sessionId): sessionId is string => typeof sessionId === 'string')
    )
  );
  const fallbackBySessionId = new Map<string, readonly string[] | undefined>(
    sessionIds.map((sessionId) => [sessionId, undefined])
  );
  if (sessionIds.length === 0) return fallbackBySessionId;

  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .select('id, used_fallback')
    .in('id', sessionIds);
  if (error || !Array.isArray(data)) return fallbackBySessionId;

  for (const candidate of data) {
    const record = asRecord(candidate);
    if (!record || typeof record.id !== 'string' || !Array.isArray(record.used_fallback)) continue;
    fallbackBySessionId.set(
      record.id,
      record.used_fallback.filter((axis): axis is string => typeof axis === 'string')
    );
  }
  return fallbackBySessionId;
}

/**
 * 축 행에 표식이 없고 통합 세션에서 만들어진 경우 세션의 used_fallback을 확인한다.
 * 조회 실패는 false로 간주하지 않고 unknown(undefined)을 유지한다.
 */
export async function resolveStoredFallback(
  supabase: SupabaseClient,
  axis: StoredAnalysisAxis,
  row: Record<string, unknown>,
  fallbackBySessionId?: StoredFallbackSessionMap
): Promise<boolean | undefined> {
  const config = STORED_RESULT_CONFIG[axis];
  const inline = readStoredFallbackFlag(row[config.evidenceColumn]);
  if (inline !== undefined) return inline;

  const sessionId = typeof row.session_id === 'string' ? row.session_id : null;
  if (!sessionId) return undefined;

  if (fallbackBySessionId) {
    return fallbackBySessionId.get(sessionId)?.includes(config.sessionAxis);
  }

  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .select('used_fallback')
    .eq('id', sessionId)
    .maybeSingle();
  if (error || !data || !Array.isArray(data.used_fallback)) return undefined;

  return data.used_fallback.includes(config.sessionAxis);
}

/** historyId가 있으면 그 행만, 없으면 최신 저장 행 한 건을 읽는다. */
export async function loadStoredAnalysisRecord(
  supabase: SupabaseClient,
  axis: StoredAnalysisAxis,
  historyId?: string
): Promise<StoredAnalysisRecord> {
  const config = STORED_RESULT_CONFIG[axis];
  let query = supabase.from(config.table).select(config.columns);

  if (historyId) {
    query = query.eq('id', historyId);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new StoredResultError('저장된 분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  }
  const row = asRecord(data);
  if (!row) {
    throw new StoredResultError('저장된 분석 결과가 없어요. 새 분석을 시작해주세요.');
  }

  return {
    row,
    usedFallback: await resolveStoredFallback(supabase, axis, row),
  };
}

export function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function storedRecord(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}
