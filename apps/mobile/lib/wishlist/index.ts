/**
 * 위시리스트 모듈
 *
 * 사용자 찜하기/위시리스트 CRUD
 *
 * @module lib/wishlist
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  clerk_user_id: string;
  product_id: string;
  note: string | null;
  priority: WishlistPriority;
  created_at: string;
}

export type WishlistPriority = 'high' | 'medium' | 'low';

export interface AddToWishlistInput {
  product_id: string;
  note?: string;
  priority?: WishlistPriority;
}

// ─── 조회 ───────────────────────────────────────────

/**
 * 위시리스트 조회
 */
export async function getWishlist(
  supabase: SupabaseClient,
  userId: string,
  limit = 50
): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('id, clerk_user_id, product_id, note, priority, created_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`위시리스트 조회 실패: ${error.message}`);
  return (data ?? []) as WishlistItem[];
}

/**
 * 위시리스트 포함 여부 확인
 */
export async function isInWishlist(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<boolean> {
  const { count } = await supabase
    .from('wishlist')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .eq('product_id', productId);

  return (count ?? 0) > 0;
}

/**
 * 위시리스트 수 조회
 */
export async function getWishlistCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('wishlist')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId);

  return count ?? 0;
}

// ─── 추가/삭제 ──────────────────────────────────────

/**
 * 위시리스트에 추가
 */
export async function addToWishlist(
  supabase: SupabaseClient,
  userId: string,
  input: AddToWishlistInput
): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist')
    .insert({
      clerk_user_id: userId,
      product_id: input.product_id,
      note: input.note ?? null,
      priority: input.priority ?? 'medium',
    })
    .select()
    .single();

  if (error) throw new Error(`위시리스트 추가 실패: ${error.message}`);
  return data as WishlistItem;
}

/**
 * 위시리스트에서 삭제
 */
export async function removeFromWishlist(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<void> {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('product_id', productId);

  if (error) throw new Error(`위시리스트 삭제 실패: ${error.message}`);
}

/**
 * 위시리스트 토글 (있으면 삭제, 없으면 추가)
 */
export async function toggleWishlist(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<boolean> {
  const exists = await isInWishlist(supabase, userId, productId);
  if (exists) {
    await removeFromWishlist(supabase, userId, productId);
    return false;
  }
  await addToWishlist(supabase, userId, { product_id: productId });
  return true;
}

/**
 * 위시리스트 메모 수정
 */
export async function updateWishlistNote(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  note: string
): Promise<void> {
  const { error } = await supabase
    .from('wishlist')
    .update({ note })
    .eq('clerk_user_id', userId)
    .eq('product_id', productId);

  if (error) throw new Error(`메모 수정 실패: ${error.message}`);
}

// ─── 우선순위 라벨 ──────────────────────────────────

export const PRIORITY_LABELS: Record<WishlistPriority, string> = {
  high: '꼭 사고 싶어요',
  medium: '관심 있어요',
  low: '나중에 볼게요',
};
