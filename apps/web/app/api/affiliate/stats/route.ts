/**
 * 어필리에이트 통계 API
 * @description GET /api/affiliate/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardSummary,
  getPartnerRevenues,
  getDailyRevenueTrend,
  getTopProducts,
  getDateRange,
} from '@/lib/affiliate/stats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'today' | 'week' | 'month' | 'quarter' | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // summary | partners | trend | products

    // 기간 결정
    let dateRange: { start: string; end: string };
    if (startDate && endDate) {
      dateRange = { start: startDate, end: endDate };
    } else {
      dateRange = getDateRange(period || 'week');
    }

    // Mock 모드 확인 (환경변수 또는 쿼리 파라미터)
    const useMock = process.env.AFFILIATE_USE_MOCK !== 'false';

    // 타입별 데이터 반환
    switch (type) {
      case 'summary':
        const summary = await getDashboardSummary(dateRange.start, dateRange.end, useMock);
        return NextResponse.json({
          success: true,
          data: summary,
          isMock: useMock,
        });

      case 'partners':
        const partners = await getPartnerRevenues(dateRange.start, dateRange.end, useMock);
        return NextResponse.json({
          success: true,
          data: partners,
          isMock: useMock,
        });

      case 'trend':
        const trend = await getDailyRevenueTrend(dateRange.start, dateRange.end, useMock);
        return NextResponse.json({
          success: true,
          data: trend,
          isMock: useMock,
        });

      case 'products':
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const products = await getTopProducts(limit, useMock);
        return NextResponse.json({
          success: true,
          data: products,
          isMock: useMock,
        });

      default:
        // 전체 대시보드 데이터
        const [dashboardSummary, partnerRevenues, dailyTrend, topProducts] = await Promise.all([
          getDashboardSummary(dateRange.start, dateRange.end, useMock),
          getPartnerRevenues(dateRange.start, dateRange.end, useMock),
          getDailyRevenueTrend(dateRange.start, dateRange.end, useMock),
          getTopProducts(10, useMock),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            summary: dashboardSummary,
            partners: partnerRevenues,
            trend: dailyTrend,
            topProducts,
          },
          isMock: useMock,
        });
    }
  } catch (error) {
    console.error('[Affiliate Stats API] Error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
