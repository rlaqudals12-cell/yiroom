/**
 * Nutrition Suggest API 테스트
 * /api/nutrition/suggest
 *
 * - POST: AI 식단 추천
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/nutrition/suggest/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({})),
}));

// Mock preferences helpers
vi.mock('@/lib/preferences', () => ({
  getAllergies: vi.fn().mockResolvedValue([]),
  getDislikedFoods: vi.fn().mockResolvedValue([]),
}));

import { auth } from '@clerk/nextjs/server';

// 요청 헬퍼
function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/nutrition/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Nutrition Suggest API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
  });

  describe('인증', () => {
    it('비인증 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createRequest({
        goal: 'weight_loss',
        mealType: 'lunch',
        remainingCalories: 500,
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('식사 유형별 추천', () => {
    it('아침 식사 추천을 반환한다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'breakfast',
        remainingCalories: 500,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mealType).toBe('breakfast');
      expect(data.suggestions).toBeDefined();
      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('점심 식사 추천을 반환한다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'lunch',
        remainingCalories: 700,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mealType).toBe('lunch');
      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('저녁 식사 추천을 반환한다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'dinner',
        remainingCalories: 600,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mealType).toBe('dinner');
      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('간식 추천을 반환한다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'snack',
        remainingCalories: 300,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mealType).toBe('snack');
      expect(data.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('목표별 추천', () => {
    it('체중 감량 목표는 저칼로리 음식을 우선 추천한다', async () => {
      const request = createRequest({
        goal: 'weight_loss',
        mealType: 'lunch',
        remainingCalories: 500,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contextMessage).toContain('저칼로리');
    });

    it('근육 증가 목표는 고단백 음식을 우선 추천한다', async () => {
      const request = createRequest({
        goal: 'muscle',
        mealType: 'lunch',
        remainingCalories: 700,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contextMessage).toContain('단백질');
    });

    it('피부 건강 목표는 피부 관련 음식을 추천한다', async () => {
      const request = createRequest({
        goal: 'skin',
        mealType: 'dinner',
        remainingCalories: 600,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contextMessage).toContain('피부');
    });

    it('건강 유지 목표는 균형 잡힌 영양을 추천한다', async () => {
      const request = createRequest({
        goal: 'health',
        mealType: 'lunch',
        remainingCalories: 600,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contextMessage).toContain('건강');
    });
  });

  describe('칼로리 필터링', () => {
    it('남은 칼로리가 적으면 저칼로리 음식만 추천한다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'snack',
        remainingCalories: 150,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // 고구마(130kcal)만 필터됨
      for (const suggestion of data.suggestions) {
        expect(suggestion.calories).toBeLessThanOrEqual(150);
      }
    });
  });

  describe('피부 고민 연동', () => {
    it('피부 고민이 있으면 컨텍스트 메시지에 반영된다', async () => {
      const request = createRequest({
        goal: 'skin',
        mealType: 'dinner',
        remainingCalories: 600,
        skinConcerns: ['hydration', 'wrinkles'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contextMessage).toContain('수분 보충');
    });
  });

  describe('체형 연동', () => {
    it('체형 정보가 있으면 컨텍스트 메시지에 반영된다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'lunch',
        remainingCalories: 600,
        bodyType: 'W',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contextMessage).toContain('웨이브 체형');
    });
  });

  describe('응답 형식', () => {
    it('추천 음식에 필수 필드가 포함된다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'lunch',
        remainingCalories: 700,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const suggestion = data.suggestions[0];
      expect(suggestion).toHaveProperty('name');
      expect(suggestion).toHaveProperty('description');
      expect(suggestion).toHaveProperty('calories');
      expect(suggestion).toHaveProperty('protein');
      expect(suggestion).toHaveProperty('carbs');
      expect(suggestion).toHaveProperty('fat');
      expect(suggestion).toHaveProperty('trafficLight');
      expect(suggestion).toHaveProperty('reason');
      expect(suggestion).toHaveProperty('whereToGet');
      expect(suggestion).toHaveProperty('priceRange');
      expect(suggestion).toHaveProperty('tags');
    });

    it('totalCalories가 계산되어 반환된다', async () => {
      const request = createRequest({
        goal: 'maintain',
        mealType: 'lunch',
        remainingCalories: 700,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(typeof data.totalCalories).toBe('number');
      expect(data.totalCalories).toBeGreaterThan(0);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 JSON은 500을 반환한다', async () => {
      const request = new Request('http://localhost/api/nutrition/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
