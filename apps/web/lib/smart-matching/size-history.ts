/**
 * 사이즈 기록 Repository
 * @description 브랜드별 사이즈 구매/착용 기록 관리
 */

import { supabase } from '@/lib/supabase/client';
import type {
  UserSizeHistory,
  UserSizeHistoryDB,
  SizeFit,
} from '@/types/smart-matching';
import { mapSizeHistoryRow } from '@/types/smart-matching';

/**
 * 사용자의 전체 사이즈 기록 조회
 */
export async function getSizeHistory(clerkUserId: string): Promise<UserSizeHistory[]> {
  const { data, error } = await supabase
    .from('user_size_history')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as UserSizeHistoryDB[]).map(mapSizeHistoryRow);
}

/**
 * 브랜드별 사이즈 기록 조회
 */
export async function getSizeHistoryByBrand(
  clerkUserId: string,
  brandId: string
): Promise<UserSizeHistory[]> {
  const { data, error } = await supabase
    .from('user_size_history')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as UserSizeHistoryDB[]).map(mapSizeHistoryRow);
}

/**
 * 카테고리별 사이즈 기록 조회
 */
export async function getSizeHistoryByCategory(
  clerkUserId: string,
  category: string
): Promise<UserSizeHistory[]> {
  const { data, error } = await supabase
    .from('user_size_history')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as UserSizeHistoryDB[]).map(mapSizeHistoryRow);
}

/**
 * 사이즈 기록 추가
 */
export async function addSizeHistory(input: {
  clerkUserId: string;
  brandId: string;
  brandName: string;
  category: string;
  size: string;
  fit?: SizeFit;
  productId?: string;
  purchaseDate?: Date;
}): Promise<UserSizeHistory | null> {
  const { data, error } = await supabase
    .from('user_size_history')
    .insert({
      clerk_user_id: input.clerkUserId,
      brand_id: input.brandId,
      brand_name: input.brandName,
      category: input.category,
      size: input.size,
      fit: input.fit ?? null,
      product_id: input.productId ?? null,
      purchase_date: input.purchaseDate?.toISOString().split('T')[0] ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[SizeHistory] 추가 실패:', error);
    return null;
  }

  return mapSizeHistoryRow(data as UserSizeHistoryDB);
}

/**
 * 사이즈 핏 피드백 업데이트
 */
export async function updateSizeFit(
  historyId: string,
  fit: SizeFit
): Promise<boolean> {
  const { error } = await supabase
    .from('user_size_history')
    .update({ fit })
    .eq('id', historyId);

  if (error) {
    console.error('[SizeHistory] 핏 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * 사이즈 기록 삭제
 */
export async function deleteSizeHistory(historyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_size_history')
    .delete()
    .eq('id', historyId);

  if (error) {
    console.error('[SizeHistory] 삭제 실패:', error);
    return false;
  }

  return true;
}

/**
 * 브랜드별 가장 최근 사이즈 조회
 * @description 사이즈 추천에 활용
 */
export async function getLatestSizeByBrand(
  clerkUserId: string,
  brandId: string,
  category: string
): Promise<UserSizeHistory | null> {
  const { data, error } = await supabase
    .from('user_size_history')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('brand_id', brandId)
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return mapSizeHistoryRow(data as UserSizeHistoryDB);
}

/**
 * 핏이 좋았던 사이즈 기록들 조회
 * @description 사이즈 추천 정확도 향상용
 */
export async function getPerfectFitHistory(
  clerkUserId: string,
  category?: string
): Promise<UserSizeHistory[]> {
  let query = supabase
    .from('user_size_history')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('fit', 'perfect');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as UserSizeHistoryDB[]).map(mapSizeHistoryRow);
}
