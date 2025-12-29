/**
 * 사이즈 추천 API
 * POST - 사이즈 추천 요청
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getSizeRecommendation,
  getProductSizeRecommendation,
} from '@/lib/smart-matching';
import type { ClothingCategory } from '@/types/smart-matching';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, brandName, category, productId } = body;

    if (!brandId || !brandName || !category) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (brandId, brandName, category)' },
        { status: 400 }
      );
    }

    // 카테고리 유효성 검사
    const validCategories: ClothingCategory[] = ['top', 'bottom', 'outer', 'dress', 'shoes'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    let recommendation;

    if (productId) {
      // 제품 ID가 있으면 제품별 추천
      recommendation = await getProductSizeRecommendation(
        userId,
        productId,
        brandId,
        brandName,
        category
      );
    } else {
      // 브랜드 + 카테고리 기반 추천
      recommendation = await getSizeRecommendation(
        userId,
        brandId,
        brandName,
        category
      );
    }

    return NextResponse.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error('[API] SizeRecommend error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
