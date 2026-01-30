/**
 * 레시피 매칭 API 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/recipes/match/route';
import { NextRequest } from 'next/server';

// Clerk auth mock
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
}));

describe('POST /api/recipes/match', () => {
  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/recipes/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('냉장고 재료 기반 레시피를 추천한다', async () => {
    const req = createRequest({
      pantryItems: ['닭가슴살', '양상추', '토마토'],
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);

    // 첫 번째 결과 검증
    const firstResult = data.results[0];
    expect(firstResult).toHaveProperty('recipe');
    expect(firstResult).toHaveProperty('matchScore');
    expect(firstResult).toHaveProperty('matchedIngredients');
    expect(firstResult).toHaveProperty('missingIngredients');
    expect(firstResult).toHaveProperty('availabilityRate');
  });

  it('영양 목표 필터를 적용한다', async () => {
    const req = createRequest({
      pantryItems: ['닭가슴살', '양상추', '토마토', '오이', '올리브오일'],
      nutritionGoal: 'diet',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // 다이어트 목표 레시피만 반환되어야 함
    for (const result of data.results) {
      expect(result.recipe.nutritionGoals).toContain('diet');
    }
  });

  it('최소 매칭 점수로 필터링한다', async () => {
    const req = createRequest({
      pantryItems: ['닭가슴살'],
      minMatchScore: 50,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);

    for (const result of data.results) {
      expect(result.matchScore).toBeGreaterThanOrEqual(50);
    }
  });

  it('최대 누락 재료 수로 필터링한다', async () => {
    const req = createRequest({
      pantryItems: ['닭가슴살', '양상추'],
      maxMissingIngredients: 2,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);

    for (const result of data.results) {
      expect(result.missingIngredients.length).toBeLessThanOrEqual(2);
    }
  });

  it('조리 시간으로 필터링한다', async () => {
    const req = createRequest({
      pantryItems: ['밥', '계란', '간장'],
      maxCookTime: 15,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);

    for (const result of data.results) {
      expect(result.recipe.cookTime).toBeLessThanOrEqual(15);
    }
  });

  it('유통기한 임박 재료를 고려한다', async () => {
    const req = createRequest({
      pantryItems: ['닭가슴살', '양상추', '토마토', '오이', '올리브오일'],
      expiringItems: ['닭가슴살'],
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata.expiringItemCount).toBe(1);
  });

  it('결과 수를 제한한다', async () => {
    const req = createRequest({
      pantryItems: ['닭가슴살', '밥', '계란'],
      limit: 3,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.length).toBeLessThanOrEqual(3);
  });

  it('잘못된 입력에 대해 400 에러를 반환한다', async () => {
    const req = createRequest({
      pantryItems: 'not-an-array',
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('메타데이터를 포함한다', async () => {
    const req = createRequest({
      pantryItems: ['닭가슴살', '양상추', '토마토'],
      nutritionGoal: 'diet',
      minMatchScore: 40,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.pantryItemCount).toBe(3);
    expect(data.metadata.appliedFilters.nutritionGoal).toBe('diet');
    expect(data.metadata.appliedFilters.minMatchScore).toBe(40);
  });
});
