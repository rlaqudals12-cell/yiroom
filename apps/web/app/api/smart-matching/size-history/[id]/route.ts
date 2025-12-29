/**
 * 개별 사이즈 기록 API
 * PATCH - 핏 피드백 업데이트
 * DELETE - 기록 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateSizeFit, deleteSizeHistory } from '@/lib/smart-matching';

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

    if (!body.fit || !['small', 'perfect', 'large'].includes(body.fit)) {
      return NextResponse.json(
        { error: '유효한 fit 값이 필요합니다. (small, perfect, large)' },
        { status: 400 }
      );
    }

    const success = await updateSizeFit(id, body.fit);

    if (!success) {
      return NextResponse.json({ error: '업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] SizeHistory PATCH error:', error);
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
    const success = await deleteSizeHistory(id);

    if (!success) {
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] SizeHistory DELETE error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
