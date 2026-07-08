/**
 * 캡슐 큐레이션 → 실제 제품 연결 테스트
 * @see lib/capsule/curate-products.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachCurateProducts } from '@/lib/capsule/curate-products';
import type { CurateTargetItem } from '@/lib/capsule/curate-products';
import type { BeautyProfile } from '@/types/capsule';

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

function makeItem(overrides: Partial<CurateTargetItem> = {}): CurateTargetItem {
  return {
    id: 'skin-placeholder-0',
    name: '토너로 피부결 정리',
    category: 'toner',
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
    purchase_url: null,
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

describe('attachCurateProducts', () => {
  it('스킨 카테고리에 맞는 실제 제품을 부착한다', async () => {
    mockRows.push(makeRow());
    const items = [makeItem()];

    await attachCurateProducts('skin', items, makeProfile());

    expect(items[0].solutionProduct).toBeDefined();
    expect(items[0].solutionProduct?.brand).toBe('브랜드A');
    expect(items[0].solutionProduct?.priceKrw).toBe(15000);
  });

  it('purchase_url이 있을 때만 purchaseUrl을 부착한다 (가짜 URL 금지)', async () => {
    mockRows.push(makeRow({ purchase_url: 'https://example.com/p/1' }));
    const items = [makeItem()];

    await attachCurateProducts('skin', items, makeProfile());

    expect(items[0].solutionProduct?.purchaseUrl).toBe('https://example.com/p/1');
  });

  it('purchase_url이 없으면 purchaseUrl 필드 자체를 만들지 않는다', async () => {
    mockRows.push(makeRow({ purchase_url: null }));
    const items = [makeItem()];

    await attachCurateProducts('skin', items, makeProfile());

    expect(items[0].solutionProduct).toBeDefined();
    expect(items[0].solutionProduct?.purchaseUrl).toBeUndefined();
  });

  it('대응 카테고리가 없으면(exfoliator) 지어내지 않는다', async () => {
    mockRows.push(makeRow());
    const items = [makeItem({ category: 'exfoliator', name: '각질 케어' })];

    await attachCurateProducts('skin', items, makeProfile());

    expect(items[0].solutionProduct).toBeUndefined();
  });

  it('fashion/personal-color/body 도메인은 행동형 스텝으로 유지한다', async () => {
    mockRows.push(makeRow());
    const fashionItems = [makeItem({ category: 'top', name: '퍼스널 톤 상의 매치' })];
    const pcItems = [makeItem({ category: 'clothing', name: '팔레트 확인' })];
    const bodyItems = [makeItem({ category: 'posture-correction', name: '자세 교정' })];

    await attachCurateProducts('fashion', fashionItems, makeProfile());
    await attachCurateProducts('personal-color', pcItems, makeProfile());
    await attachCurateProducts('body', bodyItems, makeProfile());

    expect(fashionItems[0].solutionProduct).toBeUndefined();
    expect(pcItems[0].solutionProduct).toBeUndefined();
    expect(bodyItems[0].solutionProduct).toBeUndefined();
  });

  it('메이크업 색조(립)는 내 시즌과 다른 시즌 태깅 제품을 제외한다', async () => {
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
    const items = [makeItem({ id: 'makeup-placeholder-2', category: 'lip', name: '시즌 컬러 립' })];

    await attachCurateProducts('makeup', items, makeProfile()); // season: summer

    expect(items[0].solutionProduct?.id).toBe('p-summer');
  });

  it('헤어 도메인은 모발/두피 타입 일치 제품을 우선한다', async () => {
    mockRows.push(
      makeRow({
        id: 'p-mismatch',
        category: 'shampoo',
        rating: 4.8,
        hair_types: ['straight'],
        scalp_types: ['dry'],
      }),
      makeRow({
        id: 'p-match',
        category: 'shampoo',
        rating: 4.5,
        hair_types: ['wavy'],
        scalp_types: ['oily'],
      })
    );
    const items = [makeItem({ id: 'hair-placeholder-0', category: 'shampoo', name: '샴푸' })];

    await attachCurateProducts('hair', items, makeProfile()); // wavy/oily

    expect(items[0].solutionProduct?.id).toBe('p-match');
  });

  it('가격 접근성 가산 — 평점이 비슷하면 저가를 선호한다', async () => {
    mockRows.push(
      makeRow({ id: 'p-luxury', price_krw: 580000, rating: 4.8 }),
      makeRow({ id: 'p-budget', price_krw: 18000, rating: 4.5 })
    );
    const items = [makeItem()];

    await attachCurateProducts('skin', items, makeProfile());

    expect(items[0].solutionProduct?.id).toBe('p-budget');
  });

  it('아이템 간 같은 제품을 중복 부착하지 않는다', async () => {
    mockRows.push(makeRow({ id: 'only-one' }));
    const items = [
      makeItem({ id: 'i1', category: 'toner' }),
      makeItem({ id: 'i2', category: 'toner' }),
    ];

    await attachCurateProducts('skin', items, makeProfile());

    expect(items[0].solutionProduct?.id).toBe('only-one');
    expect(items[1].solutionProduct).toBeUndefined();
  });

  it('name이 brand로 시작하면 중복을 제거해 표시명을 만든다', async () => {
    mockRows.push(makeRow({ name: '브랜드A 수분 토너', brand: '브랜드A' }));
    const items = [makeItem()];

    await attachCurateProducts('skin', items, makeProfile());

    expect(items[0].solutionProduct?.name).toBe('수분 토너');
  });

  it('쿼리 에러 시 조용히 아무것도 부착하지 않는다', async () => {
    mockError = { message: 'db down' };
    const items = [makeItem()];

    await expect(attachCurateProducts('skin', items, makeProfile())).resolves.toBeUndefined();
    expect(items[0].solutionProduct).toBeUndefined();
  });
});
