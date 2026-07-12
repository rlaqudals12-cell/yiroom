/**
 * 어필리에이트 제품 Repository 테스트
 * @description 검색 함수 단위 테스트
 *
 * @note 목록/추천 조회 함수는 cosmetic_products로 재배선되며 삭제됨.
 *   searchAffiliateProducts(검색 브리지)만 보존되어 여기서 테스트한다.
 */

import { searchAffiliateProducts } from '@/lib/affiliate/products';
import type { AffiliateProductRow } from '@/lib/affiliate/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock 제품 데이터 (실제 DB 스키마 반영)
const createMockProductRow = (
  overrides: Partial<AffiliateProductRow> = {}
): AffiliateProductRow => ({
  id: 'product_1',
  partner_id: 'partner_1',
  external_product_id: 'ext_1',
  name: '테스트 제품',
  brand: '테스트 브랜드',
  category: 'skincare',
  subcategory: null,
  price_krw: 25000,
  price_original_krw: 30000,
  currency: 'KRW',
  description: '테스트 설명',
  image_url: 'https://example.com/image.jpg',
  affiliate_url: 'https://www.coupang.com/vp/products/123',
  direct_url: 'https://www.coupang.com/vp/products/123',
  rating: 4.5,
  review_count: 100,
  is_in_stock: true,
  is_active: true,
  skin_types: ['dry', 'normal'],
  skin_concerns: ['hydration'],
  personal_colors: ['spring_warm'],
  body_types: null,
  keywords: ['보습', '수분'],
  tags: ['보습', '수분'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Mock Supabase 쿼리 빌더
const createMockQueryBuilder = (
  data: AffiliateProductRow[] | null,
  error: { message: string } | null = null
) => {
  const mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn(() => Promise.resolve({ data, error })),
    single: jest.fn(() =>
      Promise.resolve({
        data: data && data.length > 0 ? data[0] : null,
        error: data && data.length > 0 ? null : error,
      })
    ),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
  };
  mockBuilder.limit.mockImplementation(() => Promise.resolve({ data, error }));
  return mockBuilder;
};

const createMockSupabase = (queryBuilder: ReturnType<typeof createMockQueryBuilder>) =>
  ({
    from: jest.fn(() => queryBuilder),
  }) as unknown as SupabaseClient;

describe('searchAffiliateProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('키워드로 제품을 검색해야 함', async () => {
    const mockProducts = [createMockProductRow({ name: '보습 크림' })];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await searchAffiliateProducts(mockSupabase, '보습');

    expect(result).toHaveLength(1);
    expect(queryBuilder.or).toHaveBeenCalled();
  });

  it('검색 결과가 없으면 빈 배열을 반환해야 함', async () => {
    const queryBuilder = createMockQueryBuilder([]);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await searchAffiliateProducts(mockSupabase, '없는키워드');

    expect(result).toEqual([]);
  });

  it('DB 오류 시 빈 배열을 반환해야 함', async () => {
    const queryBuilder = createMockQueryBuilder(null, { message: 'DB error' });
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await searchAffiliateProducts(mockSupabase, '보습');

    expect(result).toEqual([]);
  });
});
