/**
 * FAQ 피드백 API
 * POST /api/faq/feedback - FAQ 도움됨/안됨 피드백 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateFAQFeedback } from '@/lib/api/announcements';

interface FeedbackRequest {
  faqId: string;
  helpful: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { faqId, helpful } = body;

    // 필수 필드 검증
    if (!faqId || typeof helpful !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'faqId and helpful are required' },
        { status: 400 }
      );
    }

    const success = await updateFAQFeedback(faqId, helpful);

    if (!success) {
      // 실패해도 사용자에게는 성공 응답 (UX 우선)
      console.warn('[FAQ Feedback] Update failed for faqId:', faqId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FAQ Feedback] Error:', error);
    // 오류가 발생해도 사용자에게는 성공 응답 (UX)
    return NextResponse.json({ success: true });
  }
}
