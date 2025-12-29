/**
 * 개별 피드백 API
 * PATCH - 피드백 업데이트
 * DELETE - 피드백 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateFeedback, deleteFeedback } from '@/lib/smart-matching';

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

    const success = await updateFeedback(id, {
      rating: body.rating,
      sizeFit: body.sizeFit,
      colorAccuracy: body.colorAccuracy,
      wouldRecommend: body.wouldRecommend,
      comment: body.comment,
      pros: body.pros,
      cons: body.cons,
      photos: body.photos,
    });

    if (!success) {
      return NextResponse.json({ error: '업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Feedback PATCH error:', error);
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
    const success = await deleteFeedback(id);

    if (!success) {
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Feedback DELETE error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
