/**
 * 피드백 API
 * POST /api/feedback
 * - 사용자 피드백을 저장
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

interface FeedbackRequest {
  type: 'bug' | 'feature' | 'general' | 'other';
  content: string;
  email?: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body: FeedbackRequest = await request.json();

    // 유효성 검사
    if (!body.type || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 피드백 저장
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        clerk_user_id: userId || null,
        type: body.type,
        content: body.content,
        email: body.email || null,
        status: 'pending',
        user_agent: request.headers.get('user-agent') || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Feedback API] Insert error:', error);
      // 테이블이 없어도 성공 응답 (UX 우선)
      return NextResponse.json({ success: true, id: null });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    // 오류가 발생해도 사용자에게는 성공 응답 (UX)
    return NextResponse.json({ success: true, id: null });
  }
}
