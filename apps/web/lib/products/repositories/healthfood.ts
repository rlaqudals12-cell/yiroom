/**
 * 건강식품 Repository
 * @description 건강식품 제품 CRUD 함수
 */

import { supabase } from '@/lib/supabase/client';
import type {
  HealthFood,
  HealthFoodRow,
  HealthFoodFilter,
  HealthFoodBenefit,
  DietaryInfo,
  TargetUser,
} from '@/types/product';

// 타입 변환 함수
export function mapHealthFoodRow(row: HealthFoodRow): HealthFood {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as HealthFood['category'],
    subcategory: row.subcategory ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    pricePerServing: row.price_per_serving ?? undefined,
    servingSize: row.serving_size ?? undefined,
    servingsPerContainer: row.servings_per_container ?? undefined,
    caloriesPerServing: row.calories_per_serving ?? undefined,
    proteinG: row.protein_g ?? undefined,
    carbsG: row.carbs_g ?? undefined,
    sugarG: row.sugar_g ?? undefined,
    fatG: row.fat_g ?? undefined,
    fiberG: row.fiber_g ?? undefined,
    sodiumMg: row.sodium_mg ?? undefined,
    additionalNutrients: row.additional_nutrients ?? undefined,
    flavorOptions: row.flavor_options ?? undefined,
    dietaryInfo: row.dietary_info as DietaryInfo[] | undefined,
    allergens: row.allergens ?? undefined,
    benefits: row.benefits as HealthFoodBenefit[] | undefined,
    bestTime: row.best_time as HealthFood['bestTime'],
    targetUsers: row.target_users as TargetUser[] | undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    affiliateUrl: row.affiliate_url ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    features: row.features ?? undefined,
    tasteRating: row.taste_rating ?? undefined,
    mixabilityRating: row.mixability_rating ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 건강식품 목록 조회
 * @param filter 필터 옵션
 * @param limit 최대 개수 (기본 50)
 */
export async function getHealthFoods(
  filter?: HealthFoodFilter,
  limit = 50
): Promise<HealthFood[]> {
  let query = supabase
    .from('health_foods')
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

  if (filter?.maxCalories) {
    query = query.lte('calories_per_serving', filter.maxCalories);
  }

  if (filter?.minProtein) {
    query = query.gte('protein_g', filter.minProtein);
  }

  if (filter?.minRating) {
    query = query.gte('rating', filter.minRating);
  }

  // 배열 필터 (overlaps)
  if (filter?.benefits && filter.benefits.length > 0) {
    query = query.overlaps('benefits', filter.benefits);
  }

  if (filter?.dietaryInfo && filter.dietaryInfo.length > 0) {
    query = query.contains('dietary_info', filter.dietaryInfo);
  }

  if (filter?.targetUsers && filter.targetUsers.length > 0) {
    query = query.overlaps('target_users', filter.targetUsers);
  }

  const { data, error } = await query.order('rating', { ascending: false });

  if (error) {
    console.error('건강식품 조회 실패:', error);
    return [];
  }

  return (data as HealthFoodRow[]).map(mapHealthFoodRow);
}

/**
 * 건강식품 단일 조회
 * @param id 제품 ID
 */
export async function getHealthFoodById(
  id: string
): Promise<HealthFood | null> {
  const { data, error } = await supabase
    .from('health_foods')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('건강식품 조회 실패:', error);
    return null;
  }

  return mapHealthFoodRow(data as HealthFoodRow);
}

/**
 * 목표/식이 정보 기반 건강식품 추천
 * @param benefits 원하는 효능
 * @param dietaryInfo 식이 정보 (비건, 글루텐프리 등)
 * @param targetUsers 타겟 사용자
 */
export async function getRecommendedHealthFoods(
  benefits?: HealthFoodBenefit[],
  dietaryInfo?: DietaryInfo[],
  targetUsers?: TargetUser[]
): Promise<HealthFood[]> {
  let query = supabase
    .from('health_foods')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(20);

  if (benefits && benefits.length > 0) {
    query = query.overlaps('benefits', benefits);
  }

  if (dietaryInfo && dietaryInfo.length > 0) {
    query = query.contains('dietary_info', dietaryInfo);
  }

  if (targetUsers && targetUsers.length > 0) {
    query = query.overlaps('target_users', targetUsers);
  }

  const { data, error } = await query;

  if (error) {
    console.error('추천 건강식품 조회 실패:', error);
    return [];
  }

  return (data as HealthFoodRow[]).map(mapHealthFoodRow);
}

/**
 * 고단백 건강식품 조회
 * @param minProtein 최소 단백질 (g)
 * @param maxCalories 최대 칼로리 (선택)
 */
export async function getHighProteinFoods(
  minProtein = 20,
  maxCalories?: number
): Promise<HealthFood[]> {
  let query = supabase
    .from('health_foods')
    .select('*')
    .eq('is_active', true)
    .gte('protein_g', minProtein)
    .order('protein_g', { ascending: false })
    .limit(20);

  if (maxCalories) {
    query = query.lte('calories_per_serving', maxCalories);
  }

  const { data, error } = await query;

  if (error) {
    console.error('고단백 식품 조회 실패:', error);
    return [];
  }

  return (data as HealthFoodRow[]).map(mapHealthFoodRow);
}

/**
 * 건강식품 브랜드 목록 조회
 */
export async function getHealthFoodBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('health_foods')
    .select('brand')
    .eq('is_active', true);

  if (error) {
    console.error('브랜드 조회 실패:', error);
    return [];
  }

  const brands = [...new Set(data.map((d) => d.brand))];
  return brands.sort();
}
