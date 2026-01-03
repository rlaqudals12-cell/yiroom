/**
 * Admin Analytics API
 * GET /api/admin/analytics
 * @description 관리자 대시보드용 사용자 활동 통계 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrThrow } from '@/lib/admin/auth';
import {
  getActiveUserStats,
  getFeatureUsageStats,
  getDailyActiveUserTrend,
  getDailyFeatureUsageTrend,
} from '@/lib/admin/user-activity-stats';

export const dynamic = 'force-dynamic';

type StatsType = 'all' | 'activeUsers' | 'featureUsage' | 'activeUserTrend' | 'featureUsageTrend';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdminOrThrow();

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all') as StatsType;
    const days = parseInt(searchParams.get('days') || '14', 10);

    switch (type) {
      case 'activeUsers': {
        const activeUserStats = await getActiveUserStats();
        return NextResponse.json({
          success: true,
          data: activeUserStats,
        });
      }

      case 'featureUsage': {
        const featureUsageStats = await getFeatureUsageStats();
        return NextResponse.json({
          success: true,
          data: featureUsageStats,
        });
      }

      case 'activeUserTrend': {
        const trend = await getDailyActiveUserTrend(days);
        return NextResponse.json({
          success: true,
          data: trend,
        });
      }

      case 'featureUsageTrend': {
        const trend = await getDailyFeatureUsageTrend(days);
        return NextResponse.json({
          success: true,
          data: trend,
        });
      }

      case 'all':
      default: {
        // 병렬로 모든 데이터 조회
        const [activeUserStats, featureUsageStats, activeUserTrend, featureUsageTrend] =
          await Promise.all([
            getActiveUserStats(),
            getFeatureUsageStats(),
            getDailyActiveUserTrend(days),
            getDailyFeatureUsageTrend(days),
          ]);

        return NextResponse.json({
          success: true,
          data: {
            activeUserStats,
            featureUsageStats,
            activeUserTrend,
            featureUsageTrend,
          },
        });
      }
    }
  } catch (error) {
    console.error('[Admin Analytics API] Error:', error);

    // 권한 오류 구분
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
