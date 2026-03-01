/**
 * 제품 레포지토리 모듈
 *
 * Supabase 기반 제품 CRUD, 리뷰, 카테고리 조회
 *
 * @module lib/products
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export type ProductCategory =
  | 'cosmetic'
  | 'supplement'
  | 'equipment'
  | 'health_food';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number | null;
  image_url: string | null;
  description: string | null;
  ingredients: string[] | null;
  rating: number | null;
  review_count: number;
  affiliate_url: string | null;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  clerk_user_id: string;
  rating: number;
  content: string | null;
  created_at: string;
}

export interface ProductFilter {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  source: string;
  recorded_at: string;
}

// ─── 제품 조회 ──────────────────────────────────────

/**
 * 제품 목록 조회
 */
export async function getProducts(
  supabase: SupabaseClient,
  filter: ProductFilter = {}
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.category) query = query.eq('category', filter.category);
  if (filter.minPrice != null) query = query.gte('price', filter.minPrice);
  if (filter.maxPrice != null) query = query.lte('price', filter.maxPrice);
  if (filter.minRating != null) query = query.gte('rating', filter.minRating);
  if (filter.search) query = query.ilike('name', `%${filter.search}%`);
  if (filter.limit) query = query.limit(filter.limit);
  if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit ?? 20) - 1);

  const { data, error } = await query;
  if (error) throw new Error(`제품 조회 실패: ${error.message}`);
  return (data ?? []) as Product[];
}

/**
 * 제품 단건 조회
 */
export async function getProductById(
  supabase: SupabaseClient,
  productId: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) return null;
  return data as Product;
}

/**
 * 카테고리별 제품 수 조회
 */
export async function getProductCountByCategory(
  supabase: SupabaseClient
): Promise<Record<ProductCategory, number>> {
  const categories: ProductCategory[] = ['cosmetic', 'supplement', 'equipment', 'health_food'];
  const counts: Record<string, number> = {};

  for (const cat of categories) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat);
    counts[cat] = count ?? 0;
  }

  return counts as Record<ProductCategory, number>;
}

// ─── 리뷰 ───────────────────────────────────────────

/**
 * 제품 리뷰 조회
 */
export async function getProductReviews(
  supabase: SupabaseClient,
  productId: string,
  limit = 20
): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, product_id, clerk_user_id, rating, content, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`리뷰 조회 실패: ${error.message}`);
  return (data ?? []) as ProductReview[];
}

/**
 * 리뷰 작성
 */
export async function createReview(
  supabase: SupabaseClient,
  review: Omit<ProductReview, 'id' | 'created_at'>
): Promise<ProductReview> {
  const { data, error } = await supabase
    .from('product_reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw new Error(`리뷰 작성 실패: ${error.message}`);
  return data as ProductReview;
}

// ─── 가격 히스토리 ──────────────────────────────────

/**
 * 최저가 조회
 */
export async function getLowestPrice(
  supabase: SupabaseClient,
  productId: string
): Promise<number | null> {
  const { data } = await supabase
    .from('price_history')
    .select('price')
    .eq('product_id', productId)
    .order('price', { ascending: true })
    .limit(1)
    .single();

  return data?.price ?? null;
}

// ─── 카테고리 라벨 ──────────────────────────────────

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cosmetic: '화장품',
  supplement: '영양제',
  equipment: '운동기구',
  health_food: '건강식품',
};
