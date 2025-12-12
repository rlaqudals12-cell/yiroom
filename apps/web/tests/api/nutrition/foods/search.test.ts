/**
 * N-1 음식 검색 API 테스트
 * Task 2.12: 음식 검색 API (GET /api/nutrition/foods/search)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted로 mock 객체를 모듈 스코프에서 정의
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}));

// Mock 모듈 설정
vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

import { GET } from '@/app/api/nutrition/foods/search/route';

// Mock 요청 헬퍼
function createMockRequest(params: Record<string, string>): Request {
  const searchParams = new URLSearchParams(params);
  const url = `http://localhost/api/nutrition/foods/search?${searchParams.toString()}`;
  return {
    url,
    json: () => Promise.resolve({}),
  } as Request;
}

// Mock 음식 데이터
const mockFoods = [
  {
    id: 'food-1',
    name: '비빔밥',
    name_en: 'Bibimbap',
    category: 'rice',
    serving_size: '1인분',
    serving_grams: 450,
    calories: 550,
    protein: 18,
    carbs: 78,
    fat: 15,
    traffic_light: 'yellow',
    is_korean: true,
    tags: ['traditional', 'balanced'],
  },
  {
    id: 'food-2',
    name: '김치찌개',
    name_en: 'Kimchi Stew',
    category: 'soup',
    serving_size: '1인분',
    serving_grams: 350,
    calories: 220,
    protein: 14,
    carbs: 12,
    fat: 14,
    traffic_light: 'yellow',
    is_korean: true,
    tags: ['traditional', 'spicy'],
  },
  {
    id: 'food-3',
    name: '닭가슴살 샐러드',
    name_en: 'Chicken Breast Salad',
    category: 'side',
    serving_size: '1인분',
    serving_grams: 250,
    calories: 180,
    protein: 28,
    carbs: 8,
    fat: 5,
    traffic_light: 'green',
    is_korean: false,
    tags: ['healthy', 'high_protein', 'diet'],
  },
];

describe('GET /api/nutrition/foods/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 체이닝을 위해 this 반환
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.ilike.mockReturnThis();
    mockSupabase.or.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockResolvedValue({ data: mockFoods, error: null });
  });

  describe('검색어 처리', () => {
    it('검색어가 없으면 400을 반환한다', async () => {
      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Search query is required');
    });

    it('검색어가 너무 짧으면 400을 반환한다', async () => {
      const request = createMockRequest({ q: '밥' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 2 characters');
    });

    it('유효한 검색어로 검색한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [mockFoods[0]], error: null });

      const request = createMockRequest({ q: '비빔밥' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.foods).toHaveLength(1);
      expect(data.foods[0].name).toBe('비빔밥');
    });

    it('검색어를 트림한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [mockFoods[0]], error: null });

      const request = createMockRequest({ q: '  비빔밥  ' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalled();
    });
  });

  describe('카테고리 필터', () => {
    it('카테고리로 필터링할 수 있다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [mockFoods[1]], error: null });

      const request = createMockRequest({ q: '찌개', category: 'soup' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'soup');
    });

    it('잘못된 카테고리는 무시한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: mockFoods, error: null });

      const request = createMockRequest({ q: '비빔밥', category: 'invalid' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      // invalid category should not call eq
    });
  });

  describe('신호등 필터', () => {
    it('신호등 색상으로 필터링할 수 있다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [mockFoods[2]], error: null });

      const request = createMockRequest({ q: '샐러드', trafficLight: 'green' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('traffic_light', 'green');
    });
  });

  describe('페이지네이션', () => {
    it('기본 limit은 20이다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: mockFoods, error: null });

      const request = createMockRequest({ q: '밥류' });
      await GET(request);

      expect(mockSupabase.limit).toHaveBeenCalledWith(20);
    });

    it('커스텀 limit을 설정할 수 있다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: mockFoods, error: null });

      const request = createMockRequest({ q: '밥류', limit: '10' });
      await GET(request);

      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it('limit은 최대 50이다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: mockFoods, error: null });

      const request = createMockRequest({ q: '밥류', limit: '100' });
      await GET(request);

      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('응답 형식', () => {
    it('올바른 응답 구조를 반환한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: mockFoods, error: null });

      const request = createMockRequest({ q: '음식' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('foods');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('query');
      expect(data.query).toBe('음식');
    });

    it('빈 결과를 올바르게 처리한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      const request = createMockRequest({ q: '존재하지않는음식' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.foods).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('에러 처리', () => {
    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createMockRequest({ q: '비빔밥' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search foods');
    });
  });

  describe('한국어 음식 우선', () => {
    it('한국어 음식을 먼저 정렬한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: mockFoods, error: null });

      const request = createMockRequest({ q: '샐러드' });
      await GET(request);

      // is_korean DESC로 정렬되어 한국 음식이 먼저 오도록
      expect(mockSupabase.order).toHaveBeenCalledWith('is_korean', { ascending: false });
    });
  });
});
