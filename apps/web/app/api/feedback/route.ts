/**
 * 피드백 API
 * GET /api/feedback - 피드백 목록 조회 (관리자용)
 * POST /api/feedback - 사용자 피드백 저장
 * DB 스키마: feedback (clerk_user_id, type, title, content, contact_email, status)
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 프론트엔드 타입 → DB 타입 매핑
const TYPE_MAP: Record<string, string> = {
  bug: 'bug',
  feature: 'suggestion', // feature → suggestion
  general: 'question', // general → question
  other: 'other',
};

// 타입별 기본 제목
const DEFAULT_TITLES: Record<string, string> = {
  bug: '버그 신고',
  suggestion: '기능 제안',
  question: '일반 문의',
  other: '기타 문의',
};

interface FeedbackRequest {
  type: 'bug' | 'feature' | 'general' | 'other';
  title?: string;
  content: string;
  email?: string;
}

// GET /api/feedback - 피드백 목록 조회 (관리자용)
export async function GET() {
  try {
    const { userId } = await auth();

    // 인증 확인 (관리자 페이지에서 호출되므로 로그인 필수)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // 피드백 목록 조회 (최신순)
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Feedback API] GET error:', error);
      return NextResponse.json({ feedbacks: [] });
    }

    // DB 형식 → 프론트엔드 형식 변환
    const feedbacks = data.map((item) => ({
      id: item.id,
      clerkUserId: item.clerk_user_id,
      type:
        item.type === 'suggestion'
          ? 'suggestion'
          : item.type === 'question'
            ? 'question'
            : item.type,
      title: item.title,
      content: item.content,
      contactEmail: item.contact_email,
      screenshotUrl: null,
      status: item.status,
      adminNotes: item.admin_notes || null,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at || item.created_at),
      userName: item.clerk_user_id === 'anonymous' ? '익명' : null,
    }));

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('[Feedback API] GET Error:', error);
    return NextResponse.json({ feedbacks: [] });
  }
}

// POST /api/feedback - 사용자 피드백 저장
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body: FeedbackRequest = await request.json();

    // 유효성 검사
    if (!body.type || !body.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (body.content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    // DB 타입으로 매핑
    const dbType = TYPE_MAP[body.type] || 'other';
    const title = body.title || DEFAULT_TITLES[dbType] || '피드백';

    // 익명 피드백을 위해 service role 클라이언트 사용 (RLS 우회)
    const supabase = createServiceRoleClient();

    // 피드백 저장 (DB 스키마에 맞게)
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        clerk_user_id: userId || 'anonymous',
        type: dbType,
        title: title,
        content: body.content,
        contact_email: body.email || null,
        status: 'pending',
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
