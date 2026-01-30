/**
 * Cron 감사 로그 자동 정리 API
 * @description 오래된 감사 로그를 자동 삭제 (개인정보보호법 준수)
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-audit-logs",
 *     "schedule": "0 19 * * *"  // 매일 04:00 KST (UTC 19:00)
 *   }]
 * }
 *
 * 삭제 기준:
 * - audit_logs: 90일 이상 경과
 * - image_access_logs: 30일 이상 경과
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createLogger } from '@/lib/utils/logger';
import { logAuditEvent } from '@/lib/audit/logger';

const logger = createLogger('CleanupAuditLogs');

// 보관 기간 설정
const AUDIT_LOGS_RETENTION_DAYS = 90;
const IMAGE_ACCESS_LOGS_RETENTION_DAYS = 30;

interface CleanupResult {
  auditLogs: {
    deleted: number;
    error?: string;
  };
  imageAccessLogs: {
    deleted: number;
    error?: string;
  };
}

/**
 * Vercel Cron 인증 검증
 */
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET 환경변수가 설정된 경우
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Vercel Cron 서명 확인
  const vercelSignature = request.headers.get('x-vercel-cron-signature');
  if (vercelSignature) {
    return true;
  }

  // 개발 환경에서는 허용
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/**
 * 오래된 audit_logs 삭제
 */
async function cleanupAuditLogs(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<{ deleted: number; error?: string }> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - AUDIT_LOGS_RETENTION_DAYS);

  try {
    // 삭제 전 개수 확인
    const { count: beforeCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thresholdDate.toISOString());

    // 오래된 로그 삭제
    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', thresholdDate.toISOString());

    if (error) {
      logger.error('Failed to delete old audit_logs:', error);
      return { deleted: 0, error: error.message };
    }

    const deletedCount = beforeCount ?? 0;
    logger.info(`Deleted ${deletedCount} audit_logs older than ${AUDIT_LOGS_RETENTION_DAYS} days`);

    return { deleted: deletedCount };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error cleaning up audit_logs:', errorMsg);
    return { deleted: 0, error: errorMsg };
  }
}

/**
 * 오래된 image_access_logs 삭제
 */
async function cleanupImageAccessLogs(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<{ deleted: number; error?: string }> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - IMAGE_ACCESS_LOGS_RETENTION_DAYS);

  try {
    // 삭제 전 개수 확인
    const { count: beforeCount } = await supabase
      .from('image_access_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thresholdDate.toISOString());

    // 오래된 로그 삭제
    const { error } = await supabase
      .from('image_access_logs')
      .delete()
      .lt('created_at', thresholdDate.toISOString());

    if (error) {
      logger.error('Failed to delete old image_access_logs:', error);
      return { deleted: 0, error: error.message };
    }

    const deletedCount = beforeCount ?? 0;
    logger.info(
      `Deleted ${deletedCount} image_access_logs older than ${IMAGE_ACCESS_LOGS_RETENTION_DAYS} days`
    );

    return { deleted: deletedCount };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error cleaning up image_access_logs:', errorMsg);
    return { deleted: 0, error: errorMsg };
  }
}

export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('Starting audit log cleanup cron job...');

  try {
    const supabase = createServiceRoleClient();
    const result: CleanupResult = {
      auditLogs: { deleted: 0 },
      imageAccessLogs: { deleted: 0 },
    };

    // 1. audit_logs 정리 (90일)
    result.auditLogs = await cleanupAuditLogs(supabase);

    // 2. image_access_logs 정리 (30일)
    result.imageAccessLogs = await cleanupImageAccessLogs(supabase);

    // 3. 완료 감사 로그 기록 (자기 참조 방지를 위해 새 로그만 기록)
    await logAuditEvent({
      type: 'CRON_CLEANUP_IMAGES_COMPLETED',
      userId: 'system:cron:audit-cleanup',
      action: 'cleanup-audit-logs',
      resource: 'audit_logs',
      details: {
        audit_logs_deleted: result.auditLogs.deleted,
        image_access_logs_deleted: result.imageAccessLogs.deleted,
        retention_days: {
          audit_logs: AUDIT_LOGS_RETENTION_DAYS,
          image_access_logs: IMAGE_ACCESS_LOGS_RETENTION_DAYS,
        },
      },
    });

    const response = {
      success: true,
      message: 'Audit log cleanup completed',
      auditLogs: {
        deleted: result.auditLogs.deleted,
        retentionDays: AUDIT_LOGS_RETENTION_DAYS,
        error: result.auditLogs.error,
      },
      imageAccessLogs: {
        deleted: result.imageAccessLogs.deleted,
        retentionDays: IMAGE_ACCESS_LOGS_RETENTION_DAYS,
        error: result.imageAccessLogs.error,
      },
      completedAt: new Date().toISOString(),
    };

    logger.info('Audit log cleanup result:', response);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected error in audit cleanup cron:', error);
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
