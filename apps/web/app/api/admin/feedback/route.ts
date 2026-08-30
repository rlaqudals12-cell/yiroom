/**
 * 관리자 피드백 API
 * GET /api/admin/feedback - 전체 사용자 피드백/AI 생성물 신고 조회
 * PATCH /api/admin/feedback - 피드백 상태/메모 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllFeedbacks, updateFeedbackStatus } from '@/lib/api/feedback';
import { requireAdminOrThrow } from '@/lib/admin/auth';
import type { FeedbackStatus } from '@/types/feedback';

const VALID_STATUSES: FeedbackStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];

function isAdminAuthError(error: unknown): boolean {
  return error instanceof Error && error.message === 'Unauthorized: Admin access required';
}

/**
 * 모든 사용자의 피드백/AI 생성물 신고 조회.
 * 사용자용 /api/feedback는 RLS상 본인 행만 보이므로 운영 화면은 관리자 가드 뒤에서
 * 기존 service-role repository를 사용해야 접수된 신고가 실제 검토자에게 도달한다.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await requireAdminOrThrow();
    const feedbacks = await getAllFeedbacks();
    return NextResponse.json({ feedbacks });
  } catch (error) {
    if (isAdminAuthError(error)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[Admin Feedback API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminOrThrow();

    const body = await request.json();
    const { feedbackId, status, adminNotes } = body as {
      feedbackId: string;
      status?: FeedbackStatus;
      adminNotes?: string;
    };

    if (!feedbackId) {
      return NextResponse.json({ error: 'feedbackId is required' }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 상태 또는 메모 업데이트
    const success = await updateFeedbackStatus(feedbackId, status || 'pending', adminNotes);

    if (!success) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isAdminAuthError(error)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[Admin Feedback API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
