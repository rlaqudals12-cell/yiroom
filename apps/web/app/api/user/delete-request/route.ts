/**
 * GDPR 삭제 요청 API
 * POST /api/user/delete-request - 삭제 예약 (30일 유예기간)
 * DELETE /api/user/delete-request - 삭제 취소
 *
 * @see SDD-GDPR-DELETION-CRON.md
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  GDPR_CONFIG,
  type DeletionRequestResponse,
  type DeletionAuditAction,
} from '@/types/gdpr';

/**
 * 감사 로그 기록 (deletion_audit_log 테이블)
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
    console.error('[GDPR] Failed to write audit log:', error);
  }
}

/**
 * POST: 삭제 요청 (30일 유예기간 후 삭제 예약)
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_user_id, deletion_requested_at, deletion_scheduled_at')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 삭제 요청 중인지 확인
    if (user.deletion_requested_at) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_REQUESTED',
          message: '이미 삭제 요청이 진행 중입니다.',
          data: {
            scheduledAt: user.deletion_scheduled_at,
            gracePeriodDays: GDPR_CONFIG.GRACE_PERIOD_DAYS,
            canCancelUntil: user.deletion_scheduled_at,
          },
        },
        { status: 409 }
      );
    }

    // 삭제 예약 날짜 계산 (30일 후)
    const now = new Date();
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + GDPR_CONFIG.GRACE_PERIOD_DAYS);

    // 삭제 요청 저장
    const { error: updateError } = await supabase
      .from('users')
      .update({
        deletion_requested_at: now.toISOString(),
        deletion_scheduled_at: scheduledAt.toISOString(),
      })
      .eq('clerk_user_id', userId);

    if (updateError) {
      console.error('[GDPR] Failed to update deletion request:', updateError);
      return NextResponse.json(
        { success: false, error: 'UPDATE_FAILED', message: '삭제 요청 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await logDeletionAudit(supabase, user.id, 'DELETION_REQUESTED', {
      clerk_user_id: userId,
      requested_at: now.toISOString(),
      scheduled_at: scheduledAt.toISOString(),
      grace_period_days: GDPR_CONFIG.GRACE_PERIOD_DAYS,
    });

    const response: DeletionRequestResponse = {
      success: true,
      data: {
        scheduledAt: scheduledAt.toISOString(),
        gracePeriodDays: GDPR_CONFIG.GRACE_PERIOD_DAYS,
        canCancelUntil: scheduledAt.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GDPR] Unexpected error in delete request:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 삭제 요청 취소
 */
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_user_id, deletion_requested_at, deletion_scheduled_at, deleted_at')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제 요청이 없는 경우
    if (!user.deletion_requested_at) {
      return NextResponse.json(
        { success: false, error: 'NO_REQUEST', message: '취소할 삭제 요청이 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 삭제된 경우 (soft delete 이후)
    if (user.deleted_at) {
      return NextResponse.json(
        { success: false, error: 'ALREADY_DELETED', message: '이미 삭제 처리가 완료되어 취소할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 삭제 예약 취소
    const { error: updateError } = await supabase
      .from('users')
      .update({
        deletion_requested_at: null,
        deletion_scheduled_at: null,
      })
      .eq('clerk_user_id', userId);

    if (updateError) {
      console.error('[GDPR] Failed to cancel deletion request:', updateError);
      return NextResponse.json(
        { success: false, error: 'UPDATE_FAILED', message: '삭제 취소 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await logDeletionAudit(supabase, user.id, 'DELETION_CANCELLED', {
      clerk_user_id: userId,
      cancelled_at: new Date().toISOString(),
      original_scheduled_at: user.deletion_scheduled_at,
    });

    return NextResponse.json({
      success: true,
      message: '삭제 요청이 취소되었습니다.',
    });
  } catch (error) {
    console.error('[GDPR] Unexpected error in cancel delete request:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET: 현재 삭제 요청 상태 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('deletion_requested_at, deletion_scheduled_at, deleted_at')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제 요청 없음
    if (!user.deletion_requested_at) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'active',
          deletionRequested: false,
        },
      });
    }

    // 이미 삭제됨
    if (user.deleted_at) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'deleted',
          deletionRequested: true,
          deletedAt: user.deleted_at,
        },
      });
    }

    // 삭제 예정
    const daysRemaining = Math.ceil(
      (new Date(user.deletion_scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      success: true,
      data: {
        status: 'pending_deletion',
        deletionRequested: true,
        requestedAt: user.deletion_requested_at,
        scheduledAt: user.deletion_scheduled_at,
        daysRemaining: Math.max(0, daysRemaining),
        canCancel: daysRemaining > 0,
      },
    });
  } catch (error) {
    console.error('[GDPR] Unexpected error in get delete status:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
