/**
 * 화장품 Repository
 * @description 화장품 제품 CRUD 함수
 */

import { supabase } from '@/lib/supabase/client';
import { productLogger } from '@/lib/utils/logger';
import type {
  CosmeticProduct,
  CosmeticProductRow,
  CosmeticProductFilter,
  SkinType,
  SkinConcern,
  PersonalColorSeason,
  HairType,
  ScalpType,
  FaceShape,
  Undertone,
} from '@/types/product';

// 타입 변환 함수
export function mapCosmeticRow(row: CosmeticProductRow): CosmeticProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as CosmeticProduct['category'],
    subcategory: row.subcategory ?? undefined,
    priceRange: row.price_range as CosmeticProduct['priceRange'],
    priceKrw: row.price_krw ?? undefined,
    skinTypes: row.skin_types as SkinType[] | undefined,
    concerns: row.concerns as SkinConcern[] | undefined,
    keyIngredients: row.key_ingredients ?? undefined,
    avoidIngredients: row.avoid_ingredients ?? undefined,
    personalColorSeasons: row.personal_color_seasons as PersonalColorSeason[] | undefined,
    hairTypes: row.hair_types as HairType[] | undefined,
    scalpTypes: row.scalp_types as ScalpType[] | undefined,
    faceShapes: row.face_shapes as FaceShape[] | undefined,
    undertones: row.undertones as Undertone[] | undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 화장품 목록 조회
 * @param filter 필터 옵션
 * @param limit 최대 개수 (기본 50)
 */
export async function getCosmeticProducts(
  filter?: CosmeticProductFilter,
  limit = 50
): Promise<CosmeticProduct[]> {
  let query = supabase.from('cosmetic_products').select('*').eq('is_active', true).limit(limit);

  if (filter?.category) {
    query = query.eq('category', filter.category);
  }

  if (filter?.subcategory) {
    query = query.eq('subcategory', filter.subcategory);
  }

  if (filter?.brand) {
    query = query.ilike('brand', `%${filter.brand}%`);
  }

  if (filter?.priceRange) {
    query = query.eq('price_range', filter.priceRange);
  }

  if (filter?.minRating) {
    query = query.gte('rating', filter.minRating);
  }

  // 배열 필터 (contains)
  if (filter?.skinTypes && filter.skinTypes.length > 0) {
    query = query.contains('skin_types', filter.skinTypes);
  }

  if (filter?.concerns && filter.concerns.length > 0) {
    query = query.contains('concerns', filter.concerns);
  }

  if (filter?.personalColorSeasons && filter.personalColorSeasons.length > 0) {
    query = query.contains('personal_color_seasons', filter.personalColorSeasons);
  }

  if (filter?.hairTypes && filter.hairTypes.length > 0) {
    query = query.contains('hair_types', filter.hairTypes);
  }

  if (filter?.scalpTypes && filter.scalpTypes.length > 0) {
    query = query.contains('scalp_types', filter.scalpTypes);
  }

  if (filter?.faceShapes && filter.faceShapes.length > 0) {
    query = query.contains('face_shapes', filter.faceShapes);
  }

  if (filter?.undertones && filter.undertones.length > 0) {
    query = query.contains('undertones', filter.undertones);
  }

  const { data, error } = await query.order('rating', { ascending: false });

  if (error) {
    productLogger.error('화장품 조회 실패:', error);
    return [];
  }

  return (data as CosmeticProductRow[]).map(mapCosmeticRow);
}

/**
 * 세분류(category) 배열로 화장품 목록 조회
 *
 * 왜: 모바일 대분류 필터(skincare/makeup/...)는 여러 세분류에 대응한다
 * (예: skincare = cleanser,toner,serum,...). 대분류→세분류 매핑(category-map)을
 * 거친 배열을 `.in()`으로 한 번에 조회한다.
 * @param categories cosmetic_products.category 값 배열
 * @param limit 최대 개수 (기본 50)
 */
export async function getCosmeticProductsByCategories(
  categories: string[],
  limit = 50
): Promise<CosmeticProduct[]> {
  // 빈 배열이면 필터 없이 전체 조회 (대분류 미선택/미매핑 상황)
  if (categories.length === 0) {
    return getCosmeticProducts(undefined, limit);
  }

  const { data, error } = await supabase
    .from('cosmetic_products')
    .select('*')
    .eq('is_active', true)
    .in('category', categories)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    productLogger.error('화장품 카테고리 조회 실패:', error);
    return [];
  }

  return (data as CosmeticProductRow[]).map(mapCosmeticRow);
}

/**
 * 피부 타입 기반 화장품 추천 (분석 결과 → 제품)
 *
 * 왜: affiliate_products(0행)를 대체. cosmetic_products의 skin_types(dry/oily/...)와
 * 사용자 피부 타입을 교집합(overlaps)으로 매칭하고, 고민(concerns)이 있으면 함께 좁힌다.
 * @param skinType 사용자 피부 타입
 * @param concerns 피부 고민(선택)
 * @param limit 최대 개수 (기본 10)
 */
export async function getCosmeticsBySkinType(
  skinType: SkinType,
  concerns?: SkinConcern[],
  limit = 10
): Promise<CosmeticProduct[]> {
  let query = supabase
    .from('cosmetic_products')
    .select('*')
    .eq('is_active', true)
    .overlaps('skin_types', [skinType]);

  if (concerns && concerns.length > 0) {
    query = query.overlaps('concerns', concerns);
  }

  const { data, error } = await query.order('rating', { ascending: false }).limit(limit);

  if (error) {
    productLogger.error('피부 타입 추천 조회 실패:', error);
    return [];
  }

  return (data as CosmeticProductRow[]).map(mapCosmeticRow);
}

/**
 * 퍼스널 컬러 시즌 기반 화장품 추천 (메이크업 등)
 *
 * 왜: cosmetic_products의 personal_color_seasons는 'Spring'|'Summer'|'Autumn'|'Winter'로
 * 저장되므로, 시즌 값을 그대로 overlaps 매칭한다. 시즌 정규화는 호출부에서 수행.
 * @param season 퍼스널 컬러 시즌
 * @param limit 최대 개수 (기본 10)
 */
export async function getCosmeticsByPersonalColor(
  season: PersonalColorSeason,
  limit = 10
): Promise<CosmeticProduct[]> {
  const { data, error } = await supabase
    .from('cosmetic_products')
    .select('*')
    .eq('is_active', true)
    .overlaps('personal_color_seasons', [season])
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    productLogger.error('퍼스널 컬러 추천 조회 실패:', error);
    return [];
  }

  return (data as CosmeticProductRow[]).map(mapCosmeticRow);
}

/**
 * 화장품 단일 조회
 * @param id 제품 ID
 */
export async function getCosmeticProductById(id: string): Promise<CosmeticProduct | null> {
  const { data, error } = await supabase
    .from('cosmetic_products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    productLogger.error('화장품 조회 실패:', error);
    return null;
  }

  return mapCosmeticRow(data as CosmeticProductRow);
}

/**
 * 피부 타입 기반 화장품 추천
 * @param skinType 피부 타입
 * @param concerns 피부 고민
 * @param personalColor 퍼스널 컬러 (메이크업용)
 */
export async function getRecommendedCosmetics(
  skinType: SkinType,
  concerns?: SkinConcern[],
  personalColor?: PersonalColorSeason
): Promise<CosmeticProduct[]> {
  let query = supabase
    .from('cosmetic_products')
    .select('*')
    .eq('is_active', true)
    .contains('skin_types', [skinType])
    .order('rating', { ascending: false })
    .limit(20);

  if (concerns && concerns.length > 0) {
    query = query.overlaps('concerns', concerns);
  }

  if (personalColor) {
    query = query.contains('personal_color_seasons', [personalColor]);
  }

  const { data, error } = await query;

  if (error) {
    productLogger.error('추천 화장품 조회 실패:', error);
    return [];
  }

  return (data as CosmeticProductRow[]).map(mapCosmeticRow);
}

/**
 * 화장품 브랜드 목록 조회
 */
export async function getCosmeticBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('cosmetic_products')
    .select('brand')
    .eq('is_active', true);

  if (error) {
    productLogger.error('브랜드 조회 실패:', error);
    return [];
  }

  // 중복 제거
  const brands = [...new Set(data.map((d) => d.brand))];
  return brands.sort();
}
