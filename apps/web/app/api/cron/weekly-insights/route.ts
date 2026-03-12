/**
 * 주간 인사이트 다이제스트 크론 잡
 * @description 매주 월요일 09:00 KST (UTC 00:00 Mon) 실행
 * 사용자별 크로스 모듈 인사이트 상위 3개를 푸시 알림으로 발송
 *
 * Vercel Cron 설정 (vercel.json):
 * { "path": "/api/cron/weekly-insights", "schedule": "0 0 * * 1" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendPushToSubscription, isVapidConfigured } from '@/lib/push/server';
import { generateUserInsights } from '@/lib/insights';
import { NOTIFICATION_TEMPLATES } from '@/lib/notifications/templates';
import type { PushSubscriptionRow, PushSendResult } from '@/lib/push/types';

// Vercel Cron 인증 검증 (push-reminders 패턴 동일)
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

// 인사이트를 요약 메시지로 변환
function formatInsightDigest(insights: Array<{ title: string; description: string }>): string {
  if (insights.length === 0) {
    return '이번 주 활동을 분석한 리포트가 준비됐어요.';
  }

  if (insights.length === 1) {
    return `💡 ${insights[0].title}`;
  }

  // 상위 2-3개 인사이트 제목 요약
  const titles = insights.slice(0, 3).map((i) => i.title);
  return `💡 ${titles[0]} 외 ${titles.length - 1}개 인사이트가 도착했어요`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isVapidConfigured()) {
    console.warn('[Cron Weekly] VAPID not configured, skipping');
    return NextResponse.json({
      success: false,
      message: 'VAPID not configured',
    });
  }

  console.info('[Cron Weekly] Starting weekly insights digest...');

  try {
    const supabase = createServiceRoleClient();

    // 활성 푸시 구독이 있는 고유 사용자 조회
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (subError) {
      console.error('[Cron Weekly] Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.info('[Cron Weekly] No active subscriptions');
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No active subscriptions',
      });
    }

    // 사용자별 구독 그룹핑
    const userSubscriptions = new Map<string, PushSubscriptionRow[]>();
    for (const sub of subscriptions as PushSubscriptionRow[]) {
      const userId = sub.clerk_user_id;
      if (!userSubscriptions.has(userId)) {
        userSubscriptions.set(userId, []);
      }
      userSubscriptions.get(userId)!.push(sub);
    }

    console.info(
      `[Cron Weekly] Processing ${userSubscriptions.size} users with ${subscriptions.length} subscriptions`
    );

    let totalSent = 0;
    let totalFailed = 0;
    const expiredEndpoints: string[] = [];
    const template = NOTIFICATION_TEMPLATES['weekly_report'];

    // 사용자별 인사이트 생성 + 푸시 발송
    for (const [userId, userSubs] of userSubscriptions) {
      try {
        // 사용자별 인사이트 생성 (최대 3개)
        const insightResult = await generateUserInsights(supabase, userId, {
          maxInsights: 3,
        });

        // 인사이트 기반 개인화 메시지 생성
        const personalizedBody =
          insightResult.insights.length > 0
            ? formatInsightDigest(insightResult.insights)
            : template.body;

        // 해당 사용자의 모든 구독에 발송
        const pushResults: PushSendResult[] = await Promise.all(
          userSubs.map((sub) =>
            sendPushToSubscription(sub, {
              title: template.title,
              body: personalizedBody,
              type: 'weekly_report',
              url: template.action?.url,
            })
          )
        );

        totalSent += pushResults.filter((r) => r.success).length;
        totalFailed += pushResults.filter((r) => !r.success).length;
        expiredEndpoints.push(
          ...pushResults.filter((r) => r.error === 'SUBSCRIPTION_EXPIRED').map((r) => r.endpoint)
        );
      } catch (userError) {
        console.error(`[Cron Weekly] Error processing user ${userId}:`, userError);
        totalFailed += userSubs.length;
      }
    }

    // 만료된 구독 비활성화
    const uniqueExpired = [...new Set(expiredEndpoints)];
    if (uniqueExpired.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('endpoint', uniqueExpired);

      console.info(`[Cron Weekly] Deactivated ${uniqueExpired.length} expired subscriptions`);
    }

    console.info(`[Cron Weekly] Completed: ${totalSent} sent, ${totalFailed} failed`);

    return NextResponse.json({
      success: true,
      usersProcessed: userSubscriptions.size,
      totalSent,
      totalFailed,
      expiredDeactivated: uniqueExpired.length,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Weekly] Error:', error);
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
export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
