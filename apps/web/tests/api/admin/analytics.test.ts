import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/admin/auth', () => ({
  requireAdminOrThrow: vi.fn(),
}));

vi.mock('@/lib/admin/user-activity-stats', () => ({
  getActiveUserStats: vi.fn(),
  getFeatureUsageStats: vi.fn(),
  getDailyActiveUserTrend: vi.fn(),
  getDailyFeatureUsageTrend: vi.fn(),
}));

import { requireAdminOrThrow } from '@/lib/admin/auth';
import {
  getActiveUserStats,
  getFeatureUsageStats,
  getDailyActiveUserTrend,
  getDailyFeatureUsageTrend,
} from '@/lib/admin/user-activity-stats';

// Dynamic import after mocking
const importRoute = async () => {
  return await import('@/app/api/admin/analytics/route');
};

describe('Admin Analytics API', () => {
  const mockActiveUserStats = {
    dau: 100,
    wau: 500,
    mau: 1500,
    dauChange: 10,
    wauChange: 5,
    mauChange: -2,
  };

  const mockFeatureUsageStats = {
    personalColorAnalyses: 200,
    skinAnalyses: 150,
    bodyAnalyses: 100,
    workoutLogs: 1000,
    mealRecords: 2000,
    changes: {
      personalColor: 5,
      skin: -3,
      body: 0,
      workout: 10,
      meal: 8,
    },
  };

  const mockActiveUserTrend = [
    { date: '2025-12-20', activeUsers: 100 },
    { date: '2025-12-21', activeUsers: 120 },
  ];

  const mockFeatureUsageTrend = [
    { date: '2025-12-20', personalColor: 10, skin: 8, body: 5, workout: 50, meal: 80 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminOrThrow).mockResolvedValue(undefined);
    vi.mocked(getActiveUserStats).mockResolvedValue(mockActiveUserStats);
    vi.mocked(getFeatureUsageStats).mockResolvedValue(mockFeatureUsageStats);
    vi.mocked(getDailyActiveUserTrend).mockResolvedValue(mockActiveUserTrend);
    vi.mocked(getDailyFeatureUsageTrend).mockResolvedValue(mockFeatureUsageTrend);
  });

  describe('GET /api/admin/analytics', () => {
    it('모든 데이터를 반환한다 (type=all)', async () => {
      const { GET } = await importRoute();
      const request = new NextRequest('http://localhost/api/admin/analytics?type=all');

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('activeUserStats');
      expect(data.data).toHaveProperty('featureUsageStats');
      expect(data.data).toHaveProperty('activeUserTrend');
      expect(data.data).toHaveProperty('featureUsageTrend');
    });

    it('활성 사용자 통계만 반환한다 (type=activeUsers)', async () => {
      const { GET } = await importRoute();
      const request = new NextRequest('http://localhost/api/admin/analytics?type=activeUsers');

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockActiveUserStats);
      expect(getActiveUserStats).toHaveBeenCalled();
    });

    it('기능별 사용 현황만 반환한다 (type=featureUsage)', async () => {
      const { GET } = await importRoute();
      const request = new NextRequest('http://localhost/api/admin/analytics?type=featureUsage');

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFeatureUsageStats);
      expect(getFeatureUsageStats).toHaveBeenCalled();
    });

    it('활성 사용자 추이를 반환한다 (type=activeUserTrend)', async () => {
      const { GET } = await importRoute();
      const request = new NextRequest('http://localhost/api/admin/analytics?type=activeUserTrend');

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockActiveUserTrend);
      expect(getDailyActiveUserTrend).toHaveBeenCalled();
    });

    it('기능별 사용량 추이를 반환한다 (type=featureUsageTrend)', async () => {
      const { GET } = await importRoute();
      const request = new NextRequest(
        'http://localhost/api/admin/analytics?type=featureUsageTrend'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFeatureUsageTrend);
      expect(getDailyFeatureUsageTrend).toHaveBeenCalled();
    });

    it('days 파라미터를 전달한다', async () => {
      const { GET } = await importRoute();
      const request = new NextRequest(
        'http://localhost/api/admin/analytics?type=activeUserTrend&days=7'
      );

      await GET(request);

      expect(getDailyActiveUserTrend).toHaveBeenCalledWith(7);
    });

    it('관리자 권한이 없으면 401을 반환한다', async () => {
      vi.mocked(requireAdminOrThrow).mockRejectedValue(
        new Error('Unauthorized: Admin access required')
      );

      const { GET } = await importRoute();
      const request = new NextRequest('http://localhost/api/admin/analytics');

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('서버 에러 발생 시 500을 반환한다', async () => {
      vi.mocked(getActiveUserStats).mockRejectedValue(new Error('DB Error'));

      const { GET } = await importRoute();
      const request = new NextRequest('http://localhost/api/admin/analytics?type=all');

      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
