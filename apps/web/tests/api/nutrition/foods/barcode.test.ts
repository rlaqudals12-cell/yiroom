/**
 * 바코드 식품 API 테스트
 * /api/nutrition/foods/barcode
 *
 * - GET /api/nutrition/foods/barcode/[code] - 바코드로 조회
 * - GET /api/nutrition/foods/barcode - 스캔 이력 조회
 * - POST /api/nutrition/foods/barcode - 새 식품 등록
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/nutrition/foods/barcode/[code]/route';
import { GET as GET_HISTORY, POST } from '@/app/api/nutrition/foods/barcode/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase - 체이닝 지원
const mockSingle = vi.fn();
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: mockSingle,
  insert: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabase,
}));

import { auth } from '@clerk/nextjs/server';

// 헬퍼 함수
function createRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options);
}

describe('Barcode Foods API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
  });

  describe('GET /api/nutrition/foods/barcode/[code]', () => {
    it('비인증 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createRequest('http://localhost/api/nutrition/foods/barcode/8801234567890');
      const response = await GET(request, { params: Promise.resolve({ code: '8801234567890' }) });

      expect(response.status).toBe(401);
    });

    it('잘못된 바코드 형식은 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/nutrition/foods/barcode/abc');
      const response = await GET(request, { params: Promise.resolve({ code: 'abc' }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid barcode');
    });

    it('너무 짧은 바코드는 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/nutrition/foods/barcode/1234');
      const response = await GET(request, { params: Promise.resolve({ code: '1234' }) });

      expect(response.status).toBe(400);
    });

    it('존재하는 바코드는 식품 정보를 반환한다', async () => {
      const mockFood = {
        id: 'food-1',
        barcode: '8801234567890',
        name: '신라면',
        brand: '농심',
        serving_size: 120,
        serving_unit: 'g',
        calories: 500,
        protein: 10,
        carbs: 80,
        fat: 16,
        fiber: 3,
        sodium: 1790,
        sugar: 4,
        category: '라면',
        source: 'manual',
        verified: true,
      };

      mockSingle.mockResolvedValueOnce({ data: mockFood, error: null });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode/8801234567890');
      const response = await GET(request, { params: Promise.resolve({ code: '8801234567890' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.found).toBe(true);
      expect(data.food.name).toBe('신라면');
      expect(data.food.barcode).toBe('8801234567890');
    });

    it('존재하지 않는 바코드는 found: false를 반환한다', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode/9999999999999');
      const response = await GET(request, { params: Promise.resolve({ code: '9999999999999' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.found).toBe(false);
      expect(data.barcode).toBe('9999999999999');
      expect(data.message).toContain('등록되지 않은');
    });

    it('8자리 바코드(EAN-8)도 허용한다', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode/12345678');
      const response = await GET(request, { params: Promise.resolve({ code: '12345678' }) });

      expect(response.status).toBe(200);
    });

    it('14자리 바코드(ITF-14)도 허용한다', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode/12345678901234');
      const response = await GET(request, { params: Promise.resolve({ code: '12345678901234' }) });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/nutrition/foods/barcode (History)', () => {
    it('비인증 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createRequest('http://localhost/api/nutrition/foods/barcode');
      const response = await GET_HISTORY(request);

      expect(response.status).toBe(401);
    });

    it('스캔 이력을 반환한다', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          scanned_at: '2025-01-15T10:00:00Z',
          barcode_foods: {
            id: 'food-1',
            barcode: '8801234567890',
            name: '신라면',
            brand: '농심',
            serving_size: 120,
            calories: 500,
            protein: 10,
            carbs: 80,
            fat: 16,
          },
        },
      ];

      mockSupabase.limit.mockResolvedValueOnce({ data: mockHistory, error: null });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode');
      const response = await GET_HISTORY(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.history).toHaveLength(1);
      expect(data.history[0].barcodeFood.name).toBe('신라면');
    });

    it('limit 파라미터가 적용된다', async () => {
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode?limit=5');
      await GET_HISTORY(request);

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });

    it('limit은 최대 50으로 제한된다', async () => {
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode?limit=100');
      await GET_HISTORY(request);

      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('POST /api/nutrition/foods/barcode', () => {
    it('비인증 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createRequest('http://localhost/api/nutrition/foods/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: '8801234567890', name: '테스트', calories: 100 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('필수 필드 누락 시 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/nutrition/foods/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: '8801234567890' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing required fields');
    });

    it('잘못된 바코드 형식은 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/nutrition/foods/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: 'abc', name: '테스트', calories: 100 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid barcode');
    });

    it('중복 바코드는 409를 반환한다', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: '8801234567890',
          name: '테스트',
          calories: 100,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already registered');
    });

    it('새 식품을 성공적으로 등록한다', async () => {
      // 중복 체크 - 없음
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      // 삽입 성공
      const newFood = {
        id: 'new-food-id',
        barcode: '9999999999999',
        name: '새로운 식품',
        brand: '테스트 브랜드',
        serving_size: 100,
        serving_unit: 'g',
        calories: 200,
        protein: 5,
        carbs: 30,
        fat: 8,
        source: 'crowdsourced',
        verified: false,
      };
      mockSingle.mockResolvedValueOnce({ data: newFood, error: null });

      const request = createRequest('http://localhost/api/nutrition/foods/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: '9999999999999',
          name: '새로운 식품',
          brand: '테스트 브랜드',
          servingSize: 100,
          calories: 200,
          protein: 5,
          carbs: 30,
          fat: 8,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.food.name).toBe('새로운 식품');
      expect(data.food.source).toBe('crowdsourced');
    });
  });
});
