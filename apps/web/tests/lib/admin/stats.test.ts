import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase service role client
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

// Mock adminLogger
vi.mock('@/lib/utils/logger', () => ({
  adminLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Dynamic import after mocking
const importStats = async () => {
  return await import('@/lib/admin/stats');
};

describe('stats', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chain
    mockSelect.mockReturnThis();
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    vi.mocked(createServiceRoleClient).mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof createServiceRoleClient>);
  });

  describe('getDashboardStats', () => {
    it('모든 통계를 반환한다', async () => {
      const { getDashboardStats } = await importStats();

      // Mock all count queries
      mockSelect.mockReturnValue({
        count: 100,
        data: null,
        gte: vi.fn().mockReturnValue({
          count: 10,
          data: null,
        }),
      });

      const result = await getDashboardStats();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('analyses');
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('activity');
    });

    it('사용자 통계 구조가 올바르다', async () => {
      const { getDashboardStats } = await importStats();

      mockSelect.mockReturnValue({
        count: 50,
        data: null,
        gte: vi.fn().mockReturnValue({
          count: 5,
          data: null,
        }),
      });

      const result = await getDashboardStats();

      expect(result.users).toHaveProperty('total');
      expect(result.users).toHaveProperty('today');
      expect(result.users).toHaveProperty('thisWeek');
      expect(result.users).toHaveProperty('thisMonth');
    });

    it('분석 통계 구조가 올바르다', async () => {
      const { getDashboardStats } = await importStats();

      mockSelect.mockReturnValue({
        count: 30,
        data: null,
        gte: vi.fn().mockReturnValue({
          count: 3,
          data: null,
        }),
      });

      const result = await getDashboardStats();

      expect(result.analyses).toHaveProperty('personalColor');
      expect(result.analyses).toHaveProperty('skin');
      expect(result.analyses).toHaveProperty('body');
      expect(result.analyses).toHaveProperty('workout');
      expect(result.analyses).toHaveProperty('nutrition');
    });

    it('제품 통계 구조가 올바르다', async () => {
      const { getDashboardStats } = await importStats();

      mockSelect.mockReturnValue({
        count: 20,
        data: null,
        gte: vi.fn().mockReturnValue({
          count: 2,
          data: null,
        }),
      });

      const result = await getDashboardStats();

      expect(result.products).toHaveProperty('cosmetics');
      expect(result.products).toHaveProperty('supplements');
      expect(result.products).toHaveProperty('equipment');
      expect(result.products).toHaveProperty('healthFoods');
    });

    it('활동 통계 구조가 올바르다', async () => {
      const { getDashboardStats } = await importStats();

      mockSelect.mockReturnValue({
        count: 15,
        data: null,
        gte: vi.fn().mockReturnValue({
          count: 1,
          data: null,
        }),
      });

      const result = await getDashboardStats();

      expect(result.activity).toHaveProperty('workoutLogs');
      expect(result.activity).toHaveProperty('mealRecords');
      expect(result.activity).toHaveProperty('wishlists');
    });

    it('count가 null이면 0을 반환한다', async () => {
      const { getDashboardStats } = await importStats();

      mockSelect.mockReturnValue({
        count: null,
        data: null,
        gte: vi.fn().mockReturnValue({
          count: null,
          data: null,
        }),
      });

      const result = await getDashboardStats();

      expect(result.users.total).toBe(0);
      expect(result.users.today).toBe(0);
    });
  });

  describe('getUserList', () => {
    it('사용자 목록과 총 개수를 반환한다', async () => {
      const { getUserList } = await importStats();

      const mockData = [
        {
          id: 'uuid-1',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          name: '홍길동',
          created_at: '2026-01-15T10:00:00Z',
          personal_color_assessments: [{ id: 'pc-1' }],
          skin_analyses: [],
          body_analyses: [],
          workout_analyses: [],
          nutrition_settings: [],
        },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockData,
              count: 1,
              error: null,
            }),
          }),
        }),
      });

      const result = await getUserList(1, 20);

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.users[0]).toHaveProperty('clerkUserId', 'clerk_123');
      expect(result.users[0]).toHaveProperty('hasPersonalColor', true);
      expect(result.users[0]).toHaveProperty('hasSkin', false);
    });

    it('기본 페이지네이션 값이 적용된다', async () => {
      const { getUserList } = await importStats();

      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockSelectFn = vi.fn().mockReturnValue({ order: mockOrder });

      mockFrom.mockReturnValue({
        select: mockSelectFn,
      });

      await getUserList();

      // 기본값 page=1, limit=20 → range(0, 19)
      expect(mockRange).toHaveBeenCalledWith(0, 19);
    });

    it('에러 발생 시 빈 목록과 0을 반환한다', async () => {
      const { getUserList } = await importStats();

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: null,
              count: null,
              error: { message: 'DB Error' },
            }),
          }),
        }),
      });

      const result = await getUserList();

      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('분석 여부를 올바르게 판단한다', async () => {
      const { getUserList } = await importStats();

      const mockData = [
        {
          id: 'uuid-1',
          clerk_user_id: 'clerk_123',
          email: 'test@example.com',
          name: '전부있음',
          created_at: '2026-01-15T10:00:00Z',
          personal_color_assessments: [{ id: 'pc-1' }],
          skin_analyses: [{ id: 's-1' }],
          body_analyses: [{ id: 'b-1' }],
          workout_analyses: [{ id: 'w-1' }],
          nutrition_settings: [{ id: 'n-1' }],
        },
        {
          id: 'uuid-2',
          clerk_user_id: 'clerk_456',
          email: 'none@example.com',
          name: '분석없음',
          created_at: '2026-01-15T11:00:00Z',
          personal_color_assessments: [],
          skin_analyses: [],
          body_analyses: [],
          workout_analyses: [],
          nutrition_settings: [],
        },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockData,
              count: 2,
              error: null,
            }),
          }),
        }),
      });

      const result = await getUserList();

      // 첫 번째 사용자: 모든 분석 완료
      expect(result.users[0].hasPersonalColor).toBe(true);
      expect(result.users[0].hasSkin).toBe(true);
      expect(result.users[0].hasBody).toBe(true);
      expect(result.users[0].hasWorkout).toBe(true);
      expect(result.users[0].hasNutrition).toBe(true);

      // 두 번째 사용자: 분석 없음
      expect(result.users[1].hasPersonalColor).toBe(false);
      expect(result.users[1].hasSkin).toBe(false);
      expect(result.users[1].hasBody).toBe(false);
      expect(result.users[1].hasWorkout).toBe(false);
      expect(result.users[1].hasNutrition).toBe(false);
    });
  });

  describe('getRecentActivities', () => {
    it('최근 활동 목록을 반환한다', async () => {
      const { getRecentActivities } = await importStats();

      const mockWorkoutLogs = [
        {
          clerk_user_id: 'user_1',
          exercise_name: '스쿼트',
          created_at: '2026-01-15T10:00:00Z',
        },
      ];

      const mockMealRecords = [
        {
          clerk_user_id: 'user_2',
          meal_type: 'lunch',
          created_at: '2026-01-15T09:00:00Z',
        },
      ];

      const mockWishlists = [
        {
          clerk_user_id: 'user_3',
          product_type: 'cosmetic',
          created_at: '2026-01-15T08:00:00Z',
        },
      ];

      const getMockDataByTable = (table: string) => {
        if (table === 'workout_logs') return mockWorkoutLogs;
        if (table === 'meal_records') return mockMealRecords;
        return mockWishlists;
      };

      mockFrom.mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: getMockDataByTable(table), error: null }),
            }),
          }),
        };
      });

      const result = await getRecentActivities(10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it('활동이 시간순으로 정렬된다', async () => {
      const { getRecentActivities } = await importStats();

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const twoHoursAgo = new Date(now.getTime() - 7200000);

      const mockWorkoutLogs = [
        {
          clerk_user_id: 'user_1',
          exercise_name: '스쿼트',
          created_at: oneHourAgo.toISOString(),
        },
      ];

      const mockMealRecords = [
        {
          clerk_user_id: 'user_2',
          meal_type: 'lunch',
          created_at: now.toISOString(),
        },
      ];

      const mockWishlists = [
        {
          clerk_user_id: 'user_3',
          product_type: 'cosmetic',
          created_at: twoHoursAgo.toISOString(),
        },
      ];

      const getMockDataByTable = (table: string) => {
        if (table === 'workout_logs') return mockWorkoutLogs;
        if (table === 'meal_records') return mockMealRecords;
        return mockWishlists;
      };

      mockFrom.mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: getMockDataByTable(table), error: null }),
            }),
          }),
        };
      });

      const result = await getRecentActivities(10);

      // 가장 최근 활동이 먼저 와야 함 (meal → workout → wishlist)
      expect(result[0].type).toBe('meal');
      expect(result[1].type).toBe('workout');
      expect(result[2].type).toBe('wishlist');
    });

    it('활동 타입별 설명이 올바르다', async () => {
      const { getRecentActivities } = await importStats();

      const getMockDataByTable = (table: string) => {
        if (table === 'workout_logs') {
          return [{ clerk_user_id: 'u1', exercise_name: '런지', created_at: new Date().toISOString() }];
        }
        if (table === 'meal_records') {
          return [{ clerk_user_id: 'u2', meal_type: 'breakfast', created_at: new Date().toISOString() }];
        }
        return [{ clerk_user_id: 'u3', product_type: 'supplement', created_at: new Date().toISOString() }];
      };

      mockFrom.mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: getMockDataByTable(table), error: null }),
            }),
          }),
        };
      });

      const result = await getRecentActivities(10);

      const workoutActivity = result.find((a) => a.type === 'workout');
      const mealActivity = result.find((a) => a.type === 'meal');
      const wishlistActivity = result.find((a) => a.type === 'wishlist');

      expect(workoutActivity?.description).toContain('런지');
      expect(mealActivity?.description).toContain('아침');
      expect(wishlistActivity?.description).toContain('영양제');
    });

    it('limit 파라미터가 적용된다', async () => {
      const { getRecentActivities } = await importStats();

      // 많은 활동 데이터 생성
      const manyActivities = Array.from({ length: 20 }, (_, i) => ({
        clerk_user_id: `user_${i}`,
        exercise_name: `운동_${i}`,
        created_at: new Date(Date.now() - i * 60000).toISOString(),
      }));

      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: manyActivities.slice(0, 5), error: null }),
          }),
        }),
      }));

      const result = await getRecentActivities(5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('데이터가 없으면 빈 배열을 반환한다', async () => {
      const { getRecentActivities } = await importStats();

      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }));

      const result = await getRecentActivities();

      expect(result).toEqual([]);
    });
  });

  describe('DashboardStats 타입', () => {
    it('DashboardStats 타입이 export 된다', async () => {
      const statsModule = await importStats();

      // 타입이 존재하는지 간접적으로 확인
      expect(statsModule).toHaveProperty('getDashboardStats');
    });
  });
});
