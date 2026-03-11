/**
 * API 타이밍 + 성능 통계 조회
 * GET /api/admin/monitoring/timings
 * @description 라우트별 API 응답 시간 통계 (p50/p95/p99) + AI/DB 성능 메트릭
 */

import { NextResponse } from 'next/server';
import { requireAdminOrThrow } from '@/lib/admin/auth';
import {
  getTimingStats,
  getTimings,
  getAiStats,
  getDbStats,
  checkThresholds,
  PERFORMANCE_THRESHOLDS,
} from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdminOrThrow();

    const stats = getTimingStats();
    const totalEntries = getTimings().length;
    const aiStats = getAiStats();
    const dbStats = getDbStats();
    const alerts = checkThresholds();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        totalEntries,
        bufferSize: 1000,
        // AI 분석 성능
        aiPerformance: {
          stats: aiStats,
          thresholds: {
            p95Target: PERFORMANCE_THRESHOLDS.AI_P95_TARGET,
            fallbackWarn: PERFORMANCE_THRESHOLDS.AI_FALLBACK_WARN,
          },
        },
        // DB 쿼리 성능
        dbPerformance: {
          stats: dbStats,
          thresholds: {
            p95Target: PERFORMANCE_THRESHOLDS.DB_P95_TARGET,
          },
        },
        // 임계값 초과 알림
        alerts,
      },
    });
  } catch (error) {
    console.error('[API] GET /admin/monitoring/timings error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch timing stats',
          userMessage: '타이밍 통계를 불러올 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}
