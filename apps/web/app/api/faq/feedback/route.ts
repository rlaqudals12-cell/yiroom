/**
 * FAQ 피드백 API
 * POST /api/faq/feedback - FAQ 도움됨/안됨 피드백 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

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

    const supabase = createServiceRoleClient();

    // FAQ 테이블의 helpful/not_helpful 카운트 증가
    const column = helpful ? 'helpful_count' : 'not_helpful_count';

    const { error } = await supabase.rpc('increment_faq_feedback', {
      faq_id: faqId,
      column_name: column,
    });

    if (error) {
      // RPC 함수가 없거나 테이블이 없는 경우 직접 업데이트 시도
      if (error.code === '42883' || error.code === '42P01') {
        // faqs 테이블 직접 업데이트
        const { error: updateError } = await supabase
          .from('faqs')
          .update({
            [column]: supabase.rpc('increment', { x: 1 }),
          })
          .eq('id', faqId);

        if (updateError) {
          console.warn('[FAQ Feedback] Update failed:', updateError);
          // 실패해도 사용자에게는 성공 응답
          return NextResponse.json({ success: true });
        }
      } else {
        console.error('[FAQ Feedback] RPC error:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FAQ Feedback] Error:', error);
    // 오류가 발생해도 사용자에게는 성공 응답 (UX)
    return NextResponse.json({ success: true });
  }
}
