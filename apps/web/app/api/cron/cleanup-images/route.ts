/**
 * Cron 이미지 자동 삭제 API
 * @description 장기 미접속/탈퇴 사용자 이미지 자동 삭제 (GDPR/PIPA 준수)
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-images",
 *     "schedule": "0 19 * * *"  // 매일 04:00 KST (UTC 19:00)
 *   }]
 * }
 *
 * 처리 대상:
 * 1. 30일 이상 미접속 사용자의 이미지 익명화
 * 2. 탈퇴 요청 후 72시간 경과 사용자의 이미지 완전 삭제
 * 3. 삭제 결과 감사 로그 기록
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createLogger } from '@/lib/utils/logger';
import { redactPii } from '@/lib/utils/redact-pii';

const logger = createLogger('CleanupImages');

// 분석 타입별 스토리지 버킷 매핑
const ANALYSIS_STORAGE_BUCKETS = [
  'skin-images',
  'body-images',
  'personal-color-images',
  'food-images',
] as const;

// 관련 분석 테이블 (이미지 URL 컬럼 보유)
const ANALYSIS_TABLES_WITH_IMAGES = [
  { table: 'personal_color_assessments', columns: ['face_image_url', 'left_image_url', 'right_image_url', 'wrist_image_url'] },
  { table: 'skin_analyses', columns: ['face_image_url'] },
  { table: 'body_analyses', columns: ['body_image_url', 'front_image_url', 'side_image_url'] },
  { table: 'meal_records', columns: ['image_url'] },
] as const;

// 설정
const INACTIVE_DAYS_THRESHOLD = 30; // 미접속 기준 (일)
const DELETION_GRACE_HOURS = 72; // 탈퇴 후 삭제 유예 시간

interface CleanupResult {
  inactiveUsers: {
    processed: number;
    anonymizedImages: number;
    errors: string[];
  };
  deletedUsers: {
    processed: number;
    deletedImages: number;
    errors: string[];
  };
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

/**
 * 감사 로그 기록
 */
async function logAudit(
  supabase: ReturnType<typeof createServiceRoleClient>,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action,
      details,
      performed_by: 'system:cron:cleanup-images',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // 감사 로그 실패해도 메인 작업은 계속 진행
    logger.warn('Failed to write audit log:', error);
  }
}

/**
 * 사용자의 모든 버킷에서 이미지 삭제
 */
async function deleteUserImages(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<number> {
  let deletedCount = 0;

  for (const bucketName of ANALYSIS_STORAGE_BUCKETS) {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(userId);

      if (listError) {
        logger.warn(`Storage list error for bucket ${bucketName}:`, listError.message);
        continue;
      }

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove(filePaths);

        if (deleteError) {
          logger.error(`Storage delete error for bucket ${bucketName}:`, deleteError.message);
        } else {
          deletedCount += filePaths.length;
          logger.info(
            `Deleted ${filePaths.length} images from ${bucketName} for user ${redactPii.userId(userId)}`
          );
        }
      }
    } catch (error) {
      logger.error(`Error processing bucket ${bucketName}:`, error);
    }
  }

  return deletedCount;
}

/**
 * 분석 테이블의 이미지 URL 익명화
 */
async function anonymizeImageUrls(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<number> {
  let anonymizedCount = 0;

  for (const { table, columns } of ANALYSIS_TABLES_WITH_IMAGES) {
    try {
      // 업데이트할 컬럼 객체 생성
      const updateData: Record<string, null> = {};
      for (const col of columns) {
        updateData[col] = null;
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('clerk_user_id', userId);

      if (error) {
        logger.warn(`Failed to anonymize ${table} for user:`, error.message);
      } else {
        anonymizedCount += columns.length;
      }
    } catch (error) {
      logger.error(`Error anonymizing ${table}:`, error);
    }
  }

  return anonymizedCount;
}

/**
 * 30일 미접속 사용자 처리
 */
async function processInactiveUsers(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<CleanupResult['inactiveUsers']> {
  const result: CleanupResult['inactiveUsers'] = {
    processed: 0,
    anonymizedImages: 0,
    errors: [],
  };

  // 30일 전 날짜 계산
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - INACTIVE_DAYS_THRESHOLD);

  // 미접속 사용자 조회 (이미지 보유 + last_sign_in이 오래된)
  const { data: inactiveUsers, error: fetchError } = await supabase
    .from('users')
    .select('clerk_user_id, last_sign_in_at, email')
    .lt('last_sign_in_at', thresholdDate.toISOString())
    .eq('images_anonymized', false) // 이미 처리되지 않은 사용자만
    .limit(50); // 배치 처리

  if (fetchError) {
    logger.error('Failed to fetch inactive users:', fetchError);
    result.errors.push('Failed to fetch inactive users');
    return result;
  }

  if (!inactiveUsers || inactiveUsers.length === 0) {
    logger.info('No inactive users found for image anonymization');
    return result;
  }

  logger.info(`Found ${inactiveUsers.length} inactive users for processing`);

  for (const user of inactiveUsers) {
    try {
      // 1. 스토리지에서 이미지 삭제
      const deletedCount = await deleteUserImages(supabase, user.clerk_user_id);

      // 2. DB에서 이미지 URL 익명화
      const anonymizedCount = await anonymizeImageUrls(supabase, user.clerk_user_id);

      // 3. 사용자 플래그 업데이트
      await supabase
        .from('users')
        .update({
          images_anonymized: true,
          images_anonymized_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', user.clerk_user_id);

      // 4. 감사 로그
      await logAudit(supabase, 'IMAGE_ANONYMIZATION', {
        user_id: redactPii.userId(user.clerk_user_id),
        reason: 'INACTIVE_30_DAYS',
        storage_deleted: deletedCount,
        db_anonymized: anonymizedCount,
      });

      result.processed++;
      result.anonymizedImages += deletedCount + anonymizedCount;
    } catch (error) {
      const errorMsg = `Error processing inactive user ${redactPii.userId(user.clerk_user_id)}`;
      logger.error(errorMsg, error);
      result.errors.push(errorMsg);
    }
  }

  return result;
}

/**
 * 탈퇴 요청 사용자 완전 삭제 처리
 */
async function processDeletedUsers(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<CleanupResult['deletedUsers']> {
  const result: CleanupResult['deletedUsers'] = {
    processed: 0,
    deletedImages: 0,
    errors: [],
  };

  // 72시간 전 날짜 계산
  const graceDeadline = new Date();
  graceDeadline.setHours(graceDeadline.getHours() - DELETION_GRACE_HOURS);

  // 탈퇴 요청 후 72시간 경과 사용자 조회
  const { data: deletedUsers, error: fetchError } = await supabase
    .from('users')
    .select('clerk_user_id, email, deleted_at')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', graceDeadline.toISOString())
    .eq('data_purged', false) // 아직 완전 삭제되지 않은 사용자
    .limit(20); // 배치 처리

  if (fetchError) {
    logger.error('Failed to fetch deleted users:', fetchError);
    result.errors.push('Failed to fetch deleted users');
    return result;
  }

  if (!deletedUsers || deletedUsers.length === 0) {
    logger.info('No deleted users pending data purge');
    return result;
  }

  logger.info(`Found ${deletedUsers.length} deleted users for complete purge`);

  for (const user of deletedUsers) {
    try {
      // 1. 스토리지에서 이미지 완전 삭제
      const deletedCount = await deleteUserImages(supabase, user.clerk_user_id);

      // 2. 분석 데이터 완전 삭제 (RLS 우회하여 삭제)
      for (const { table } of ANALYSIS_TABLES_WITH_IMAGES) {
        await supabase
          .from(table)
          .delete()
          .eq('clerk_user_id', user.clerk_user_id);
      }

      // 3. 기타 개인 데이터 삭제
      const personalDataTables = [
        'workout_logs',
        'meal_records',
        'water_records',
        'daily_nutrition_summary',
        'user_levels',
        'user_badges',
        'wellness_scores',
        'friendships',
        'user_notification_settings',
        'user_push_tokens',
        'pantry_items',
        'product_reviews',
        'feedback',
      ];

      for (const tableName of personalDataTables) {
        await supabase
          .from(tableName)
          .delete()
          .eq('clerk_user_id', user.clerk_user_id);
      }

      // 4. 사용자 레코드 완전 삭제 플래그
      await supabase
        .from('users')
        .update({
          data_purged: true,
          data_purged_at: new Date().toISOString(),
          email: null, // 이메일도 삭제
        })
        .eq('clerk_user_id', user.clerk_user_id);

      // 5. 감사 로그
      await logAudit(supabase, 'COMPLETE_DATA_PURGE', {
        user_id: redactPii.userId(user.clerk_user_id),
        reason: 'ACCOUNT_DELETION_GRACE_PERIOD_EXPIRED',
        storage_deleted: deletedCount,
        tables_purged: personalDataTables.length + ANALYSIS_TABLES_WITH_IMAGES.length,
      });

      result.processed++;
      result.deletedImages += deletedCount;
    } catch (error) {
      const errorMsg = `Error purging data for user ${redactPii.userId(user.clerk_user_id)}`;
      logger.error(errorMsg, error);
      result.errors.push(errorMsg);
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('Starting image cleanup cron job...');

  try {
    const supabase = createServiceRoleClient();

    // 1. 30일 미접속 사용자 처리
    const inactiveResult = await processInactiveUsers(supabase);

    // 2. 탈퇴 사용자 완전 삭제 처리
    const deletedResult = await processDeletedUsers(supabase);

    const response = {
      success: true,
      message: 'Image cleanup completed',
      inactiveUsers: {
        processed: inactiveResult.processed,
        anonymizedImages: inactiveResult.anonymizedImages,
        errors: inactiveResult.errors.length > 0 ? inactiveResult.errors : undefined,
      },
      deletedUsers: {
        processed: deletedResult.processed,
        deletedImages: deletedResult.deletedImages,
        errors: deletedResult.errors.length > 0 ? deletedResult.errors : undefined,
      },
      completedAt: new Date().toISOString(),
    };

    logger.info('Cleanup result:', response);

    // 최종 감사 로그
    await logAudit(supabase, 'CRON_CLEANUP_IMAGES_COMPLETED', {
      inactive_users_processed: inactiveResult.processed,
      deleted_users_processed: deletedResult.processed,
      total_images_affected: inactiveResult.anonymizedImages + deletedResult.deletedImages,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected error in cleanup cron:', error);
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
