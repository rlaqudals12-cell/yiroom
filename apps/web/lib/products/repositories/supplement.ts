/**
 * 영양제 Repository
 * @description 영양제 제품 CRUD 함수
 */

import { supabase } from '@/lib/supabase/client';
import type {
  SupplementProduct,
  SupplementProductRow,
  SupplementProductFilter,
  SupplementBenefit,
} from '@/types/product';

// 타입 변환 함수
export function mapSupplementRow(row: SupplementProductRow): SupplementProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as SupplementProduct['category'],
    benefits: row.benefits as SupplementBenefit[] | undefined,
    mainIngredients: row.main_ingredients ?? undefined,
    targetConcerns: row.target_concerns ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    dosage: row.dosage ?? undefined,
    servingSize: row.serving_size ?? undefined,
    totalServings: row.total_servings ?? undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    warnings: row.warnings ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 영양제 목록 조회
 * @param filter 필터 옵션
 * @param limit 최대 개수 (기본 50)
 */
export async function getSupplementProducts(
  filter?: SupplementProductFilter,
  limit = 50
): Promise<SupplementProduct[]> {
  let query = supabase
    .from('supplement_products')
    .select('*')
    .eq('is_active', true)
    .limit(limit);

  if (filter?.category) {
    query = query.eq('category', filter.category);
  }

  if (filter?.brand) {
    query = query.ilike('brand', `%${filter.brand}%`);
  }

  if (filter?.maxPrice) {
    query = query.lte('price_krw', filter.maxPrice);
  }

  if (filter?.minRating) {
    query = query.gte('rating', filter.minRating);
  }

  if (filter?.benefits && filter.benefits.length > 0) {
    query = query.contains('benefits', filter.benefits);
  }

  if (filter?.targetConcerns && filter.targetConcerns.length > 0) {
    query = query.overlaps('target_concerns', filter.targetConcerns);
  }

  const { data, error } = await query.order('rating', { ascending: false });

  if (error) {
    console.error('영양제 조회 실패:', error);
    return [];
  }

  return (data as SupplementProductRow[]).map(mapSupplementRow);
}

/**
 * 영양제 단일 조회
 * @param id 제품 ID
 */
export async function getSupplementProductById(
  id: string
): Promise<SupplementProduct | null> {
  const { data, error } = await supabase
    .from('supplement_products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('영양제 조회 실패:', error);
    return null;
  }

  return mapSupplementRow(data as SupplementProductRow);
}

/**
 * 피부 고민 기반 영양제 추천
 * @param concerns 피부/건강 고민
 * @param benefits 원하는 효능
 */
export async function getRecommendedSupplements(
  concerns?: string[],
  benefits?: SupplementBenefit[]
): Promise<SupplementProduct[]> {
  let query = supabase
    .from('supplement_products')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(20);

  if (concerns && concerns.length > 0) {
    query = query.overlaps('target_concerns', concerns);
  }

  if (benefits && benefits.length > 0) {
    query = query.contains('benefits', benefits);
  }

  const { data, error } = await query;

  if (error) {
    console.error('추천 영양제 조회 실패:', error);
    return [];
  }

  return (data as SupplementProductRow[]).map(mapSupplementRow);
}

/**
 * 영양제 브랜드 목록 조회
 */
export async function getSupplementBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('supplement_products')
    .select('brand')
    .eq('is_active', true);

  if (error) {
    console.error('브랜드 조회 실패:', error);
    return [];
  }

  const brands = [...new Set(data.map((d) => d.brand))];
  return brands.sort();
}
