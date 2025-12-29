/**
 * 어필리에이트 통계 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDashboardSummary,
  getPartnerRevenues,
  getDailyRevenueTrend,
  getTopProducts,
  getDateRange,
} from '@/lib/affiliate/stats';

describe('Affiliate Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('Mock 데이터로 대시보드 요약을 반환한다', async () => {
      const summary = await getDashboardSummary('2025-01-01', '2025-01-07', true);

      expect(summary).toHaveProperty('period');
      expect(summary).toHaveProperty('totalClicks');
      expect(summary).toHaveProperty('totalConversions');
      expect(summary).toHaveProperty('totalSalesKrw');
      expect(summary).toHaveProperty('totalCommissionKrw');
      expect(summary).toHaveProperty('conversionRate');
      expect(summary).toHaveProperty('comparedToPrevious');
    });

    it('기간 정보가 올바르게 설정된다', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      const summary = await getDashboardSummary(startDate, endDate, true);

      expect(summary.period.start).toBe(startDate);
      expect(summary.period.end).toBe(endDate);
    });

    it('전환율이 올바르게 계산된다', async () => {
      const summary = await getDashboardSummary('2025-01-01', '2025-01-07', true);

      if (summary.totalClicks > 0) {
        const expectedRate = (summary.totalConversions / summary.totalClicks) * 100;
        expect(summary.conversionRate).toBeCloseTo(expectedRate, 1);
      }
    });
  });

  describe('getPartnerRevenues', () => {
    it('모든 파트너의 수익 통계를 반환한다', async () => {
      const partners = await getPartnerRevenues('2025-01-01', '2025-01-07', true);

      expect(partners).toHaveLength(3);
      expect(partners.map((p) => p.partnerId)).toContain('coupang');
      expect(partners.map((p) => p.partnerId)).toContain('iherb');
      expect(partners.map((p) => p.partnerId)).toContain('musinsa');
    });

    it('각 파트너 통계에 필수 필드가 있다', async () => {
      const partners = await getPartnerRevenues('2025-01-01', '2025-01-07', true);

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

    it('파트너별 한국어 이름이 설정된다', async () => {
      const partners = await getPartnerRevenues('2025-01-01', '2025-01-07', true);

      const coupang = partners.find((p) => p.partnerId === 'coupang');
      expect(coupang?.partnerName).toBe('쿠팡');

      const iherb = partners.find((p) => p.partnerId === 'iherb');
      expect(iherb?.partnerName).toBe('iHerb');

      const musinsa = partners.find((p) => p.partnerId === 'musinsa');
      expect(musinsa?.partnerName).toBe('무신사');
    });
  });

  describe('getDailyRevenueTrend', () => {
    it('일별 트렌드 데이터를 반환한다', async () => {
      const trend = await getDailyRevenueTrend('2025-01-01', '2025-01-07', true);

      expect(trend.length).toBeGreaterThan(0);
      trend.forEach((day) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('clicks');
        expect(day).toHaveProperty('conversions');
        expect(day).toHaveProperty('commissionKrw');
      });
    });

    it('날짜순으로 정렬된다', async () => {
      const trend = await getDailyRevenueTrend('2025-01-01', '2025-01-07', true);

      for (let i = 1; i < trend.length; i++) {
        expect(trend[i].date >= trend[i - 1].date).toBe(true);
      }
    });
  });

  describe('getTopProducts', () => {
    it('인기 제품 목록을 반환한다', async () => {
      const products = await getTopProducts(10, true);

      expect(products.length).toBeLessThanOrEqual(10);
      products.forEach((product) => {
        expect(product).toHaveProperty('productId');
        expect(product).toHaveProperty('productName');
        expect(product).toHaveProperty('partnerId');
        expect(product).toHaveProperty('clicks');
        expect(product).toHaveProperty('conversions');
        expect(product).toHaveProperty('commissionKrw');
      });
    });

    it('limit에 따라 결과 수를 제한한다', async () => {
      const products5 = await getTopProducts(5, true);
      expect(products5.length).toBeLessThanOrEqual(5);

      const products3 = await getTopProducts(3, true);
      expect(products3.length).toBeLessThanOrEqual(3);
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
