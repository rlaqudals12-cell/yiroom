/**
 * 어필리에이트 통계 유틸리티 테스트
 *
 * 조작된 랜덤 Mock은 제거됨 — clicks Repository를 모킹해 실데이터 집계 경로를 검증한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// clicks Repository 모킹 (실 DB 대신)
vi.mock('@/lib/affiliate/clicks', () => ({
  getAffiliateStatsSummary: vi.fn(),
  getPartnerDailyStats: vi.fn(),
  getTopClickedProducts: vi.fn(),
}));

import {
  getAffiliateStatsSummary,
  getPartnerDailyStats,
  getTopClickedProducts,
} from '@/lib/affiliate/clicks';
import {
  getDashboardSummary,
  getPartnerRevenues,
  getDailyRevenueTrend,
  getTopProducts,
  getDateRange,
} from '@/lib/affiliate/stats';

const ONE_DAY = [
  {
    date: '2025-01-01',
    totalClicks: 100,
    uniqueClicks: 80,
    conversions: 5,
    totalSalesKrw: 500000,
    totalCommissionKrw: 25000,
  },
];

describe('Affiliate Stats (실데이터 경로)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('실데이터 요약을 반환한다', async () => {
      vi.mocked(getAffiliateStatsSummary).mockResolvedValue({
        totalClicks: 300,
        totalConversions: 15,
        totalSalesKrw: 1500000,
        totalCommissionKrw: 75000,
        conversionRate: 5,
      });

      const summary = await getDashboardSummary('2025-01-01', '2025-01-07');

      expect(summary.period).toEqual({ start: '2025-01-01', end: '2025-01-07' });
      expect(summary.totalClicks).toBe(300);
      expect(summary.totalCommissionKrw).toBe(75000);
      expect(summary).toHaveProperty('comparedToPrevious');
    });

    it('데이터가 없으면 0을 반환한다 (조작 없음)', async () => {
      vi.mocked(getAffiliateStatsSummary).mockResolvedValue({
        totalClicks: 0,
        totalConversions: 0,
        totalSalesKrw: 0,
        totalCommissionKrw: 0,
        conversionRate: 0,
      });

      const summary = await getDashboardSummary('2025-01-01', '2025-01-07');

      expect(summary.totalClicks).toBe(0);
      expect(summary.totalSalesKrw).toBe(0);
      expect(summary.totalCommissionKrw).toBe(0);
      expect(summary.conversionRate).toBe(0);
    });

    it('기간 정보가 올바르게 설정된다', async () => {
      vi.mocked(getAffiliateStatsSummary).mockResolvedValue({
        totalClicks: 0,
        totalConversions: 0,
        totalSalesKrw: 0,
        totalCommissionKrw: 0,
        conversionRate: 0,
      });

      const summary = await getDashboardSummary('2025-01-01', '2025-01-31');

      expect(summary.period.start).toBe('2025-01-01');
      expect(summary.period.end).toBe('2025-01-31');
    });
  });

  describe('getPartnerRevenues', () => {
    it('모든 파트너의 수익 통계를 집계한다', async () => {
      vi.mocked(getPartnerDailyStats).mockResolvedValue(ONE_DAY);

      const partners = await getPartnerRevenues('2025-01-01', '2025-01-07');

      // coupang, iherb, musinsa, oliveyoung
      expect(partners).toHaveLength(4);
      const coupang = partners.find((p) => p.partnerId === 'coupang');
      expect(coupang?.partnerName).toBe('쿠팡');
      expect(coupang?.clicks).toBe(100);
      expect(coupang?.conversions).toBe(5);
      expect(coupang?.salesKrw).toBe(500000);
      expect(coupang?.commissionKrw).toBe(25000);
      expect(coupang?.conversionRate).toBeCloseTo(5, 1);
    });

    it('각 파트너 통계에 필수 필드가 있다', async () => {
      vi.mocked(getPartnerDailyStats).mockResolvedValue([]);

      const partners = await getPartnerRevenues('2025-01-01', '2025-01-07');

      partners.forEach((partner) => {
        expect(partner).toHaveProperty('partnerId');
        expect(partner).toHaveProperty('partnerName');
        expect(partner).toHaveProperty('clicks');
        expect(partner).toHaveProperty('conversions');
        expect(partner).toHaveProperty('salesKrw');
        expect(partner).toHaveProperty('commissionKrw');
        expect(partner).toHaveProperty('conversionRate');
      });
    });
  });

  describe('getDailyRevenueTrend', () => {
    it('파트너별 일별 통계를 날짜로 합산한다', async () => {
      vi.mocked(getPartnerDailyStats).mockResolvedValue(ONE_DAY);

      const trend = await getDailyRevenueTrend('2025-01-01', '2025-01-07');

      // 3개 파트너(coupang/iherb/musinsa)가 같은 날짜를 합산 → 1개 항목
      expect(trend).toHaveLength(1);
      expect(trend[0].date).toBe('2025-01-01');
      expect(trend[0].clicks).toBe(300); // 100 × 3
      expect(trend[0].conversions).toBe(15); // 5 × 3
      expect(trend[0].commissionKrw).toBe(75000); // 25000 × 3
    });

    it('날짜순으로 정렬된다', async () => {
      vi.mocked(getPartnerDailyStats).mockResolvedValue([
        {
          date: '2025-01-03',
          totalClicks: 10,
          uniqueClicks: 8,
          conversions: 1,
          totalSalesKrw: 1000,
          totalCommissionKrw: 50,
        },
        {
          date: '2025-01-01',
          totalClicks: 10,
          uniqueClicks: 8,
          conversions: 1,
          totalSalesKrw: 1000,
          totalCommissionKrw: 50,
        },
      ]);

      const trend = await getDailyRevenueTrend('2025-01-01', '2025-01-07');

      for (let i = 1; i < trend.length; i++) {
        expect(trend[i].date >= trend[i - 1].date).toBe(true);
      }
    });
  });

  describe('getTopProducts', () => {
    it('클릭 기준 인기 제품을 매핑한다', async () => {
      vi.mocked(getTopClickedProducts).mockResolvedValue([
        { productId: 'prod-1', clicks: 40 },
        { productId: 'prod-2', clicks: 20 },
      ]);

      const products = await getTopProducts(10);

      expect(products).toHaveLength(2);
      products.forEach((product) => {
        expect(product).toHaveProperty('productId');
        expect(product).toHaveProperty('productName');
        expect(product).toHaveProperty('partnerId');
        expect(product).toHaveProperty('clicks');
        expect(product).toHaveProperty('conversions');
        expect(product).toHaveProperty('commissionKrw');
      });
      expect(products[0].productId).toBe('prod-1');
      expect(products[0].clicks).toBe(40);
    });

    it('데이터가 없으면 빈 배열을 반환한다', async () => {
      vi.mocked(getTopClickedProducts).mockResolvedValue([]);

      const products = await getTopProducts(10);

      expect(products).toEqual([]);
    });
  });

  describe('getDateRange', () => {
    it('today 기간을 올바르게 계산한다', () => {
      const range = getDateRange('today');
      const today = new Date().toISOString().split('T')[0];

      expect(range.end).toBe(today);
    });

    it('week 기간을 올바르게 계산한다', () => {
      const range = getDateRange('week');
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      expect(range.start).toBe(weekAgo.toISOString().split('T')[0]);
    });

    it('month 기간을 올바르게 계산한다', () => {
      const range = getDateRange('month');
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      expect(range.start).toBe(monthAgo.toISOString().split('T')[0]);
    });

    it('quarter 기간을 올바르게 계산한다', () => {
      const range = getDateRange('quarter');
      const today = new Date();
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);

      expect(range.start).toBe(quarterAgo.toISOString().split('T')[0]);
    });
  });
});
