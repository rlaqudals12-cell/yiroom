/**
 * 쿠팡 제품 검색 API
 * GET /api/affiliate/coupang/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchCoupangProducts, isCoupangConfigured } from '@/lib/affiliate';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const subId = searchParams.get('subId') || undefined;

    // 키워드 필수
    if (!keyword) {
      return NextResponse.json(
        { error: '검색어가 필요합니다' },
        { status: 400 }
      );
    }

    // 검색어 길이 제한
    if (keyword.length < 2) {
      return NextResponse.json(
        { error: '검색어는 2자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    // limit 유효성 검사
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit은 1~100 사이여야 합니다' },
        { status: 400 }
      );
    }

    // 제품 검색
    const products = await searchCoupangProducts({
      keyword,
      limit,
      subId,
    });

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
      isConfigured: isCoupangConfigured(),
      isMock: !isCoupangConfigured(),
    });
  } catch (error) {
    console.error('[API] 쿠팡 검색 에러:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
