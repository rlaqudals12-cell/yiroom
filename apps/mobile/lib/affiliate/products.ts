/**
 * 어필리에이트 제품 Repository
 * @description 제품 조회, 필터링, 매칭 함수 (모바일 앱용)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AffiliateProduct,
  AffiliateProductRow,
  AffiliateProductFilter,
  AffiliateProductSortBy,
  AffiliatePartnerName,
  AffiliateSkinType,
  AffiliatePersonalColor,
  AffiliateBodyType,
} from './types';

/**
 * DB Row → 앱 타입 변환
 */
function mapProductRow(row: AffiliateProductRow): AffiliateProduct {
  return {
    id: row.id,
    partnerId: row.partner_id,
    externalId: row.external_product_id,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    subcategory: row.subcategory ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    price: row.price_krw ?? 0,
    originalPrice: row.price_original_krw ?? undefined,
    currency: row.currency,
    affiliateUrl: row.affiliate_url,
    productUrl: row.direct_url ?? row.affiliate_url,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    skinTypes: row.skin_types as AffiliateSkinType[] | undefined,
    skinConcerns: row.skin_concerns as AffiliateProduct['skinConcerns'],
    personalColors: row.personal_colors as AffiliatePersonalColor[] | undefined,
    bodyTypes: row.body_types as AffiliateBodyType[] | undefined,
    keywords: row.keywords ?? undefined,
    tags: row.tags ?? undefined,
    isAvailable: row.is_in_stock && row.is_active,
  };
}

/**
 * 제품 목록 조회 (필터/정렬/페이징)
 * @param supabase - Clerk 통합 Supabase 클라이언트
 */
export async function getAffiliateProducts(
  supabase: SupabaseClient,
  filter?: AffiliateProductFilter,
  sortBy: AffiliateProductSortBy = 'rating',
  limit = 20,
  offset = 0
): Promise<AffiliateProduct[]> {
  let query = supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true);

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
      query = query.order('review_count', {
        ascending: false,
        nullsFirst: false,
      });
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
    console.error('[Mobile Affiliate] 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 제품 ID로 단일 조회
 */
export async function getAffiliateProductById(
  supabase: SupabaseClient,
  id: string
): Promise<AffiliateProduct | null> {
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('[Mobile Affiliate] 제품 조회 실패:', error);
    return null;
  }

  return mapProductRow(data as AffiliateProductRow);
}

/**
 * 파트너별 제품 조회
 */
export async function getAffiliateProductsByPartner(
  supabase: SupabaseClient,
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
    console.error('[Mobile Affiliate] 파트너 조회 실패:', partnerError);
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
    console.error('[Mobile Affiliate] 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 피부 분석 기반 추천 제품
 */
export async function getRecommendedProductsBySkin(
  supabase: SupabaseClient,
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
    console.error('[Mobile Affiliate] 추천 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 퍼스널 컬러 기반 추천 제품
 */
export async function getRecommendedProductsByColor(
  supabase: SupabaseClient,
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
    console.error('[Mobile Affiliate] 추천 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 체형 기반 추천 제품
 */
export async function getRecommendedProductsByBodyType(
  supabase: SupabaseClient,
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
    console.error('[Mobile Affiliate] 추천 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 제품 검색 (키워드)
 */
export async function searchAffiliateProducts(
  supabase: SupabaseClient,
  keyword: string,
  limit = 20
): Promise<AffiliateProduct[]> {
  // 이름, 브랜드, 설명에서 검색
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .or(
      `name.ilike.%${keyword}%,brand.ilike.%${keyword}%,description.ilike.%${keyword}%`
    )
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('[Mobile Affiliate] 제품 검색 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 인기 제품 조회 (리뷰 수 기준)
 */
export async function getPopularAffiliateProducts(
  supabase: SupabaseClient,
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
    console.error('[Mobile Affiliate] 인기 제품 조회 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}

/**
 * 카테고리별 제품 조회 (Mock 포함)
 * DB에 제품이 없을 경우 Mock 데이터 반환
 */
export async function getProductsByCategory(
  supabase: SupabaseClient,
  category: string,
  limit = 20
): Promise<AffiliateProduct[]> {
  const products = await getAffiliateProducts(
    supabase,
    { category, inStockOnly: true },
    'rating',
    limit
  );

  // DB에 제품이 없으면 Mock 데이터 반환
  if (products.length === 0) {
    return getMockProductsByCategory(category, limit);
  }

  return products;
}

/**
 * Mock 제품 데이터 (DB 미연동 시 Fallback)
 */
function getMockProductsByCategory(
  category: string,
  limit: number
): AffiliateProduct[] {
  const mockProducts: Record<string, AffiliateProduct[]> = {
    skincare: [
      {
        id: 'mock-1',
        partnerId: 'mock',
        externalId: 'mock-1',
        name: '수분 크림 리치',
        brand: '아이오페',
        price: 35000,
        currency: 'KRW',
        imageUrl: 'https://via.placeholder.com/150',
        productUrl: 'https://example.com/product/1',
        affiliateUrl: 'https://example.com/product/1',
        rating: 4.5,
        reviewCount: 120,
        skinTypes: ['dry'],
        tags: ['건성', '보습', '히알루론산'],
        isAvailable: true,
      },
      {
        id: 'mock-2',
        partnerId: 'mock',
        externalId: 'mock-2',
        name: '톤업 선크림 SPF50+',
        brand: '라운드랩',
        price: 18000,
        currency: 'KRW',
        imageUrl: 'https://via.placeholder.com/150',
        productUrl: 'https://example.com/product/2',
        affiliateUrl: 'https://example.com/product/2',
        rating: 4.7,
        reviewCount: 89,
        personalColors: ['spring_warm'],
        tags: ['자외선차단', '무자극', '봄웜톤'],
        isAvailable: true,
      },
    ],
    makeup: [
      {
        id: 'mock-3',
        partnerId: 'mock',
        externalId: 'mock-3',
        name: '코랄 립스틱',
        brand: '롬앤',
        price: 12000,
        currency: 'KRW',
        imageUrl: 'https://via.placeholder.com/150',
        productUrl: 'https://example.com/product/3',
        affiliateUrl: 'https://example.com/product/3',
        rating: 4.8,
        reviewCount: 256,
        personalColors: ['spring_warm'],
        tags: ['봄웜톤', '코랄', '데일리'],
        isAvailable: true,
      },
    ],
    supplement: [
      {
        id: 'mock-5',
        partnerId: 'mock',
        externalId: 'mock-5',
        name: '멀티비타민',
        brand: '센트룸',
        price: 28000,
        currency: 'KRW',
        imageUrl: 'https://via.placeholder.com/150',
        productUrl: 'https://example.com/product/5',
        affiliateUrl: 'https://example.com/product/5',
        rating: 4.6,
        reviewCount: 340,
        tags: ['종합비타민', '에너지', '면역력'],
        isAvailable: true,
      },
    ],
    equipment: [
      {
        id: 'mock-7',
        partnerId: 'mock',
        externalId: 'mock-7',
        name: '요가매트 6mm',
        brand: '만두카',
        price: 45000,
        currency: 'KRW',
        imageUrl: 'https://via.placeholder.com/150',
        productUrl: 'https://example.com/product/7',
        affiliateUrl: 'https://example.com/product/7',
        rating: 4.9,
        reviewCount: 78,
        bodyTypes: ['wave'],
        tags: ['요가', '필라테스', '미끄럼방지'],
        isAvailable: true,
      },
    ],
  };

  const products = mockProducts[category] || [];
  return products.slice(0, limit);
}
