import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase service role client
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Dynamic import after mocking
const importStats = async () => {
  return await import('@/lib/admin/user-activity-stats');
};

describe('user-activity-stats', () => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain
    mockSelect.mockReturnThis();
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    vi.mocked(createServiceRoleClient).mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof createServiceRoleClient>);
  });

  describe('getActiveUserStats', () => {
    it('DAU/WAU/MAU 통계를 반환한다', async () => {
      const { getActiveUserStats } = await importStats();

      // Mock workout_logs and meal_records queries
      mockSelect
        .mockReturnValueOnce({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [{ clerk_user_id: 'user1' }, { clerk_user_id: 'user2' }],
            }),
          }),
        })
        .mockReturnValueOnce({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [{ clerk_user_id: 'user1' }],
            }),
          }),
        });

      const result = await getActiveUserStats();

      expect(result).toHaveProperty('dau');
      expect(result).toHaveProperty('wau');
      expect(result).toHaveProperty('mau');
      expect(result).toHaveProperty('dauChange');
      expect(result).toHaveProperty('wauChange');
      expect(result).toHaveProperty('mauChange');
    });

    it('에러 발생 시 기본값을 반환한다', async () => {
      const { getActiveUserStats } = await importStats();

      mockSelect.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const result = await getActiveUserStats();

      expect(result).toEqual({
        dau: 0,
        wau: 0,
        mau: 0,
        dauChange: 0,
        wauChange: 0,
        mauChange: 0,
      });
    });
  });

  describe('getFeatureUsageStats', () => {
    it('기능별 사용 현황을 반환한다', async () => {
      const { getFeatureUsageStats } = await importStats();

      // Mock count queries
      mockSelect.mockReturnValue({
        count: 10,
        data: null,
        gte: vi.fn().mockReturnValue({
          count: 5,
          data: null,
          lt: vi.fn().mockResolvedValue({ count: 3, data: null }),
        }),
      });

      const result = await getFeatureUsageStats();

      expect(result).toHaveProperty('personalColorAnalyses');
      expect(result).toHaveProperty('skinAnalyses');
      expect(result).toHaveProperty('bodyAnalyses');
      expect(result).toHaveProperty('workoutLogs');
      expect(result).toHaveProperty('mealRecords');
      expect(result).toHaveProperty('changes');
    });

    it('에러 발생 시 기본값을 반환한다', async () => {
      const { getFeatureUsageStats } = await importStats();

      mockSelect.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const result = await getFeatureUsageStats();

      expect(result.personalColorAnalyses).toBe(0);
      expect(result.skinAnalyses).toBe(0);
      expect(result.bodyAnalyses).toBe(0);
      expect(result.workoutLogs).toBe(0);
      expect(result.mealRecords).toBe(0);
    });
  });

  describe('getDailyActiveUserTrend', () => {
    it('일별 활성 사용자 추이를 반환한다', async () => {
      const { getDailyActiveUserTrend } = await importStats();

      mockSelect.mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({
            data: [{ clerk_user_id: 'user1' }],
          }),
        }),
      });

      const result = await getDailyActiveUserTrend(7);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(7);

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('date');
        expect(result[0]).toHaveProperty('activeUsers');
      }
    });

    it('에러 발생 시 빈 배열을 반환한다', async () => {
      const { getDailyActiveUserTrend } = await importStats();

      mockSelect.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const result = await getDailyActiveUserTrend();

      expect(result).toEqual([]);
    });
  });

  describe('getDailyFeatureUsageTrend', () => {
    it('기능별 일별 사용량 추이를 반환한다', async () => {
      const { getDailyFeatureUsageTrend } = await importStats();

      mockSelect.mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ count: 5, data: null }),
        }),
      });

      const result = await getDailyFeatureUsageTrend(7);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(7);

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('date');
        expect(result[0]).toHaveProperty('personalColor');
        expect(result[0]).toHaveProperty('skin');
        expect(result[0]).toHaveProperty('body');
        expect(result[0]).toHaveProperty('workout');
        expect(result[0]).toHaveProperty('meal');
      }
    });

    it('에러 발생 시 빈 배열을 반환한다', async () => {
      const { getDailyFeatureUsageTrend } = await importStats();

      mockSelect.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const result = await getDailyFeatureUsageTrend();

      expect(result).toEqual([]);
    });
  });
});
