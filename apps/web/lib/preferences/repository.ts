/**
 * 사용자 선호/기피 Repository
 * @description Supabase CRUD 및 조회 함수
 * @version 1.0
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type UserPreference,
  type UserPreferenceRow,
  type PreferenceDomain,
  type PreferenceItemType,
  type AvoidLevel,
  toUserPreference,
} from '@/types/preferences';

// =============================================================================
// 조회 함수
// =============================================================================

/**
 * 사용자 선호/기피 목록 조회
 */
export async function getUserPreferences(
  supabase: SupabaseClient,
  clerkUserId: string,
  filters?: {
    domain?: PreferenceDomain;
    itemType?: PreferenceItemType;
    isFavorite?: boolean;
    avoidLevel?: AvoidLevel;
  }
): Promise<UserPreference[]> {
  let query = supabase
    .from('user_preferences')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.domain) {
    query = query.eq('domain', filters.domain);
  }

  if (filters?.itemType) {
    query = query.eq('item_type', filters.itemType);
  }

  if (filters?.isFavorite !== undefined) {
    query = query.eq('is_favorite', filters.isFavorite);
  }

  if (filters?.avoidLevel) {
    query = query.eq('avoid_level', filters.avoidLevel);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Preferences] Failed to fetch preferences:', error);
    return [];
  }

  return (data as UserPreferenceRow[]).map(toUserPreference);
}

/**
 * ID로 선호/기피 항목 조회
 */
export async function getPreferenceById(
  supabase: SupabaseClient,
  id: string
): Promise<UserPreference | null> {
  const { data, error } = await supabase.from('user_preferences').select('*').eq('id', id).single();

  if (error || !data) {
    return null;
  }

  return toUserPreference(data as UserPreferenceRow);
}

/**
 * 도메인별 기피 항목 이름 목록 조회 (빠른 필터링용)
 */
export async function getAvoidedItemNames(
  supabase: SupabaseClient,
  clerkUserId: string,
  domain: PreferenceDomain
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('item_name')
    .eq('clerk_user_id', clerkUserId)
    .eq('domain', domain)
    .eq('is_favorite', false);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.item_name);
}

/**
 * 위험/불가 항목만 조회 (cannot, danger)
 */
export async function getCriticalAvoids(
  supabase: SupabaseClient,
  clerkUserId: string,
  domain?: PreferenceDomain
): Promise<UserPreference[]> {
  let query = supabase
    .from('user_preferences')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('is_favorite', false)
    .in('avoid_level', ['cannot', 'danger']);

  if (domain) {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Preferences] Failed to fetch critical avoids:', error);
    return [];
  }

  return (data as UserPreferenceRow[]).map(toUserPreference);
}

/**
 * 도메인별 선호/기피 개수 요약
 */
export async function getPreferenceSummary(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<Record<PreferenceDomain, { favorites: number; avoids: number }>> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('domain, is_favorite')
    .eq('clerk_user_id', clerkUserId);

  if (error || !data) {
    return {
      beauty: { favorites: 0, avoids: 0 },
      style: { favorites: 0, avoids: 0 },
      nutrition: { favorites: 0, avoids: 0 },
      workout: { favorites: 0, avoids: 0 },
      color: { favorites: 0, avoids: 0 },
    };
  }

  const summary: Record<PreferenceDomain, { favorites: number; avoids: number }> = {
    beauty: { favorites: 0, avoids: 0 },
    style: { favorites: 0, avoids: 0 },
    nutrition: { favorites: 0, avoids: 0 },
    workout: { favorites: 0, avoids: 0 },
    color: { favorites: 0, avoids: 0 },
  };

  for (const row of data) {
    const domain = row.domain as PreferenceDomain;
    if (summary[domain]) {
      if (row.is_favorite) {
        summary[domain].favorites++;
      } else {
        summary[domain].avoids++;
      }
    }
  }

  return summary;
}

// =============================================================================
// 생성/수정/삭제 함수
// =============================================================================

/**
 * 선호/기피 항목 추가
 */
export async function addPreference(
  supabase: SupabaseClient,
  preference: Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserPreference | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .insert({
      clerk_user_id: preference.clerkUserId,
      domain: preference.domain,
      item_type: preference.itemType,
      item_id: preference.itemId ?? null,
      item_name: preference.itemName,
      item_name_en: preference.itemNameEn ?? null,
      is_favorite: preference.isFavorite,
      avoid_level: preference.avoidLevel ?? null,
      avoid_reason: preference.avoidReason ?? null,
      avoid_note: preference.avoidNote ?? null,
      priority: preference.priority ?? 3,
      source: preference.source ?? 'user',
    })
    .select()
    .single();

  if (error) {
    console.error('[Preferences] Failed to add preference:', error);
    return null;
  }

  return toUserPreference(data as UserPreferenceRow);
}

/**
 * 선호/기피 항목 수정
 */
export async function updatePreference(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<UserPreference, 'avoidLevel' | 'avoidReason' | 'avoidNote' | 'priority'>>
): Promise<UserPreference | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      ...(updates.avoidLevel !== undefined && { avoid_level: updates.avoidLevel }),
      ...(updates.avoidReason !== undefined && { avoid_reason: updates.avoidReason }),
      ...(updates.avoidNote !== undefined && { avoid_note: updates.avoidNote }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Preferences] Failed to update preference:', error);
    return null;
  }

  return toUserPreference(data as UserPreferenceRow);
}

/**
 * 선호/기피 항목 삭제
 */
export async function removePreference(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from('user_preferences').delete().eq('id', id);

  if (error) {
    console.error('[Preferences] Failed to remove preference:', error);
    return false;
  }

  return true;
}

/**
 * 도메인별 모든 선호/기피 삭제
 */
export async function clearPreferencesByDomain(
  supabase: SupabaseClient,
  clerkUserId: string,
  domain: PreferenceDomain
): Promise<boolean> {
  const { error } = await supabase
    .from('user_preferences')
    .delete()
    .eq('clerk_user_id', clerkUserId)
    .eq('domain', domain);

  if (error) {
    console.error('[Preferences] Failed to clear preferences:', error);
    return false;
  }

  return true;
}

// =============================================================================
// 존재 여부 확인
// =============================================================================

/**
 * 특정 항목이 이미 등록되어 있는지 확인
 */
export async function preferenceExists(
  supabase: SupabaseClient,
  clerkUserId: string,
  domain: PreferenceDomain,
  itemType: PreferenceItemType,
  itemName: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('user_preferences')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', clerkUserId)
    .eq('domain', domain)
    .eq('item_type', itemType)
    .eq('item_name', itemName);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

// =============================================================================
// 일괄 처리
// =============================================================================

/**
 * 여러 선호/기피 항목 일괄 추가 (upsert)
 */
export async function upsertPreferences(
  supabase: SupabaseClient,
  preferences: Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<UserPreference[]> {
  if (preferences.length === 0) {
    return [];
  }

  const rows = preferences.map((p) => ({
    clerk_user_id: p.clerkUserId,
    domain: p.domain,
    item_type: p.itemType,
    item_id: p.itemId ?? null,
    item_name: p.itemName,
    item_name_en: p.itemNameEn ?? null,
    is_favorite: p.isFavorite,
    avoid_level: p.avoidLevel ?? null,
    avoid_reason: p.avoidReason ?? null,
    avoid_note: p.avoidNote ?? null,
    priority: p.priority ?? 3,
    source: p.source ?? 'user',
  }));

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(rows, {
      onConflict: 'clerk_user_id,domain,item_type,item_name',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('[Preferences] Failed to upsert preferences:', error);
    return [];
  }

  return (data as UserPreferenceRow[]).map(toUserPreference);
}
