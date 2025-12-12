/**
 * 위시리스트 API
 * @description 사용자 위시리스트 CRUD 함수
 */

import type { ProductType } from '@/types/product';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WishlistItem {
  id: string;
  clerkUserId: string;
  productType: ProductType;
  productId: string;
  createdAt: string;
}

interface WishlistRow {
  id: string;
  clerk_user_id: string;
  product_type: string;
  product_id: string;
  created_at: string;
}

/**
 * 위시리스트에 제품 추가
 */
export async function addToWishlist(
  supabase: SupabaseClient,
  clerkUserId: string,
  productType: ProductType,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('user_wishlists').insert({
    clerk_user_id: clerkUserId,
    product_type: productType,
    product_id: productId,
  });

  if (error) {
    if (error.code === '23505') {
      // 이미 추가된 제품
      return { success: true };
    }
    console.error('위시리스트 추가 실패:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 위시리스트에서 제품 제거
 */
export async function removeFromWishlist(
  supabase: SupabaseClient,
  clerkUserId: string,
  productType: ProductType,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_wishlists')
    .delete()
    .eq('clerk_user_id', clerkUserId)
    .eq('product_type', productType)
    .eq('product_id', productId);

  if (error) {
    console.error('위시리스트 제거 실패:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 위시리스트 토글 (추가/제거)
 */
export async function toggleWishlist(
  supabase: SupabaseClient,
  clerkUserId: string,
  productType: ProductType,
  productId: string
): Promise<{ success: boolean; isWishlisted: boolean; error?: string }> {
  // 현재 상태 확인
  const isWishlisted = await checkWishlistStatus(supabase, clerkUserId, productType, productId);

  if (isWishlisted) {
    const result = await removeFromWishlist(supabase, clerkUserId, productType, productId);
    return { ...result, isWishlisted: false };
  } else {
    const result = await addToWishlist(supabase, clerkUserId, productType, productId);
    return { ...result, isWishlisted: true };
  }
}

/**
 * 위시리스트 상태 확인
 */
export async function checkWishlistStatus(
  supabase: SupabaseClient,
  clerkUserId: string,
  productType: ProductType,
  productId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_wishlists')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .eq('product_type', productType)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    console.error('위시리스트 상태 확인 실패:', error);
    return false;
  }

  return !!data;
}

/**
 * 사용자의 위시리스트 조회
 */
export async function getUserWishlist(
  supabase: SupabaseClient,
  clerkUserId: string,
  productType?: ProductType
): Promise<WishlistItem[]> {
  let query = supabase
    .from('user_wishlists')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false });

  if (productType) {
    query = query.eq('product_type', productType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('위시리스트 조회 실패:', error);
    return [];
  }

  return (data as WishlistRow[]).map((row) => ({
    id: row.id,
    clerkUserId: row.clerk_user_id,
    productType: row.product_type as ProductType,
    productId: row.product_id,
    createdAt: row.created_at,
  }));
}

/**
 * 여러 제품의 위시리스트 상태 확인 (일괄)
 */
export async function checkWishlistStatusBulk(
  supabase: SupabaseClient,
  clerkUserId: string,
  products: Array<{ productType: ProductType; productId: string }>
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();

  if (products.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from('user_wishlists')
    .select('product_type, product_id')
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('위시리스트 일괄 조회 실패:', error);
    return result;
  }

  const wishlistSet = new Set(
    (data as { product_type: string; product_id: string }[]).map(
      (item) => `${item.product_type}:${item.product_id}`
    )
  );

  for (const product of products) {
    const key = `${product.productType}:${product.productId}`;
    result.set(key, wishlistSet.has(key));
  }

  return result;
}

/**
 * 위시리스트 개수 조회
 */
export async function getWishlistCount(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('user_wishlists')
    .select('*', { count: 'exact', head: true })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('위시리스트 개수 조회 실패:', error);
    return 0;
  }

  return count ?? 0;
}
