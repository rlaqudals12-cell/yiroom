/**
 * iHerb 제품 검색 API
 * @description GET /api/affiliate/iherb/search
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchIHerbProducts,
  isIHerbConfigured,
  IHERB_CATEGORIES,
} from '@/lib/affiliate';
import type { IHerbCategory } from '@/lib/affiliate';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const category = searchParams.get('category') as IHerbCategory | null;
    const limitParam = searchParams.get('limit');
    const subId = searchParams.get('subId');

    // 검색어 또는 카테고리 필수
    if (!keyword && !category) {
      return NextResponse.json(
        { error: '검색어(keyword) 또는 카테고리(category)가 필요합니다' },
        { status: 400 }
      );
    }

    // 검색어 길이 검증
    if (keyword && keyword.length < 2) {
      return NextResponse.json(
        { error: '검색어는 최소 2자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    // 카테고리 검증
    if (category && !IHERB_CATEGORIES[category]) {
      const validCategories = Object.keys(IHERB_CATEGORIES).join(', ');
      return NextResponse.json(
        { error: `유효하지 않은 카테고리입니다. 사용 가능: ${validCategories}` },
        { status: 400 }
      );
    }

    // limit 검증
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit은 1~100 사이의 숫자여야 합니다' },
        { status: 400 }
      );
    }

    // 제품 검색
    const products = await searchIHerbProducts({
      keyword: keyword || '',
      category: category || undefined,
      limit,
      subId: subId || undefined,
    });

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      isMock: !isIHerbConfigured(),
      isConfigured: isIHerbConfigured(),
    });
  } catch (error) {
    console.error('[iHerb Search API] Error:', error);
    return NextResponse.json(
      { error: '제품 검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
