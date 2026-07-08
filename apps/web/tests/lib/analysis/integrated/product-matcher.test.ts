/**
 * 통합 큐레이션 제품 매처 테스트
 *
 * @see lib/analysis/integrated/internal/product-matcher.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 왜: DB(getCosmeticProducts)를 목킹하고, 정렬(addMatchInfoToProducts)은 실제 로직 사용
const getCosmeticProducts = vi.fn();

vi.mock('@/lib/products', async () => {
  const actual = await vi.importActual<typeof import('@/lib/products')>('@/lib/products');
  return {
    ...actual,
    getCosmeticProducts: (...args: unknown[]) => getCosmeticProducts(...args),
  };
});

import { fetchCurationProducts } from '@/lib/analysis/integrated/internal/product-matcher';

function product(over: Record<string, unknown>) {
  return {
    id: 'id',
    name: '제품',
    brand: '브랜드',
    category: 'serum',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

describe('fetchCurationProducts', () => {
  beforeEach(() => {
    getCosmeticProducts.mockReset();
  });

  it('데이터 없으면 빈 배열 (링크 카드 폴백)', async () => {
    getCosmeticProducts.mockResolvedValue([]);
    const r = await fetchCurationProducts({ skinType: 'oily', gender: 'neutral' });
    expect(r).toEqual([]);
  });

  it('남성이면 메이크업 제품 제외, 스킨케어만 반환', async () => {
    getCosmeticProducts.mockResolvedValue([
      product({ id: 'lip', name: '립틴트', category: 'makeup' }),
      product({ id: 'serum', name: '세럼', category: 'serum', skinTypes: ['oily'] }),
    ]);
    const r = await fetchCurationProducts({ skinType: 'oily', gender: 'male' });
    expect(r.some((p) => p.id === 'lip')).toBe(false);
    expect(r.some((p) => p.id === 'serum')).toBe(true);
  });

  it('여성이면 메이크업 제품 포함 가능', async () => {
    getCosmeticProducts.mockResolvedValue([
      product({ id: 'lip', name: '립틴트', category: 'makeup', personalColorSeasons: ['Spring'] }),
    ]);
    const r = await fetchCurationProducts({
      skinType: 'oily',
      personalColorSeason: 'spring',
      gender: 'female',
    });
    expect(r.some((p) => p.id === 'lip')).toBe(true);
  });

  it('가격·이름·브랜드를 매핑하고 최대 3개로 제한', async () => {
    getCosmeticProducts.mockResolvedValue([
      product({ id: 'a', name: 'A', brand: '브A', category: 'serum', priceKrw: 15000 }),
      product({ id: 'b', name: 'B', category: 'toner', priceKrw: 20000 }),
      product({ id: 'c', name: 'C', category: 'moisturizer' }),
      product({ id: 'd', name: 'D', category: 'cleanser' }),
    ]);
    const r = await fetchCurationProducts({ gender: 'neutral' });
    expect(r.length).toBeLessThanOrEqual(3);
    const a = r.find((p) => p.id === 'a');
    expect(a?.priceKrw).toBe(15000);
    expect(a?.name).toBe('A');
    expect(a?.brand).toBe('브A');
  });

  it('DB 조회가 throw해도 빈 배열 (결과 페이지 보호)', async () => {
    getCosmeticProducts.mockRejectedValue(new Error('db down'));
    const r = await fetchCurationProducts({ skinType: 'dry', gender: 'neutral' });
    expect(r).toEqual([]);
  });
});
