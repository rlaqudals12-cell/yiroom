import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { reportPost } from '@/lib/feed';
import type { ReportReason } from '@/lib/feed/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'inappropriate_content',
  'misinformation',
  'other',
];

/**
 * POST /api/feed/[id]/report
 * 게시물 신고
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ success: false, error: '로그인이 필요해요.' }, { status: 401 });
    }

    const body = await req.json();
    const { reason, description } = body;

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: '신고 사유를 선택해주세요.' },
        { status: 400 }
      );
    }

    const report = await reportPost(userId, {
      post_id: id,
      reason,
      description,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    // 중복 신고 (UNIQUE 제약 위반)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { success: false, error: '이미 신고한 게시물이에요.' },
        { status: 409 }
      );
    }

    console.error('[Feed API] Report error:', error);
    return NextResponse.json({ success: false, error: '신고 접수에 실패했어요.' }, { status: 500 });
  }
}
