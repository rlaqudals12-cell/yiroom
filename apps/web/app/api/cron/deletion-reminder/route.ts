/**
 * GDPR 삭제 알림 Cron
 * GET /api/cron/deletion-reminder
 *
 * 삭제 예정 사용자에게 7일, 3일, 1일 전 알림 발송
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/deletion-reminder",
 *     "schedule": "0 9 * * *"  // 매일 18:00 KST (UTC 09:00)
 *   }]
 * }
 *
 * @see SDD-GDPR-DELETION-CRON.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendPushToSubscriptions } from '@/lib/push/server';
import {
  GDPR_CONFIG,
  type DeletionReminderResult,
  type DeletionAuditAction,
} from '@/types/gdpr';

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

/**
 * 감사 로그 기록
 */
async function logDeletionAudit(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  action: DeletionAuditAction,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('deletion_audit_log').insert({
      user_id: userId,
      action,
      details,
      is_permanent: true,
    });
  } catch (error) {
    console.error('[GDPR-REMINDER] Failed to write audit log:', error);
  }
}

/**
 * 사용자에게 푸시 알림 발송
 * Web Push (push_subscriptions 테이블)를 통해 알림 발송
 */
async function sendDeletionReminder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  clerkUserId: string,
  daysRemaining: number
): Promise<boolean> {
  try {
    // Web Push 구독 조회 (push_subscriptions 테이블)
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, clerk_user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at, is_active')
      .eq('clerk_user_id', clerkUserId)
      .eq('is_active', true);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log(`[GDPR-REMINDER] No push subscriptions for user ${userId}`);
      return false;
    }

    // 푸시 알림 발송
    const title = '계정 삭제 예정 알림';
    const body =
      daysRemaining === 1
        ? '내일 계정이 삭제됩니다. 취소하시려면 지금 로그인해주세요.'
        : `${daysRemaining}일 후 계정이 삭제됩니다. 취소하시려면 앱에서 확인해주세요.`;

    await sendPushToSubscriptions(subscriptions, {
      title,
      body,
      data: {
        type: 'DELETION_REMINDER',
        daysRemaining,
        action: 'open_settings',
      },
    });

    return true;
  } catch (error) {
    console.error('[GDPR-REMINDER] Failed to send push notification:', error);
    return false;
  }
}

/**
 * 특정 일수 남은 사용자 조회 및 알림 발송
 */
async function processRemindersForDays(
  supabase: ReturnType<typeof createServiceRoleClient>,
  daysRemaining: number
): Promise<number> {
  // 해당 일수 남은 날짜 범위 계산
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  // 해당 날짜의 시작과 끝
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 해당 날짜에 삭제 예정인 사용자 조회
  const { data: users, error } = await supabase
    .from('users')
    .select('id, clerk_user_id, email, deletion_scheduled_at')
    .gte('deletion_scheduled_at', startOfDay.toISOString())
    .lte('deletion_scheduled_at', endOfDay.toISOString())
    .is('deleted_at', null) // 아직 삭제되지 않음
    .limit(100);

  if (error) {
    console.error(`[GDPR-REMINDER] Failed to query users for ${daysRemaining} days:`, error);
    return 0;
  }

  if (!users || users.length === 0) {
    console.log(`[GDPR-REMINDER] No users with ${daysRemaining} days remaining`);
    return 0;
  }

  console.log(`[GDPR-REMINDER] Found ${users.length} users with ${daysRemaining} days remaining`);

  let sentCount = 0;

  for (const user of users) {
    const sent = await sendDeletionReminder(supabase, user.id, user.clerk_user_id, daysRemaining);

    if (sent) {
      // 감사 로그 기록
      const action: DeletionAuditAction =
        daysRemaining === 7
          ? 'REMINDER_7D_SENT'
          : daysRemaining === 3
            ? 'REMINDER_3D_SENT'
            : 'REMINDER_1D_SENT';

      await logDeletionAudit(supabase, user.id, action, {
        clerk_user_id: user.clerk_user_id,
        days_remaining: daysRemaining,
        scheduled_at: user.deletion_scheduled_at,
      });

      sentCount++;
    }
  }

  return sentCount;
}

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[GDPR-REMINDER] Starting deletion reminder cron job...');

  try {
    const supabase = createServiceRoleClient();
    const result: DeletionReminderResult = {
      success: true,
      sent: {},
    };

    // 각 알림 기한별 처리 (7일, 3일, 1일)
    for (const days of GDPR_CONFIG.REMINDER_DAYS) {
      const sentCount = await processRemindersForDays(supabase, days);
      result.sent[`${days}d`] = sentCount;
    }

    // 전체 감사 로그
    await supabase.from('audit_logs').insert({
      action: 'CRON_DELETION_REMINDER_COMPLETED',
      details: {
        sent_7d: result.sent['7d'],
        sent_3d: result.sent['3d'],
        sent_1d: result.sent['1d'],
        total_sent: Object.values(result.sent).reduce((a, b) => a + b, 0),
      },
      performed_by: 'system:cron:deletion-reminder',
    });

    console.log('[GDPR-REMINDER] Completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Deletion reminders sent',
      sent: result.sent,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GDPR-REMINDER] Unexpected error:', error);
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
