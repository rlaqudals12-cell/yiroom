/**
 * Cron 푸시 리마인더 API
 * @description 스케줄에 따라 활성 구독자에게 리마인더 푸시 발송
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/push-reminders",
 *     "schedule": "0 9 * * *"  // 매일 오전 9시 (UTC) = 오후 6시 (KST)
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendPushToSubscription, isVapidConfigured } from '@/lib/push/server';
import { NOTIFICATION_TEMPLATES, type NotificationType } from '@/lib/notifications/templates';
import type { PushSubscriptionRow, PushSendResult, PushNotificationType } from '@/lib/push/types';

// Cron에서 사용하는 리마인더 타입 (양쪽 타입의 교집합)
type ReminderType = Extract<PushNotificationType, NotificationType>;

// Vercel Cron 인증 검증
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  const vercelSignature = request.headers.get('x-vercel-cron-signature');
  if (vercelSignature) {
    return true;
  }

  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

// KST 시간 기준 알림 타입 결정
function getReminderType(): ReminderType {
  const now = new Date();
  // KST = UTC + 9
  const kstHour = (now.getUTCHours() + 9) % 24;

  // 오전 (6-11시): 일일 체크인
  if (kstHour >= 6 && kstHour < 12) {
    return 'daily_checkin';
  }
  // 오후 (12-17시): 영양 리마인더
  if (kstHour >= 12 && kstHour < 18) {
    return 'nutrition_reminder';
  }
  // 저녁 (18-23시): 운동 리마인더
  return 'workout_reminder';
}

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // VAPID 설정 확인
  if (!isVapidConfigured()) {
    console.warn('[Cron Push] VAPID not configured, skipping push reminders');
    return NextResponse.json({
      success: false,
      message: 'VAPID not configured',
    });
  }

  console.log('[Cron Push] Starting scheduled push reminders...');

  try {
    const supabase = createServiceRoleClient();

    // 활성 푸시 구독 조회
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Cron Push] No active subscriptions found');
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions',
        sent: 0,
      });
    }

    // 알림 타입 결정 및 템플릿 조회
    const reminderType = getReminderType();
    const template = NOTIFICATION_TEMPLATES[reminderType];

    console.log(`[Cron Push] Sending ${reminderType} to ${subscriptions.length} subscribers`);

    // 푸시 발송
    const results: PushSendResult[] = await Promise.all(
      (subscriptions as PushSubscriptionRow[]).map((sub) =>
        sendPushToSubscription(sub, {
          title: template.title,
          body: template.body,
          type: reminderType,
          url: template.action?.url,
        })
      )
    );

    // 결과 집계
    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const expired = results
      .filter((r) => r.error === 'SUBSCRIPTION_EXPIRED')
      .map((r) => r.endpoint);

    // 만료된 구독 비활성화
    if (expired.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('endpoint', expired);

      console.log(`[Cron Push] Deactivated ${expired.length} expired subscriptions`);
    }

    console.log(`[Cron Push] Completed: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      reminderType,
      sent,
      failed,
      expiredDeactivated: expired.length,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Push] Error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
  return GET(request);
}
