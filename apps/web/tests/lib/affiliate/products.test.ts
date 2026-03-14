/**
 * 어필리에이트 제품 Repository 테스트
 * @description lib/affiliate/products.ts의 제품 조회, 필터링, 추천 함수 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과를 저장하는 변수
let terminalResult: { data: unknown; error: unknown; count?: number | null } = {
  data: null,
  error: null,
};

// Supabase 체이너블 mock
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.ilike = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.overlaps = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockChain,
}));

vi.mock('@/lib/utils/logger', () => ({
  affiliateLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  getAffiliateProducts,
  getAffiliateProductById,
  getAffiliateProductByExternalId,
  getAffiliateProductsByPartner,
  getRecommendedProductsBySkin,
  getRecommendedProductsByColor,
  getRecommendedProductsByBodyType,
  searchAffiliateProducts,
  getPopularAffiliateProducts,
  getAffiliateProductCount,
} from '@/lib/affiliate/products';

// ============================================================================
// 테스트 데이터
// ============================================================================

const mockProductRow = {
  id: 'prod_001',
  partner_id: 'partner_001',
  external_product_id: 'ext_001',
  name: '순한 보습 크림',
  brand: '이니스프리',
  category: 'skincare',
  subcategory: 'moisturizer',
  description: '건조한 피부를 위한 보습 크림',
  image_url: 'https://example.com/img.jpg',
  image_urls: ['https://example.com/img1.jpg'],
  thumbnail_url: 'https://example.com/thumb.jpg',
  price_krw: 25000,
  price_original_krw: 30000,
  currency: 'KRW',
  affiliate_url: 'https://link.example.com/prod_001',
  direct_url: 'https://example.com/prod_001',
  rating: 4.5,
  review_count: 1200,
  skin_types: ['dry', 'combination'],
  skin_concerns: ['hydration', 'sensitivity'],
  personal_colors: ['spring', 'autumn'],
  body_types: null,
  keywords: ['보습', '크림'],
  tags: ['인기'],
  is_in_stock: true,
  is_active: true,
  last_synced_at: '2026-01-15T10:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

// ============================================================================
// 테스트
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

describe('getAffiliateProducts', () => {
  it('활성 제품 목록을 반환한다', async () => {
    terminalResult = { data: [mockProductRow], error: null };

    const result = await getAffiliateProducts();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('prod_001');
    expect(result[0].name).toBe('순한 보습 크림');
    expect(result[0].priceKrw).toBe(25000);
    expect(result[0].isActive).toBe(true);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    const result = await getAffiliateProducts();

    expect(result).toEqual([]);
  });

  it('필터를 적용한다 - partnerId', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts({ partnerId: 'partner_001' });

    expect(mockChain.eq).toHaveBeenCalledWith('partner_id', 'partner_001');
  });

  it('필터를 적용한다 - category', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts({ category: 'skincare' });

    expect(mockChain.eq).toHaveBeenCalledWith('category', 'skincare');
  });

  it('필터를 적용한다 - brand (부분 매칭)', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts({ brand: '이니스프리' });

    expect(mockChain.ilike).toHaveBeenCalledWith('brand', '%이니스프리%');
  });

  it('필터를 적용한다 - inStockOnly', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts({ inStockOnly: true });

    expect(mockChain.eq).toHaveBeenCalledWith('is_in_stock', true);
  });

  it('필터를 적용한다 - 가격 범위', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts({ minPrice: 10000, maxPrice: 50000 });

    expect(mockChain.gte).toHaveBeenCalledWith('price_krw', 10000);
    expect(mockChain.lte).toHaveBeenCalledWith('price_krw', 50000);
  });

  it('필터를 적용한다 - skinTypes 배열', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts({ skinTypes: ['dry', 'oily'] });

    expect(mockChain.overlaps).toHaveBeenCalledWith('skin_types', ['dry', 'oily']);
  });

  it('정렬 기본값은 rating이다', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts();

    expect(mockChain.order).toHaveBeenCalledWith('rating', {
      ascending: false,
      nullsFirst: false,
    });
  });

  it('price_asc 정렬을 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts(undefined, 'price_asc');

    expect(mockChain.order).toHaveBeenCalledWith('price_krw', {
      ascending: true,
      nullsFirst: false,
    });
  });

  it('newest 정렬을 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts(undefined, 'newest');

    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('페이징을 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getAffiliateProducts(undefined, 'rating', 10, 20);

    expect(mockChain.range).toHaveBeenCalledWith(20, 29);
  });

  it('null 필드를 undefined로 매핑한다', async () => {
    const rowWithNulls = {
      ...mockProductRow,
      brand: null,
      category: null,
      description: null,
      image_url: null,
      thumbnail_url: null,
      price_krw: null,
      price_original_krw: null,
      direct_url: null,
      rating: null,
      review_count: null,
      body_types: null,
      last_synced_at: null,
    };
    terminalResult = { data: [rowWithNulls], error: null };

    const result = await getAffiliateProducts();

    expect(result[0].brand).toBeUndefined();
    expect(result[0].priceKrw).toBeUndefined();
    expect(result[0].rating).toBeUndefined();
    expect(result[0].lastSyncedAt).toBeUndefined();
  });
});

describe('getAffiliateProductById', () => {
  it('제품 ID로 단일 조회한다', async () => {
    terminalResult = { data: mockProductRow, error: null };

    const result = await getAffiliateProductById('prod_001');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('prod_001');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'prod_001');
  });

  it('존재하지 않는 제품은 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Not found' } };

    const result = await getAffiliateProductById('nonexistent');

    expect(result).toBeNull();
  });

  it('비활성 제품은 조회되지 않는다', async () => {
    terminalResult = { data: mockProductRow, error: null };

    await getAffiliateProductById('prod_001');

    expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
  });
});

describe('getAffiliateProductByExternalId', () => {
  it('외부 제품 ID로 조회한다', async () => {
    terminalResult = { data: mockProductRow, error: null };

    const result = await getAffiliateProductByExternalId('partner_001', 'ext_001');

    expect(result).not.toBeNull();
    expect(result!.externalProductId).toBe('ext_001');
    expect(mockChain.eq).toHaveBeenCalledWith('partner_id', 'partner_001');
    expect(mockChain.eq).toHaveBeenCalledWith('external_product_id', 'ext_001');
  });

  it('존재하지 않으면 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Not found' } };

    const result = await getAffiliateProductByExternalId('partner_001', 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('getAffiliateProductsByPartner', () => {
  it('파트너 이름으로 제품을 조회한다', async () => {
    // 첫 번째 호출: 파트너 ID 조회
    // 두 번째 호출: 제품 조회
    // thenable mock이므로 호출 순서로 제어
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: { id: 'partner_001' }, error: null }).then(resolve);
      }
      return Promise.resolve({ data: [mockProductRow], error: null }).then(resolve);
    });

    const result = await getAffiliateProductsByPartner('coupang');

    expect(result).toHaveLength(1);
    expect(result[0].partnerId).toBe('partner_001');
  });

  it('파트너가 존재하지 않으면 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Not found' } };

    const result = await getAffiliateProductsByPartner('coupang');

    expect(result).toEqual([]);
  });
});

describe('getRecommendedProductsBySkin', () => {
  it('피부 타입 기반으로 제품을 추천한다', async () => {
    terminalResult = { data: [mockProductRow], error: null };

    const result = await getRecommendedProductsBySkin('dry');

    expect(result).toHaveLength(1);
    expect(mockChain.contains).toHaveBeenCalledWith('skin_types', ['dry']);
    expect(mockChain.eq).toHaveBeenCalledWith('is_in_stock', true);
  });

  it('피부 고민 필터를 추가 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getRecommendedProductsBySkin('dry', ['hydration', 'wrinkles']);

    expect(mockChain.overlaps).toHaveBeenCalledWith('skin_concerns', ['hydration', 'wrinkles']);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getRecommendedProductsBySkin('dry');

    expect(result).toEqual([]);
  });
});

describe('getRecommendedProductsByColor', () => {
  it('퍼스널 컬러 기반으로 제품을 추천한다', async () => {
    terminalResult = { data: [mockProductRow], error: null };

    const result = await getRecommendedProductsByColor('spring');

    expect(result).toHaveLength(1);
    expect(mockChain.contains).toHaveBeenCalledWith('personal_colors', ['spring']);
  });

  it('카테고리 필터를 추가 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getRecommendedProductsByColor('spring', 'makeup');

    expect(mockChain.eq).toHaveBeenCalledWith('category', 'makeup');
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getRecommendedProductsByColor('spring');

    expect(result).toEqual([]);
  });
});

describe('getRecommendedProductsByBodyType', () => {
  it('체형 기반으로 제품을 추천한다', async () => {
    terminalResult = { data: [mockProductRow], error: null };

    const result = await getRecommendedProductsByBodyType('hourglass');

    expect(result).toHaveLength(1);
    expect(mockChain.contains).toHaveBeenCalledWith('body_types', ['hourglass']);
  });

  it('카테고리 필터를 추가 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getRecommendedProductsByBodyType('hourglass', 'fashion');

    expect(mockChain.eq).toHaveBeenCalledWith('category', 'fashion');
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getRecommendedProductsByBodyType('hourglass');

    expect(result).toEqual([]);
  });
});

describe('searchAffiliateProducts', () => {
  it('키워드로 제품을 검색한다', async () => {
    terminalResult = { data: [mockProductRow], error: null };

    const result = await searchAffiliateProducts('보습');

    expect(result).toHaveLength(1);
    expect(mockChain.or).toHaveBeenCalledWith(
      'name.ilike.%보습%,brand.ilike.%보습%,description.ilike.%보습%'
    );
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await searchAffiliateProducts('테스트');

    expect(result).toEqual([]);
  });

  it('커스텀 limit을 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await searchAffiliateProducts('크림', 5);

    expect(mockChain.limit).toHaveBeenCalledWith(5);
  });
});

describe('getPopularAffiliateProducts', () => {
  it('인기 제품을 리뷰 수 기준으로 정렬한다', async () => {
    terminalResult = { data: [mockProductRow], error: null };

    const result = await getPopularAffiliateProducts();

    expect(result).toHaveLength(1);
    expect(mockChain.order).toHaveBeenCalledWith('review_count', {
      ascending: false,
      nullsFirst: false,
    });
  });

  it('카테고리 필터를 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getPopularAffiliateProducts('skincare');

    expect(mockChain.eq).toHaveBeenCalledWith('category', 'skincare');
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getPopularAffiliateProducts();

    expect(result).toEqual([]);
  });
});

describe('getAffiliateProductCount', () => {
  it('활성 제품 총 개수를 반환한다', async () => {
    terminalResult = { data: null, error: null, count: 150 };

    const result = await getAffiliateProductCount();

    expect(result).toBe(150);
  });

  it('필터를 적용한 개수를 반환한다', async () => {
    terminalResult = { data: null, error: null, count: 30 };

    const result = await getAffiliateProductCount({ category: 'skincare', inStockOnly: true });

    expect(result).toBe(30);
    expect(mockChain.eq).toHaveBeenCalledWith('category', 'skincare');
    expect(mockChain.eq).toHaveBeenCalledWith('is_in_stock', true);
  });

  it('DB 에러 시 0을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' }, count: null };

    const result = await getAffiliateProductCount();

    expect(result).toBe(0);
  });

  it('count가 null이면 0을 반환한다', async () => {
    terminalResult = { data: null, error: null, count: null };

    const result = await getAffiliateProductCount();

    expect(result).toBe(0);
  });
});
