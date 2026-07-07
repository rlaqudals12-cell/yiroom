/**
 * 데일리 캡슐 솔루션 → 실제 제품 연결 테스트
 * @see lib/capsule/solution-products.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachSolutionProducts } from '@/lib/capsule/solution-products';
import type { BeautyProfile, DailyItem } from '@/types/capsule';

// Supabase mock — 체이닝 쿼리 빌더
const mockRows: unknown[] = [];
let mockError: { message: string } | null = null;

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        order: () => builder,
        limit: () => Promise.resolve({ data: mockRows, error: mockError }),
      };
      return builder;
    },
  }),
}));

function makeProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    personalColor: { season: 'summer', subType: 'cool', palette: [] },
    skin: { type: 'combination', concerns: [], scores: {} },
    hair: { type: 'wavy', scalp: 'oily', concerns: [] },
    completedModules: ['PC', 'S', 'H'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    ...overrides,
  };
}

function makeItem(overrides: Partial<DailyItem>): DailyItem {
  return {
    id: 'item-1',
    moduleCode: 'S',
    name: '토너',
    reason: '',
    compatibilityScore: 0,
    isChecked: false,
    ...overrides,
  };
}

function makeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'prod-1',
    name: '테스트 토너',
    brand: '브랜드A',
    category: 'toner',
    subcategory: null,
    price_krw: 15000,
    image_url: null,
    rating: 4.5,
    skin_types: ['combination'],
    personal_color_seasons: null,
    hair_types: null,
    scalp_types: null,
    ...overrides,
  };
}

beforeEach(() => {
  mockRows.length = 0;
  mockError = null;
});

describe('attachSolutionProducts', () => {
  it('피부 스텝 카테고리에 맞는 제품을 부착한다', async () => {
    mockRows.push(makeRow());
    const items = [makeItem({ category: 'toner' })];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct).toBeDefined();
    expect(items[0].solutionProduct?.brand).toBe('브랜드A');
    expect(items[0].solutionProduct?.priceKrw).toBe(15000);
  });

  it('category가 없는 아이템은 건드리지 않는다', async () => {
    mockRows.push(makeRow());
    const items = [makeItem({ category: undefined })];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct).toBeUndefined();
  });

  it('대응 카테고리가 없으면(oil 스텝) 지어내지 않는다', async () => {
    mockRows.push(makeRow());
    const items = [makeItem({ category: 'oil' })];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct).toBeUndefined();
  });

  it('오일 클렌저 스텝에는 오일 계열 서브카테고리만 붙는다', async () => {
    mockRows.push(
      makeRow({ id: 'p-water', category: 'cleanser', subcategory: 'micellar', rating: 5.0 }),
      makeRow({ id: 'p-oil', category: 'cleanser', subcategory: 'cleansing-oil', rating: 4.0 })
    );
    const items = [makeItem({ category: 'cleanser', name: '오일 클렌저' })];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct?.id).toBe('p-oil');
  });

  it('일반 클렌저(아침 세안) 스텝에는 오일/밤이 제외된다', async () => {
    mockRows.push(
      makeRow({ id: 'p-oil', category: 'cleanser', subcategory: 'cleansing-oil', rating: 5.0 }),
      makeRow({ id: 'p-foam', category: 'cleanser', subcategory: 'foam', rating: 4.0 })
    );
    const items = [makeItem({ category: 'cleanser', name: '클렌저' })];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct?.id).toBe('p-foam');
  });

  it('색조(립)는 내 시즌과 다른 시즌 태깅 제품을 제외한다', async () => {
    mockRows.push(
      makeRow({
        id: 'p-winter',
        category: 'makeup',
        subcategory: 'lip',
        personal_color_seasons: ['Winter'],
        rating: 5.0,
      }),
      makeRow({
        id: 'p-summer',
        category: 'makeup',
        subcategory: 'lip',
        personal_color_seasons: ['Summer'],
        rating: 4.0,
      })
    );
    const items = [makeItem({ moduleCode: 'M', category: 'lip', name: '시즌 컬러 립 포인트' })];

    await attachSolutionProducts(items, makeProfile()); // season: summer

    expect(items[0].solutionProduct?.id).toBe('p-summer');
  });

  it('가격 접근성 가산 — 평점이 같으면 저가를 선호한다', async () => {
    mockRows.push(
      makeRow({ id: 'p-luxury', price_krw: 580000, rating: 4.8 }),
      makeRow({ id: 'p-budget', price_krw: 18000, rating: 4.5 })
    );
    const items = [makeItem({ category: 'toner' })];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct?.id).toBe('p-budget');
  });

  it('아이템 간 같은 제품을 중복 부착하지 않는다', async () => {
    mockRows.push(makeRow({ id: 'only-one' }));
    const items = [
      makeItem({ id: 'i1', category: 'toner' }),
      makeItem({ id: 'i2', category: 'toner' }),
    ];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct?.id).toBe('only-one');
    expect(items[1].solutionProduct).toBeUndefined();
  });

  it('name이 brand로 시작하면 중복을 제거해 표시명을 만든다', async () => {
    mockRows.push(makeRow({ name: '브랜드A 수분 토너', brand: '브랜드A' }));
    const items = [makeItem({ category: 'toner' })];

    await attachSolutionProducts(items, makeProfile());

    expect(items[0].solutionProduct?.name).toBe('수분 토너');
  });

  it('쿼리 에러 시 조용히 아무것도 부착하지 않는다', async () => {
    mockError = { message: 'db down' };
    const items = [makeItem({ category: 'toner' })];

    await expect(attachSolutionProducts(items, makeProfile())).resolves.toBeUndefined();
    expect(items[0].solutionProduct).toBeUndefined();
  });
});
