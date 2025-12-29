/**
 * Analytics 통계 조회 API
 * GET /api/analytics/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsPeriod, AnalyticsStatsType } from '@/types/analytics';
import {
  getDateRange,
  getAnalyticsSummary,
  getTopPages,
  getTopFeatures,
  getDeviceBreakdown,
  getUserFlow,
  getDailyTrend,
  getAnalyticsDashboardData,
} from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const period = (searchParams.get('period') || 'week') as AnalyticsPeriod;
    const type = (searchParams.get('type') || 'all') as AnalyticsStatsType | 'all' | 'trend';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // 기간 계산
    let startDate: string;
    let endDate: string;

    if (startDateParam && endDateParam) {
      startDate = startDateParam;
      endDate = endDateParam;
    } else {
      const range = getDateRange(period);
      startDate = range.start;
      endDate = range.end;
    }

    // 타입별 데이터 조회
    switch (type) {
      case 'summary': {
        const summary = await getAnalyticsSummary(startDate, endDate);
        return NextResponse.json({
          success: true,
          data: summary,
          isMock: true,
        });
      }

      case 'pages': {
        const pages = await getTopPages(limit, startDate, endDate);
        return NextResponse.json({
          success: true,
          data: pages,
          isMock: true,
        });
      }

      case 'features': {
        const features = await getTopFeatures(limit, startDate, endDate);
        return NextResponse.json({
          success: true,
          data: features,
          isMock: true,
        });
      }

      case 'devices': {
        const devices = await getDeviceBreakdown(startDate, endDate);
        return NextResponse.json({
          success: true,
          data: devices,
          isMock: true,
        });
      }

      case 'flow': {
        const flow = await getUserFlow(startDate, endDate);
        return NextResponse.json({
          success: true,
          data: flow,
          isMock: true,
        });
      }

      case 'trend': {
        const trend = await getDailyTrend(startDate, endDate);
        return NextResponse.json({
          success: true,
          data: trend,
          isMock: true,
        });
      }

      case 'all':
      default: {
        const dashboard = await getAnalyticsDashboardData(startDate, endDate);
        return NextResponse.json({
          success: true,
          data: dashboard,
          isMock: true,
        });
      }
    }
  } catch (error) {
    console.error('[Analytics Stats API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
