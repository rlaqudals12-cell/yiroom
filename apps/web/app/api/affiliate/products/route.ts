/**
 * 어필리에이트 제품 조회 API
 * GET /api/affiliate/products
 *
 * @description 어필리에이트 제품 목록 조회 (필터/정렬/페이징)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAffiliateProducts,
  getAffiliateProductCount,
} from '@/lib/affiliate/products';
import type {
  AffiliateProductFilter,
  AffiliateProductSortBy,
  AffiliateSkinType,
  AffiliateSkinConcern,
  AffiliatePersonalColor,
  AffiliateBodyType,
} from '@/types/affiliate';

/**
 * GET /api/affiliate/products
 * 쿼리 파라미터:
 * - partnerId: 파트너 ID
 * - category: 카테고리 (supplement, cosmetic, fashion)
 * - brand: 브랜드명 (부분 검색)
 * - skinTypes: 피부 타입 (콤마 구분)
 * - skinConcerns: 피부 고민 (콤마 구분)
 * - personalColors: 퍼스널 컬러 (콤마 구분)
 * - bodyTypes: 체형 (콤마 구분)
 * - minPrice, maxPrice: 가격 범위
 * - minRating: 최소 평점
 * - inStockOnly: 재고 있는 것만
 * - sortBy: 정렬 (rating, price_asc, price_desc, popular, newest)
 * - limit, offset: 페이징
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 파싱
    const filter: AffiliateProductFilter = {};

    const partnerId = searchParams.get('partnerId');
    if (partnerId) filter.partnerId = partnerId;

    const category = searchParams.get('category');
    if (category) filter.category = category;

    const brand = searchParams.get('brand');
    if (brand) filter.brand = brand;

    const skinTypes = searchParams.get('skinTypes');
    if (skinTypes) {
      filter.skinTypes = skinTypes.split(',') as AffiliateSkinType[];
    }

    const skinConcerns = searchParams.get('skinConcerns');
    if (skinConcerns) {
      filter.skinConcerns = skinConcerns.split(',') as AffiliateSkinConcern[];
    }

    const personalColors = searchParams.get('personalColors');
    if (personalColors) {
      filter.personalColors = personalColors.split(',') as AffiliatePersonalColor[];
    }

    const bodyTypes = searchParams.get('bodyTypes');
    if (bodyTypes) {
      filter.bodyTypes = bodyTypes.split(',') as AffiliateBodyType[];
    }

    const minPrice = searchParams.get('minPrice');
    if (minPrice) filter.minPrice = parseInt(minPrice, 10);

    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) filter.maxPrice = parseInt(maxPrice, 10);

    const minRating = searchParams.get('minRating');
    if (minRating) filter.minRating = parseFloat(minRating);

    const inStockOnly = searchParams.get('inStockOnly');
    if (inStockOnly === 'true') filter.inStockOnly = true;

    // 정렬
    const sortBy = (searchParams.get('sortBy') || 'rating') as AffiliateProductSortBy;

    // 페이징
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 제품 조회
    const [products, total] = await Promise.all([
      getAffiliateProducts(filter, sortBy, limit, offset),
      getAffiliateProductCount(filter),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + products.length < total,
      },
    });
  } catch (error) {
    console.error('[Affiliate] 제품 조회 에러:', error);
    return NextResponse.json(
      { error: '제품 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
