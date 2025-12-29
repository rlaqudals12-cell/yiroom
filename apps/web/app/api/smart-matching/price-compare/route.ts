/**
 * 가격 비교 API
 * POST - 제품 가격 비교 요청
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  comparePrices,
  analyzePriceTrend,
} from '@/lib/smart-matching';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, platforms, action } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId가 필요합니다.' }, { status: 400 });
    }

    // 가격 트렌드 분석 요청
    if (action === 'analyzeTrend') {
      const days = body.days || 30;
      const trend = await analyzePriceTrend(productId, days);

      return NextResponse.json({
        success: true,
        trend,
      });
    }

    // 가격 비교 요청 (기본)
    const comparison = await comparePrices(productId, {
      platforms,
      includeHistory: body.includeHistory,
    });

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('[API] PriceCompare error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
