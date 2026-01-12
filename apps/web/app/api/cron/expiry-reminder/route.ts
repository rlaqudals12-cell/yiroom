/**
 * Cron 유통기한 만료 리마인더 API
 * @description 3일 이내 만료 예정 재료 알림 발송
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/expiry-reminder",
 *     "schedule": "0 0 * * *"  // 매일 자정 실행 (UTC)
 *   }]
 * }
 *
 * 동작 방식:
 * 1. 3일 이내 만료 예정 재료 조회 (user_inventory.category = 'pantry')
 * 2. 사용자별로 그룹핑
 * 3. 푸시 알림 발송 (friend_activity_notifications 테이블 활용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendPushToSubscription, isVapidConfigured } from '@/lib/push/server';
import type { PushSubscriptionRow, PushSendResult } from '@/lib/push/types';

// 만료 예정 재료 정보
interface ExpiringItem {
  id: string;
  name: string;
  expiry_date: string;
  days_until_expiry: number;
  brand: string | null;
}

// 사용자별 만료 재료 그룹
interface UserExpiringItems {
  clerk_user_id: string;
  items: ExpiringItem[];
}

// 알림 발송 결과
interface ExpiryReminderResult {
  totalUsers: number;
  totalItems: number;
  sent: number;
  failed: number;
  expired: string[];
}

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

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // VAPID 설정 확인
  if (!isVapidConfigured()) {
    console.warn('[Cron Expiry] VAPID not configured, skipping expiry reminders');
    return NextResponse.json({
      success: false,
      message: 'VAPID not configured',
    });
  }

  console.log('[Cron Expiry] Starting expiry reminder check...');

  try {
    const supabase = createServiceRoleClient();

    // 1. 3일 이내 만료 예정 재료 조회
    const { data: expiringItems, error: queryError } = await supabase
      .from('user_inventory')
      .select('id, clerk_user_id, name, brand, expiry_date')
      .eq('category', 'pantry')
      .not('expiry_date', 'is', null)
      .gte('expiry_date', new Date().toISOString().split('T')[0]) // 오늘 이후
      .lte(
        'expiry_date',
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      ) // 3일 이내
      .order('expiry_date', { ascending: true });

    if (queryError) {
      console.error('[Cron Expiry] Error querying expiring items:', queryError);
      return NextResponse.json(
        { error: 'Failed to query expiring items', message: queryError.message },
        { status: 500 }
      );
    }

    if (!expiringItems || expiringItems.length === 0) {
      console.log('[Cron Expiry] No expiring items found');
      return NextResponse.json({
        success: true,
        message: 'No expiring items found',
        totalUsers: 0,
        totalItems: 0,
        sent: 0,
      });
    }

    // 2. 사용자별로 그룹핑 및 만료일 계산
    const userItemsMap = new Map<string, ExpiringItem[]>();

    for (const item of expiringItems) {
      const expiryDate = new Date(item.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const expiringItem: ExpiringItem = {
        id: item.id,
        name: item.name,
        expiry_date: item.expiry_date,
        days_until_expiry: daysUntilExpiry,
        brand: item.brand,
      };

      if (!userItemsMap.has(item.clerk_user_id)) {
        userItemsMap.set(item.clerk_user_id, []);
      }
      userItemsMap.get(item.clerk_user_id)!.push(expiringItem);
    }

    const userGroups: UserExpiringItems[] = Array.from(userItemsMap.entries()).map(
      ([clerk_user_id, items]) => ({
        clerk_user_id,
        items,
      })
    );

    console.log(`[Cron Expiry] Found ${expiringItems.length} items for ${userGroups.length} users`);

    // 3. 사용자별 푸시 알림 발송
    const result: ExpiryReminderResult = {
      totalUsers: userGroups.length,
      totalItems: expiringItems.length,
      sent: 0,
      failed: 0,
      expired: [],
    };

    for (const userGroup of userGroups) {
      const pushResult = await sendExpiryNotification(supabase, userGroup);
      result.sent += pushResult.sent;
      result.failed += pushResult.failed;
      result.expired.push(...pushResult.expired);
    }

    // 4. 만료된 구독 비활성화
    const uniqueExpired = [...new Set(result.expired)];
    if (uniqueExpired.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('endpoint', uniqueExpired);

      console.log(`[Cron Expiry] Deactivated ${uniqueExpired.length} expired subscriptions`);
    }

    console.log(`[Cron Expiry] Completed: ${result.sent} sent, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      ...result,
      expiredDeactivated: uniqueExpired.length,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Expiry] Error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 사용자에게 만료 알림 푸시 발송
 */
async function sendExpiryNotification(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userGroup: UserExpiringItems
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const result = { sent: 0, failed: 0, expired: [] as string[] };

  try {
    const { clerk_user_id, items } = userGroup;

    // 활성 푸시 구독 조회
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .eq('is_active', true);

    if (subError) {
      console.error('[Cron Expiry] Error fetching subscriptions:', subError);
      return result;
    }

    if (!subscriptions || subscriptions.length === 0) {
      // 푸시 구독이 없으면 알림 테이블에 저장 (friend_activity_notifications 재활용)
      await supabase.from('friend_activity_notifications').insert({
        user_id: clerk_user_id,
        friend_id: clerk_user_id, // 시스템 알림이므로 자기 자신으로 설정
        activity_type: 'expiry_warning',
        activity_summary: createExpiryMessage(items),
        is_read: false,
      });

      return result;
    }

    // 푸시 메시지 생성
    const title = '🍽️ 유통기한 임박 알림';
    const body = createExpiryMessage(items);

    // 푸시 발송
    const pushResults: PushSendResult[] = await Promise.all(
      (subscriptions as PushSubscriptionRow[]).map((sub) =>
        sendPushToSubscription(sub, {
          title,
          body,
          type: 'nutrition_reminder', // 기존 타입 재활용
          url: '/inventory/pantry',
        })
      )
    );

    // 결과 집계
    result.sent = pushResults.filter((r) => r.success).length;
    result.failed = pushResults.filter((r) => !r.success).length;
    result.expired = pushResults
      .filter((r) => r.error === 'SUBSCRIPTION_EXPIRED')
      .map((r) => r.endpoint);

    // 알림 테이블에도 저장 (푸시 실패 대비)
    await supabase.from('friend_activity_notifications').insert({
      user_id: clerk_user_id,
      friend_id: clerk_user_id,
      activity_type: 'expiry_warning',
      activity_summary: body,
      is_read: false,
    });

    return result;
  } catch (error) {
    console.error('[Cron Expiry] Error sending notification:', error);
    return result;
  }
}

/**
 * 만료 예정 재료 메시지 생성
 */
function createExpiryMessage(items: ExpiringItem[]): string {
  if (items.length === 0) return '';

  // 가장 먼저 만료되는 재료
  const firstItem = items[0];
  const daysText =
    firstItem.days_until_expiry === 0
      ? '오늘'
      : firstItem.days_until_expiry === 1
        ? '내일'
        : `${firstItem.days_until_expiry}일 후`;

  if (items.length === 1) {
    return `${firstItem.name}이(가) ${daysText} 만료됩니다.`;
  }

  return `${firstItem.name} 외 ${items.length - 1}개 재료가 ${daysText} 만료됩니다.`;
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
  return GET(request);
}
