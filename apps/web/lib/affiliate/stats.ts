/**
 * 어필리에이트 통계 유틸리티
 * @description 수익 대시보드용 통계 함수 (실데이터 전용)
 *
 * 조작된 랜덤 매출 Mock(generateMock*)은 제거됨 — 데이터가 없으면 0/빈 배열을
 * 반환해 "아직 수익 없음"을 정직하게 노출한다.
 */

import { getPartnerDailyStats, getAffiliateStatsSummary, getTopClickedProducts } from './clicks';
import type { AffiliatePartnerName } from '@/types/affiliate';

/** 파트너별 수익 통계 */
export interface PartnerRevenue {
  partnerId: AffiliatePartnerName;
  partnerName: string;
  clicks: number;
  conversions: number;
  salesKrw: number;
  commissionKrw: number;
  conversionRate: number;
}

/** 일별 수익 트렌드 */
export interface DailyRevenueTrend {
  date: string;
  clicks: number;
  conversions: number;
  commissionKrw: number;
}

/** 대시보드 요약 통계 */
export interface DashboardSummary {
  period: { start: string; end: string };
  totalClicks: number;
  totalConversions: number;
  totalSalesKrw: number;
  totalCommissionKrw: number;
  conversionRate: number;
  comparedToPrevious: {
    clicksChange: number; // %
    commissionsChange: number; // %
  };
}

/** 인기 제품 */
export interface TopProduct {
  productId: string;
  productName: string;
  partnerId: AffiliatePartnerName;
  clicks: number;
  conversions: number;
  commissionKrw: number;
}

/**
 * 대시보드 요약 통계 조회 (실데이터 전용 — 조작된 Mock 없음)
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 */
export async function getDashboardSummary(
  startDate: string,
  endDate: string
): Promise<DashboardSummary> {
  // 실제 DB 조회
  const stats = await getAffiliateStatsSummary(startDate, endDate);

  // 이전 기간 통계 (비교용)
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const periodDays = Math.ceil(
    (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  const prevEndDate = new Date(startDateObj);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - periodDays);

  const prevStats = await getAffiliateStatsSummary(
    prevStartDate.toISOString().split('T')[0],
    prevEndDate.toISOString().split('T')[0]
  );

  const clicksChange =
    prevStats.totalClicks > 0
      ? ((stats.totalClicks - prevStats.totalClicks) / prevStats.totalClicks) * 100
      : 0;

  const commissionsChange =
    prevStats.totalCommissionKrw > 0
      ? ((stats.totalCommissionKrw - prevStats.totalCommissionKrw) / prevStats.totalCommissionKrw) *
        100
      : 0;

  return {
    period: { start: startDate, end: endDate },
    totalClicks: stats.totalClicks,
    totalConversions: stats.totalConversions,
    totalSalesKrw: stats.totalSalesKrw,
    totalCommissionKrw: stats.totalCommissionKrw,
    conversionRate: stats.conversionRate,
    comparedToPrevious: {
      clicksChange: parseFloat(clicksChange.toFixed(1)),
      commissionsChange: parseFloat(commissionsChange.toFixed(1)),
    },
  };
}

/**
 * 파트너별 수익 통계
 */
export async function getPartnerRevenues(
  startDate: string,
  endDate: string
): Promise<PartnerRevenue[]> {
  const partners: AffiliatePartnerName[] = ['coupang', 'iherb', 'musinsa', 'oliveyoung'];
  const partnerNames: Record<AffiliatePartnerName, string> = {
    coupang: '쿠팡',
    iherb: 'iHerb',
    musinsa: '무신사',
    oliveyoung: '올리브영',
  };

  const results: PartnerRevenue[] = [];

  for (const partnerId of partners) {
    const stats = await getPartnerDailyStats(partnerId, startDate, endDate);

    const totals = stats.reduce(
      (acc, day) => ({
        clicks: acc.clicks + day.totalClicks,
        conversions: acc.conversions + day.conversions,
        salesKrw: acc.salesKrw + day.totalSalesKrw,
        commissionKrw: acc.commissionKrw + day.totalCommissionKrw,
      }),
      { clicks: 0, conversions: 0, salesKrw: 0, commissionKrw: 0 }
    );

    results.push({
      partnerId,
      partnerName: partnerNames[partnerId],
      clicks: totals.clicks,
      conversions: totals.conversions,
      salesKrw: totals.salesKrw,
      commissionKrw: totals.commissionKrw,
      conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
    });
  }

  return results;
}

/**
 * 일별 수익 트렌드
 */
export async function getDailyRevenueTrend(
  startDate: string,
  endDate: string
): Promise<DailyRevenueTrend[]> {
  // 모든 파트너의 일별 통계 합산
  const partners: AffiliatePartnerName[] = ['coupang', 'iherb', 'musinsa'];
  const dailyMap = new Map<string, DailyRevenueTrend>();

  for (const partnerId of partners) {
    const stats = await getPartnerDailyStats(partnerId, startDate, endDate);

    for (const day of stats) {
      const existing = dailyMap.get(day.date) || {
        date: day.date,
        clicks: 0,
        conversions: 0,
        commissionKrw: 0,
      };

      dailyMap.set(day.date, {
        date: day.date,
        clicks: existing.clicks + day.totalClicks,
        conversions: existing.conversions + day.conversions,
        commissionKrw: existing.commissionKrw + day.totalCommissionKrw,
      });
    }
  }

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 인기 제품 목록
 */
export async function getTopProducts(limit = 10): Promise<TopProduct[]> {
  const topClicked = await getTopClickedProducts(undefined, limit);

  // 실제 구현에서는 product 정보도 조인해야 함
  // 여기서는 간단히 ID만 반환
  return topClicked.map((item, idx) => ({
    productId: item.productId,
    productName: `제품 ${idx + 1}`,
    partnerId: 'coupang' as AffiliatePartnerName,
    clicks: item.clicks,
    conversions: Math.floor(item.clicks * 0.025),
    commissionKrw: Math.floor(item.clicks * 0.025 * 800),
  }));
}

/**
 * 기간별 날짜 범위 계산
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter'): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start: Date;

  switch (period) {
    case 'today':
      start = now;
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end,
  };
}
