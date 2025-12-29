/**
 * 개별 가격 알림 API
 * PATCH - 알림 조건 업데이트
 * DELETE - 알림 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updatePriceWatch, deletePriceWatch } from '@/lib/smart-matching';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const success = await updatePriceWatch(id, {
      targetPrice: body.targetPrice,
      percentDrop: body.percentDrop,
      platforms: body.platforms,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    if (!success) {
      return NextResponse.json({ error: '업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] PriceWatch PATCH error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deletePriceWatch(id);

    if (!success) {
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] PriceWatch DELETE error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
