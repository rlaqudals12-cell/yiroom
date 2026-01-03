/**
 * POST /api/push/subscribe
 * Push 구독 등록
 * Phase L: L-1 Web Push 알림
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { PushSubscriptionData } from '@/lib/push/types';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as PushSubscriptionData;

    // 필수 필드 검증
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { success: false, message: '잘못된 구독 정보입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 구독 정보 저장 (upsert: 같은 엔드포인트면 업데이트)
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        clerk_user_id: userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: request.headers.get('user-agent'),
        is_active: true,
      },
      {
        onConflict: 'clerk_user_id,endpoint',
      }
    );

    if (error) {
      console.error('[Push] Subscribe error:', error);
      return NextResponse.json(
        { success: false, message: '구독 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '푸시 알림 구독이 완료되었습니다.',
    });
  } catch (error) {
    console.error('[Push] Subscribe error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
