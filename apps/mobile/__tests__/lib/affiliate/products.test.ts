/**
 * 어필리에이트 제품 Repository 테스트
 * @description DB 조회 함수 단위 테스트
 */

import {
  getAffiliateProducts,
  getAffiliateProductById,
  getAffiliateProductsByPartner,
  getRecommendedProductsBySkin,
  getRecommendedProductsByColor,
  getRecommendedProductsByBodyType,
  searchAffiliateProducts,
  getPopularAffiliateProducts,
  getProductsByCategory,
} from '@/lib/affiliate/products';
import type {
  AffiliateProductFilter,
  AffiliateProductRow,
} from '@/lib/affiliate/types';
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

const createMockSupabase = (
  queryBuilder: ReturnType<typeof createMockQueryBuilder>
) =>
  ({
    from: jest.fn(() => queryBuilder),
  }) as unknown as SupabaseClient;

describe('getAffiliateProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('제품 목록을 성공적으로 조회해야 함', async () => {
    const mockProducts = [
      createMockProductRow(),
      createMockProductRow({ id: 'product_2' }),
    ];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getAffiliateProducts(mockSupabase);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('product_1');
    expect(mockSupabase.from).toHaveBeenCalledWith('affiliate_products');
  });

  it('카테고리 필터를 적용해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const filter: AffiliateProductFilter = { category: 'makeup' };
    await getAffiliateProducts(mockSupabase, filter);

    expect(queryBuilder.eq).toHaveBeenCalledWith('category', 'makeup');
  });

  it('inStockOnly 필터를 적용해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const filter: AffiliateProductFilter = { inStockOnly: true };
    await getAffiliateProducts(mockSupabase, filter);

    expect(queryBuilder.eq).toHaveBeenCalledWith('is_in_stock', true);
  });

  it('price_asc 정렬 옵션을 적용해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    await getAffiliateProducts(mockSupabase, undefined, 'price_asc');

    expect(queryBuilder.order).toHaveBeenCalledWith('price_krw', {
      ascending: true,
      nullsFirst: false,
    });
  });

  it('DB 오류 시 빈 배열을 반환해야 함', async () => {
    const queryBuilder = createMockQueryBuilder(null, { message: 'DB error' });
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getAffiliateProducts(mockSupabase);

    expect(result).toEqual([]);
  });

  it('가격 범위 필터를 적용해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const filter: AffiliateProductFilter = { minPrice: 10000, maxPrice: 50000 };
    await getAffiliateProducts(mockSupabase, filter);

    expect(queryBuilder.gte).toHaveBeenCalledWith('price_krw', 10000);
    expect(queryBuilder.lte).toHaveBeenCalledWith('price_krw', 50000);
  });

  it('기본 정렬은 rating 내림차순이어야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    await getAffiliateProducts(mockSupabase);

    expect(queryBuilder.order).toHaveBeenCalledWith('rating', {
      ascending: false,
      nullsFirst: false,
    });
  });
});

describe('getAffiliateProductById', () => {
  it('ID로 제품을 조회해야 함', async () => {
    const mockProduct = createMockProductRow();
    const queryBuilder = createMockQueryBuilder([mockProduct]);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getAffiliateProductById(mockSupabase, 'product_1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('product_1');
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'product_1');
  });

  it('존재하지 않는 제품은 null을 반환해야 함', async () => {
    const queryBuilder = createMockQueryBuilder([]);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getAffiliateProductById(mockSupabase, 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('getAffiliateProductsByPartner', () => {
  it('파트너 이름으로 제품을 조회해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    // 파트너 조회 + 제품 조회 2단계
    const partnerQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() =>
        Promise.resolve({ data: { id: 'partner_uuid' }, error: null })
      ),
    };
    const productQueryBuilder = createMockQueryBuilder(mockProducts);

    let callCount = 0;
    const mockSupabase = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return partnerQueryBuilder;
        return productQueryBuilder;
      }),
    } as unknown as SupabaseClient;

    const result = await getAffiliateProductsByPartner(mockSupabase, 'coupang');

    expect(result).toHaveLength(1);
    expect(partnerQueryBuilder.eq).toHaveBeenCalledWith('name', 'coupang');
  });

  it('파트너를 찾지 못하면 빈 배열을 반환해야 함', async () => {
    const partnerQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() =>
        Promise.resolve({ data: null, error: { message: 'Not found' } })
      ),
    };

    const mockSupabase = {
      from: jest.fn(() => partnerQueryBuilder),
    } as unknown as SupabaseClient;

    const result = await getAffiliateProductsByPartner(mockSupabase, 'unknown');

    expect(result).toEqual([]);
  });
});

describe('getRecommendedProductsBySkin', () => {
  it('피부 타입으로 제품을 추천해야 함', async () => {
    const mockProducts = [
      createMockProductRow({ skin_types: ['dry', 'sensitive'] }),
    ];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getRecommendedProductsBySkin(mockSupabase, 'dry');

    expect(result).toHaveLength(1);
    expect(queryBuilder.contains).toHaveBeenCalledWith('skin_types', ['dry']);
  });

  it('피부 고민으로 필터링해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    await getRecommendedProductsBySkin(mockSupabase, 'oily', ['acne', 'pore']);

    expect(queryBuilder.overlaps).toHaveBeenCalledWith('skin_concerns', [
      'acne',
      'pore',
    ]);
  });

  it('결과 개수를 제한해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    await getRecommendedProductsBySkin(mockSupabase, 'normal', undefined, 5);

    expect(queryBuilder.limit).toHaveBeenCalledWith(5);
  });
});

describe('getRecommendedProductsByColor', () => {
  it('퍼스널 컬러로 제품을 추천해야 함', async () => {
    const mockProducts = [
      createMockProductRow({ personal_colors: ['spring_warm'] }),
    ];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getRecommendedProductsByColor(
      mockSupabase,
      'spring_warm'
    );

    expect(result).toHaveLength(1);
    expect(queryBuilder.contains).toHaveBeenCalledWith('personal_colors', [
      'spring_warm',
    ]);
  });

  it('카테고리로 추가 필터링해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    await getRecommendedProductsByColor(mockSupabase, 'summer_cool', 'makeup');

    expect(queryBuilder.eq).toHaveBeenCalledWith('category', 'makeup');
  });
});

describe('getRecommendedProductsByBodyType', () => {
  it('체형으로 제품을 추천해야 함', async () => {
    const mockProducts = [createMockProductRow({ body_types: ['straight'] })];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getRecommendedProductsByBodyType(
      mockSupabase,
      'straight'
    );

    expect(result).toHaveLength(1);
    expect(queryBuilder.contains).toHaveBeenCalledWith('body_types', [
      'straight',
    ]);
  });
});

describe('searchAffiliateProducts', () => {
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
});

describe('getPopularAffiliateProducts', () => {
  it('리뷰 수 기준 내림차순으로 제품을 조회해야 함', async () => {
    const mockProducts = [
      createMockProductRow({ review_count: 200 }),
      createMockProductRow({ id: 'product_2', review_count: 100 }),
    ];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getPopularAffiliateProducts(mockSupabase);

    expect(result).toHaveLength(2);
    expect(queryBuilder.order).toHaveBeenCalledWith('review_count', {
      ascending: false,
      nullsFirst: false,
    });
  });

  it('카테고리로 필터링해야 함', async () => {
    const mockProducts = [createMockProductRow()];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    await getPopularAffiliateProducts(mockSupabase, 'skincare');

    expect(queryBuilder.eq).toHaveBeenCalledWith('category', 'skincare');
  });
});

describe('getProductsByCategory', () => {
  it('카테고리별 제품을 조회해야 함', async () => {
    const mockProducts = [createMockProductRow({ category: 'makeup' })];
    const queryBuilder = createMockQueryBuilder(mockProducts);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getProductsByCategory(mockSupabase, 'makeup');

    expect(result).toHaveLength(1);
  });

  it('DB에 제품이 없으면 Mock 데이터를 반환해야 함', async () => {
    const queryBuilder = createMockQueryBuilder([]);
    const mockSupabase = createMockSupabase(queryBuilder);

    const result = await getProductsByCategory(mockSupabase, 'skincare');

    // Mock Fallback 테스트
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].partnerId).toBe('mock');
  });
});

describe('mapProductRow', () => {
  it('DB 행을 AffiliateProduct로 변환해야 함', async () => {
    const mockRow = createMockProductRow({
      skin_types: ['dry', 'normal'],
      personal_colors: ['spring_warm', 'autumn_warm'],
      body_types: ['straight'],
      direct_url: 'https://direct.url/product',
    });
    const queryBuilder = createMockQueryBuilder([mockRow]);
    const mockSupabase = createMockSupabase(queryBuilder);

    const [result] = await getAffiliateProducts(mockSupabase);

    expect(result.skinTypes).toEqual(['dry', 'normal']);
    expect(result.personalColors).toEqual(['spring_warm', 'autumn_warm']);
    expect(result.bodyTypes).toEqual(['straight']);
    expect(result.productUrl).toBe(mockRow.direct_url);
    expect(result.reviewCount).toBe(mockRow.review_count);
    expect(result.price).toBe(mockRow.price_krw);
  });

  it('null 필드를 undefined로 변환해야 함', async () => {
    const mockRow = createMockProductRow({
      brand: null,
      description: null,
      image_url: null,
    });
    const queryBuilder = createMockQueryBuilder([mockRow]);
    const mockSupabase = createMockSupabase(queryBuilder);

    const [result] = await getAffiliateProducts(mockSupabase);

    expect(result.brand).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.imageUrl).toBeUndefined();
  });

  it('isAvailable은 is_in_stock && is_active의 결과여야 함', async () => {
    const mockRowAvailable = createMockProductRow({
      is_in_stock: true,
      is_active: true,
    });

    const queryBuilder = createMockQueryBuilder([mockRowAvailable]);
    const mockSupabase = createMockSupabase(queryBuilder);

    const [resultAvailable] = await getAffiliateProducts(mockSupabase);
    expect(resultAvailable.isAvailable).toBe(true);
  });
});
