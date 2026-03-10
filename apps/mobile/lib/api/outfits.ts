/**
 * Phase J P3-B: 저장된 코디 Repository
 * clerk_user_id 기반 RLS 적용
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FullOutfit, OutfitOccasion } from '@/types/styling';
import type { SeasonType } from '@/lib/mock/personal-color';

/** 저장된 코디 DB 레코드 */
export interface SavedOutfitRecord {
  id: string;
  clerk_user_id: string;
  outfit_id: string;
  season_type: SeasonType;
  occasion: OutfitOccasion;
  outfit_snapshot: FullOutfit;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** 저장된 코디 응답 */
export interface SavedOutfit {
  id: string;
  outfitId: string;
  seasonType: SeasonType;
  occasion: OutfitOccasion;
  outfit: FullOutfit;
  note: string | null;
  savedAt: Date;
}

/** 코디 저장 요청 */
export interface SaveOutfitRequest {
  outfitId: string;
  seasonType: SeasonType;
  occasion: OutfitOccasion;
  outfit: FullOutfit;
  note?: string;
}

/**
 * DB 레코드를 클라이언트 타입으로 변환
 */
function transformRecord(record: SavedOutfitRecord): SavedOutfit {
  return {
    id: record.id,
    outfitId: record.outfit_id,
    seasonType: record.season_type,
    occasion: record.occasion,
    outfit: record.outfit_snapshot,
    note: record.note,
    savedAt: new Date(record.created_at),
  };
}

/**
 * 저장된 코디 목록 조회
 */
export async function getSavedOutfits(
  supabase: SupabaseClient,
  options?: {
    seasonType?: SeasonType;
    occasion?: OutfitOccasion;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: SavedOutfit[]; count: number }> {
  let query = supabase
    .from('saved_outfits')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.seasonType) {
    query = query.eq('season_type', options.seasonType);
  }

  if (options?.occasion) {
    query = query.eq('occasion', options.occasion);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Outfits] Failed to get saved outfits:', error);
    throw error;
  }

  return {
    data: (data as SavedOutfitRecord[]).map(transformRecord),
    count: count || 0,
  };
}

/**
 * 저장된 코디 단일 조회
 */
export async function getSavedOutfitById(
  supabase: SupabaseClient,
  id: string
): Promise<SavedOutfit | null> {
  const { data, error } = await supabase.from('saved_outfits').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[Outfits] Failed to get saved outfit:', error);
    throw error;
  }

  return transformRecord(data as SavedOutfitRecord);
}

/**
 * 코디 저장 여부 확인
 */
export async function isOutfitSaved(supabase: SupabaseClient, outfitId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('saved_outfits')
    .select('id')
    .eq('outfit_id', outfitId)
    .maybeSingle();

  if (error) {
    console.error('[Outfits] Failed to check saved outfit:', error);
    return false;
  }

  return !!data;
}

/**
 * 코디 저장
 */
export async function saveOutfit(
  supabase: SupabaseClient,
  clerkUserId: string,
  request: SaveOutfitRequest
): Promise<SavedOutfit> {
  const { data, error } = await supabase
    .from('saved_outfits')
    .insert({
      clerk_user_id: clerkUserId,
      outfit_id: request.outfitId,
      season_type: request.seasonType,
      occasion: request.occasion,
      outfit_snapshot: request.outfit,
      note: request.note || null,
    })
    .select()
    .single();

  if (error) {
    // 중복 저장 시도
    if (error.code === '23505') {
      throw new Error('ALREADY_SAVED');
    }
    console.error('[Outfits] Failed to save outfit:', error);
    throw error;
  }

  return transformRecord(data as SavedOutfitRecord);
}

/**
 * 저장된 코디 삭제
 */
export async function deleteSavedOutfit(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from('saved_outfits').delete().eq('id', id);

  if (error) {
    console.error('[Outfits] Failed to delete saved outfit:', error);
    throw error;
  }

  return true;
}

/**
 * outfit_id로 저장된 코디 삭제 (토글 용도)
 */
export async function deleteSavedOutfitByOutfitId(
  supabase: SupabaseClient,
  outfitId: string
): Promise<boolean> {
  const { error } = await supabase.from('saved_outfits').delete().eq('outfit_id', outfitId);

  if (error) {
    console.error('[Outfits] Failed to delete saved outfit by outfit_id:', error);
    throw error;
  }

  return true;
}

/**
 * 저장된 코디 메모 업데이트
 */
export async function updateSavedOutfitNote(
  supabase: SupabaseClient,
  id: string,
  note: string | null
): Promise<SavedOutfit> {
  const { data, error } = await supabase
    .from('saved_outfits')
    .update({ note })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Outfits] Failed to update note:', error);
    throw error;
  }

  return transformRecord(data as SavedOutfitRecord);
}

/**
 * 저장된 코디 개수 조회
 */
export async function getSavedOutfitsCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('saved_outfits')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[Outfits] Failed to get count:', error);
    return 0;
  }

  return count || 0;
}
