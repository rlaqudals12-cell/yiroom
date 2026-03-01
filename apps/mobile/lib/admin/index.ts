/**
 * 피처 플래그 클라이언트 (읽기 전용)
 *
 * Supabase feature_flags 테이블 조회, 메모리 캐시
 *
 * @module lib/admin
 * @see .claude/rules/feature-flags.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export type FeatureFlagKey =
  | 'analysis_personal_color'
  | 'analysis_skin'
  | 'analysis_body'
  | 'workout_module'
  | 'nutrition_module'
  | 'reports_module'
  | 'product_recommendations'
  | 'product_wishlist'
  | 'ai_qa'
  | 'ingredient_warning'
  | 'price_crawler'
  | 'share_results';

export interface FeatureFlag {
  key: FeatureFlagKey;
  name: string;
  enabled: boolean;
  updatedAt: string;
}

// ─── 캐시 ─────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 1000; // 1분

let flagCache: Map<string, boolean> | null = null;
let cacheTimestamp = 0;

function isCacheValid(): boolean {
  return flagCache !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/**
 * 캐시 무효화
 */
export function invalidateFlagCache(): void {
  flagCache = null;
  cacheTimestamp = 0;
}

// ─── 조회 ─────────────────────────────────────────────

/**
 * 단일 피처 플래그 확인
 *
 * DB에 없으면 활성화(true) 반환 — 안전한 기본값
 */
export async function isFeatureEnabled(
  supabase: SupabaseClient,
  key: FeatureFlagKey
): Promise<boolean> {
  // 캐시 확인
  if (isCacheValid() && flagCache) {
    return flagCache.get(key) ?? true;
  }

  // DB 조회 + 캐시 갱신
  await refreshCache(supabase);

  return flagCache?.get(key) ?? true;
}

/**
 * 여러 피처 플래그 일괄 확인
 */
export async function getEnabledFeatures(
  supabase: SupabaseClient,
  keys: FeatureFlagKey[]
): Promise<Record<FeatureFlagKey, boolean>> {
  if (!isCacheValid()) {
    await refreshCache(supabase);
  }

  const result: Record<string, boolean> = {};
  keys.forEach((key) => {
    result[key] = flagCache?.get(key) ?? true;
  });

  return result as Record<FeatureFlagKey, boolean>;
}

/**
 * 전체 피처 플래그 조회 (캐시 경유)
 */
export async function getCachedFeatureFlags(
  supabase: SupabaseClient
): Promise<FeatureFlag[]> {
  const { data } = await supabase
    .from('feature_flags')
    .select('key, name, enabled, updated_at')
    .order('key');

  return (data ?? []).map((row) => ({
    key: row.key as FeatureFlagKey,
    name: row.name,
    enabled: row.enabled,
    updatedAt: row.updated_at,
  }));
}

// ─── 유틸리티 ─────────────────────────────────────────

/**
 * 피처 플래그로 조건부 실행
 */
export async function withFeatureFlag<T>(
  supabase: SupabaseClient,
  key: FeatureFlagKey,
  enabledFn: () => T | Promise<T>,
  disabledFn?: () => T | Promise<T>
): Promise<T | null> {
  const enabled = await isFeatureEnabled(supabase, key);
  if (enabled) return enabledFn();
  if (disabledFn) return disabledFn();
  return null;
}

/**
 * 모든 분석 모듈 활성 상태
 */
export async function getAnalysisModuleFlags(
  supabase: SupabaseClient
): Promise<Record<string, boolean>> {
  return getEnabledFeatures(supabase, [
    'analysis_personal_color',
    'analysis_skin',
    'analysis_body',
  ]);
}

// ─── 내부 함수 ───────────────────────────────────────

async function refreshCache(supabase: SupabaseClient): Promise<void> {
  try {
    const { data } = await supabase
      .from('feature_flags')
      .select('key, enabled');

    flagCache = new Map();
    (data ?? []).forEach((row) => {
      flagCache!.set(row.key, row.enabled);
    });
    cacheTimestamp = Date.now();
  } catch {
    // DB 실패 시 빈 캐시 (기본값 true 반환)
    flagCache = new Map();
    cacheTimestamp = Date.now();
  }
}
