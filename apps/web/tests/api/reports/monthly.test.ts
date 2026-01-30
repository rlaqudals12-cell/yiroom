/**
 * R-1 월간 리포트 API 테스트
 * @description GET /api/reports/monthly 테스트
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

vi.mock('@/lib/reports/monthlyAggregator', () => ({
  generateMonthlyReport: vi.fn(),
  getMonthRangeFromYYYYMM: vi.fn(),
}));

vi.mock('@/lib/reports/weeklyAggregator', () => ({
  DEFAULT_NUTRITION_TARGETS: {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    water: 2000,
  },
}));

import { GET } from '@/app/api/reports/monthly/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { generateMonthlyReport, getMonthRangeFromYYYYMM } from '@/lib/reports/monthlyAggregator';

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
    meal_date: '2025-12-01',
    meal_type: 'breakfast',
    foods: [
      { food_name: '밥', calories: 300, protein: 5, carbs: 65, fat: 1, traffic_light: 'green' },
    ],
    total_calories: 300,
    total_protein: 5,
    total_carbs: 65,
    total_fat: 1,
    created_at: '2025-12-01T08:00:00Z',
  },
];

const mockWaterRecords = [
  {
    id: 'water-1',
    clerk_user_id: 'user_test123',
    record_date: '2025-12-01',
    amount_ml: 500,
    effective_ml: 500,
    drink_type: 'water',
  },
];

const mockWorkoutLogs = [
  {
    id: 'workout-1',
    user_id: 'user_test123',
    workout_date: '2025-12-01',
    exercise_logs: [],
    actual_duration: 30,
    actual_calories: 200,
    completed_at: '2025-12-01T10:00:00Z',
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
  current_streak: 15,
  longest_streak: 30,
  last_record_date: '2025-12-09',
  badges_earned: ['3day', '7day', '14day'],
};

const mockWorkoutStreak = {
  current_streak: 10,
  longest_streak: 20,
  last_workout_date: '2025-12-09',
  badges_earned: ['3day', '7day'],
};

const mockBodyAnalyses = [
  { user_input: { weight: 65 }, created_at: '2025-12-01T00:00:00Z' },
  { user_input: { weight: 64 }, created_at: '2025-12-15T00:00:00Z' },
];

const mockMonthlyReport = {
  month: '2025-12',
  monthStart: '2025-12-01',
  monthEnd: '2025-12-31',
  generatedAt: new Date().toISOString(),
  nutrition: {
    summary: {
      totalCalories: 55800,
      avgCaloriesPerDay: 1800,
      totalProtein: 2170,
      avgProteinPerDay: 70,
      totalCarbs: 6820,
      avgCarbsPerDay: 220,
      totalFat: 1705,
      avgFatPerDay: 55,
      totalWater: 62000,
      avgWaterPerDay: 2000,
      mealCount: 90,
      daysWithRecords: 31,
    },
    achievement: {
      caloriesPercent: 90,
      proteinPercent: 85,
      carbsPercent: 88,
      fatPercent: 80,
      waterPercent: 100,
    },
    trend: {
      caloriesTrend: 'stable' as const,
      waterTrend: 'up' as const,
      proteinTrend: 'stable' as const,
      foodQualityScore: 80,
      consistencyScore: 90,
    },
    dailyBreakdown: [],
  },
  workout: {
    summary: {
      totalSessions: 15,
      totalDuration: 450,
      avgDurationPerSession: 30,
      totalCaloriesBurned: 3000,
      daysWithWorkout: 15,
    },
    trend: {
      consistencyScore: 80,
      durationTrend: 'up' as const,
      caloriesTrend: 'up' as const,
    },
    dailyBreakdown: [],
    hasData: true,
  },
  weeklyComparison: [
    {
      weekStart: '2025-12-02',
      weekEnd: '2025-12-08',
      avgCalories: 1750,
      avgWater: 1900,
      avgProtein: 68,
      workoutCount: 4,
      mealCount: 21,
      foodQualityScore: 78,
    },
  ],
  calorieBalance: {
    totalIntake: 55800,
    totalBurned: 3000,
    netCalories: 52800,
    status: 'balanced' as const,
    avgNetPerDay: 1703,
  },
  bodyProgress: {
    startWeight: 65,
    endWeight: 64,
    weightChange: -1,
    reanalysisRecommended: false,
    message: '1kg 감량하셨어요!',
  },
  goalProgress: {
    goal: 'maintain' as const,
    achievementRate: 85,
    message: '목표를 잘 유지하고 계세요',
    isOnTrack: true,
  },
  insights: {
    highlights: ['한 달간 꾸준히 기록하셨어요'],
    improvements: ['주말 식단 관리가 필요해요'],
    tips: ['다음 달에는 운동 빈도를 높여보세요'],
  },
  streak: {
    nutrition: { current: 15, longest: 30, milestone: null, message: '15일 연속 기록 중!' },
    workout: { current: 10, longest: 20, milestone: null, message: '10일 연속 기록 중!' },
  },
  highlights: {
    bestWeek: 2,
    worstWeek: 4,
    bestWeekScore: 92,
    worstWeekScore: 65,
  },
};

describe('GET /api/reports/monthly', () => {
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
    vi.mocked(getMonthRangeFromYYYYMM).mockReturnValue({
      monthStart: '2025-12-01',
      monthEnd: '2025-12-31',
    });
    vi.mocked(generateMonthlyReport).mockReturnValue(mockMonthlyReport);

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
      if (table === 'body_analyses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockBodyAnalyses, error: null }),
                }),
              }),
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

      const response = await GET(createMockGetRequest('http://localhost/api/reports/monthly'));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('잘못된 월 형식은 400을 반환한다', async () => {
      const response = await GET(
        createMockGetRequest('http://localhost/api/reports/monthly?month=2025-12-01')
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid month format');
    });

    it('잘못된 월 형식 (슬래시)은 400을 반환한다', async () => {
      const response = await GET(
        createMockGetRequest('http://localhost/api/reports/monthly?month=2025/12')
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid month format');
    });

    it('월 형식이 맞으면 정상 처리된다', async () => {
      const response = await GET(
        createMockGetRequest('http://localhost/api/reports/monthly?month=2025-12')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('데이터 조회', () => {
    it('month 미지정 시 이번 달 리포트를 반환한다', async () => {
      const response = await GET(createMockGetRequest('http://localhost/api/reports/monthly'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.hasData).toBe(true);
      expect(json.data).toEqual(mockMonthlyReport);
    });

    it('지정된 월의 리포트를 반환한다', async () => {
      vi.mocked(getMonthRangeFromYYYYMM).mockReturnValue({
        monthStart: '2025-11-01',
        monthEnd: '2025-11-30',
      });

      const response = await GET(
        createMockGetRequest('http://localhost/api/reports/monthly?month=2025-11')
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
        if (table === 'workout_logs' || table === 'body_analyses') {
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

      const response = await GET(createMockGetRequest('http://localhost/api/reports/monthly'));
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
        if (table === 'water_records' || table === 'workout_logs' || table === 'body_analyses') {
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

      const response = await GET(createMockGetRequest('http://localhost/api/reports/monthly'));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toContain('Failed to fetch');
    });
  });

  describe('체형 분석 연동', () => {
    it('체형 분석 데이터가 있으면 체중 변화가 포함된다', async () => {
      const response = await GET(createMockGetRequest('http://localhost/api/reports/monthly'));
      await response.json();

      expect(response.status).toBe(200);
      expect(generateMonthlyReport).toHaveBeenCalled();
      // generateMonthlyReport이 호출될 때 bodyAnalysisStart, bodyAnalysisEnd가 전달되는지 확인
      const callArgs = vi.mocked(generateMonthlyReport).mock.calls[0][0];
      expect(callArgs.bodyAnalysisStart).toEqual({ weight: 65 });
      expect(callArgs.bodyAnalysisEnd).toEqual({ weight: 64 });
    });

    it('체형 분석 데이터가 하나만 있으면 시작과 종료가 같다', async () => {
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
        if (table === 'body_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [{ user_input: { weight: 65 }, created_at: '2025-12-01T00:00:00Z' }],
                      error: null,
                    }),
                  }),
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

      const response = await GET(createMockGetRequest('http://localhost/api/reports/monthly'));

      expect(response.status).toBe(200);
      const callArgs = vi.mocked(generateMonthlyReport).mock.calls[0][0];
      expect(callArgs.bodyAnalysisStart).toEqual({ weight: 65 });
      expect(callArgs.bodyAnalysisEnd).toEqual({ weight: 65 });
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const response = await GET(createMockGetRequest('http://localhost/api/reports/monthly'));
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('hasData', true);
      expect(json).toHaveProperty('data');
    });
  });
});
