/**
 * 프로필 폴백 — 이번 세션에 없는 축을 사용자의 "최신 실측 진단"으로 채운다.
 *
 * @module lib/analysis/integrated/internal/profile-fallback
 * @description
 *   ADR-109 cadence locking의 약속은 "선택한 축만 다시 분석하고, 나머지는 프로필
 *   최신값을 그대로 유지한다"였다. 그런데 축 결과는 `session_id` FK로만 조회되므로,
 *   update 모드에서 제외된 축은 새 세션에 행이 없어 결과 화면에서 통째로 사라졌다
 *   (= "유지" 약속 위반). 이 모듈이 그 빈 축을 사용자의 최신 레코드로 메운다.
 *
 *   원칙: **실측된 본인 진단만** 쓴다. 없으면 null — 지어내지 않는다.
 *   폴백이 쓰였다는 사실은 호출부가 사용자에게 정직하게 고지해야 한다.
 *
 * @see docs/adr/ADR-109-profile-centric-analysis.md
 * @internal — 외부 import 금지 (오케스트레이터·result-fetcher 전용)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { normalizeColors } from '@/lib/color/normalize-colors';
import { resolveAxisProvenance, type AxisRecord } from '@/lib/analysis/integrated/profile-snapshot';
import { AXIS_TABLES } from '../types';
import type {
  AxisCode,
  AxisFallbackState,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
  PersonalColorAxisData,
  SkinAxisData,
} from '../types';

/**
 * 사용자의 최신 축 레코드 1건 (service_role — 오케스트레이터 컨텍스트).
 *
 * RLS를 우회하는 클라이언트이므로 `clerk_user_id` 필터를 직접 건다(세션 저장 경로와 동일 계약).
 */
async function fetchLatestAxisRecordForUser(
  axis: AxisCode,
  clerkUserId: string
): Promise<AxisRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(AXIS_TABLES[axis])
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[ProfileFallback] ${axis} fetch error:`, error.message);
    return null;
  }
  return (data as AxisRecord | null) ?? null;
}

/** 승계 행을 만든 원본 세션의 폴백 집계. 조회 불가/연결 없음은 unknown 근거로 남긴다. */
async function fetchSourceSessionFallback(
  record: AxisRecord,
  clerkUserId: string
): Promise<unknown> {
  if (typeof record.session_id !== 'string') return undefined;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .select('used_fallback')
    .eq('id', record.session_id)
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (error) {
    console.error('[ProfileFallback] source session fetch error:', error.message);
    return undefined;
  }
  return data?.used_fallback;
}

/** JSONB 안의 문자열 안전 추출 (없으면 빈 문자열) */
function readNestedString(record: AxisRecord, key: string, field: string): string {
  const nested = record[key];
  if (typeof nested !== 'object' || nested === null) return '';
  const value = (nested as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

/** 저장된 PC 레코드 → PersonalColorAxisData (DB는 대문자 저장, 도메인은 소문자 사용) */
export function toPersonalColorAxisData(record: AxisRecord): PersonalColorAxisData {
  const season = String(record.season ?? '').toLowerCase();
  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    season,
    tone: readNestedString(record, 'image_analysis', 'tone') || season,
    undertone: String(record.undertone ?? '').toLowerCase(),
    confidence: Number(record.confidence ?? 0),
    palette: normalizeColors(record.best_colors).map(({ hex }) => hex),
    ...(readNestedString(record, 'image_analysis', 'contrastLevel')
      ? {
          contrastLevel: readNestedString(record, 'image_analysis', 'contrastLevel') as
            | 'low'
            | 'medium'
            | 'high',
        }
      : {}),
  };
}

/** 저장된 피부 레코드 → SkinAxisData */
export function toSkinAxisData(record: AxisRecord): SkinAxisData {
  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    skinType: String(record.skin_type ?? ''),
    overallScore: Number(record.overall_score ?? 0),
  };
}

/** 저장된 체형 레코드 → persona/추천 입력. 핵심 판정이 없으면 승계하지 않는다. */
export function toBodyAxisData(record: AxisRecord): BodyAxisData | null {
  const bodyType = typeof record.body_type === 'string' ? record.body_type.trim() : '';
  return bodyType ? { id: record.id, bodyType } : null;
}

/** 저장된 헤어 레코드 → HairAxisData. 얼굴형이 없으면 persona 성공 축으로 세지 않는다. */
export function toHairAxisData(record: AxisRecord): HairAxisData | null {
  const faceShape = typeof record.face_shape === 'string' ? record.face_shape.trim() : '';
  if (!faceShape) return null;
  return {
    id: record.id,
    faceShape,
    hairType: typeof record.hair_type === 'string' ? record.hair_type : undefined,
  };
}

/** 통합/단독 메이크업 JSONB에서 실제 사람이 읽는 베이스 추천만 승계한다. */
export function toMakeupAxisData(record: AxisRecord): MakeupAxisData | null {
  const recommendations = record.recommendations;
  if (typeof recommendations !== 'object' || recommendations === null) return null;
  const stored = recommendations as Record<string, unknown>;
  const candidates = [stored.baseRecommendation, stored.insight];
  const baseRecommendation = candidates.find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
  return baseRecommendation
    ? { id: record.id, baseRecommendation: baseRecommendation.trim() }
    : null;
}

/** 프로필에서 승계한 축 값 + 그 값이 Mock 폴백으로 만들어졌는지 여부 */
export interface CarriedAxis<T> {
  data: T;
  /** 확인된 Mock 대체일 때만 true. 출처 불명은 false + provenance=unknown이다. */
  usedFallback: boolean;
  provenance: AxisFallbackState;
  confidence: 'normal' | 'low';
  recordId: string | null;
  sourceSessionId: string | null;
}

async function toCarriedAxis<T>(
  axis: AxisCode,
  clerkUserId: string,
  record: AxisRecord,
  data: T
): Promise<CarriedAxis<T>> {
  const provenance = resolveAxisProvenance(
    axis,
    record,
    'profile',
    await fetchSourceSessionFallback(record, clerkUserId)
  );
  return {
    data,
    usedFallback: provenance.fallbackState === 'used',
    provenance: provenance.fallbackState,
    confidence: provenance.confidence,
    recordId: provenance.recordId,
    sourceSessionId: provenance.sourceSessionId,
  };
}

/**
 * 최신 퍼스널컬러 진단 승계 (없으면 null).
 * 폴백 여부는 저장 당시 기록된 `image_analysis.usedFallback`에서 읽는다.
 */
export async function carryLatestPersonalColor(
  clerkUserId: string
): Promise<CarriedAxis<PersonalColorAxisData> | null> {
  const record = await fetchLatestAxisRecordForUser('personal_color', clerkUserId);
  if (!record) return null;
  return toCarriedAxis('personal_color', clerkUserId, record, toPersonalColorAxisData(record));
}

/**
 * 최신 피부 분석 승계 (없으면 null).
 * 폴백 여부는 저장 당시 기록된 `recommendations.usedFallback`에서 읽는다.
 */
export async function carryLatestSkin(
  clerkUserId: string
): Promise<CarriedAxis<SkinAxisData> | null> {
  const record = await fetchLatestAxisRecordForUser('skin', clerkUserId);
  if (!record) return null;
  return toCarriedAxis('skin', clerkUserId, record, toSkinAxisData(record));
}

/**
 * 최신 헤어 분석 승계 (없으면 null).
 *
 * 왜 메이크업 경로에 필요한가: M-1은 얼굴형을 H-1에서만 승계한다. 헤어를 이번에
 * 재분석하지 않았다고 얼굴형을 placeholder(미측정)로 떨어뜨리면, 이미 실측한
 * 사용자의 결과가 재분석할수록 빈약해진다 — "유지" 약속과 반대 방향.
 */
export async function carryLatestHair(
  clerkUserId: string
): Promise<CarriedAxis<HairAxisData> | null> {
  const record = await fetchLatestAxisRecordForUser('hair', clerkUserId);
  if (!record) return null;
  const data = toHairAxisData(record);
  return data ? toCarriedAxis('hair', clerkUserId, record, data) : null;
}
