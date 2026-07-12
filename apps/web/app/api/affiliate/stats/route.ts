/**
 * 어필리에이트 통계 API
 * @description GET /api/affiliate/stats
 *
 * 매출·수수료 등 사업 지표를 노출하므로 관리자 인증 뒤에 둔다.
 * (예전에는 무인증 공개 라우트라 누구나 매출 집계를 조회할 수 있었다.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrThrow } from '@/lib/admin/auth';
import {
  getDashboardSummary,
  getPartnerRevenues,
  getDailyRevenueTrend,
  getTopProducts,
  getDateRange,
} from '@/lib/affiliate/stats';

/**
 * 전환(수익) 추적 파이프라인이 실제로 구성되었는지 여부.
 * 전환 웹훅 검증에는 파트너별 시크릿이 필요하므로, 하나라도 설정되어 있으면
 * 수익 집계가 유효하다고 본다. 미설정 시 수치는 0이며 isConfigured=false로
 * "아직 구성 전"임을 정직하게 표시한다(조작된 랜덤 매출 Mock 제거).
 */
function isRevenueTrackingConfigured(): boolean {
  return Boolean(
    process.env.COUPANG_WEBHOOK_SECRET ||
    process.env.IHERB_WEBHOOK_SECRET ||
    process.env.MUSINSA_WEBHOOK_SECRET
  );
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인 (매출·수수료 지표 보호)
    await requireAdminOrThrow();

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

    const isConfigured = isRevenueTrackingConfigured();

    // 타입별 데이터 반환 (항상 실데이터 — 없으면 0/빈 배열)
    switch (type) {
      case 'summary': {
        const summary = await getDashboardSummary(dateRange.start, dateRange.end);
        return NextResponse.json({ success: true, data: summary, isConfigured });
      }

      case 'partners': {
        const partners = await getPartnerRevenues(dateRange.start, dateRange.end);
        return NextResponse.json({ success: true, data: partners, isConfigured });
      }

      case 'trend': {
        const trend = await getDailyRevenueTrend(dateRange.start, dateRange.end);
        return NextResponse.json({ success: true, data: trend, isConfigured });
      }

      case 'products': {
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const products = await getTopProducts(limit);
        return NextResponse.json({ success: true, data: products, isConfigured });
      }

      default: {
        // 전체 대시보드 데이터
        const [dashboardSummary, partnerRevenues, dailyTrend, topProducts] = await Promise.all([
          getDashboardSummary(dateRange.start, dateRange.end),
          getPartnerRevenues(dateRange.start, dateRange.end),
          getDailyRevenueTrend(dateRange.start, dateRange.end),
          getTopProducts(10),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            summary: dashboardSummary,
            partners: partnerRevenues,
            trend: dailyTrend,
            topProducts,
          },
          isConfigured,
        });
      }
    }
  } catch (error) {
    // 권한 오류 구분 (requireAdminOrThrow는 'Unauthorized...' 메시지로 throw)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.error('[Affiliate Stats API] Error:', error);
    return NextResponse.json({ error: '통계 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}
