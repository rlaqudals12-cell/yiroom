/**
 * API 타이밍 통계 조회
 * GET /api/admin/monitoring/timings
 * @description 라우트별 API 응답 시간 통계 (p50/p95/p99)
 */

import { NextResponse } from 'next/server';
import { requireAdminOrThrow } from '@/lib/admin/auth';
import { getTimingStats, getTimings } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdminOrThrow();

    const stats = getTimingStats();
    const totalEntries = getTimings().length;

    return NextResponse.json({
      success: true,
      data: {
        stats,
        totalEntries,
        bufferSize: 1000,
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
