/**
 * Feature Flags 관리
 * @description 기능 ON/OFF 토글 시스템
 */

import { supabase } from '@/lib/supabase/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Feature Flag 타입
 */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feature Flag 키 목록 (타입 안전성)
 */
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

/**
 * DB Row를 FeatureFlag로 변환
 */
function toFeatureFlag(row: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}): FeatureFlag {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 모든 Feature Flags 조회
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  // 관리자 페이지에서 호출되므로 service role 사용
  const client = createServiceRoleClient();

  const { data, error } = await client
    .from('feature_flags')
    .select('*')
    .order('name');

  if (error) {
    console.error('Feature flags 조회 실패:', error);
    return [];
  }

  return data.map(toFeatureFlag);
}

/**
 * 특정 Feature Flag 조회
 */
export async function getFeatureFlag(key: FeatureFlagKey): Promise<FeatureFlag | null> {
  // 공개 클라이언트 사용 (feature 확인은 모든 곳에서 가능해야 함)
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) {
    return null;
  }

  return toFeatureFlag(data);
}

/**
 * Feature Flag 활성화 여부 확인
 * 기본값: true (없으면 활성화)
 */
export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flag = await getFeatureFlag(key);
  return flag?.enabled ?? true;
}

/**
 * Feature Flag 토글 (관리자 전용)
 */
export async function toggleFeatureFlag(
  key: FeatureFlagKey,
  enabled: boolean
): Promise<FeatureFlag | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .update({ enabled })
    .eq('key', key)
    .select()
    .single();

  if (error) {
    console.error('Feature flag 토글 실패:', error);
    return null;
  }

  return toFeatureFlag(data);
}

/**
 * Feature Flag 생성 (관리자 전용)
 */
export async function createFeatureFlag(
  flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FeatureFlag | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .insert({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
    })
    .select()
    .single();

  if (error) {
    console.error('Feature flag 생성 실패:', error);
    return null;
  }

  return toFeatureFlag(data);
}

/**
 * Feature Flag 삭제 (관리자 전용)
 */
export async function deleteFeatureFlag(key: FeatureFlagKey): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('key', key);

  if (error) {
    console.error('Feature flag 삭제 실패:', error);
    return false;
  }

  return true;
}

/**
 * 여러 Feature Flags 활성화 여부 일괄 확인
 */
export async function getEnabledFeatures(
  keys: FeatureFlagKey[]
): Promise<Record<FeatureFlagKey, boolean>> {
  const flags = await getAllFeatureFlags();
  const result: Record<string, boolean> = {};

  for (const key of keys) {
    const flag = flags.find((f) => f.key === key);
    result[key] = flag?.enabled ?? true;
  }

  return result as Record<FeatureFlagKey, boolean>;
}

/**
 * Feature Flag 캐시 (클라이언트 사이드용)
 */
let cachedFlags: FeatureFlag[] | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60 * 1000; // 1분

export async function getCachedFeatureFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  if (cachedFlags && now - cacheTime < CACHE_TTL) {
    return cachedFlags;
  }

  cachedFlags = await getAllFeatureFlags();
  cacheTime = now;
  return cachedFlags;
}

/**
 * 캐시 무효화
 */
export function invalidateFeatureFlagCache(): void {
  cachedFlags = null;
  cacheTime = 0;
}
