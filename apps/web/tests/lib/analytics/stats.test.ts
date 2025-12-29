/**
 * Analytics 통계 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDateRange,
  getAnalyticsSummary,
  getTopPages,
  getTopFeatures,
  getDeviceBreakdown,
  getUserFlow,
  getRealtimeStats,
  getDailyTrend,
  getAnalyticsDashboardData,
} from '@/lib/analytics/stats';

describe('Analytics Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDateRange', () => {
    it('today 기간을 올바르게 계산한다', () => {
      const range = getDateRange('today');
      const today = new Date().toISOString().split('T')[0];

      expect(range.start).toBe(today);
      expect(range.end).toBe(today);
    });

    it('week 기간을 올바르게 계산한다', () => {
      const range = getDateRange('week');
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      expect(range.start).toBe(weekAgo.toISOString().split('T')[0]);
      expect(range.end).toBe(today.toISOString().split('T')[0]);
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

  describe('getAnalyticsSummary', () => {
    it('Mock 데이터로 대시보드 요약을 반환한다', async () => {
      const summary = await getAnalyticsSummary('2025-01-01', '2025-01-07', true);

      expect(summary).toHaveProperty('period');
      expect(summary).toHaveProperty('totalPageViews');
      expect(summary).toHaveProperty('uniqueUsers');
      expect(summary).toHaveProperty('totalSessions');
      expect(summary).toHaveProperty('avgSessionDuration');
      expect(summary).toHaveProperty('avgPagePerSession');
      expect(summary).toHaveProperty('bounceRate');
      expect(summary).toHaveProperty('comparedToPrevious');
    });

    it('기간 정보가 올바르게 설정된다', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      const summary = await getAnalyticsSummary(startDate, endDate, true);

      expect(summary.period.start).toBe(startDate);
      expect(summary.period.end).toBe(endDate);
    });
  });

  describe('getTopPages', () => {
    it('인기 페이지 목록을 반환한다', async () => {
      const pages = await getTopPages(10, '2025-01-01', '2025-01-07', true);

      expect(pages.length).toBeLessThanOrEqual(10);
      pages.forEach((page) => {
        expect(page).toHaveProperty('path');
        expect(page).toHaveProperty('pageViews');
        expect(page).toHaveProperty('uniqueUsers');
        expect(page).toHaveProperty('avgDuration');
        expect(page).toHaveProperty('bounceRate');
      });
    });

    it('limit에 따라 결과 수를 제한한다', async () => {
      const pages5 = await getTopPages(5, '2025-01-01', '2025-01-07', true);
      expect(pages5.length).toBeLessThanOrEqual(5);

      const pages3 = await getTopPages(3, '2025-01-01', '2025-01-07', true);
      expect(pages3.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getTopFeatures', () => {
    it('인기 기능 목록을 반환한다', async () => {
      const features = await getTopFeatures(10, '2025-01-01', '2025-01-07', true);

      expect(features.length).toBeLessThanOrEqual(10);
      features.forEach((feature) => {
        expect(feature).toHaveProperty('featureId');
        expect(feature).toHaveProperty('featureName');
        expect(feature).toHaveProperty('usageCount');
        expect(feature).toHaveProperty('uniqueUsers');
      });
    });
  });

  describe('getDeviceBreakdown', () => {
    it('디바이스 분포를 반환한다', async () => {
      const devices = await getDeviceBreakdown('2025-01-01', '2025-01-07', true);

      expect(devices.length).toBe(3); // mobile, desktop, tablet
      devices.forEach((device) => {
        expect(device).toHaveProperty('deviceType');
        expect(device).toHaveProperty('sessions');
        expect(device).toHaveProperty('percentage');
      });
    });

    it('비율 합계가 100%에 근접한다', async () => {
      const devices = await getDeviceBreakdown('2025-01-01', '2025-01-07', true);
      const totalPercentage = devices.reduce((sum, d) => sum + d.percentage, 0);

      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe('getUserFlow', () => {
    it('사용자 흐름 데이터를 반환한다', async () => {
      const flow = await getUserFlow('2025-01-01', '2025-01-07', true);

      expect(flow.length).toBeGreaterThan(0);
      flow.forEach((item) => {
        expect(item).toHaveProperty('fromPage');
        expect(item).toHaveProperty('toPage');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('percentage');
      });
    });
  });

  describe('getRealtimeStats', () => {
    it('실시간 통계를 반환한다', async () => {
      const realtime = await getRealtimeStats(true);

      expect(realtime).toHaveProperty('activeUsers');
      expect(realtime).toHaveProperty('pageViewsLast5Min');
      expect(realtime).toHaveProperty('topPagesNow');
      expect(Array.isArray(realtime.topPagesNow)).toBe(true);
    });
  });

  describe('getDailyTrend', () => {
    it('일별 트렌드 데이터를 반환한다', async () => {
      const trend = await getDailyTrend('2025-01-01', '2025-01-07', true);

      expect(trend.length).toBeGreaterThan(0);
      trend.forEach((day) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('pageViews');
        expect(day).toHaveProperty('uniqueUsers');
        expect(day).toHaveProperty('sessions');
      });
    });

    it('날짜순으로 정렬된다', async () => {
      const trend = await getDailyTrend('2025-01-01', '2025-01-07', true);

      for (let i = 1; i < trend.length; i++) {
        expect(trend[i].date >= trend[i - 1].date).toBe(true);
      }
    });
  });

  describe('getAnalyticsDashboardData', () => {
    it('전체 대시보드 데이터를 반환한다', async () => {
      const data = await getAnalyticsDashboardData('2025-01-01', '2025-01-07', true);

      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('topPages');
      expect(data).toHaveProperty('topFeatures');
      expect(data).toHaveProperty('deviceBreakdown');
      expect(data).toHaveProperty('dailyTrend');
    });
  });
});
