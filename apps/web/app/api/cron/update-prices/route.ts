/**
 * Cron 가격 업데이트 API
 * @description Vercel Cron으로 트리거되는 자동 가격 업데이트
 * @version 1.0
 * @date 2025-12-09
 *
 * GET /api/cron/update-prices
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-prices",
 *     "schedule": "0 3 * * *"  // 매일 새벽 3시
 *   }]
 * }
 *
 * 환경 변수:
 * - CRON_SECRET: Vercel Cron 시크릿 (자동 제공)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateAllPrices } from '@/lib/crawler';

// Vercel Cron 인증 검증
function validateCronAuth(request: NextRequest): boolean {
  // Vercel Cron은 자동으로 Authorization 헤더 추가
  const authHeader = request.headers.get('Authorization');

  // 로컬 개발용: CRON_SECRET 환경 변수
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Vercel 배포 환경에서는 Vercel이 자동으로 검증
  // x-vercel-cron-signature 헤더 확인 가능
  const vercelSignature = request.headers.get('x-vercel-cron-signature');
  if (vercelSignature) {
    return true; // Vercel이 서명을 제공하면 신뢰
  }

  // 개발 환경에서는 허용
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

  console.log('[Cron] Starting scheduled price update...');

  try {
    // 각 타입당 100개씩 업데이트 (총 400개)
    const result = await updateAllPrices({
      limitPerType: 100,
      // source: 'naver_shopping', // Naver API 키가 있으면 사용
    });

    // 결과 요약
    const summary = {
      cosmetic: {
        total: result.cosmetic.total,
        success: result.cosmetic.success,
        failed: result.cosmetic.failed,
      },
      supplement: {
        total: result.supplement.total,
        success: result.supplement.success,
        failed: result.supplement.failed,
      },
      workout_equipment: {
        total: result.workout_equipment.total,
        success: result.workout_equipment.success,
        failed: result.workout_equipment.failed,
      },
      health_food: {
        total: result.health_food.total,
        success: result.health_food.success,
        failed: result.health_food.failed,
      },
    };

    const totalSuccess =
      summary.cosmetic.success +
      summary.supplement.success +
      summary.workout_equipment.success +
      summary.health_food.success;

    const totalFailed =
      summary.cosmetic.failed +
      summary.supplement.failed +
      summary.workout_equipment.failed +
      summary.health_food.failed;

    console.log(
      `[Cron] Price update completed: ${totalSuccess} success, ${totalFailed} failed`
    );

    return NextResponse.json({
      success: true,
      summary,
      totalSuccess,
      totalFailed,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Price update error:', error);
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
