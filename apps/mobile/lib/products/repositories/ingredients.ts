/**
 * 화장품 성분 Repository
 * @description cosmetic_ingredients 테이블 CRUD 및 분석 함수
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CosmeticIngredient,
  CosmeticIngredientRow,
  ProductIngredientAnalysis,
  IngredientCategory,
  EWGDistribution,
} from '@/types/ingredient';
import { toCosmeticIngredient, getEWGLevel } from '@/types/ingredient';

// =============================================================================
// 단일 성분 조회
// =============================================================================

/**
 * ID로 성분 조회
 */
export async function getIngredientById(
  supabase: SupabaseClient,
  id: string
): Promise<CosmeticIngredient | null> {
  const { data, error } = await supabase
    .from('cosmetic_ingredients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('[Ingredients] getIngredientById error:', error);
    return null;
  }

  return toCosmeticIngredient(data as CosmeticIngredientRow);
}

/**
 * 이름으로 성분 검색 (한글/영문/INCI)
 */
export async function searchIngredients(
  supabase: SupabaseClient,
  query: string,
  options?: {
    limit?: number;
    category?: IngredientCategory;
  }
): Promise<CosmeticIngredient[]> {
  const { limit = 20, category } = options || {};

  let queryBuilder = supabase
    .from('cosmetic_ingredients')
    .select('*')
    .or(`name_ko.ilike.%${query}%,name_en.ilike.%${query}%,name_inci.ilike.%${query}%`)
    .limit(limit);

  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('[Ingredients] searchIngredients error:', error);
    return [];
  }

  return (data || []).map((row) => toCosmeticIngredient(row as CosmeticIngredientRow));
}

// =============================================================================
// 제품 성분 조회
// =============================================================================

/**
 * 제품의 성분 목록 조회
 */
export async function getProductIngredients(
  supabase: SupabaseClient,
  productId: string
): Promise<CosmeticIngredient[]> {
  const { data, error } = await supabase
    .from('cosmetic_product_ingredients')
    .select(
      `
      order_index,
      purpose,
      concentration_level,
      ingredient:cosmetic_ingredients(*)
    `
    )
    .eq('product_id', productId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[Ingredients] getProductIngredients error:', error);
    return [];
  }

  return (data || [])
    .filter((row) => row.ingredient)
    .map((row) => toCosmeticIngredient(row.ingredient as unknown as CosmeticIngredientRow));
}

// =============================================================================
// 특수 성분 목록 조회
// =============================================================================

/**
 * 20가지 주의 성분 조회
 */
export async function getCaution20Ingredients(
  supabase: SupabaseClient
): Promise<CosmeticIngredient[]> {
  const { data, error } = await supabase
    .from('cosmetic_ingredients')
    .select('*')
    .eq('is_caution_20', true)
    .order('ewg_score', { ascending: false });

  if (error) {
    console.error('[Ingredients] getCaution20Ingredients error:', error);
    return [];
  }

  return (data || []).map((row) => toCosmeticIngredient(row as CosmeticIngredientRow));
}

/**
 * 알레르기 유발 성분 조회
 */
export async function getAllergenIngredients(
  supabase: SupabaseClient
): Promise<CosmeticIngredient[]> {
  const { data, error } = await supabase
    .from('cosmetic_ingredients')
    .select('*')
    .eq('is_allergen', true)
    .order('ewg_score', { ascending: false });

  if (error) {
    console.error('[Ingredients] getAllergenIngredients error:', error);
    return [];
  }

  return (data || []).map((row) => toCosmeticIngredient(row as CosmeticIngredientRow));
}

/**
 * 카테고리별 성분 조회
 */
export async function getIngredientsByCategory(
  supabase: SupabaseClient,
  category: IngredientCategory,
  limit: number = 50
): Promise<CosmeticIngredient[]> {
  const { data, error } = await supabase
    .from('cosmetic_ingredients')
    .select('*')
    .eq('category', category)
    .order('name_ko', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Ingredients] getIngredientsByCategory error:', error);
    return [];
  }

  return (data || []).map((row) => toCosmeticIngredient(row as CosmeticIngredientRow));
}

// =============================================================================
// 제품 성분 분석
// =============================================================================

/**
 * 제품 성분 분석 결과 생성
 */
export async function analyzeProductIngredients(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductIngredientAnalysis | null> {
  // 제품 성분 조회
  const ingredients = await getProductIngredients(supabase, productId);

  if (ingredients.length === 0) {
    return null;
  }

  // EWG 등급 분포 계산
  const ewgDistribution: EWGDistribution = {
    low: 0,
    moderate: 0,
    high: 0,
    unknown: 0,
  };

  ingredients.forEach((ing) => {
    const level = getEWGLevel(ing.ewgScore);
    ewgDistribution[level]++;
  });

  // 주의 성분 필터링
  const cautionIngredients = ingredients.filter((ing) => ing.isCaution20);
  const allergenIngredients = ingredients.filter((ing) => ing.isAllergen);

  // 기능별 분포
  const functionBreakdown: Record<string, number> = {};
  ingredients.forEach((ing) => {
    ing.functions.forEach((fn) => {
      functionBreakdown[fn] = (functionBreakdown[fn] || 0) + 1;
    });
  });

  // 카테고리별 분포
  const categoryBreakdown: Record<IngredientCategory, number> = {
    moisturizer: 0,
    whitening: 0,
    antioxidant: 0,
    soothing: 0,
    surfactant: 0,
    preservative: 0,
    sunscreen: 0,
    exfoliant: 0,
    emulsifier: 0,
    fragrance: 0,
    colorant: 0,
    other: 0,
  };

  ingredients.forEach((ing) => {
    if (ing.category in categoryBreakdown) {
      categoryBreakdown[ing.category]++;
    }
  });

  // 피부타입별 호환성 계산
  const skinTypeCompatibility = calculateSkinTypeCompatibility(ingredients);

  return {
    productId,
    totalCount: ingredients.length,
    ewgDistribution,
    cautionIngredients,
    allergenIngredients,
    functionBreakdown,
    categoryBreakdown,
    skinTypeCompatibility,
  };
}

/**
 * 피부타입별 호환성 계산
 */
function calculateSkinTypeCompatibility(
  ingredients: CosmeticIngredient[]
): Record<string, 'good' | 'neutral' | 'caution'> {
  const skinTypes = ['oily', 'dry', 'sensitive', 'combination', 'normal'];
  const result: Record<string, 'good' | 'neutral' | 'caution'> = {};

  skinTypes.forEach((skinType) => {
    let cautionCount = 0;
    let recommendedCount = 0;

    ingredients.forEach((ing) => {
      const caution = ing.skinTypeCaution?.[skinType as keyof typeof ing.skinTypeCaution];
      if (caution === 'caution' || caution === 'avoid') {
        cautionCount++;
      } else if (caution === 'recommended') {
        recommendedCount++;
      }
    });

    // 주의 성분이 2개 이상이면 'caution'
    // 추천 성분이 많으면 'good'
    // 그 외 'neutral'
    if (cautionCount >= 2) {
      result[skinType] = 'caution';
    } else if (recommendedCount >= 3 && cautionCount === 0) {
      result[skinType] = 'good';
    } else {
      result[skinType] = 'neutral';
    }
  });

  return result;
}

// =============================================================================
// 유틸리티
// =============================================================================

/**
 * 성분 존재 여부 확인
 */
export async function ingredientExists(supabase: SupabaseClient, nameKo: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('cosmetic_ingredients')
    .select('*', { count: 'exact', head: true })
    .eq('name_ko', nameKo);

  if (error) {
    console.error('[Ingredients] ingredientExists error:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * 기능별 성분 수 집계
 */
export async function getFunctionCounts(
  supabase: SupabaseClient
): Promise<{ name: string; count: number }[]> {
  // 모든 성분의 functions 조회
  const { data, error } = await supabase.from('cosmetic_ingredients').select('functions');

  if (error) {
    console.error('[Ingredients] getFunctionCounts error:', error);
    return [];
  }

  // 기능별 집계
  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    (row.functions || []).forEach((fn: string) => {
      counts[fn] = (counts[fn] || 0) + 1;
    });
  });

  // 배열로 변환 후 정렬
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
