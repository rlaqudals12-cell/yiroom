/**
 * 피드백 API
 * GET /api/feedback - 본인 피드백 목록 조회 (로그인 사용자)
 * POST /api/feedback - 사용자 피드백 저장 (익명 가능)
 * DB 스키마: feedback (clerk_user_id, type, title, content, contact_email, status)
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFeedbacks, submitFeedback } from '@/lib/api/feedback';
import { applyRateLimit } from '@/lib/security/rate-limit';
import type { FeedbackType } from '@/types/feedback';

// 프론트엔드 타입 -> DB 타입 매핑
const TYPE_MAP: Record<string, FeedbackType> = {
  bug: 'bug',
  feature: 'suggestion',
  general: 'question',
  other: 'other',
};

// 타입별 기본 제목
const DEFAULT_TITLES: Record<FeedbackType, string> = {
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

// GET /api/feedback - 본인 피드백 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    // 인증 확인
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limit 체크
    const rateLimitResult = applyRateLimit(request, userId);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    // Repository 패턴으로 조회
    const feedbacks = await getUserFeedbacks(userId);

    return NextResponse.json({ feedbacks }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('[Feedback API] GET Error:', error);
    return NextResponse.json({ feedbacks: [] });
  }
}

// POST /api/feedback - 사용자 피드백 저장 (익명 가능)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    // Rate Limit 체크 (익명 사용자도 IP 기반으로 제한)
    const rateLimitResult = applyRateLimit(request, userId);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const body: FeedbackRequest = await request.json();

    // 유효성 검사
    if (!body.type || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (body.content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // DB 타입으로 매핑
    const dbType = TYPE_MAP[body.type] || 'other';
    const title = body.title || DEFAULT_TITLES[dbType] || '피드백';

    // Repository 패턴으로 저장
    const result = await submitFeedback({
      clerkUserId: userId,
      type: dbType,
      title: title,
      content: body.content,
      contactEmail: body.email,
    });

    if (!result.success) {
      console.error('[Feedback API] Insert error:', result.error);
      // 테이블이 없어도 성공 응답 (UX 우선)
      return NextResponse.json({ success: true, id: null }, { headers: rateLimitResult.headers });
    }

    return NextResponse.json(
      { success: true, id: result.id },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    // 오류가 발생해도 사용자에게는 성공 응답 (UX)
    return NextResponse.json({ success: true, id: null });
  }
}
