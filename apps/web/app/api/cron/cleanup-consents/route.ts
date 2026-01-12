/**
 * Cron GDPR 동의 만료 정리 API
 * @description 만료된 이미지 저장 동의 자동 정리 (GDPR/PIPA 준수)
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-consents",
 *     "schedule": "0 18 * * *"  // 매일 03:00 KST (UTC 18:00)
 *   }]
 * }
 *
 * 처리 로직:
 * 1. retention_until이 지난 동의 레코드 조회
 * 2. 각 레코드의 이미지 스토리지에서 삭제
 * 3. 동의 레코드 soft delete (consent_given = false)
 * 4. 처리 결과 로깅
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 분석 타입별 스토리지 버킷 매핑
const ANALYSIS_STORAGE_BUCKETS: Record<string, string> = {
  skin: 'skin-images',
  body: 'body-images',
  'personal-color': 'personal-color-images',
};

interface ExpiredConsent {
  id: string;
  clerk_user_id: string;
  analysis_type: string;
  retention_until: string;
}

interface CleanupResult {
  processed: number;
  deletedImages: number;
  total: number;
  errors?: string[];
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

  console.log('[Cron Cleanup] Starting GDPR consent cleanup...');

  try {
    const supabase = createServiceRoleClient();

    // 1. 만료된 동의 레코드 조회
    const now = new Date().toISOString();
    const { data: expiredConsents, error: fetchError } = await supabase
      .from('image_consents')
      .select('id, clerk_user_id, analysis_type, retention_until')
      .eq('consent_given', true)
      .lt('retention_until', now)
      .limit(100); // 배치 처리 (한 번에 100개)

    if (fetchError) {
      console.error('[Cron Cleanup] Failed to fetch expired consents:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch expired consents', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!expiredConsents || expiredConsents.length === 0) {
      console.log('[Cron Cleanup] No expired consents found');
      return NextResponse.json({
        success: true,
        message: 'No expired consents to process',
        processed: 0,
        completedAt: new Date().toISOString(),
      });
    }

    console.log(`[Cron Cleanup] Found ${expiredConsents.length} expired consents`);

    // 2. 각 레코드 처리
    const result: CleanupResult = {
      processed: 0,
      deletedImages: 0,
      total: expiredConsents.length,
      errors: [],
    };

    for (const consent of expiredConsents as ExpiredConsent[]) {
      try {
        const bucketName = ANALYSIS_STORAGE_BUCKETS[consent.analysis_type];

        if (bucketName) {
          // 사용자 이미지 폴더 조회
          const { data: files, error: listError } = await supabase.storage
            .from(bucketName)
            .list(consent.clerk_user_id);

          if (listError) {
            console.warn(
              `[Cron Cleanup] Storage list error for ${consent.clerk_user_id}:`,
              listError.message
            );
          } else if (files && files.length > 0) {
            // 이미지 삭제
            const filePaths = files.map((file) => `${consent.clerk_user_id}/${file.name}`);
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove(filePaths);

            if (deleteError) {
              console.error(`[Cron Cleanup] Storage delete error:`, deleteError.message);
            } else {
              result.deletedImages += filePaths.length;
              console.log(
                `[Cron Cleanup] Deleted ${filePaths.length} images for ${consent.clerk_user_id}`
              );
            }
          }
        }

        // 3. 동의 레코드 soft delete
        const { error: updateError } = await supabase
          .from('image_consents')
          .update({
            consent_given: false,
            withdrawal_at: new Date().toISOString(),
          })
          .eq('id', consent.id);

        if (updateError) {
          console.error(`[Cron Cleanup] Update error for consent ${consent.id}:`, updateError);
          result.errors!.push(`Failed to update consent ${consent.id}`);
        } else {
          result.processed++;
        }
      } catch (err) {
        console.error(`[Cron Cleanup] Error processing consent ${consent.id}:`, err);
        result.errors!.push(`Error processing consent ${consent.id}`);
      }
    }

    // 4. 결과 반환
    const response = {
      success: true,
      message: 'GDPR cleanup completed',
      processed: result.processed,
      deletedImages: result.deletedImages,
      total: result.total,
      errors: result.errors && result.errors.length > 0 ? result.errors : undefined,
      completedAt: new Date().toISOString(),
    };

    console.log('[Cron Cleanup] Result:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Cron Cleanup] Unexpected error:', error);
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
