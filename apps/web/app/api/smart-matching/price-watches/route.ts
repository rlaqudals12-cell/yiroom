/**
 * 가격 모니터링 API
 * GET - 알림 목록 조회
 * POST - 가격 알림 등록
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getPriceWatches,
  getPriceWatchByProduct,
  createPriceWatch,
} from '@/lib/smart-matching';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const watch = await getPriceWatchByProduct(userId, productId);
      return NextResponse.json(watch);
    }

    const watches = await getPriceWatches(userId);
    return NextResponse.json(watches);
  } catch (error) {
    console.error('[API] PriceWatch GET error:', error);
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

    if (!body.productId) {
      return NextResponse.json({ error: 'productId가 필요합니다.' }, { status: 400 });
    }

    // 이미 등록된 알림 확인
    const existing = await getPriceWatchByProduct(userId, body.productId);
    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 가격 알림입니다.', data: existing },
        { status: 409 }
      );
    }

    const result = await createPriceWatch({
      clerkUserId: userId,
      productId: body.productId,
      targetPrice: body.targetPrice,
      percentDrop: body.percentDrop,
      platforms: body.platforms,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    if (!result) {
      return NextResponse.json({ error: '가격 알림 등록에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] PriceWatch POST error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
