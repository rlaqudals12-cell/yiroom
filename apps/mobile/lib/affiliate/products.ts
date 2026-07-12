/**
 * 어필리에이트 제품 Repository
 * @description 제품 검색 함수 (모바일 앱용)
 *
 * @note 목록/추천 조회는 affiliate_products(prod 0행) 대신 cosmetic_products로 재배선됨
 *   (lib/products/repositories/cosmetic.ts). 여기 남은 searchAffiliateProducts는
 *   바코드/제품 검색 브리지용으로 보존한다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AffiliateProduct,
  AffiliateProductRow,
  AffiliateSkinType,
  AffiliatePersonalColor,
  AffiliateBodyType,
} from './types';
import { affiliateLogger } from '../utils/logger';

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
    .or(`name.ilike.%${keyword}%,brand.ilike.%${keyword}%,description.ilike.%${keyword}%`)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error(' 제품 검색 실패:', error);
    return [];
  }

  return (data as AffiliateProductRow[]).map(mapProductRow);
}
