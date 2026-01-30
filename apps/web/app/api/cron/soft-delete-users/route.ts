/**
 * GDPR Soft Delete Cron
 * GET /api/cron/soft-delete-users
 *
 * 30일 유예기간 경과 사용자 데이터 익명화 (Soft Delete)
 * - PII 마스킹 (이메일, 이름 등)
 * - 분석 결과 익명화
 * - Clerk 계정 비활성화
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/soft-delete-users",
 *     "schedule": "0 10 * * *"  // 매일 19:00 KST (UTC 10:00)
 *   }]
 * }
 *
 * @see SDD-GDPR-DELETION-CRON.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { GDPR_CONFIG, type CronJobResult, type DeletionAuditAction } from '@/types/gdpr';
import { redactPii } from '@/lib/utils/redact-pii';

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
    console.error('[GDPR-SOFT-DELETE] Failed to write audit log:', error);
  }
}

/**
 * PII 마스킹 데이터 생성
 */
function generateAnonymizedData(userId: string): Record<string, unknown> {
  const anonymizedId = `deleted_${userId.slice(0, 8)}`;
  return {
    email: `${anonymizedId}@deleted.yiroom.app`,
    display_name: '삭제된 사용자',
    profile_image_url: null,
    bio: null,
    phone: null,
    birth_date: null,
    gender: null,
  };
}

/**
 * 사용자 데이터 익명화 (Soft Delete)
 */
async function softDeleteUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  user: {
    id: string;
    clerk_user_id: string;
    email: string | null;
  }
): Promise<boolean> {
  const { id: userId, clerk_user_id: clerkUserId } = user;
  const now = new Date().toISOString();

  try {
    console.log(`[GDPR-SOFT-DELETE] Processing user ${redactPii.userId(clerkUserId)}`);

    // 1. 사용자 테이블 익명화
    const anonymizedData = generateAnonymizedData(userId);
    const { error: userError } = await supabase
      .from('users')
      .update({
        ...anonymizedData,
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', userId);

    if (userError) {
      console.error('[GDPR-SOFT-DELETE] Failed to anonymize user:', userError);
      return false;
    }

    // 2. 관련 테이블 익명화 (이미지 URL null 처리)
    const tablesToAnonymize = [
      { table: 'personal_color_assessments', imageColumns: ['face_image_url', 'left_image_url', 'right_image_url', 'wrist_image_url'] },
      { table: 'skin_analyses', imageColumns: ['face_image_url'] },
      { table: 'body_analyses', imageColumns: ['body_image_url', 'front_image_url', 'side_image_url'] },
      { table: 'meal_records', imageColumns: ['image_url'] },
    ];

    for (const { table, imageColumns } of tablesToAnonymize) {
      try {
        const updateData: Record<string, null> = {};
        for (const col of imageColumns) {
          updateData[col] = null;
        }
        await supabase.from(table).update(updateData).eq('clerk_user_id', clerkUserId);
      } catch {
        // 테이블이 없거나 컬럼이 없으면 무시
        console.log(`[GDPR-SOFT-DELETE] Skipping ${table} - may not exist`);
      }
    }

    // 3. 스토리지 이미지 삭제
    const storageBuckets = ['skin-images', 'body-images', 'personal-color-images', 'food-images'];
    for (const bucket of storageBuckets) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list(clerkUserId);
        if (files && files.length > 0) {
          const filePaths = files.map((f) => `${clerkUserId}/${f.name}`);
          await supabase.storage.from(bucket).remove(filePaths);
          console.log(`[GDPR-SOFT-DELETE] Deleted ${filePaths.length} files from ${bucket}`);
        }
      } catch {
        // 버킷이 없거나 파일이 없으면 무시
      }
    }

    // 4. 소셜 데이터 삭제 (친구, 피드 등)
    const socialTables = [
      'friendships',
      'feed_posts',
      'post_likes',
      'post_comments',
    ];

    for (const table of socialTables) {
      try {
        await supabase.from(table).delete().eq('clerk_user_id', clerkUserId);
      } catch {
        // 테이블이 없으면 무시
      }
    }

    // 5. 푸시 토큰 삭제
    try {
      await supabase.from('user_push_tokens').delete().eq('clerk_user_id', clerkUserId);
    } catch {
      // 무시
    }

    // 6. Clerk 계정 비활성화 (삭제 아님, 향후 복구 가능성 대비)
    try {
      const client = await clerkClient();
      await client.users.updateUser(clerkUserId, {
        publicMetadata: {
          deletionStatus: 'soft_deleted',
          softDeletedAt: now,
        },
      });
    } catch (clerkError) {
      console.warn('[GDPR-SOFT-DELETE] Failed to update Clerk metadata:', clerkError);
      // Clerk 실패해도 계속 진행
    }

    // 7. 감사 로그
    await logDeletionAudit(supabase, userId, 'SOFT_DELETED', {
      clerk_user_id: clerkUserId,
      soft_deleted_at: now,
      anonymized_fields: Object.keys(anonymizedData),
    });

    console.log(`[GDPR-SOFT-DELETE] Successfully soft-deleted user ${redactPii.userId(clerkUserId)}`);
    return true;
  } catch (error) {
    console.error(`[GDPR-SOFT-DELETE] Error processing user ${redactPii.userId(clerkUserId)}:`, error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[GDPR-SOFT-DELETE] Starting soft delete cron job...');

  try {
    const supabase = createServiceRoleClient();
    const result: CronJobResult = {
      success: true,
      processed: 0,
      failed: 0,
      remaining: false,
    };

    // 삭제 예정 날짜가 지난 사용자 조회 (아직 soft delete 안 됨)
    const now = new Date();
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, clerk_user_id, email, deletion_scheduled_at')
      .lt('deletion_scheduled_at', now.toISOString()) // 예정일 지남
      .is('deleted_at', null) // 아직 삭제 안 됨
      .not('deletion_requested_at', 'is', null) // 삭제 요청 있음
      .limit(GDPR_CONFIG.BATCH_SIZE.SOFT_DELETE);

    if (queryError) {
      console.error('[GDPR-SOFT-DELETE] Failed to query users:', queryError);
      return NextResponse.json(
        { error: 'Query failed', message: queryError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('[GDPR-SOFT-DELETE] No users pending soft delete');
      return NextResponse.json({
        success: true,
        message: 'No users to process',
        processed: 0,
        completedAt: now.toISOString(),
      });
    }

    console.log(`[GDPR-SOFT-DELETE] Found ${users.length} users for soft delete`);

    // 각 사용자 처리
    for (const user of users) {
      const success = await softDeleteUser(supabase, user);
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
      .lt('deletion_scheduled_at', now.toISOString())
      .is('deleted_at', null)
      .not('deletion_requested_at', 'is', null);

    result.remaining = (count ?? 0) > 0;

    // 전체 감사 로그
    await supabase.from('audit_logs').insert({
      action: 'CRON_SOFT_DELETE_COMPLETED',
      details: {
        processed: result.processed,
        failed: result.failed,
        remaining: result.remaining,
      },
      performed_by: 'system:cron:soft-delete-users',
    });

    console.log('[GDPR-SOFT-DELETE] Completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Soft delete completed',
      processed: result.processed,
      failed: result.failed,
      remaining: result.remaining,
      completedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[GDPR-SOFT-DELETE] Unexpected error:', error);
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
