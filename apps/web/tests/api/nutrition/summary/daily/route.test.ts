/**
 * N-1 일일 영양 요약 API 테스트
 * Task 2.8: 오늘의 식단 API (GET /api/nutrition/summary/daily)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { GET } from '@/app/api/nutrition/summary/daily/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Mock 요청 헬퍼
function createMockRequest(date?: string): Request {
  const url = date
    ? `http://localhost/api/nutrition/summary/daily?date=${date}`
    : 'http://localhost/api/nutrition/summary/daily';
  return {
    url,
    json: () => Promise.resolve({}),
  } as Request;
}

// ReturnType helper for auth
type AuthReturnType = ReturnType<typeof auth> extends Promise<infer T> ? T : never;

// Mock 데이터
const mockMealRecords = [
  {
    id: 'record-1',
    clerk_user_id: 'user_test123',
    meal_type: 'breakfast',
    meal_date: '2025-12-02',
    total_calories: 400,
    total_protein: 15,
    total_carbs: 50,
    total_fat: 15,
    foods: [
      { food_name: '토스트', traffic_light: 'yellow' },
      { food_name: '계란', traffic_light: 'green' },
    ],
    created_at: '2025-12-02T08:00:00Z',
  },
  {
    id: 'record-2',
    clerk_user_id: 'user_test123',
    meal_type: 'lunch',
    meal_date: '2025-12-02',
    total_calories: 550,
    total_protein: 20,
    total_carbs: 80,
    total_fat: 15,
    foods: [
      { food_name: '비빔밥', traffic_light: 'yellow' },
    ],
    created_at: '2025-12-02T12:00:00Z',
  },
];

const mockWaterRecords = [
  { amount_ml: 250, effective_ml: 250 },
  { amount_ml: 500, effective_ml: 500 },
  { amount_ml: 200, effective_ml: 160 },
];

const mockNutritionSettings = {
  daily_calories: 2000,
  daily_carbs: 250,
  daily_protein: 80,
  daily_fat: 55,
  daily_water: 2000,
};

// 체이닝 가능한 Supabase mock 생성
function createSupabaseMock(
  mealsData: typeof mockMealRecords | null = mockMealRecords,
  waterData: typeof mockWaterRecords | null = mockWaterRecords,
  settingsData: typeof mockNutritionSettings | null = mockNutritionSettings
) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'meal_records') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mealsData, error: null }),
              }),
            }),
          }),
        };
      } else if (table === 'water_records') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: waterData, error: null }),
            }),
          }),
        };
      } else if (table === 'nutrition_settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: settingsData, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

describe('GET /api/nutrition/summary/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      createSupabaseMock() as unknown as ReturnType<typeof createServiceRoleClient>
    );
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturnType);

      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('날짜 파라미터', () => {
    it('날짜 파라미터가 없으면 오늘 날짜를 사용한다', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBeDefined();
    });

    it('유효한 날짜 파라미터를 처리한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2025-12-02');
    });

    it('잘못된 날짜 형식은 400을 반환한다', async () => {
      const request = createMockRequest('2025/12/02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });
  });

  describe('응답 형식', () => {
    it('target 객체를 포함한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.target).toBeDefined();
      expect(data.target.calories).toBeDefined();
      expect(data.target.carbs).toBeDefined();
      expect(data.target.protein).toBeDefined();
      expect(data.target.fat).toBeDefined();
      expect(data.target.water).toBeDefined();
    });

    it('consumed 객체를 포함한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consumed).toBeDefined();
      expect(data.consumed.calories).toBeDefined();
    });

    it('achievement 객체를 포함한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.achievement).toBeDefined();
      expect(data.achievement.calories_percent).toBeDefined();
    });

    it('signal_ratio 객체를 포함한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signal_ratio).toBeDefined();
      expect(data.signal_ratio.green).toBeDefined();
      expect(data.signal_ratio.yellow).toBeDefined();
      expect(data.signal_ratio.red).toBeDefined();
    });

    it('meals 배열을 포함한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meals).toBeDefined();
      expect(Array.isArray(data.meals)).toBe(true);
    });

    it('insights 배열을 포함한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.insights).toBeDefined();
      expect(Array.isArray(data.insights)).toBe(true);
    });

    it('meal_count를 포함한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meal_count).toBeDefined();
      expect(typeof data.meal_count).toBe('number');
    });
  });

  describe('계산 검증', () => {
    it('영양소 총합을 올바르게 계산한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      // 400 + 550 = 950 kcal
      expect(data.consumed.calories).toBe(950);
      // 15 + 20 = 35g protein
      expect(data.consumed.protein).toBe(35);
      // 50 + 80 = 130g carbs
      expect(data.consumed.carbs).toBe(130);
      // 15 + 15 = 30g fat
      expect(data.consumed.fat).toBe(30);
    });

    it('달성률을 올바르게 계산한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      // 950 / 2000 * 100 = 47.5 → 48%
      expect(data.achievement.calories_percent).toBe(48);
    });

    it('신호등 비율을 올바르게 계산한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      // 3개 음식: 1 green, 2 yellow, 0 red
      // green: 33%, yellow: 67%, red: 0%
      expect(data.signal_ratio.green).toBe(33);
      expect(data.signal_ratio.yellow).toBe(67);
      expect(data.signal_ratio.red).toBe(0);
    });
  });

  describe('빈 데이터 처리', () => {
    it('기록이 없을 때 0값을 반환한다', async () => {
      // 빈 데이터 mock
      vi.mocked(createServiceRoleClient).mockReturnValue(
        createSupabaseMock([], [], null) as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consumed.calories).toBe(0);
      expect(data.meal_count).toBe(0);
      expect(data.signal_ratio.green).toBe(0);
      expect(data.signal_ratio.yellow).toBe(0);
      expect(data.signal_ratio.red).toBe(0);
    });
  });

  describe('인사이트 생성', () => {
    it('인사이트 배열은 최대 3개이다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(data.insights.length).toBeLessThanOrEqual(3);
    });
  });

  describe('수분 섭취 계산', () => {
    it('수분 섭취량을 올바르게 계산한다', async () => {
      const request = createMockRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      // 250 + 500 + 160 = 910ml
      expect(data.consumed.water).toBe(910);
    });
  });
});
