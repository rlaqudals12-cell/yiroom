/**
 * 관리자 피드백 API
 * PATCH /api/admin/feedback - 피드백 상태/메모 업데이트
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateFeedbackStatus } from '@/lib/api/feedback';
import type { FeedbackStatus } from '@/types/feedback';

const VALID_STATUSES: FeedbackStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('[Admin Feedback API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
