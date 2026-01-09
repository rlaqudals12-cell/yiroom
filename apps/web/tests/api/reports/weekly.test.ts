/**
 * R-1 주간 리포트 API 테스트
 * @description GET /api/reports/weekly 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/reports/weeklyAggregator', () => ({
  generateWeeklyReport: vi.fn(),
  getWeekStart: vi.fn(),
  getWeekEnd: vi.fn(),
  DEFAULT_NUTRITION_TARGETS: {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    water: 2000,
  },
}));

import { GET } from '@/app/api/reports/weekly/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { generateWeeklyReport, getWeekStart, getWeekEnd } from '@/lib/reports/weeklyAggregator';

// Mock 요청 헬퍼
function createMockGetRequest(url: string): Request {
  return {
    url,
  } as Request;
}

// Mock 데이터
const mockMeals = [
  {
    id: 'meal-1',
    clerk_user_id: 'user_test123',
    meal_date: '2025-12-09',
    meal_type: 'breakfast',
    foods: [
      { food_name: '밥', calories: 300, protein: 5, carbs: 65, fat: 1, traffic_light: 'green' },
    ],
    total_calories: 300,
    total_protein: 5,
    total_carbs: 65,
    total_fat: 1,
    created_at: '2025-12-09T08:00:00Z',
  },
];

const mockWaterRecords = [
  {
    id: 'water-1',
    clerk_user_id: 'user_test123',
    record_date: '2025-12-09',
    amount_ml: 500,
    effective_ml: 500,
    drink_type: 'water',
  },
];

const mockWorkoutLogs = [
  {
    id: 'workout-1',
    user_id: 'user_test123',
    workout_date: '2025-12-09',
    exercise_logs: [],
    actual_duration: 30,
    actual_calories: 200,
    completed_at: '2025-12-09T10:00:00Z',
  },
];

const mockSettings = {
  goal: 'maintain',
  daily_calories: 2000,
  daily_protein: 50,
  daily_carbs: 250,
  daily_fat: 65,
  daily_water: 2000,
};

const mockNutritionStreak = {
  current_streak: 5,
  longest_streak: 10,
  last_record_date: '2025-12-09',
  badges_earned: ['3day', '7day'],
};

const mockWorkoutStreak = {
  current_streak: 3,
  longest_streak: 7,
  last_workout_date: '2025-12-09',
  badges_earned: ['3day'],
};

const mockWeeklyReport = {
  weekStart: '2025-12-09',
  weekEnd: '2025-12-15',
  generatedAt: new Date().toISOString(),
  nutrition: {
    summary: {
      totalCalories: 10500,
      avgCaloriesPerDay: 1500,
      totalProtein: 420,
      avgProteinPerDay: 60,
      totalCarbs: 1400,
      avgCarbsPerDay: 200,
      totalFat: 350,
      avgFatPerDay: 50,
      totalWater: 12600,
      avgWaterPerDay: 1800,
      mealCount: 21,
      daysWithRecords: 7,
    },
    achievement: {
      caloriesPercent: 75,
      proteinPercent: 80,
      carbsPercent: 70,
      fatPercent: 65,
      waterPercent: 90,
    },
    trend: {
      caloriesTrend: 'stable' as const,
      waterTrend: 'up' as const,
      proteinTrend: 'stable' as const,
      foodQualityScore: 75,
      consistencyScore: 85,
    },
    dailyBreakdown: [],
  },
  workout: {
    summary: {
      totalSessions: 3,
      totalDuration: 90,
      avgDurationPerSession: 30,
      totalCaloriesBurned: 600,
      daysWithWorkout: 3,
    },
    trend: {
      consistencyScore: 70,
      durationTrend: 'stable' as const,
      caloriesTrend: 'up' as const,
    },
    dailyBreakdown: [],
    hasData: true,
  },
  calorieBalance: {
    totalIntake: 10500,
    totalBurned: 600,
    netCalories: 9900,
    status: 'balanced' as const,
    avgNetPerDay: 1414,
  },
  insights: {
    highlights: ['수분 섭취가 꾸준합니다'],
    improvements: ['단백질 섭취를 늘려보세요'],
    tips: ['아침 식사를 거르지 마세요'],
  },
  streak: {
    nutrition: { current: 5, longest: 10, milestone: null, message: '5일 연속 기록 중!' },
    workout: { current: 3, longest: 7, milestone: null, message: '3일 연속 기록 중!' },
  },
  highlights: {
    bestDay: '2025-12-10',
    worstDay: '2025-12-12',
    bestDayScore: 90,
    worstDayScore: 50,
  },
};

describe('GET /api/reports/weekly', () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
    vi.mocked(getWeekStart).mockReturnValue('2025-12-09');
    vi.mocked(getWeekEnd).mockReturnValue('2025-12-15');
    vi.mocked(generateWeeklyReport).mockReturnValue(mockWeeklyReport);

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'meal_records') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockMeals, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'water_records') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: mockWaterRecords, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'workout_logs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: mockWorkoutLogs, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'nutrition_settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
            }),
          }),
        };
      }
      if (table === 'nutrition_streaks') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockNutritionStreak, error: null }),
            }),
          }),
        };
      }
      if (table === 'workout_streaks') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWorkoutStreak, error: null }),
            }),
          }),
        };
      }
      // hair_analyses, makeup_analyses (H-1, M-1)
      if (table === 'hair_analyses' || table === 'makeup_analyses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      // 알 수 없는 테이블에 대한 기본 mock
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await GET(createMockGetRequest('http://localhost/api/reports/weekly'));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('잘못된 날짜 형식은 400을 반환한다', async () => {
      const response = await GET(
        createMockGetRequest('http://localhost/api/reports/weekly?weekStart=2025/12/09')
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid date format');
    });

    it('날짜 형식이 맞으면 정상 처리된다', async () => {
      vi.mocked(getWeekStart).mockImplementation((date) => {
        return date ? '2025-12-09' : '2025-12-09';
      });

      const response = await GET(
        createMockGetRequest('http://localhost/api/reports/weekly?weekStart=2025-12-09')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('데이터 조회', () => {
    it('weekStart 미지정 시 이번 주 리포트를 반환한다', async () => {
      const response = await GET(createMockGetRequest('http://localhost/api/reports/weekly'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.hasData).toBe(true);
      expect(json.data).toEqual(mockWeeklyReport);
    });

    it('지정된 주의 리포트를 반환한다', async () => {
      vi.mocked(getWeekStart).mockReturnValue('2025-12-02');
      vi.mocked(getWeekEnd).mockReturnValue('2025-12-08');

      const response = await GET(
        createMockGetRequest('http://localhost/api/reports/weekly?weekStart=2025-12-02')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('데이터가 없으면 hasData=false를 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'meal_records') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'water_records') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'workout_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (
          table === 'nutrition_settings' ||
          table === 'nutrition_streaks' ||
          table === 'workout_streaks'
        ) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === 'hair_analyses' || table === 'makeup_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await GET(createMockGetRequest('http://localhost/api/reports/weekly'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.hasData).toBe(false);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'meal_records') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi
                      .fn()
                      .mockResolvedValue({
                        data: null,
                        error: { code: 'OTHER', message: 'DB Error' },
                      }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'water_records' || table === 'workout_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'hair_analyses' || table === 'makeup_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        // nutrition_settings, nutrition_streaks, workout_streaks
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      const response = await GET(createMockGetRequest('http://localhost/api/reports/weekly'));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toContain('Failed to fetch');
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const response = await GET(createMockGetRequest('http://localhost/api/reports/weekly'));
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('hasData', true);
      expect(json).toHaveProperty('data');
    });
  });
});
