/**
 * POST /api/push/unsubscribe
 * Push 구독 해제
 * Phase L: L-1 Web Push 알림
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as { endpoint: string };

    if (!body.endpoint) {
      return NextResponse.json(
        { success: false, message: 'endpoint가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 구독 삭제
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('clerk_user_id', userId)
      .eq('endpoint', body.endpoint);

    if (error) {
      console.error('[Push] Unsubscribe error:', error);
      return NextResponse.json(
        { success: false, message: '구독 해제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '푸시 알림 구독이 해제되었습니다.',
    });
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
