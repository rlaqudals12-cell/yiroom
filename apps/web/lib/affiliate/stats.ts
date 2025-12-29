/**
 * 어필리에이트 통계 유틸리티
 * @description 수익 대시보드용 통계 함수 + Mock 데이터
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

// Mock 데이터 생성 함수들
function generateMockDailyTrend(days: number): DailyRevenueTrend[] {
  const trends: DailyRevenueTrend[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 주말은 트래픽 감소
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseClicks = isWeekend ? 50 : 100;

    const clicks = Math.floor(baseClicks + Math.random() * 50);
    const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.03));
    const commissionKrw = conversions * (500 + Math.floor(Math.random() * 1000));

    trends.push({
      date: date.toISOString().split('T')[0],
      clicks,
      conversions,
      commissionKrw,
    });
  }

  return trends;
}

function generateMockPartnerRevenue(): PartnerRevenue[] {
  const partners: { id: AffiliatePartnerName; name: string; baseClicks: number }[] = [
    { id: 'coupang', name: '쿠팡', baseClicks: 500 },
    { id: 'iherb', name: 'iHerb', baseClicks: 300 },
    { id: 'musinsa', name: '무신사', baseClicks: 200 },
  ];

  return partners.map(({ id, name, baseClicks }) => {
    const clicks = baseClicks + Math.floor(Math.random() * 200);
    const conversionRate = 2 + Math.random() * 3;
    const conversions = Math.floor(clicks * (conversionRate / 100));
    const avgOrderValue = id === 'coupang' ? 35000 : id === 'iherb' ? 55000 : 45000;
    const commissionRate = id === 'coupang' ? 0.03 : id === 'iherb' ? 0.05 : 0.04;
    const salesKrw = conversions * avgOrderValue;
    const commissionKrw = Math.floor(salesKrw * commissionRate);

    return {
      partnerId: id,
      partnerName: name,
      clicks,
      conversions,
      salesKrw,
      commissionKrw,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  });
}

function generateMockTopProducts(): TopProduct[] {
  const products = [
    { name: '프리미엄 비타민C 1000mg', partner: 'iherb' as AffiliatePartnerName },
    { name: '무신사 스탠다드 에센셜 반팔티', partner: 'musinsa' as AffiliatePartnerName },
    { name: '닥터자르트 시카페어 크림', partner: 'coupang' as AffiliatePartnerName },
    { name: '콜라겐 펩타이드 파우더', partner: 'iherb' as AffiliatePartnerName },
    { name: '나이키 에어맥스 270', partner: 'musinsa' as AffiliatePartnerName },
    { name: '아이소이 불가리안 로즈 세럼', partner: 'coupang' as AffiliatePartnerName },
    { name: 'NOW Foods 오메가-3', partner: 'iherb' as AffiliatePartnerName },
    { name: '디스커버리 다운 패딩', partner: 'musinsa' as AffiliatePartnerName },
    { name: '라네즈 워터뱅크 크림', partner: 'coupang' as AffiliatePartnerName },
    { name: 'California Gold 프로바이오틱스', partner: 'iherb' as AffiliatePartnerName },
  ];

  return products.map((p, idx) => ({
    productId: `mock-product-${idx + 1}`,
    productName: p.name,
    partnerId: p.partner,
    clicks: 100 - idx * 8 + Math.floor(Math.random() * 20),
    conversions: Math.floor((10 - idx) * (1 + Math.random())),
    commissionKrw: Math.floor((5000 - idx * 300) * (1 + Math.random() * 0.5)),
  }));
}

/**
 * 대시보드 요약 통계 조회
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 * @param useMock Mock 데이터 사용 여부
 */
export async function getDashboardSummary(
  startDate: string,
  endDate: string,
  useMock = true
): Promise<DashboardSummary> {
  if (useMock) {
    const partnerData = generateMockPartnerRevenue();
    const totalClicks = partnerData.reduce((sum, p) => sum + p.clicks, 0);
    const totalConversions = partnerData.reduce((sum, p) => sum + p.conversions, 0);
    const totalSalesKrw = partnerData.reduce((sum, p) => sum + p.salesKrw, 0);
    const totalCommissionKrw = partnerData.reduce((sum, p) => sum + p.commissionKrw, 0);

    return {
      period: { start: startDate, end: endDate },
      totalClicks,
      totalConversions,
      totalSalesKrw,
      totalCommissionKrw,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      comparedToPrevious: {
        clicksChange: 12.5, // Mock: 전 기간 대비 +12.5%
        commissionsChange: 8.3, // Mock: 전 기간 대비 +8.3%
      },
    };
  }

  // 실제 DB 조회
  const stats = await getAffiliateStatsSummary(startDate, endDate);

  // 이전 기간 통계 (비교용)
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const periodDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

  const prevEndDate = new Date(startDateObj);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - periodDays);

  const prevStats = await getAffiliateStatsSummary(
    prevStartDate.toISOString().split('T')[0],
    prevEndDate.toISOString().split('T')[0]
  );

  const clicksChange = prevStats.totalClicks > 0
    ? ((stats.totalClicks - prevStats.totalClicks) / prevStats.totalClicks) * 100
    : 0;

  const commissionsChange = prevStats.totalCommissionKrw > 0
    ? ((stats.totalCommissionKrw - prevStats.totalCommissionKrw) / prevStats.totalCommissionKrw) * 100
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
  endDate: string,
  useMock = true
): Promise<PartnerRevenue[]> {
  if (useMock) {
    return generateMockPartnerRevenue();
  }

  const partners: AffiliatePartnerName[] = ['coupang', 'iherb', 'musinsa'];
  const partnerNames: Record<AffiliatePartnerName, string> = {
    coupang: '쿠팡',
    iherb: 'iHerb',
    musinsa: '무신사',
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
  endDate: string,
  useMock = true
): Promise<DailyRevenueTrend[]> {
  if (useMock) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return generateMockDailyTrend(days);
  }

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
export async function getTopProducts(
  limit = 10,
  useMock = true
): Promise<TopProduct[]> {
  if (useMock) {
    return generateMockTopProducts().slice(0, limit);
  }

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
