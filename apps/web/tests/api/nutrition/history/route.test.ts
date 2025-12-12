/**
 * N-1 식단 히스토리 API 테스트
 * Task 2.14: 히스토리 API (GET /api/nutrition/history)
 *
 * 기간별 식단 기록 조회:
 * - 날짜 범위 조회 (startDate, endDate)
 * - 일별 요약 통계
 * - 페이지네이션
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/nutrition/history/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase service role client
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  range: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabase,
}));

import { auth } from '@clerk/nextjs/server';

// Mock 요청 헬퍼
function createMockRequest(params: Record<string, string>): Request {
  const searchParams = new URLSearchParams(params);
  const url = `http://localhost/api/nutrition/history?${searchParams.toString()}`;
  return {
    url,
    json: () => Promise.resolve({}),
  } as Request;
}

// Mock 식단 기록 데이터
const mockMealRecords = [
  {
    id: 'meal-1',
    clerk_user_id: 'user-123',
    meal_type: 'breakfast',
    meal_date: '2025-12-01',
    total_calories: 350,
    total_protein: 20,
    total_carbs: 45,
    total_fat: 12,
    foods: [{ food_name: '계란후라이', calories: 150 }],
    created_at: '2025-12-01T08:30:00Z',
  },
  {
    id: 'meal-2',
    clerk_user_id: 'user-123',
    meal_type: 'lunch',
    meal_date: '2025-12-01',
    total_calories: 650,
    total_protein: 30,
    total_carbs: 80,
    total_fat: 22,
    foods: [{ food_name: '비빔밥', calories: 550 }],
    created_at: '2025-12-01T12:30:00Z',
  },
  {
    id: 'meal-3',
    clerk_user_id: 'user-123',
    meal_type: 'dinner',
    meal_date: '2025-11-30',
    total_calories: 500,
    total_protein: 25,
    total_carbs: 60,
    total_fat: 18,
    foods: [{ food_name: '김치찌개', calories: 350 }],
    created_at: '2025-11-30T19:00:00Z',
  },
];

describe('GET /api/nutrition/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 인증 설정
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

    // Supabase 체이닝 설정
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.lte.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockResolvedValue({ data: mockMealRecords, error: null });
    mockSupabase.range.mockResolvedValue({ data: mockMealRecords, error: null });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('날짜 범위 조회', () => {
    it('startDate와 endDate로 기간 조회가 가능하다', async () => {
      const request = createMockRequest({
        startDate: '2025-11-25',
        endDate: '2025-12-01',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.gte).toHaveBeenCalledWith('meal_date', '2025-11-25');
      expect(mockSupabase.lte).toHaveBeenCalledWith('meal_date', '2025-12-01');
    });

    it('날짜 없이 요청하면 최근 7일을 조회한다', async () => {
      const request = createMockRequest({});
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.gte).toHaveBeenCalled();
      expect(mockSupabase.lte).toHaveBeenCalled();
    });

    it('잘못된 날짜 형식은 400을 반환한다', async () => {
      const request = createMockRequest({
        startDate: '2025/12/01',
        endDate: '2025-12-07',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });

    it('startDate가 endDate보다 늦으면 400을 반환한다', async () => {
      const request = createMockRequest({
        startDate: '2025-12-10',
        endDate: '2025-12-01',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('startDate must be before endDate');
    });
  });

  describe('응답 형식', () => {
    it('일별 요약 데이터를 반환한다', async () => {
      const request = createMockRequest({
        startDate: '2025-11-30',
        endDate: '2025-12-01',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('startDate');
      expect(data).toHaveProperty('endDate');
      expect(data).toHaveProperty('totalDays');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('dailyRecords');
    });

    it('전체 기간 요약 통계를 포함한다', async () => {
      const request = createMockRequest({
        startDate: '2025-11-30',
        endDate: '2025-12-01',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.summary).toHaveProperty('totalCalories');
      expect(data.summary).toHaveProperty('avgCaloriesPerDay');
      expect(data.summary).toHaveProperty('totalMeals');
      expect(data.summary).toHaveProperty('daysWithRecords');
    });

    it('일별 기록을 날짜 내림차순으로 반환한다', async () => {
      const request = createMockRequest({
        startDate: '2025-11-30',
        endDate: '2025-12-01',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(Array.isArray(data.dailyRecords)).toBe(true);
      expect(mockSupabase.order).toHaveBeenCalledWith('meal_date', { ascending: false });
    });
  });

  describe('페이지네이션', () => {
    it('limit 파라미터로 결과 수를 제한할 수 있다', async () => {
      const request = createMockRequest({
        startDate: '2025-11-01',
        endDate: '2025-12-01',
        limit: '10',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it('limit 기본값은 50이다', async () => {
      const request = createMockRequest({
        startDate: '2025-11-01',
        endDate: '2025-12-01',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });

    it('limit 최대값은 100이다', async () => {
      const request = createMockRequest({
        startDate: '2025-11-01',
        endDate: '2025-12-01',
        limit: '200',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('에러 처리', () => {
    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createMockRequest({
        startDate: '2025-11-30',
        endDate: '2025-12-01',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch history');
    });
  });

  describe('빈 결과 처리', () => {
    it('기록이 없는 기간에는 빈 배열을 반환한다', async () => {
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });

      const request = createMockRequest({
        startDate: '2025-01-01',
        endDate: '2025-01-07',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dailyRecords).toEqual([]);
      expect(data.summary.totalMeals).toBe(0);
    });
  });
});
