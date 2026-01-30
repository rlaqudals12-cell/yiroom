/**
 * 사이즈 추천 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/smart-matching/size-recommend/route';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

vi.mock('@/lib/smart-matching', () => ({
  getSizeRecommendation: vi.fn(),
  getProductSizeRecommendation: vi.fn(),
}));

import { getSizeRecommendation, getProductSizeRecommendation } from '@/lib/smart-matching';

describe('POST /api/smart-matching/size-recommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('브랜드/카테고리 기반 사이즈 추천을 반환한다', async () => {
    vi.mocked(getSizeRecommendation).mockResolvedValue({
      recommendedSize: 'M',
      confidence: 85,
      basis: 'history',
      alternatives: [
        { size: 'S', note: '타이트한 핏을 원하시면' },
        { size: 'L', note: '여유로운 핏을 원하시면' },
      ],
    });

    const request = new NextRequest('http://localhost/api/smart-matching/size-recommend', {
      method: 'POST',
      body: JSON.stringify({
        brandId: 'nike',
        brandName: 'Nike',
        category: 'top',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.recommendation.recommendedSize).toBe('M');
    expect(data.recommendation.confidence).toBe(85);
  });

  it('제품 ID가 있으면 제품별 추천을 반환한다', async () => {
    vi.mocked(getProductSizeRecommendation).mockResolvedValue({
      recommendedSize: 'L',
      confidence: 75,
      basis: 'brand_chart',
      alternatives: [],
    });

    const request = new NextRequest('http://localhost/api/smart-matching/size-recommend', {
      method: 'POST',
      body: JSON.stringify({
        brandId: 'nike',
        brandName: 'Nike',
        category: 'top',
        productId: 'product-123',
      }),
    });

    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(getProductSizeRecommendation).toHaveBeenCalledWith(
      'test-user-id',
      'product-123',
      'nike',
      'Nike',
      'top'
    );
  });

  it('필수 필드 누락 시 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/smart-matching/size-recommend', {
      method: 'POST',
      body: JSON.stringify({
        brandId: 'nike',
        // brandName, category 누락
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('유효하지 않은 카테고리는 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/smart-matching/size-recommend', {
      method: 'POST',
      body: JSON.stringify({
        brandId: 'nike',
        brandName: 'Nike',
        category: 'invalid_category',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('유효한 카테고리를 허용한다', async () => {
    vi.mocked(getSizeRecommendation).mockResolvedValue({
      recommendedSize: '270',
      confidence: 60,
      basis: 'general',
      alternatives: [],
    });

    const validCategories = ['top', 'bottom', 'outer', 'dress', 'shoes'];

    for (const category of validCategories) {
      const request = new NextRequest('http://localhost/api/smart-matching/size-recommend', {
        method: 'POST',
        body: JSON.stringify({
          brandId: 'nike',
          brandName: 'Nike',
          category,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });
});
