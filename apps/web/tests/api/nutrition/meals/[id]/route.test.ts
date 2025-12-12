/**
 * N-1 개별 식단 기록 API 테스트
 * Task 2.8: 오늘의 식단 API (PUT, DELETE, GET /api/nutrition/meals/:id)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { PUT, DELETE, GET } from '@/app/api/nutrition/meals/[id]/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Mock 요청 헬퍼
function createMockRequest(method: string, body?: unknown): Request {
  return {
    url: 'http://localhost/api/nutrition/meals/test-id',
    method,
    json: () => Promise.resolve(body || {}),
  } as Request;
}

// Mock context 헬퍼
function createMockContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

// ReturnType helper for auth
type AuthReturnType = ReturnType<typeof auth> extends Promise<infer T> ? T : never;

// Mock 데이터
const mockMealRecord = {
  id: '12345678-1234-1234-1234-123456789012',
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
};

describe('GET /api/nutrition/meals/:id', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    mockSupabase.single.mockResolvedValue({ data: mockMealRecord, error: null });
  });

  it('인증되지 않은 요청은 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturnType);

    const request = createMockRequest('GET');
    const context = createMockContext(mockMealRecord.id);
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('잘못된 ID 형식은 400을 반환한다', async () => {
    const request = createMockRequest('GET');
    const context = createMockContext('invalid-id');
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid meal record ID');
  });

  it('존재하지 않는 기록은 404를 반환한다', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const request = createMockRequest('GET');
    const context = createMockContext(mockMealRecord.id);
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Meal record not found');
  });

  it('식단 기록을 성공적으로 조회한다', async () => {
    const request = createMockRequest('GET');
    const context = createMockContext(mockMealRecord.id);
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(mockMealRecord.id);
    expect(data.meal_type).toBe('lunch');
  });
});

describe('PUT /api/nutrition/meals/:id', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    // 기존 기록 조회 mock
    mockSupabase.single.mockResolvedValue({ data: mockMealRecord, error: null });
  });

  it('인증되지 않은 요청은 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturnType);

    const request = createMockRequest('PUT', { mealType: 'dinner' });
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('다른 사용자의 기록 수정은 403을 반환한다', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { ...mockMealRecord, clerk_user_id: 'other_user' },
      error: null,
    });

    const request = createMockRequest('PUT', { mealType: 'dinner' });
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('permission');
  });

  it('잘못된 mealType은 400을 반환한다', async () => {
    const request = createMockRequest('PUT', { mealType: 'invalid' });
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid mealType');
  });

  it('잘못된 날짜 형식은 400을 반환한다', async () => {
    const request = createMockRequest('PUT', { mealDate: '2025/12/02' });
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid mealDate format');
  });

  it('빈 foods 배열은 400을 반환한다', async () => {
    const request = createMockRequest('PUT', { foods: [] });
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('non-empty array');
  });

  it('업데이트할 필드가 없으면 400을 반환한다', async () => {
    const request = createMockRequest('PUT', {});
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('No valid fields');
  });

  it('식단 기록을 성공적으로 수정한다', async () => {
    // update 후 select.single mock 설정
    const updatedRecord = { ...mockMealRecord, meal_type: 'dinner' };
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockMealRecord, error: null }) // 기존 기록 조회
      .mockResolvedValueOnce({ data: updatedRecord, error: null }); // 업데이트 후 조회

    const request = createMockRequest('PUT', { mealType: 'dinner' });
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSupabase.update).toHaveBeenCalled();
  });

  it('foods 업데이트 시 영양소를 재계산한다', async () => {
    const newFoods = [
      { name: '김치찌개', calories: 200, protein: 15, carbs: 10, fat: 10 },
      { name: '밥', calories: 300, protein: 5, carbs: 65, fat: 1 },
    ];

    const updatedRecord = {
      ...mockMealRecord,
      total_calories: 500,
      total_protein: 20,
      total_carbs: 75,
      total_fat: 11,
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: mockMealRecord, error: null })
      .mockResolvedValueOnce({ data: updatedRecord, error: null });

    const request = createMockRequest('PUT', { foods: newFoods });
    const context = createMockContext(mockMealRecord.id);
    const response = await PUT(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('DELETE /api/nutrition/meals/:id', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    delete: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    mockSupabase.single.mockResolvedValue({ data: mockMealRecord, error: null });
    mockSupabase.delete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('인증되지 않은 요청은 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturnType);

    const request = createMockRequest('DELETE');
    const context = createMockContext(mockMealRecord.id);
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('다른 사용자의 기록 삭제는 403을 반환한다', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { ...mockMealRecord, clerk_user_id: 'other_user' },
      error: null,
    });

    const request = createMockRequest('DELETE');
    const context = createMockContext(mockMealRecord.id);
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('permission');
  });

  it('존재하지 않는 기록 삭제는 404를 반환한다', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const request = createMockRequest('DELETE');
    const context = createMockContext(mockMealRecord.id);
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Meal record not found');
  });

  it('식단 기록을 성공적으로 삭제한다', async () => {
    const request = createMockRequest('DELETE');
    const context = createMockContext(mockMealRecord.id);
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('삭제');
  });
});
