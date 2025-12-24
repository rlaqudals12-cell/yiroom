import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/products/affiliate', () => ({
  getAffiliateStats: vi.fn(),
  getTodayClickCount: vi.fn(),
}));

import { getAffiliateStats, getTodayClickCount } from '@/lib/products/affiliate';

const {
  fetchAffiliateStats,
  fetchTodayClicks,
  fetchDashboardStats,
} = await import('@/lib/admin/affiliate-stats');

describe('affiliate-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAffiliateStats', () => {
    it('오늘 기간으로 조회', async () => {
      vi.mocked(getAffiliateStats).mockResolvedValue({
        period: { startDate: '2025-12-24', endDate: '2025-12-24' },
        totalClicks: 10,
        uniqueUsers: 5,
        byProduct: [],
        byDate: [],
      });

      const result = await fetchAffiliateStats('today');

      expect(result).not.toBeNull();
      expect(result?.totalClicks).toBe(10);
      expect(getAffiliateStats).toHaveBeenCalled();
    });

    it('주간 기간으로 조회', async () => {
      vi.mocked(getAffiliateStats).mockResolvedValue({
        period: { startDate: '2025-12-17', endDate: '2025-12-24' },
        totalClicks: 70,
        uniqueUsers: 35,
        byProduct: [],
        byDate: [],
      });

      const result = await fetchAffiliateStats('week');

      expect(result).not.toBeNull();
      expect(result?.totalClicks).toBe(70);
    });

    it('월간 기간으로 조회', async () => {
      vi.mocked(getAffiliateStats).mockResolvedValue({
        period: { startDate: '2025-11-24', endDate: '2025-12-24' },
        totalClicks: 300,
        uniqueUsers: 150,
        byProduct: [],
        byDate: [],
      });

      const result = await fetchAffiliateStats('month');

      expect(result).not.toBeNull();
      expect(result?.totalClicks).toBe(300);
    });

    it('전체 기간으로 조회', async () => {
      vi.mocked(getAffiliateStats).mockResolvedValue({
        period: { startDate: '2024-12-24', endDate: '2025-12-24' },
        totalClicks: 1000,
        uniqueUsers: 500,
        byProduct: [],
        byDate: [],
      });

      const result = await fetchAffiliateStats('all');

      expect(result).not.toBeNull();
      expect(result?.totalClicks).toBe(1000);
    });

    it('null 반환 시 null', async () => {
      vi.mocked(getAffiliateStats).mockResolvedValue(null);

      const result = await fetchAffiliateStats('today');

      expect(result).toBeNull();
    });
  });

  describe('fetchTodayClicks', () => {
    it('오늘 클릭 수 반환', async () => {
      vi.mocked(getTodayClickCount).mockResolvedValue(42);

      const result = await fetchTodayClicks();

      expect(result).toBe(42);
    });

    it('0 반환', async () => {
      vi.mocked(getTodayClickCount).mockResolvedValue(0);

      const result = await fetchTodayClicks();

      expect(result).toBe(0);
    });
  });

  describe('fetchDashboardStats', () => {
    it('대시보드 통계 반환', async () => {
      vi.mocked(getTodayClickCount).mockResolvedValue(10);
      vi.mocked(getAffiliateStats)
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 70,
          uniqueUsers: 35,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 50,
          uniqueUsers: 25,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 300,
          uniqueUsers: 150,
          byProduct: [],
          byDate: [],
        });

      const result = await fetchDashboardStats();

      expect(result.todayClicks).toBe(10);
      expect(result.weekClicks).toBe(70);
      expect(result.monthClicks).toBe(300);
    });

    it('주간 증감율 계산 (증가)', async () => {
      vi.mocked(getTodayClickCount).mockResolvedValue(10);
      vi.mocked(getAffiliateStats)
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 100,
          uniqueUsers: 50,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 50,
          uniqueUsers: 25,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 300,
          uniqueUsers: 150,
          byProduct: [],
          byDate: [],
        });

      const result = await fetchDashboardStats();

      // (100 - 50) / 50 * 100 = 100%
      expect(result.weeklyGrowth).toBe(100);
    });

    it('주간 증감율 계산 (감소)', async () => {
      vi.mocked(getTodayClickCount).mockResolvedValue(10);
      vi.mocked(getAffiliateStats)
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 50,
          uniqueUsers: 25,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 100,
          uniqueUsers: 50,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 300,
          uniqueUsers: 150,
          byProduct: [],
          byDate: [],
        });

      const result = await fetchDashboardStats();

      // (50 - 100) / 100 * 100 = -50%
      expect(result.weeklyGrowth).toBe(-50);
    });

    it('이전 주 데이터 없으면 100%', async () => {
      vi.mocked(getTodayClickCount).mockResolvedValue(10);
      vi.mocked(getAffiliateStats)
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 50,
          uniqueUsers: 25,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 0,
          uniqueUsers: 0,
          byProduct: [],
          byDate: [],
        })
        .mockResolvedValueOnce({
          period: { startDate: '', endDate: '' },
          totalClicks: 300,
          uniqueUsers: 150,
          byProduct: [],
          byDate: [],
        });

      const result = await fetchDashboardStats();

      expect(result.weeklyGrowth).toBe(100);
    });

    it('모두 0이면 0%', async () => {
      vi.mocked(getTodayClickCount).mockResolvedValue(0);
      vi.mocked(getAffiliateStats).mockResolvedValue({
        period: { startDate: '', endDate: '' },
        totalClicks: 0,
        uniqueUsers: 0,
        byProduct: [],
        byDate: [],
      });

      const result = await fetchDashboardStats();

      expect(result.weeklyGrowth).toBe(0);
    });
  });
});
