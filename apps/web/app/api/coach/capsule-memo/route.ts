import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 코치 추천 → 캡슐 메모 저장 API
 *
 * POST /api/coach/capsule-memo
 * Body: { content: string, timestamp: string }
 *
 * coach_capsule_memos 테이블이 없으면 users.metadata JSONB에 저장
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { content, timestamp } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: '내용이 필요합니다.' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 코치 메모를 coach_chat_sessions 테이블의 metadata에 저장
    // 별도 테이블 없이 기존 사용자 메타데이터 활용
    const memo = {
      type: 'coach_recommendation',
      content: content.slice(0, 500), // 최대 500자
      savedAt: new Date().toISOString(),
      originalTimestamp: timestamp,
    };

    // users 테이블의 metadata JSONB에 코치 메모 추가
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('clerk_user_id', userId)
      .single();

    const existingMeta = (userData?.metadata as Record<string, unknown>) ?? {};
    const existingMemos = (existingMeta.coach_memos as unknown[]) ?? [];

    // 최대 20개 메모 유지 (오래된 것 제거)
    const updatedMemos = [...existingMemos, memo].slice(-20);

    await supabase
      .from('users')
      .update({
        metadata: { ...existingMeta, coach_memos: updatedMemos },
      })
      .eq('clerk_user_id', userId);

    return NextResponse.json({ success: true, memo });
  } catch (error) {
    console.error('[Coach] Capsule memo save error:', error);
    return NextResponse.json({ success: false, error: '저장에 실패했습니다.' }, { status: 500 });
  }
}
