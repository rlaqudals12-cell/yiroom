/**
 * 스타일 리포트 공유 링크 생성 API
 *
 * @route POST /api/share/report
 * Body: { sessionId: string }
 * 응답: { success: true, url: string }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createReportShare } from '@/lib/share/report';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const sessionId = body?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', userMessage: '세션 정보가 필요합니다.' },
        },
        { status: 400 }
      );
    }

    const share = await createReportShare(userId, sessionId);
    if (!share) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND_ERROR', userMessage: '공유할 결과를 찾을 수 없습니다.' },
        },
        { status: 404 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    return NextResponse.json({ success: true, url: `${origin}/share/report/${share.token}` });
  } catch (error) {
    console.error('[API /share/report] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', userMessage: '공유 링크 생성에 실패했어요.' },
      },
      { status: 500 }
    );
  }
}
