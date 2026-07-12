/**
 * 분석 결과 기반 맞춤 제품 매칭 API
 *
 * AnalysisMatchedProducts 컴포넌트에서 호출
 * 사용자 프로필 + 분석 결과 → 매칭 점수 순 제품 반환
 *
 * @route GET /api/products/matched
 * @auth optional (비인증 시 기본 추천)
 *
 * 2026-07-07 재작성 (Phase 3-①): 기존 구현은 스키마에 없는 컬럼(price,
 * color_tones)을 select하고 존재하지 않는 카테고리(skincare/haircare)로
 * 필터해 데이터가 있어도 항상 빈 배열이었다. lib/products/matching.ts의
 * 정합 매칭 엔진(calculateMatchScore)으로 교체.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { calculateMatchScore, type UserProfile } from '@/lib/products/matching';
import { diversifyBySubcategory } from '@/lib/products';
import {
  toCosmeticProduct,
  type CosmeticProductRow,
  type PersonalColorSeason,
  type SkinType,
  type SkinConcern,
  type HairType,
  type ScalpType,
  type Undertone,
} from '@/types/product';

// 분석 타입 → 실제 스키마 카테고리 (20260213 CHECK 제약 기준)
const CATEGORY_MAP: Record<string, string[]> = {
  skin: ['cleanser', 'toner', 'serum', 'essence', 'moisturizer', 'eye_cream', 'sunscreen', 'mask'],
  hair: ['shampoo', 'conditioner', 'hair-treatment', 'scalp-care'],
  // 퍼스널컬러의 실행 레이어 = 색조 (시즌 태깅된 makeup)
  'personal-color': ['makeup'],
  makeup: ['makeup'],
};

// URL 파라미터(lowercase) → DB 시즌 값(Capitalized)
function toSeason(value: string | null): PersonalColorSeason | undefined {
  if (!value) return undefined;
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return ['Spring', 'Summer', 'Autumn', 'Winter'].includes(normalized)
    ? (normalized as PersonalColorSeason)
    : undefined;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('analysisType') ?? 'skin';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '4', 10), 12);

    const profile: UserProfile = {
      personalColorSeason: toSeason(searchParams.get('personalColorSeason')),
      skinType: (searchParams.get('skinType') as SkinType | null) ?? undefined,
      skinConcerns:
        (searchParams.get('skinConcerns')?.split(',').filter(Boolean) as SkinConcern[]) ??
        undefined,
      hairType: (searchParams.get('hairType') as HairType | null) ?? undefined,
      scalpType: (searchParams.get('scalpType') as ScalpType | null) ?? undefined,
      undertone: (searchParams.get('undertone') as Undertone | null) ?? undefined,
    };

    const supabase = createServiceRoleClient();
    const categories = CATEGORY_MAP[analysisType];

    let query = supabase
      .from('cosmetic_products')
      .select('*')
      .eq('is_active', true)
      // ⚠️ rating은 화장품 전 품목이 사실상 null이라 정렬축으로 쓰면 동률이 물리적(삽입) 순서로
      // 붕괴 → personal-color 풀이 100% 립으로 collapse했다(실측: 상위 60이 전부 립, 창업자
      // "퍼스널컬러 제품이 립뿐?" 재보고). review_count(실재 컬럼)로 정렬하고 id 보조정렬을 두어
      // 결정적이면서 세분류가 고르게 섞인 풀을 뽑는다. 최종 노출 다양성은 아래 diversify가 보장.
      .order('review_count', { ascending: false, nullsFirst: false })
      .order('id', { ascending: true })
      .limit(Math.max(limit * 15, 90));

    if (categories) {
      query = query.in('category', categories);
    }

    const { data: rows, error } = await query;

    if (error || !rows) {
      console.error('[Products/Matched] query error:', error?.message);
      return NextResponse.json({ success: true, products: [] });
    }

    const scored = (rows as CosmeticProductRow[])
      .map((row) => {
        const product = toCosmeticProduct(row);
        const result = calculateMatchScore(product, profile);
        return {
          product,
          matchScore: result.score,
          matchReasons: result.reasons.filter((r) => r.matched).map((r) => r.label),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    // 메이크업(퍼스널컬러 실행 레이어)은 색조 세분류가 립으로 쏠려 BEST가 립으로 도배되는
    // 문제가 있어 최종 노출을 subcategory당 최대 절반으로 제한(다양성 확보). 스킨케어/헤어는
    // 세분류(category)가 이미 다양해 기존 점수순 상위 노출을 유지한다(불필요한 재정렬 회피).
    const isMakeup = categories?.length === 1 && categories[0] === 'makeup';
    const matched = isMakeup
      ? diversifyBySubcategory(
          scored,
          limit,
          (m) => m.product.subcategory ?? m.product.category ?? 'etc'
        )
      : scored.slice(0, limit);

    return NextResponse.json({
      success: true,
      products: matched,
      analysisType,
      totalMatched: matched.length,
    });
  } catch (error) {
    console.error('[Products/Matched] Error:', error);
    return NextResponse.json({ success: true, products: [] });
  }
}
