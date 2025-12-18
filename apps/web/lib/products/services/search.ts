/**
 * 제품 검색 Service
 * @description 통합 검색/정렬/페이지네이션 기능
 */

import { supabase } from '@/lib/supabase/client';
import type {
  ProductCategory,
  ProductSearchOptions,
  AnyProduct,
  ProductType,
  CosmeticProductRow,
  SupplementProductRow,
  WorkoutEquipmentRow,
  HealthFoodRow,
} from '@/types/product';

import { getCosmeticProducts, mapCosmeticRow } from '../repositories/cosmetic';
import { getSupplementProducts, mapSupplementRow } from '../repositories/supplement';
import { getWorkoutEquipment, mapWorkoutEquipmentRow } from '../repositories/equipment';
import { getHealthFoods, mapHealthFoodRow } from '../repositories/healthfood';

/** 제품 카테고리 정보 상수 */
export const PRODUCT_CATEGORIES: Array<{ id: ProductCategory; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'skincare', label: '스킨케어' },
  { id: 'makeup', label: '메이크업' },
  { id: 'supplement', label: '영양제' },
  { id: 'equipment', label: '운동기구' },
  { id: 'healthfood', label: '건강식품' },
];

/**
 * 카테고리별 제품 조회
 * @param category 제품 카테고리
 * @param options 검색/정렬 옵션
 */
export async function getProductsByCategory(
  category: ProductCategory,
  options?: ProductSearchOptions
): Promise<AnyProduct[]> {
  const limit = options?.limit ?? 20;
  const page = options?.page ?? 1;
  const offset = (page - 1) * limit;

  switch (category) {
    case 'skincare': {
      // 스킨케어 전체 조회 (메이크업 제외)
      const products = await getCosmeticProducts(undefined, limit * 3);
      // 스킨케어 카테고리만 필터링 (메이크업 제외)
      const skincare = products.filter(
        (p) => p.category !== 'makeup'
      );
      return applySortAndPaginate(skincare, options, offset, limit);
    }
    case 'makeup': {
      const products = await getCosmeticProducts({ category: 'makeup' }, limit + offset);
      return applySortAndPaginate(products, options, offset, limit);
    }
    case 'supplement': {
      const products = await getSupplementProducts(undefined, limit + offset);
      return applySortAndPaginate(products, options, offset, limit);
    }
    case 'equipment': {
      const products = await getWorkoutEquipment(undefined, limit + offset);
      return applySortAndPaginate(products, options, offset, limit);
    }
    case 'healthfood': {
      const products = await getHealthFoods(undefined, limit + offset);
      return applySortAndPaginate(products, options, offset, limit);
    }
    case 'all':
    default: {
      // 모든 카테고리에서 균등하게 조회 (화장품/영양제 중심)
      const cosmeticLimit = Math.ceil(limit * 0.5); // 50%
      const supplementLimit = Math.ceil(limit * 0.3); // 30%
      const otherLimit = Math.ceil(limit * 0.1); // 각 10%
      const [cosmetics, supplements, equipment, healthFoods] = await Promise.all([
        getCosmeticProducts(undefined, cosmeticLimit + offset),
        getSupplementProducts(undefined, supplementLimit + offset),
        getWorkoutEquipment(undefined, otherLimit + offset),
        getHealthFoods(undefined, otherLimit + offset),
      ]);
      const all = [...cosmetics, ...supplements, ...equipment, ...healthFoods];
      return applySortAndPaginate(all, options, offset, limit);
    }
  }
}

/**
 * 제품 검색
 * @param query 검색어 (제품명, 브랜드명)
 * @param category 카테고리 필터 (선택)
 * @param limit 최대 개수
 */
export async function searchProducts(
  query: string,
  category?: ProductCategory,
  limit = 20
): Promise<AnyProduct[]> {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [];

  const results: AnyProduct[] = [];

  // 카테고리별 검색
  if (!category || category === 'all' || category === 'skincare' || category === 'makeup') {
    const { data: cosmetics } = await supabase
      .from('cosmetic_products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .limit(limit);

    if (cosmetics) {
      results.push(...(cosmetics as CosmeticProductRow[]).map(mapCosmeticRow));
    }
  }

  if (!category || category === 'all' || category === 'supplement') {
    const { data: supplements } = await supabase
      .from('supplement_products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .limit(limit);

    if (supplements) {
      results.push(...(supplements as SupplementProductRow[]).map(mapSupplementRow));
    }
  }

  if (!category || category === 'all' || category === 'equipment') {
    const { data: equipment } = await supabase
      .from('workout_equipment')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .limit(limit);

    if (equipment) {
      results.push(...(equipment as WorkoutEquipmentRow[]).map(mapWorkoutEquipmentRow));
    }
  }

  if (!category || category === 'all' || category === 'healthfood') {
    const { data: healthFoods } = await supabase
      .from('health_foods')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .limit(limit);

    if (healthFoods) {
      results.push(...(healthFoods as HealthFoodRow[]).map(mapHealthFoodRow));
    }
  }

  return results.slice(0, limit);
}

/**
 * 정렬 및 페이지네이션 적용
 */
function applySortAndPaginate<T extends AnyProduct>(
  products: T[],
  options?: ProductSearchOptions,
  offset = 0,
  limit = 20
): T[] {
  const sorted = [...products];

  // 정렬 적용
  const sortBy = options?.sortBy ?? 'rating';
  switch (sortBy) {
    case 'priceAsc':
      sorted.sort((a, b) => (getPrice(a) ?? 0) - (getPrice(b) ?? 0));
      break;
    case 'priceDesc':
      sorted.sort((a, b) => (getPrice(b) ?? 0) - (getPrice(a) ?? 0));
      break;
    case 'rating':
      sorted.sort((a, b) => (getRating(b) ?? 0) - (getRating(a) ?? 0));
      break;
    case 'popular':
      sorted.sort((a, b) => (getReviewCount(b) ?? 0) - (getReviewCount(a) ?? 0));
      break;
    case 'newest':
      sorted.sort((a, b) => {
        const dateA = getCreatedAt(a);
        const dateB = getCreatedAt(b);
        if (!dateA || !dateB) return 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      break;
    case 'recommended':
    default:
      // 기본: 평점순
      sorted.sort((a, b) => (getRating(b) ?? 0) - (getRating(a) ?? 0));
      break;
  }

  // 페이지네이션 적용
  return sorted.slice(offset, offset + limit);
}

// 헬퍼 함수들
function getPrice(product: AnyProduct): number | undefined {
  return 'priceKrw' in product ? product.priceKrw : undefined;
}

function getRating(product: AnyProduct): number | undefined {
  return 'rating' in product ? product.rating : undefined;
}

function getReviewCount(product: AnyProduct): number | undefined {
  return 'reviewCount' in product ? product.reviewCount : undefined;
}

function getCreatedAt(product: AnyProduct): string | undefined {
  return 'createdAt' in product ? product.createdAt : undefined;
}

/**
 * 제품 타입 판별
 */
export function getProductType(product: AnyProduct): ProductType {
  if ('skinTypes' in product || 'personalColorSeasons' in product) {
    return 'cosmetic';
  }
  if ('benefits' in product && 'mainIngredients' in product) {
    return 'supplement';
  }
  if ('targetMuscles' in product || 'exerciseTypes' in product) {
    return 'workout_equipment';
  }
  if ('caloriesPerServing' in product || 'proteinG' in product) {
    return 'health_food';
  }
  return 'cosmetic'; // 기본값
}

/**
 * 제품 타입과 ID로 제품 단일 조회
 * @param type 제품 타입
 * @param id 제품 ID
 */
export async function getProductById(
  type: ProductType,
  id: string
): Promise<AnyProduct | null> {
  // Lazy import to avoid circular dependency
  const { getCosmeticProductById } = await import('../repositories/cosmetic');
  const { getSupplementProductById } = await import('../repositories/supplement');
  const { getWorkoutEquipmentById } = await import('../repositories/equipment');
  const { getHealthFoodById } = await import('../repositories/healthfood');

  switch (type) {
    case 'cosmetic':
      return getCosmeticProductById(id);
    case 'supplement':
      return getSupplementProductById(id);
    case 'workout_equipment':
      return getWorkoutEquipmentById(id);
    case 'health_food':
      return getHealthFoodById(id);
    default:
      return null;
  }
}

/**
 * ProductType을 URL 경로용 문자열로 변환
 */
export function productTypeToPath(type: ProductType): string {
  switch (type) {
    case 'cosmetic':
      return 'cosmetic';
    case 'supplement':
      return 'supplement';
    case 'workout_equipment':
      return 'equipment';
    case 'health_food':
      return 'healthfood';
    default:
      return 'cosmetic';
  }
}

/**
 * URL 경로 문자열을 ProductType으로 변환
 */
export function pathToProductType(path: string): ProductType | null {
  switch (path) {
    case 'cosmetic':
      return 'cosmetic';
    case 'supplement':
      return 'supplement';
    case 'equipment':
      return 'workout_equipment';
    case 'healthfood':
      return 'health_food';
    default:
      return null;
  }
}
