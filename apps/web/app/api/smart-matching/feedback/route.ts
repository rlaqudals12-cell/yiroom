/**
 * 사용자 피드백 API
 * GET - 피드백 목록 조회
 * POST - 피드백 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getFeedbackList,
  createFeedback,
  getRecommendationAccuracy,
} from '@/lib/smart-matching';
import type { FeedbackType } from '@/types/smart-matching';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as FeedbackType | null;
    const productId = searchParams.get('productId');
    const stats = searchParams.get('stats') === 'true';

    // 추천 정확도 통계 요청
    if (stats) {
      const accuracy = await getRecommendationAccuracy(userId);
      return NextResponse.json({ accuracy });
    }

    const feedback = await getFeedbackList(userId, {
      type: type ?? undefined,
      productId: productId ?? undefined,
      limit: 50,
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('[API] Feedback GET error:', error);
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

    if (!body.feedbackType) {
      return NextResponse.json({ error: 'feedbackType이 필요합니다.' }, { status: 400 });
    }

    const result = await createFeedback({
      clerkUserId: userId,
      feedbackType: body.feedbackType,
      productId: body.productId,
      recommendationId: body.recommendationId,
      rating: body.rating,
      sizeFit: body.sizeFit,
      colorAccuracy: body.colorAccuracy,
      wouldRecommend: body.wouldRecommend,
      comment: body.comment,
      pros: body.pros,
      cons: body.cons,
      photos: body.photos,
    });

    if (!result) {
      return NextResponse.json({ error: '피드백 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Feedback POST error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
