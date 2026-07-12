/**
 * cosmetic_products 추천/카테고리 조회 헬퍼 테스트
 * 대상: lib/products/repositories/cosmetic.ts
 *   (affiliate_products 재배선으로 신설된 함수들)
 */
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

jest.mock('@/lib/utils/logger', () => ({
  productLogger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import {
  getCosmeticProductsByCategories,
  getCosmeticsBySkinType,
  getCosmeticsByPersonalColor,
} from '@/lib/products/repositories/cosmetic';
import type { CosmeticProductRow } from '@/types/product';

const createRow = (overrides: Partial<CosmeticProductRow> = {}): CosmeticProductRow => ({
  id: 'c1',
  name: '테스트 세럼',
  brand: '브랜드',
  category: 'serum',
  subcategory: null,
  price_range: 'mid',
  price_krw: 20000,
  skin_types: ['dry'],
  concerns: ['hydration'],
  key_ingredients: ['히알루론산'],
  avoid_ingredients: null,
  personal_color_seasons: ['Spring'],
  hair_types: null,
  scalp_types: null,
  face_shapes: null,
  undertones: null,
  image_url: 'https://img/1.jpg',
  purchase_url: null,
  affiliate_url: null,
  affiliate_commission: null,
  rating: 4.6,
  review_count: 30,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// 체이닝 가능 + thenable Mock 쿼리 빌더
// (모든 메서드가 자신을 반환하고, await 시 {data,error}로 resolve → 종단 메서드가 무엇이든 동작)
function createQueryBuilder(
  data: CosmeticProductRow[] | null,
  error: { message: string } | null = null
) {
  const qb: Record<string, jest.Mock> & { then?: unknown } = {};
  ['select', 'eq', 'in', 'overlaps', 'contains', 'order', 'limit', 'gte', 'ilike'].forEach((m) => {
    qb[m] = jest.fn(() => qb);
  });
  (qb as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve({ data, error });
  return qb;
}

describe('getCosmeticProductsByCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('세분류 배열을 .in()으로 조회한다', async () => {
    const qb = createQueryBuilder([createRow()]);
    mockFrom.mockReturnValue(qb);

    const result = await getCosmeticProductsByCategories(['cleanser', 'toner']);

    expect(mockFrom).toHaveBeenCalledWith('cosmetic_products');
    expect(qb.in).toHaveBeenCalledWith('category', ['cleanser', 'toner']);
    expect(result).toHaveLength(1);
    // DB row → CosmeticProduct 변환 확인
    expect(result[0].category).toBe('serum');
    expect(result[0].priceKrw).toBe(20000);
  });

  it('빈 배열이면 전체 조회로 위임한다 (.in 미호출)', async () => {
    const qb = createQueryBuilder([createRow(), createRow({ id: 'c2' })]);
    mockFrom.mockReturnValue(qb);

    const result = await getCosmeticProductsByCategories([]);

    expect(qb.in).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it('DB 오류 시 빈 배열을 반환한다', async () => {
    const qb = createQueryBuilder(null, { message: 'DB error' });
    mockFrom.mockReturnValue(qb);

    const result = await getCosmeticProductsByCategories(['serum']);

    expect(result).toEqual([]);
  });
});

describe('getCosmeticsBySkinType', () => {
  beforeEach(() => jest.clearAllMocks());

  it('skin_types를 overlaps로 매칭한다', async () => {
    const qb = createQueryBuilder([createRow()]);
    mockFrom.mockReturnValue(qb);

    const result = await getCosmeticsBySkinType('dry');

    expect(qb.overlaps).toHaveBeenCalledWith('skin_types', ['dry']);
    expect(result).toHaveLength(1);
  });

  it('concerns가 있으면 함께 overlaps로 좁힌다', async () => {
    const qb = createQueryBuilder([createRow()]);
    mockFrom.mockReturnValue(qb);

    await getCosmeticsBySkinType('oily', ['acne']);

    expect(qb.overlaps).toHaveBeenCalledWith('concerns', ['acne']);
  });

  it('DB 오류 시 빈 배열을 반환한다', async () => {
    const qb = createQueryBuilder(null, { message: 'DB error' });
    mockFrom.mockReturnValue(qb);

    const result = await getCosmeticsBySkinType('normal');

    expect(result).toEqual([]);
  });
});

describe('getCosmeticsByPersonalColor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('personal_color_seasons를 overlaps로 매칭한다', async () => {
    const qb = createQueryBuilder([createRow({ personal_color_seasons: ['Spring'] })]);
    mockFrom.mockReturnValue(qb);

    const result = await getCosmeticsByPersonalColor('Spring');

    expect(qb.overlaps).toHaveBeenCalledWith('personal_color_seasons', ['Spring']);
    expect(result).toHaveLength(1);
  });
});
