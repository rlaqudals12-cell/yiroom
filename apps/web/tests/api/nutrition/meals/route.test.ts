/**
 * N-1 식사 기록 API 테스트
 * Task 2.7: 식단 기록 화면 (GET /api/nutrition/meals)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { GET, POST } from '@/app/api/nutrition/meals/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Mock 요청 헬퍼
function createMockGetRequest(date?: string): Request {
  const url = date
    ? `http://localhost/api/nutrition/meals?date=${date}`
    : 'http://localhost/api/nutrition/meals';
  return {
    url,
    json: () => Promise.resolve({}),
  } as Request;
}

function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/nutrition/meals',
    json: () => Promise.resolve(body),
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
      {
        food_name: '토스트',
        portion: '2조각',
        calories: 200,
        protein: 5,
        carbs: 30,
        fat: 5,
        traffic_light: 'yellow',
      },
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
      {
        food_name: '비빔밥',
        portion: '1인분',
        calories: 550,
        protein: 20,
        carbs: 80,
        fat: 15,
        traffic_light: 'yellow',
      },
    ],
    created_at: '2025-12-02T12:00:00Z',
  },
];

describe('GET /api/nutrition/meals', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 인증 설정
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    // 기본 쿼리 결과
    mockSupabase.order.mockResolvedValue({ data: mockMealRecords, error: null });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturnType);

      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('날짜 파라미터', () => {
    it('날짜 파라미터가 없으면 오늘 날짜를 사용한다', async () => {
      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBeDefined();
    });

    it('유효한 날짜 파라미터를 처리한다', async () => {
      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2025-12-02');
    });

    it('잘못된 날짜 형식은 400을 반환한다', async () => {
      const request = createMockGetRequest('2025/12/02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });

    it('잘못된 날짜 형식 (날짜만)은 400을 반환한다', async () => {
      const request = createMockGetRequest('12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });
  });

  describe('데이터 조회', () => {
    it('식사 기록을 올바르게 조회한다', async () => {
      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('meal_records');
      expect(mockSupabase.eq).toHaveBeenCalledWith('clerk_user_id', 'user_test123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('meal_date', '2025-12-02');
    });

    it('빈 결과를 올바르게 처리한다', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.totalCalories).toBe(0);
      expect(data.summary.mealCount).toBe(0);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch meal records');
    });
  });

  describe('응답 형식', () => {
    it('올바른 요약 정보를 반환한다', async () => {
      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary).toEqual({
        totalCalories: 950, // 400 + 550
        totalProtein: 35, // 15 + 20
        totalCarbs: 130, // 50 + 80
        totalFat: 30, // 15 + 15
        mealCount: 2,
      });
    });

    it('식사 타입별로 그룹화된 데이터를 반환한다', async () => {
      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meals).toHaveLength(4); // breakfast, lunch, dinner, snack

      const breakfast = data.meals.find((m: { type: string }) => m.type === 'breakfast');
      const lunch = data.meals.find((m: { type: string }) => m.type === 'lunch');

      expect(breakfast.records).toHaveLength(1);
      expect(breakfast.subtotal.calories).toBe(400);

      expect(lunch.records).toHaveLength(1);
      expect(lunch.subtotal.calories).toBe(550);
    });

    it('빈 식사 타입도 포함한다', async () => {
      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      const dinner = data.meals.find((m: { type: string }) => m.type === 'dinner');
      const snack = data.meals.find((m: { type: string }) => m.type === 'snack');

      expect(dinner.records).toHaveLength(0);
      expect(dinner.subtotal.calories).toBe(0);

      expect(snack.records).toHaveLength(0);
      expect(snack.subtotal.calories).toBe(0);
    });

    it('식사 타입 정보를 포함한다', async () => {
      const request = createMockGetRequest('2025-12-02');
      const response = await GET(request);
      const data = await response.json();

      const breakfast = data.meals.find((m: { type: string }) => m.type === 'breakfast');

      expect(breakfast.label).toBe('아침');
      expect(breakfast.icon).toBe('🌅');
      expect(breakfast.order).toBe(0);
    });
  });
});

describe('POST /api/nutrition/meals', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    mockSupabase.single.mockResolvedValue({
      data: { id: 'new-record-123' },
      error: null,
    });
  });

  it('식사 기록을 저장한다', async () => {
    const request = createMockPostRequest({
      foods: [
        {
          name: '비빔밥',
          calories: 550,
          protein: 20,
          carbs: 80,
          fat: 15,
        },
      ],
      mealType: 'lunch',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('meal_records');
    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  it('빈 foods 배열은 400을 반환한다', async () => {
    const request = createMockPostRequest({
      foods: [],
      mealType: 'lunch',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('foods array is required');
  });

  describe('recordType 지원 (Task 2.11)', () => {
    it('recordType=manual로 저장할 수 있다', async () => {
      const request = createMockPostRequest({
        foods: [
          {
            name: '집밥 김치찌개',
            calories: 200,
            protein: 10,
            carbs: 15,
            fat: 8,
            trafficLight: 'yellow',
          },
        ],
        mealType: 'lunch',
        recordType: 'manual',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          record_type: 'manual',
          ai_recognized_food: null, // manual은 AI 필드가 null
          ai_confidence: null,
        })
      );
    });

    it('recordType=photo로 저장하면 AI 필드가 설정된다', async () => {
      const request = createMockPostRequest({
        foods: [
          {
            name: '비빔밥',
            calories: 550,
            protein: 20,
            carbs: 80,
            fat: 15,
            confidence: 0.9,
          },
        ],
        mealType: 'lunch',
        recordType: 'photo',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          record_type: 'photo',
          ai_recognized_food: '비빔밥',
          ai_confidence: 'high',
        })
      );
    });

    it('유효하지 않은 recordType은 400을 반환한다', async () => {
      const request = createMockPostRequest({
        foods: [
          {
            name: '테스트',
            calories: 100,
            protein: 5,
            carbs: 10,
            fat: 3,
          },
        ],
        mealType: 'lunch',
        recordType: 'invalid',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid recordType');
    });

    it('recordType이 없으면 기본값 photo를 사용한다', async () => {
      const request = createMockPostRequest({
        foods: [
          {
            name: '비빔밥',
            calories: 550,
            protein: 20,
            carbs: 80,
            fat: 15,
          },
        ],
        mealType: 'lunch',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          record_type: 'photo',
        })
      );
    });
  });
});
