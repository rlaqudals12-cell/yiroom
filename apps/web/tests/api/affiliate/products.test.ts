/**
 * 어필리에이트 제품 조회 API 테스트
 * GET /api/affiliate/products
 *
 * @see app/api/affiliate/products/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Affiliate products mock
vi.mock('@/lib/affiliate/products', () => ({
  getAffiliateProducts: vi.fn(),
  getAffiliateProductCount: vi.fn(),
}));

import { GET } from '@/app/api/affiliate/products/route';
import { getAffiliateProducts, getAffiliateProductCount } from '@/lib/affiliate/products';

// Mock 제품 데이터 (AffiliateProduct 타입에 맞춤)
const mockProducts = [
  {
    id: 'prod-1',
    partnerId: 'coupang',
    externalProductId: 'ext-1',
    name: '히알루론산 세럼',
    brand: '라운드랩',
    category: 'cosmetic',
    priceKrw: 25000,
    currency: 'KRW',
    affiliateUrl: 'https://example.com/1',
    rating: 4.5,
    isInStock: true,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod-2',
    partnerId: 'coupang',
    externalProductId: 'ext-2',
    name: '비타민C 앰플',
    brand: '클레어스',
    category: 'cosmetic',
    priceKrw: 18000,
    currency: 'KRW',
    affiliateUrl: 'https://example.com/2',
    rating: 4.3,
    isInStock: true,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

// 헬퍼: 쿼리 파라미터가 있는 NextRequest 생성
function createProductRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/affiliate/products');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url.toString());
}

describe('GET /api/affiliate/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAffiliateProducts).mockResolvedValue(mockProducts);
    vi.mocked(getAffiliateProductCount).mockResolvedValue(2);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('기본 조회', () => {
    it('제품 목록과 페이지네이션을 반환한다', async () => {
      const request = createProductRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.products).toHaveLength(2);
      expect(json.pagination.total).toBe(2);
      expect(json.pagination.limit).toBe(20);
      expect(json.pagination.offset).toBe(0);
      expect(json.pagination.hasMore).toBe(false);
    });

    it('기본 정렬은 rating이다', async () => {
      const request = createProductRequest();
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith({}, 'rating', 20, 0);
    });
  });

  describe('필터', () => {
    it('partnerId 필터를 적용한다', async () => {
      const request = createProductRequest({ partnerId: 'coupang' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ partnerId: 'coupang' }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('category 필터를 적용한다', async () => {
      const request = createProductRequest({ category: 'cosmetic' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'cosmetic' }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('skinTypes 필터를 콤마로 분리한다', async () => {
      const request = createProductRequest({ skinTypes: 'dry,combination' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ skinTypes: ['dry', 'combination'] }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('skinConcerns 필터를 콤마로 분리한다', async () => {
      const request = createProductRequest({ skinConcerns: 'acne,wrinkle' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ skinConcerns: ['acne', 'wrinkle'] }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('personalColors 필터를 적용한다', async () => {
      const request = createProductRequest({ personalColors: 'spring,summer' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ personalColors: ['spring', 'summer'] }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('bodyTypes 필터를 적용한다', async () => {
      const request = createProductRequest({ bodyTypes: 'hourglass,rectangle' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ bodyTypes: ['hourglass', 'rectangle'] }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('가격 범위 필터를 적용한다', async () => {
      const request = createProductRequest({ minPrice: '10000', maxPrice: '50000' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 10000, maxPrice: 50000 }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('minRating 필터를 적용한다', async () => {
      const request = createProductRequest({ minRating: '4.0' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ minRating: 4.0 }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('inStockOnly 필터를 적용한다', async () => {
      const request = createProductRequest({ inStockOnly: 'true' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ inStockOnly: true }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('brand 필터를 적용한다', async () => {
      const request = createProductRequest({ brand: '라운드랩' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.objectContaining({ brand: '라운드랩' }),
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('정렬 및 페이징', () => {
    it('sortBy 파라미터를 전달한다', async () => {
      const request = createProductRequest({ sortBy: 'price_asc' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.any(Object),
        'price_asc',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('limit과 offset을 전달한다', async () => {
      const request = createProductRequest({ limit: '10', offset: '20' });
      await GET(request);

      expect(getAffiliateProducts).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        10,
        20
      );
    });

    it('hasMore가 올바르게 계산된다', async () => {
      vi.mocked(getAffiliateProductCount).mockResolvedValue(50);
      vi.mocked(getAffiliateProducts).mockResolvedValue(mockProducts);

      const request = createProductRequest({ limit: '20', offset: '0' });
      const response = await GET(request);
      const json = await response.json();

      expect(json.pagination.hasMore).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('제품 조회 실패 시 500을 반환한다', async () => {
      vi.mocked(getAffiliateProducts).mockRejectedValue(new Error('DB Error'));

      const request = createProductRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('제품 조회 중 오류가 발생했습니다.');
    });
  });
});
