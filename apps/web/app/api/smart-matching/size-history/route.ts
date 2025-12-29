/**
 * 사이즈 기록 API
 * GET - 기록 조회
 * POST - 기록 추가
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getSizeHistory,
  getSizeHistoryByBrand,
  getSizeHistoryByCategory,
  addSizeHistory,
} from '@/lib/smart-matching';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const category = searchParams.get('category');

    let history;

    if (brandId) {
      history = await getSizeHistoryByBrand(userId, brandId);
    } else if (category) {
      history = await getSizeHistoryByCategory(userId, category);
    } else {
      history = await getSizeHistory(userId);
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('[API] SizeHistory GET error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.brandId || !body.brandName || !body.category || !body.size) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (brandId, brandName, category, size)' },
        { status: 400 }
      );
    }

    const result = await addSizeHistory({
      clerkUserId: userId,
      brandId: body.brandId,
      brandName: body.brandName,
      category: body.category,
      size: body.size,
      fit: body.fit,
      productId: body.productId,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
    });

    if (!result) {
      return NextResponse.json({ error: '기록 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] SizeHistory POST error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
