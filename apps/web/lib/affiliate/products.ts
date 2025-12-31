/**
 * 어필리에이트 제품 Repository
 * @description 제품 조회, 필터링, 매칭 함수
 */

import { supabase } from '@/lib/supabase/client';
import { affiliateLogger } from '@/lib/utils/logger';
import type {
  AffiliateProduct,
  AffiliateProductRow,
  AffiliateProductFilter,
  AffiliateProductSortBy,
  AffiliatePartnerName,
} from '@/types/affiliate';

/**
 * DB Row → 앱 타입 변환
 */
function mapProductRow(row: AffiliateProductRow): AffiliateProduct {
  return {
    id: row.id,
    partnerId: row.partner_id,
    externalProductId: row.external_product_id,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    subcategory: row.subcategory ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageUrls: row.image_urls ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    priceOriginalKrw: row.price_original_krw ?? undefined,
    currency: row.currency,
    affiliateUrl: row.affiliate_url,
    directUrl: row.direct_url ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    skinTypes: row.skin_types as AffiliateProduct['skinTypes'],
    skinConcerns: row.skin_concerns as AffiliateProduct['skinConcerns'],
    personalColors: row.personal_colors as AffiliateProduct['personalColors'],
    bodyTypes: row.body_types as AffiliateProduct['bodyTypes'],
    keywords: row.keywords ?? undefined,
    tags: row.tags ?? undefined,
    isInStock: row.is_in_stock,
    isActive: row.is_active,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 제품 목록 조회 (필터/정렬/페이징)
 */
export async function getAffiliateProducts(
  filter?: AffiliateProductFilter,
  sortBy: AffiliateProductSortBy = 'rating',
  limit = 20,
  offset = 0
): Promise<AffiliateProduct[]> {
  let query = supabase.from('affiliate_products').select('*').eq('is_active', true);

  // 필터 적용
  if (filter?.partnerId) {
    query = query.eq('partner_id', filter.partnerId);
  }

  if (filter?.category) {
    query = query.eq('category', filter.category);
  }

  if (filter?.brand) {
    query = query.ilike('brand', `%${filter.brand}%`);
  }

  if (filter?.inStockOnly) {
    query = query.eq('is_in_stock', true);
  }

  if (filter?.minPrice !== undefined) {
    query = query.gte('price_krw', filter.minPrice);
  }

  if (filter?.maxPrice !== undefined) {
    query = query.lte('price_krw', filter.maxPrice);
  }

  if (filter?.minRating !== undefined) {
    query = query.gte('rating', filter.minRating);
  }

  // 배열 필터 (GIN 인덱스 활용)
  if (filter?.skinTypes && filter.skinTypes.length > 0) {
    query = query.overlaps('skin_types', filter.skinTypes);
  }

  if (filter?.skinConcerns && filter.skinConcerns.length > 0) {
    query = query.overlaps('skin_concerns', filter.skinConcerns);
  }

  if (filter?.personalColors && filter.personalColors.length > 0) {
    query = query.overlaps('personal_colors', filter.personalColors);
  }

  if (filter?.bodyTypes && filter.bodyTypes.length > 0) {
    query = query.overlaps('body_types', filter.bodyTypes);
  }

  if (filter?.keywords && filter.keywords.length > 0) {
    query = query.overlaps('keywords', filter.keywords);
  }

  // 정렬 적용
  switch (sortBy) {
    case 'price_asc':
      query = query.order('price_krw', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price_krw', { ascending: false, nullsFirst: false });
      break;
    case 'popular':
      query = query.order('review_count', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'rating':
    default:
      query = query.order('rating', { ascending: false, nullsFirst: false });
      break;
  }

  // 페이징
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    affiliateLogger.error('제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 제품 ID로 단일 조회
 */
export async function getAffiliateProductById(id: string): Promise<AffiliateProduct | null> {
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    affiliateLogger.error('제품 조회 실패:', error);
    return null;
  }

  return mapProductRow(data as AffiliateProductRow);
}

/**
 * 외부 제품 ID로 조회 (동기화용)
 */
export async function getAffiliateProductByExternalId(
  partnerId: string,
  externalProductId: string
): Promise<AffiliateProduct | null> {
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('external_product_id', externalProductId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProductRow(data as AffiliateProductRow);
}

/**
 * 파트너별 제품 조회
 */
export async function getAffiliateProductsByPartner(
  partnerName: AffiliatePartnerName,
  limit = 20
): Promise<AffiliateProduct[]> {
  // 파트너 ID 조회
  const { data: partner, error: partnerError } = await supabase
    .from('affiliate_partners')
    .select('id')
    .eq('name', partnerName)
    .single();

  if (partnerError || !partner) {
    affiliateLogger.error('파트너 조회 실패:', partnerError);
    return [];
  }

  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('partner_id', partner.id)
    .eq('is_active', true)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error('제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 피부 분석 기반 추천 제품
 */
export async function getRecommendedProductsBySkin(
  skinType: string,
  concerns?: string[],
  limit = 10
): Promise<AffiliateProduct[]> {
  let query = supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .eq('is_in_stock', true)
    .contains('skin_types', [skinType]);

  if (concerns && concerns.length > 0) {
    query = query.overlaps('skin_concerns', concerns);
  }

  const { data, error } = await query
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error('추천 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 퍼스널 컬러 기반 추천 제품
 */
export async function getRecommendedProductsByColor(
  personalColor: string,
  category?: string,
  limit = 10
): Promise<AffiliateProduct[]> {
  let query = supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .eq('is_in_stock', true)
    .contains('personal_colors', [personalColor]);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error('추천 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 체형 기반 추천 제품
 */
export async function getRecommendedProductsByBodyType(
  bodyType: string,
  category?: string,
  limit = 10
): Promise<AffiliateProduct[]> {
  let query = supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .eq('is_in_stock', true)
    .contains('body_types', [bodyType]);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error('추천 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 제품 검색 (키워드)
 */
export async function searchAffiliateProducts(
  keyword: string,
  limit = 20
): Promise<AffiliateProduct[]> {
  // 이름, 브랜드, 설명에서 검색
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${keyword}%,brand.ilike.%${keyword}%,description.ilike.%${keyword}%`)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error('제품 검색 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 인기 제품 조회 (리뷰 수 기준)
 */
export async function getPopularAffiliateProducts(
  category?: string,
  limit = 10
): Promise<AffiliateProduct[]> {
  let query = supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .eq('is_in_stock', true);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query
    .order('review_count', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error('인기 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 제품 총 개수 조회
 */
export async function getAffiliateProductCount(filter?: AffiliateProductFilter): Promise<number> {
  let query = supabase
    .from('affiliate_products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (filter?.partnerId) {
    query = query.eq('partner_id', filter.partnerId);
  }

  if (filter?.category) {
    query = query.eq('category', filter.category);
  }

  if (filter?.inStockOnly) {
    query = query.eq('is_in_stock', true);
  }

  const { count, error } = await query;

  if (error) {
    affiliateLogger.error('제품 개수 조회 실패:', error);
    return 0;
  }

  return count ?? 0;
}
