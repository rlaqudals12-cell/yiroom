/**
 * 레시피 변형 API 테스트
 */

import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/recipes/[id]/variations/route';
import { NextRequest } from 'next/server';

describe('GET /api/recipes/[id]/variations', () => {
  it('유효한 레시피 ID로 변형 목록을 반환해야 함', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/recipes/recipe-1/variations');
    const mockParams = { params: Promise.resolve({ id: 'recipe-1' }) };

    const response = await GET(mockRequest, mockParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.recipeId).toBe('recipe-1');
    expect(data.data.variations).toBeInstanceOf(Array);
  });

  it('특정 목표로 필터링된 변형을 반환해야 함', async () => {
    const mockRequest = new NextRequest(
      'http://localhost:3000/api/recipes/recipe-1/variations?goal=diet'
    );
    const mockParams = { params: Promise.resolve({ id: 'recipe-1' }) };

    const response = await GET(mockRequest, mockParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    if (data.data.variations.length > 0) {
      expect(data.data.variations.every((v: any) => v.type === 'diet')).toBe(true);
    }
  });

  it('존재하지 않는 레시피 ID는 404 반환', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/recipes/nonexistent/variations');
    const mockParams = { params: Promise.resolve({ id: 'nonexistent' }) };

    const response = await GET(mockRequest, mockParams);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('찾을 수 없습니다');
  });

  it('유효하지 않은 목표는 400 반환', async () => {
    const mockRequest = new NextRequest(
      'http://localhost:3000/api/recipes/recipe-1/variations?goal=invalid'
    );
    const mockParams = { params: Promise.resolve({ id: 'recipe-1' }) };

    const response = await GET(mockRequest, mockParams);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('유효하지 않은 목표');
  });

  it('모든 목표 타입이 허용되어야 함', async () => {
    const validGoals = ['diet', 'lean', 'bulk', 'allergen_free'];

    for (const goal of validGoals) {
      const mockRequest = new NextRequest(
        `http://localhost:3000/api/recipes/recipe-1/variations?goal=${goal}`
      );
      const mockParams = { params: Promise.resolve({ id: 'recipe-1' }) };

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  });
});
