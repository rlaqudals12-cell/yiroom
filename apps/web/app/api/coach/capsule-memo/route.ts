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

    // users 테이블의 metadata JSONB에 코치 메모 추가.
    // ⚠️ metadata 컬럼은 운영 DB gap-apply 대기 상태다. 없으면 조회·저장이 모두 실패하므로
    // 성공으로 위장하지 않고 사용자에게 정직하게 알린다(가짜 성공 금지).
    const { data: userData, error: readError } = await supabase
      .from('users')
      .select('metadata')
      .eq('clerk_user_id', userId)
      .single();

    if (readError) {
      console.error('[Coach] Capsule memo read error:', readError.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMO_STORAGE_UNAVAILABLE',
            message: `capsule memo read failed: ${readError.message}`,
            userMessage: '메모를 저장할 공간을 아직 준비하지 못했어요. 잠시 후 다시 시도해 주세요.',
          },
        },
        { status: 503 }
      );
    }

    const existingMeta = (userData?.metadata as Record<string, unknown>) ?? {};
    const existingMemos = (existingMeta.coach_memos as unknown[]) ?? [];

    // 최대 20개 메모 유지 (오래된 것 제거)
    const updatedMemos = [...existingMemos, memo].slice(-20);

    const { error: writeError } = await supabase
      .from('users')
      .update({
        metadata: { ...existingMeta, coach_memos: updatedMemos },
      })
      .eq('clerk_user_id', userId);

    if (writeError) {
      console.error('[Coach] Capsule memo write error:', writeError.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMO_SAVE_FAILED',
            message: `capsule memo write failed: ${writeError.message}`,
            userMessage: '메모를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, memo });
  } catch (error) {
    console.error('[Coach] Capsule memo save error:', error);
    return NextResponse.json({ success: false, error: '저장에 실패했습니다.' }, { status: 500 });
  }
}
