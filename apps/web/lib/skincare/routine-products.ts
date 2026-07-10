/**
 * 루틴 스텝 → 실제 제품 추천 (cosmetic_products 정본)
 *
 * @module lib/skincare/routine-products
 * @description
 *   루틴 스텝 카테고리별로 실측 카탈로그(cosmetic_products)에서 적합도 상위 제품을 반환한다.
 *
 *   왜 새로 만들었나(ADR-117 후속 수리):
 *   기존 enrichRoutineWithProducts는 getRecommendedProductsBySkin(affiliate_products)을 썼는데
 *   affiliate_products 테이블이 **0건**이라 루틴 제품 추천이 전멸(스텝당 0개·이미지 없음)했다.
 *   반면 cosmetic_products는 2,800+건에 image_url·price·skin_types가 채워져 있다 →
 *   여기로 정본을 옮겨 스텝당 복수(최대 3개) 실제품을 이미지와 함께 노출한다.
 *
 *   정직성:
 *   - 대응 DB 카테고리가 없는 스텝(oil/spot_treatment)은 빈 배열 — 지어내지 않는다.
 *   - 프로필 일치(피부타입·고민)·가격 접근성·평점으로 적합도 정렬. 점수 발명 없음.
 */

import { supabase } from '@/lib/supabase/client';
import type { AffiliateProduct } from '@/types/affiliate';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';
import type { ProductCategory } from '@/types/skincare-routine';

// 루틴 스텝 카테고리 → cosmetic_products.category (실DB 값, 2026-07-10 검증)
// oil/spot_treatment은 대응 DB 카테고리가 없어 미연결(빈 배열 반환 = 결손 슬롯, 정직).
const ROUTINE_CATEGORY_TO_DB: Partial<Record<ProductCategory, string>> = {
  cleanser: 'cleanser',
  toner: 'toner',
  essence: 'essence',
  serum: 'serum',
  ampoule: 'serum',
  cream: 'moisturizer',
  sunscreen: 'sunscreen',
  mask: 'mask',
  eye_cream: 'eye_cream',
};

/** 선별에 필요한 최소 컬럼 */
interface CosmeticRoutineRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_krw: number | null;
  image_url: string | null;
  rating: number | null;
  skin_types: string[] | null;
  concerns: string[] | null;
}

/** cosmetic_products Row → RoutineStep.recommendedProducts가 기대하는 AffiliateProduct 형태 */
function toRoutineProduct(row: CosmeticRoutineRow): AffiliateProduct {
  return {
    id: row.id,
    partnerId: '',
    externalProductId: '',
    name: row.name,
    brand: row.brand,
    category: row.category,
    imageUrl: row.image_url ?? undefined,
    // 루틴 카드가 썸네일을 thumbnailUrl에서 읽음 — image_url을 그대로 사용
    thumbnailUrl: row.image_url ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    currency: 'KRW',
    // 어필리에이트 링크가 아님 — 내부 제품 상세(매칭·성분·구매처)로 연결 (정직)
    affiliateUrl: `/beauty/${row.id}`,
    rating: row.rating ?? undefined,
    isInStock: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 루틴 스텝 카테고리에 맞는 실제 제품을 적합도 순으로 반환 (최대 limit개).
 *
 * @param category 루틴 스텝 카테고리
 * @param skinType 사용자 피부 타입 (일치 시 가산)
 * @param concerns 파생/선택 고민 (제품 concerns와 겹치면 가산)
 * @param limit 최대 개수 (기본 3)
 */
export async function getRoutineProductsByCategory(
  category: ProductCategory,
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  limit = 3
): Promise<AffiliateProduct[]> {
  const dbCategory = ROUTINE_CATEGORY_TO_DB[category];
  if (!dbCategory) return [];

  // 카테고리 일괄 조회(평점순 풀 확보) 후 코드에서 적합도 정렬 — 캡슐 solution-products와 동일 철학
  const { data, error } = await supabase
    .from('cosmetic_products')
    .select('id, name, brand, category, price_krw, image_url, rating, skin_types, concerns')
    .eq('is_active', true)
    .eq('category', dbCategory)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(60);

  if (error || !data?.length) return [];
  const rows = data as CosmeticRoutineRow[];

  const scored = rows
    .map((row) => {
      // 적합도: 평점 기반 + 프로필 일치 가산 + 가격 접근성(타겟 10-30대 데일리 실행 맥락)
      let score = (row.rating ?? 0) * 10;
      if (row.skin_types?.includes(skinType)) score += 30;
      if (concerns.length > 0 && row.concerns?.some((c) => concerns.includes(c as SkinConcernId))) {
        score += 20;
      }
      if (row.price_krw != null) {
        if (row.price_krw <= 30000) score += 15;
        else if (row.price_krw <= 60000) score += 8;
        else if (row.price_krw > 150000) score -= 10;
      }
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ row }) => toRoutineProduct(row));
}
