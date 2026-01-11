/**
 * 제품 조회 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupProduct, parseIngredientsText } from '@/lib/scan/product-lookup';

// Supabase 모킹
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('parseIngredientsText', () => {
  it('쉼표로 구분된 성분 파싱', () => {
    const text = 'Water, Glycerin, Niacinamide, Hyaluronic Acid';
    const result = parseIngredientsText(text);

    expect(result).toHaveLength(4);
    // 대문자로 변환되고 concentration, nameKo 포함
    expect(result[0].inciName).toBe('WATER');
    expect(result[0].order).toBe(1);
    expect(result[0].concentration).toBe('high'); // 처음 5개는 high
    expect(result[1].inciName).toBe('GLYCERIN');
    expect(result[2].inciName).toBe('NIACINAMIDE');
    expect(result[3].inciName).toBe('HYALURONIC ACID');
  });

  it('빈 문자열은 빈 배열 반환', () => {
    expect(parseIngredientsText('')).toEqual([]);
    // 공백만 있는 경우도 빈 배열
    const result = parseIngredientsText('   ');
    expect(result).toHaveLength(0);
  });

  it('성분 앞뒤 공백 제거', () => {
    const text = '  Water  ,  Glycerin  ,  Niacinamide  ';
    const result = parseIngredientsText(text);

    expect(result[0].inciName).toBe('WATER');
    expect(result[1].inciName).toBe('GLYCERIN');
    expect(result[2].inciName).toBe('NIACINAMIDE');
  });

  it('단일 성분 처리', () => {
    const text = 'Water';
    const result = parseIngredientsText(text);

    expect(result).toHaveLength(1);
    expect(result[0].inciName).toBe('WATER');
    expect(result[0].order).toBe(1);
  });

  it('빈 항목 필터링', () => {
    const text = 'Water, , Glycerin, , Niacinamide';
    const result = parseIngredientsText(text);

    expect(result).toHaveLength(3);
    expect(result[0].inciName).toBe('WATER');
    expect(result[1].inciName).toBe('GLYCERIN');
    expect(result[2].inciName).toBe('NIACINAMIDE');
  });
});

describe('lookupProduct', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // fetch 모킹
    global.fetch = vi.fn();
  });

  it('Mock 데이터에서 제품 찾기', async () => {
    const result = await lookupProduct('8809598453234');

    expect(result.found).toBe(true);
    expect(result.product).toBeDefined();
    expect(result.product?.brand).toBe('SOME BY MI');
    expect(result.product?.name).toContain('AHA BHA PHA');
    expect(result.source).toBe('internal_db');
  });

  it('두 번째 Mock 제품 찾기', async () => {
    const result = await lookupProduct('8809530069233');

    expect(result.found).toBe(true);
    expect(result.product).toBeDefined();
    expect(result.product?.brand).toBe('COSRX');
    expect(result.product?.name).toContain('Snail');
    expect(result.source).toBe('internal_db');
  });

  it('없는 제품은 not found', async () => {
    // Open Beauty Facts API가 빈 결과 반환
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 0 }),
    });

    const result = await lookupProduct('0000000000000');

    expect(result.found).toBe(false);
    expect(result.product).toBeUndefined();
  });

  it('Open Beauty Facts 연동 테스트', async () => {
    // Mock API 응답
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 1,
          product: {
            product_name: 'Test Product',
            brands: 'Test Brand',
            categories_tags: ['en:skincare'],
            image_url: 'https://example.com/image.jpg',
            ingredients_text: 'Water, Glycerin',
          },
        }),
    });

    const result = await lookupProduct('9999999999999');

    expect(result.found).toBe(true);
    expect(result.source).toBe('open_beauty_facts');
    expect(result.product?.name).toBe('Test Product');
    expect(result.product?.brand).toBe('Test Brand');
  });

  it('빈 바코드 처리', async () => {
    const result = await lookupProduct('');

    expect(result.found).toBe(false);
  });
});
