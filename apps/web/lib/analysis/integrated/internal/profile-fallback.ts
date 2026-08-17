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
import { AXIS_TABLES } from '../types';
import type { AxisCode, HairAxisData, PersonalColorAxisData, SkinAxisData } from '../types';

/** 축 레코드 (컬럼 구성은 축마다 다르므로 느슨한 형태로 다룬다) */
export type AxisRecord = Record<string, unknown> & { id: string };

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

/** JSONB 안의 boolean 플래그 안전 추출 (형태 보장 없음 — 없으면 false) */
function readNestedFlag(record: AxisRecord, key: string, field: string): boolean {
  const nested = record[key];
  if (typeof nested !== 'object' || nested === null) return false;
  return (nested as Record<string, unknown>)[field] === true;
}

/** JSONB 안의 문자열 안전 추출 (없으면 빈 문자열) */
function readNestedString(record: AxisRecord, key: string, field: string): string {
  const nested = record[key];
  if (typeof nested !== 'object' || nested === null) return '';
  const value = (nested as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

/**
 * best_colors JSONB → hex 문자열 배열.
 * 두 저장 형태를 모두 수용: 단독 AI 경로 `{name,hex}` / 통합 정적 경로 `"#rrggbb"`.
 */
function extractPaletteHexes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): string | null => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const c = item as { hex?: unknown; color?: unknown };
        if (typeof c.hex === 'string') return c.hex;
        if (typeof c.color === 'string') return c.color;
      }
      return null;
    })
    .filter((hex): hex is string => hex !== null && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex));
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
    palette: extractPaletteHexes(record.best_colors),
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

/** 프로필에서 승계한 축 값 + 그 값이 Mock 폴백으로 만들어졌는지 여부 */
export interface CarriedAxis<T> {
  data: T;
  /** 원 레코드가 Mock 폴백이었으면 true — 승계 결과도 폴백으로 취급해야 정직하다 */
  usedFallback: boolean;
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
  return {
    data: toPersonalColorAxisData(record),
    usedFallback: readNestedFlag(record, 'image_analysis', 'usedFallback'),
  };
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
  return {
    data: toSkinAxisData(record),
    usedFallback: readNestedFlag(record, 'recommendations', 'usedFallback'),
  };
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
  return {
    data: {
      id: typeof record.id === 'string' ? record.id : undefined,
      faceShape: String(record.face_shape ?? ''),
      hairType: typeof record.hair_type === 'string' ? record.hair_type : undefined,
    },
    usedFallback: readNestedFlag(record, 'recommendations', 'usedFallback'),
  };
}
