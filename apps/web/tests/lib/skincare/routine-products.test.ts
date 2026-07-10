import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * 루틴 스텝 → 실제 제품(cosmetic_products) 추천 (ADR-117 후속 수리, 2026-07-10)
 *
 * affiliate_products(0건)로 전멸하던 루틴 제품 추천을 cosmetic_products 정본으로 옮겼다.
 * 검증: 카테고리 매핑·대응 없는 스텝 빈 배열·썸네일 배선·복수 반환·적합도 정렬.
 */

// cosmetic_products 조회를 mock — .from().select().eq().eq().order().limit()
const rows: Array<Record<string, unknown>> = [];
const limitMock = vi.fn(async () => ({ data: rows, error: null }));
const builder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: limitMock,
};
const fromMock = vi.fn((_table: string) => builder);
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));

import { getRoutineProductsByCategory } from '@/lib/skincare/routine-products';

function setRows(newRows: Array<Record<string, unknown>>): void {
  rows.length = 0;
  rows.push(...newRows);
}

describe('getRoutineProductsByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRows([]);
  });

  it('대응 DB 카테고리가 없는 스텝(oil/spot_treatment)은 조회 없이 빈 배열', async () => {
    const oil = await getRoutineProductsByCategory('oil', 'dry', []);
    const spot = await getRoutineProductsByCategory('spot_treatment', 'oily', []);
    expect(oil).toEqual([]);
    expect(spot).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('cream 스텝은 moisturizer 카테고리를 조회한다', async () => {
    setRows([
      {
        id: 'm1',
        name: '크림A',
        brand: 'B',
        category: 'moisturizer',
        price_krw: 20000,
        image_url: 'https://x/m1.jpg',
        rating: 4.5,
        skin_types: ['dry'],
        concerns: ['hydration'],
      },
    ]);
    await getRoutineProductsByCategory('cream', 'dry', ['dryness']);
    expect(fromMock).toHaveBeenCalledWith('cosmetic_products');
    // 두 번째 .eq 호출이 category='moisturizer'
    expect(builder.eq).toHaveBeenCalledWith('category', 'moisturizer');
  });

  it('image_url을 thumbnailUrl로 배선하고 내부 상세로 링크한다', async () => {
    setRows([
      {
        id: 'p1',
        name: '토너A',
        brand: '브랜드',
        category: 'toner',
        price_krw: 15000,
        image_url: 'https://cdn/p1.jpg',
        rating: 4.2,
        skin_types: ['combination'],
        concerns: ['hydration'],
      },
    ]);
    const [product] = await getRoutineProductsByCategory('toner', 'combination', []);
    expect(product.thumbnailUrl).toBe('https://cdn/p1.jpg');
    expect(product.imageUrl).toBe('https://cdn/p1.jpg');
    expect(product.affiliateUrl).toBe('/beauty/p1');
    expect(product.priceKrw).toBe(15000);
  });

  it('최대 limit개까지 복수 제품을 반환하고 적합도(피부타입·가격) 순 정렬한다', async () => {
    setRows([
      // 평점 동일 — 피부타입 일치 + 저가일수록 상위
      {
        id: 'a',
        name: '세럼A',
        brand: 'B',
        category: 'serum',
        price_krw: 200000,
        image_url: null,
        rating: 4.0,
        skin_types: [],
        concerns: [],
      },
      {
        id: 'b',
        name: '세럼B',
        brand: 'B',
        category: 'serum',
        price_krw: 20000,
        image_url: null,
        rating: 4.0,
        skin_types: ['dry'],
        concerns: [],
      },
      {
        id: 'c',
        name: '세럼C',
        brand: 'B',
        category: 'serum',
        price_krw: 50000,
        image_url: null,
        rating: 4.0,
        skin_types: [],
        concerns: [],
      },
      {
        id: 'd',
        name: '세럼D',
        brand: 'B',
        category: 'serum',
        price_krw: 90000,
        image_url: null,
        rating: 4.0,
        skin_types: [],
        concerns: [],
      },
    ]);
    const result = await getRoutineProductsByCategory('serum', 'dry', [], 3);
    expect(result).toHaveLength(3);
    // b: 40 + 30(피부) + 15(저가) = 85 (최상위)
    expect(result[0].id).toBe('b');
    // a: 40 - 10(초고가) = 30 (최하위 → 상위 3에서 탈락)
    expect(result.map((p) => p.id)).not.toContain('a');
  });

  it('조회 결과가 없으면 빈 배열', async () => {
    setRows([]);
    const result = await getRoutineProductsByCategory('serum', 'normal', []);
    expect(result).toEqual([]);
  });
});
