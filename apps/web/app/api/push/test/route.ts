/**
 * POST /api/push/test
 * 테스트 푸시 알림 발송
 * Phase L: L-1 Web Push 알림
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  sendPushToSubscriptions,
  summarizeResults,
  getExpiredSubscriptions,
  isVapidConfigured,
} from '@/lib/push/server';
import type { PushSubscriptionRow } from '@/lib/push/types';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    if (!isVapidConfigured()) {
      return NextResponse.json(
        { success: false, message: 'VAPID 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자의 활성 구독 조회
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('is_active', true);

    if (fetchError) {
      console.error('[Push] Fetch subscriptions error:', fetchError);
      return NextResponse.json(
        { success: false, message: '구독 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { success: false, message: '활성화된 푸시 구독이 없습니다.' },
        { status: 404 }
      );
    }

    // 테스트 알림 발송
    const results = await sendPushToSubscriptions(subscriptions as PushSubscriptionRow[], {
      title: '이룸 테스트 알림',
      body: '푸시 알림이 정상적으로 작동합니다! 🎉',
      type: 'test',
      tag: 'test-notification',
      url: '/home',
    });

    const summary = summarizeResults(results);

    // 만료된 구독 비활성화
    const expiredEndpoints = getExpiredSubscriptions(results);
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('endpoint', expiredEndpoints);
    }

    return NextResponse.json({
      success: summary.sent > 0,
      message:
        summary.sent > 0
          ? `${summary.sent}개 기기에 테스트 알림을 발송했습니다.`
          : '알림 발송에 실패했습니다.',
      ...summary,
    });
  } catch (error) {
    console.error('[Push] Test push error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
