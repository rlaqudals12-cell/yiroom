/**
 * Cron 푸시 리마인더 API (개인화 버전)
 * @description 사용자별 알림 설정에 따라 개인화된 푸시 발송
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/push-reminders",
 *     "schedule": "0 * * * *"  // 매시 정각 실행 (UTC)
 *   }]
 * }
 *
 * 동작 방식:
 * 1. 현재 KST 시간 (HH:00) 계산
 * 2. user_notification_settings에서 해당 시간에 알림을 받을 사용자 조회
 * 3. 해당 사용자의 push_subscriptions 조회 후 푸시 발송
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendPushToSubscription, isVapidConfigured } from '@/lib/push/server';
import { NOTIFICATION_TEMPLATES, type NotificationType } from '@/lib/notifications/templates';
import type { PushSubscriptionRow, PushSendResult, PushNotificationType } from '@/lib/push/types';

// Cron에서 사용하는 리마인더 타입 (양쪽 타입의 교집합)
type ReminderType = Extract<PushNotificationType, NotificationType>;

// 개인화 알림 결과
interface PersonalizedPushResult {
  type: ReminderType;
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

// 현재 KST 시간을 HH:00 형식으로 반환
function getCurrentKSTHour(): string {
  const now = new Date();
  // KST = UTC + 9
  const kstHour = (now.getUTCHours() + 9) % 24;
  return `${kstHour.toString().padStart(2, '0')}:00`;
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

  const currentHour = getCurrentKSTHour();
  console.log(`[Cron Push] Starting personalized push reminders for KST ${currentHour}...`);

  try {
    const supabase = createServiceRoleClient();

    // 알림 유형별 결과
    const results: PersonalizedPushResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;
    const allExpiredEndpoints: string[] = [];

    // 1. 운동 리마인더 발송
    const workoutResult = await sendWorkoutReminders(supabase, currentHour);
    results.push(workoutResult);
    totalSent += workoutResult.sent;
    totalFailed += workoutResult.failed;
    allExpiredEndpoints.push(...workoutResult.expired);

    // 2. 영양 리마인더 (아침/점심/저녁 식사 시간)
    // 아침 식사 리마인더
    const breakfastResult = await sendNutritionReminders(supabase, 'breakfast', currentHour);
    results.push(breakfastResult);
    totalSent += breakfastResult.sent;
    totalFailed += breakfastResult.failed;
    allExpiredEndpoints.push(...breakfastResult.expired);

    // 점심 식사 리마인더
    const lunchResult = await sendNutritionReminders(supabase, 'lunch', currentHour);
    totalSent += lunchResult.sent;
    totalFailed += lunchResult.failed;
    allExpiredEndpoints.push(...lunchResult.expired);

    // 저녁 식사 리마인더
    const dinnerResult = await sendNutritionReminders(supabase, 'dinner', currentHour);
    totalSent += dinnerResult.sent;
    totalFailed += dinnerResult.failed;
    allExpiredEndpoints.push(...dinnerResult.expired);

    // 3. 일일 체크인 (오전 9시 KST 고정 - 가장 많이 사용되는 시간)
    if (currentHour === '09:00') {
      const checkinResult = await sendGlobalReminder(supabase, 'daily_checkin');
      results.push(checkinResult);
      totalSent += checkinResult.sent;
      totalFailed += checkinResult.failed;
      allExpiredEndpoints.push(...checkinResult.expired);
    }

    // 만료된 구독 비활성화 (중복 제거)
    const uniqueExpired = [...new Set(allExpiredEndpoints)];
    if (uniqueExpired.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('endpoint', uniqueExpired);

      console.log(`[Cron Push] Deactivated ${uniqueExpired.length} expired subscriptions`);
    }

    console.log(`[Cron Push] Completed: ${totalSent} sent, ${totalFailed} failed`);

    return NextResponse.json({
      success: true,
      currentHour,
      totalSent,
      totalFailed,
      expiredDeactivated: uniqueExpired.length,
      details: results,
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

/**
 * 운동 리마인더 발송
 */
async function sendWorkoutReminders(
  supabase: ReturnType<typeof createServiceRoleClient>,
  currentHour: string
): Promise<PersonalizedPushResult> {
  const result: PersonalizedPushResult = {
    type: 'workout_reminder',
    sent: 0,
    failed: 0,
    expired: [],
  };

  try {
    const hourNumber = parseInt(currentHour.split(':')[0], 10);

    // 운동 알림이 활성화된 사용자 조회
    const { data: settings, error: settingsError } = await supabase
      .from('user_notification_settings')
      .select('clerk_user_id, workout_reminder_time')
      .eq('enabled', true)
      .eq('workout_reminder', true);

    if (settingsError) {
      console.error('[Cron Push] Error fetching workout settings:', settingsError);
      return result;
    }

    if (!settings || settings.length === 0) {
      return result;
    }

    // 시간대가 일치하는 사용자만 필터링
    const matchingUsers = settings.filter((s) => {
      const timeValue = s.workout_reminder_time;
      if (!timeValue) return false;
      const settingHour = parseInt(String(timeValue).split(':')[0], 10);
      return settingHour === hourNumber;
    });

    if (matchingUsers.length === 0) {
      return result;
    }

    const userIds = matchingUsers.map((s) => s.clerk_user_id);
    console.log(`[Cron Push] workout_reminder: ${userIds.length} users at ${currentHour}`);

    return sendPushToUsers(supabase, userIds, 'workout_reminder', result);
  } catch (error) {
    console.error('[Cron Push] Error in workout_reminder:', error);
    return result;
  }
}

/**
 * 영양 리마인더 발송 (아침/점심/저녁)
 */
async function sendNutritionReminders(
  supabase: ReturnType<typeof createServiceRoleClient>,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  currentHour: string
): Promise<PersonalizedPushResult> {
  const result: PersonalizedPushResult = {
    type: 'nutrition_reminder',
    sent: 0,
    failed: 0,
    expired: [],
  };

  try {
    const hourNumber = parseInt(currentHour.split(':')[0], 10);

    // 영양 알림이 활성화된 사용자 조회
    const { data: settings, error: settingsError } = await supabase
      .from('user_notification_settings')
      .select('clerk_user_id, meal_reminder_breakfast, meal_reminder_lunch, meal_reminder_dinner')
      .eq('enabled', true)
      .eq('nutrition_reminder', true);

    if (settingsError) {
      console.error('[Cron Push] Error fetching nutrition settings:', settingsError);
      return result;
    }

    if (!settings || settings.length === 0) {
      return result;
    }

    // 해당 식사 시간대가 일치하는 사용자만 필터링
    const matchingUsers = settings.filter((s) => {
      let timeValue: string | null = null;
      if (mealType === 'breakfast') timeValue = s.meal_reminder_breakfast;
      else if (mealType === 'lunch') timeValue = s.meal_reminder_lunch;
      else if (mealType === 'dinner') timeValue = s.meal_reminder_dinner;

      if (!timeValue) return false;
      const settingHour = parseInt(String(timeValue).split(':')[0], 10);
      return settingHour === hourNumber;
    });

    if (matchingUsers.length === 0) {
      return result;
    }

    const userIds = matchingUsers.map((s) => s.clerk_user_id);
    console.log(
      `[Cron Push] nutrition_reminder (${mealType}): ${userIds.length} users at ${currentHour}`
    );

    return sendPushToUsers(supabase, userIds, 'nutrition_reminder', result);
  } catch (error) {
    console.error('[Cron Push] Error in nutrition_reminder:', error);
    return result;
  }
}

/**
 * 특정 사용자들에게 푸시 발송
 */
async function sendPushToUsers(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userIds: string[],
  reminderType: ReminderType,
  result: PersonalizedPushResult
): Promise<PersonalizedPushResult> {
  // 해당 사용자들의 활성 푸시 구독 조회
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('clerk_user_id', userIds)
    .eq('is_active', true);

  if (subError) {
    console.error('[Cron Push] Error fetching subscriptions:', subError);
    return result;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return result;
  }

  // 푸시 발송
  const template = NOTIFICATION_TEMPLATES[reminderType];
  const pushResults: PushSendResult[] = await Promise.all(
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
  result.sent = pushResults.filter((r) => r.success).length;
  result.failed = pushResults.filter((r) => !r.success).length;
  result.expired = pushResults
    .filter((r) => r.error === 'SUBSCRIPTION_EXPIRED')
    .map((r) => r.endpoint);

  return result;
}

/**
 * 전역 리마인더 발송 (알림 설정이 활성화된 모든 사용자에게)
 */
async function sendGlobalReminder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  reminderType: ReminderType
): Promise<PersonalizedPushResult> {
  const result: PersonalizedPushResult = {
    type: reminderType,
    sent: 0,
    failed: 0,
    expired: [],
  };

  try {
    // 알림이 활성화된 사용자 조회
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('clerk_user_id')
      .eq('enabled', true);

    if (!settings || settings.length === 0) {
      // 설정이 없는 사용자도 기본으로 받을 수 있도록 전체 활성 구독 조회
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (!subscriptions || subscriptions.length === 0) {
        return result;
      }

      const template = NOTIFICATION_TEMPLATES[reminderType];
      const pushResults: PushSendResult[] = await Promise.all(
        (subscriptions as PushSubscriptionRow[]).map((sub) =>
          sendPushToSubscription(sub, {
            title: template.title,
            body: template.body,
            type: reminderType,
            url: template.action?.url,
          })
        )
      );

      result.sent = pushResults.filter((r) => r.success).length;
      result.failed = pushResults.filter((r) => !r.success).length;
      result.expired = pushResults
        .filter((r) => r.error === 'SUBSCRIPTION_EXPIRED')
        .map((r) => r.endpoint);

      return result;
    }

    const userIds = settings.map((s) => s.clerk_user_id);

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('clerk_user_id', userIds)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      return result;
    }

    const template = NOTIFICATION_TEMPLATES[reminderType];
    const pushResults: PushSendResult[] = await Promise.all(
      (subscriptions as PushSubscriptionRow[]).map((sub) =>
        sendPushToSubscription(sub, {
          title: template.title,
          body: template.body,
          type: reminderType,
          url: template.action?.url,
        })
      )
    );

    result.sent = pushResults.filter((r) => r.success).length;
    result.failed = pushResults.filter((r) => !r.success).length;
    result.expired = pushResults
      .filter((r) => r.error === 'SUBSCRIPTION_EXPIRED')
      .map((r) => r.endpoint);

    console.log(`[Cron Push] ${reminderType}: ${result.sent} sent, ${result.failed} failed`);

    return result;
  } catch (error) {
    console.error(`[Cron Push] Error in ${reminderType}:`, error);
    return result;
  }
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
  return GET(request);
}
