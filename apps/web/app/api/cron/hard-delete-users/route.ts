/**
 * GDPR Hard Delete Cron
 * GET /api/cron/hard-delete-users
 *
 * Soft Delete 후 5일 경과 사용자 완전 삭제 (PIPA 준수)
 * - 모든 테이블에서 데이터 삭제
 * - Clerk 계정 완전 삭제
 * - 감사 로그만 유지 (법적 요구사항)
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/hard-delete-users",
 *     "schedule": "0 11 * * *"  // 매일 20:00 KST (UTC 11:00)
 *   }]
 * }
 *
 * @see SDD-GDPR-DELETION-CRON.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  GDPR_CONFIG,
  DELETION_TABLES,
  type CronJobResult,
  type DeletionAuditAction,
} from '@/types/gdpr';
import { redactPii } from '@/lib/utils/redact-pii';
import { purgeUserStorage } from '@/lib/api/storage-purge';
// Vercel Hobby 크론 2개 상한 대응: 스케줄되지 않는 정리 크론들을 매일 도는 이 크론 말미에 병합 호출.
import { GET as runCleanupAuditLogs } from '@/app/api/cron/cleanup-audit-logs/route';
import { GET as runCleanupImages } from '@/app/api/cron/cleanup-images/route';
import { GET as runCleanupConsents } from '@/app/api/cron/cleanup-consents/route';

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
 * 감사 로그 기록 (Hard Delete 시에도 유지)
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
    console.error('[GDPR-HARD-DELETE] Failed to write audit log:', error);
  }
}

/**
 * 사용자 데이터 완전 삭제 (Hard Delete)
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- multi-table cascade delete
async function hardDeleteUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  user: {
    id: string;
    clerk_user_id: string;
  }
): Promise<boolean> {
  const { id: userId, clerk_user_id: clerkUserId } = user;
  const now = new Date().toISOString();
  const deletedTables: string[] = [];
  const failedTables: string[] = [];

  try {
    console.info(`[GDPR-HARD-DELETE] Processing user ${redactPii.userId(clerkUserId)}`);

    // 1. 모든 관련 테이블에서 데이터 삭제 (의존성 순서대로)
    for (const tableName of DELETION_TABLES) {
      try {
        // clerk_user_id 또는 user_id 컬럼 확인하여 삭제
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('clerk_user_id', clerkUserId);

        if (deleteError) {
          // 테이블이 없거나 컬럼이 없는 경우
          if (
            deleteError.message.includes('does not exist') ||
            deleteError.message.includes('column')
          ) {
            console.info(`[GDPR-HARD-DELETE] Skipping ${tableName} - not applicable`);
          } else {
            console.error(`[GDPR-HARD-DELETE] Failed to delete from ${tableName}:`, deleteError);
            failedTables.push(tableName);
          }
        } else {
          deletedTables.push(tableName);
        }
      } catch (tableError) {
        console.error(`[GDPR-HARD-DELETE] Error with table ${tableName}:`, tableError);
        failedTables.push(tableName);
      }
    }

    // 2. 스토리지 완전 삭제 (이미 soft delete에서 처리되었을 수 있음)
    //    공유 유틸로 재귀 수집 + 전체 버킷(integrated-sessions·twins 등) 파기.
    //    생체 이미지 파기 실패는 파기의무상 감사에 남겨야 하므로 failedTables에 기록한다.
    const purge = await purgeUserStorage(supabase, clerkUserId);
    if (purge.deleted > 0) {
      console.info(`[GDPR-HARD-DELETE] Deleted ${purge.deleted} storage files for user`);
    }
    if (purge.failedBuckets.length > 0) {
      failedTables.push(...purge.failedBuckets);
    }

    // 3. users 테이블에서 완전 삭제
    const { error: userDeleteError } = await supabase.from('users').delete().eq('id', userId);

    if (userDeleteError) {
      console.error('[GDPR-HARD-DELETE] Failed to delete user record:', userDeleteError);
      failedTables.push('users');
    } else {
      deletedTables.push('users');
    }

    // 4. Clerk 계정 완전 삭제
    let clerkDeleted = false;
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
      clerkDeleted = true;

      // Clerk 삭제 감사 로그
      await logDeletionAudit(supabase, userId, 'CLERK_DELETED', {
        clerk_user_id: clerkUserId,
        deleted_at: now,
      });
    } catch (clerkError) {
      console.error('[GDPR-HARD-DELETE] Failed to delete Clerk user:', clerkError);
      // Clerk 삭제 실패해도 다른 데이터는 이미 삭제됨
    }

    // 5. 최종 감사 로그 (Hard Delete 완료 또는 실패)
    if (failedTables.length === 0) {
      await logDeletionAudit(supabase, userId, 'HARD_DELETED', {
        clerk_user_id: clerkUserId,
        hard_deleted_at: now,
        deleted_tables: deletedTables,
        clerk_deleted: clerkDeleted,
      });
      console.info(
        `[GDPR-HARD-DELETE] Successfully hard-deleted user ${redactPii.userId(clerkUserId)}`
      );
      return true;
    } else {
      await logDeletionAudit(supabase, userId, 'HARD_DELETE_FAILED', {
        clerk_user_id: clerkUserId,
        attempted_at: now,
        deleted_tables: deletedTables,
        failed_tables: failedTables,
        clerk_deleted: clerkDeleted,
      });
      console.error(
        `[GDPR-HARD-DELETE] Partial failure for user ${redactPii.userId(clerkUserId)}: ${failedTables.join(', ')}`
      );
      return false;
    }
  } catch (error) {
    console.error(
      `[GDPR-HARD-DELETE] Error processing user ${redactPii.userId(clerkUserId)}:`,
      error
    );

    await logDeletionAudit(supabase, userId, 'HARD_DELETE_FAILED', {
      clerk_user_id: clerkUserId,
      attempted_at: now,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return false;
  }
}

/**
 * 정리 크론 1개를 안전하게 실행한다.
 * 각 정리 라우트는 자체 try/catch로 500까지 흡수하므로 여기서 예외가 튀지 않지만,
 * 방어적으로 감싸 하드삭제 흐름이 정리 실패에 절대 영향받지 않도록 한다.
 */
async function safeCleanup(
  name: string,
  run: () => Promise<Response>
): Promise<Record<string, unknown>> {
  try {
    const res = await run();
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, ...body };
  } catch (error) {
    console.error(`[GDPR-HARD-DELETE] Merged cleanup "${name}" failed:`, error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 슬롯 0 정리 크론 병합 실행 (Vercel Hobby 크론 2개 상한 대응).
 *
 * cleanup-audit-logs(접속기록 730일)·cleanup-images(30일 미접속 익명화 + 탈퇴 완전삭제)
 * ·cleanup-consents(생체 동의 만료)는 vercel.json 슬롯 부족으로 스케줄되지 않는다.
 * 매일 도는 이 하드삭제 크론 말미에 병합 호출해 실효화한다.
 */
async function runMergedDailyCleanups(request: NextRequest): Promise<Record<string, unknown>> {
  return {
    auditLogs: await safeCleanup('audit-logs', () => runCleanupAuditLogs(request)),
    images: await safeCleanup('images', () => runCleanupImages(request)),
    consents: await safeCleanup('consents', () => runCleanupConsents(request)),
  };
}

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.info('[GDPR-HARD-DELETE] Starting hard delete cron job...');

  try {
    const supabase = createServiceRoleClient();
    const result: CronJobResult = {
      success: true,
      processed: 0,
      failed: 0,
      remaining: false,
    };

    // PIPA 하드 삭제 기한 계산 (Soft Delete 후 5일)
    const hardDeleteDeadline = new Date();
    hardDeleteDeadline.setDate(hardDeleteDeadline.getDate() - GDPR_CONFIG.PIPA_HARD_DELETE_DAYS);

    // Soft Delete 후 5일 경과한 사용자 조회
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, clerk_user_id, deleted_at')
      .lt('deleted_at', hardDeleteDeadline.toISOString()) // 5일 전에 soft delete됨
      .not('deleted_at', 'is', null) // soft delete됨
      .limit(GDPR_CONFIG.BATCH_SIZE.HARD_DELETE);

    if (queryError) {
      console.error('[GDPR-HARD-DELETE] Failed to query users:', queryError);
      return NextResponse.json(
        { error: 'Query failed', message: queryError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.info('[GDPR-HARD-DELETE] No users pending hard delete');
      // 하드삭제 대상이 없어도 병합 정리 크론은 매일 실행되어야 한다.
      const cleanup = await runMergedDailyCleanups(request);
      return NextResponse.json({
        success: true,
        message: 'No users to process',
        processed: 0,
        cleanup,
        completedAt: new Date().toISOString(),
      });
    }

    console.info(`[GDPR-HARD-DELETE] Found ${users.length} users for hard delete`);

    // 각 사용자 처리
    for (const user of users) {
      const success = await hardDeleteUser(supabase, user);
      if (success) {
        result.processed = (result.processed ?? 0) + 1;
      } else {
        result.failed = (result.failed ?? 0) + 1;
      }
    }

    // 더 처리할 사용자가 있는지 확인
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('deleted_at', hardDeleteDeadline.toISOString())
      .not('deleted_at', 'is', null);

    result.remaining = (count ?? 0) > 0;

    // 전체 감사 로그
    await supabase.from('audit_logs').insert({
      action: 'CRON_HARD_DELETE_COMPLETED',
      details: {
        processed: result.processed,
        failed: result.failed,
        remaining: result.remaining,
        pipa_deadline_days: GDPR_CONFIG.PIPA_HARD_DELETE_DAYS,
      },
      performed_by: 'system:cron:hard-delete-users',
    });

    console.info('[GDPR-HARD-DELETE] Completed:', result);

    // 슬롯 0 정리 크론 병합 실행 (하드삭제 성공 여부와 무관하게 항상 시도)
    const cleanup = await runMergedDailyCleanups(request);

    return NextResponse.json({
      success: true,
      message: 'Hard delete completed',
      processed: result.processed,
      failed: result.failed,
      remaining: result.remaining,
      cleanup,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GDPR-HARD-DELETE] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
  return GET(request);
}
