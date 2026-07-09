/**
 * 활성 성분 카테고리 탐지 테스트
 * @see lib/skincare/active-categories.ts
 */
import { describe, it, expect } from 'vitest';
import {
  ACTIVE_INGREDIENT_CATEGORIES,
  detectItemActives,
  detectOwnedActives,
} from '@/lib/skincare/active-categories';
import type { ShelfItem } from '@/lib/scan/product-shelf';

function makeShelf(overrides: Partial<ShelfItem>): ShelfItem {
  return {
    id: 'shelf-1',
    clerkUserId: 'user_1',
    productName: '제품',
    productIngredients: [],
    scannedAt: new Date(),
    scanMethod: 'manual',
    status: 'owned',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ACTIVE_INGREDIENT_CATEGORIES', () => {
  it('should 모든 카테고리에 라벨·별칭 존재', () => {
    for (const [, { label, aliases }] of Object.entries(ACTIVE_INGREDIENT_CATEGORIES)) {
      expect(label).toBeTruthy();
      expect(aliases.length).toBeGreaterThan(0);
    }
  });
});

describe('detectItemActives', () => {
  it('should 제품명에서 레티놀 탐지', () => {
    const item = makeShelf({ productName: '레티놀 0.5% 세럼' });
    expect(detectItemActives(item).has('retinoid')).toBe(true);
  });

  it('should 성분 INCI에서 살리실산(BHA) 탐지', () => {
    const item = makeShelf({
      productName: '모공 토너',
      productIngredients: [{ order: 1, inciName: 'Salicylic Acid' }],
    });
    expect(detectItemActives(item).has('exfoliantBHA')).toBe(true);
  });

  it('should 한 제품에서 복수 활성 탐지 (비타민C + 나이아신 무관 진정)', () => {
    const item = makeShelf({ productName: '비타민C 세라마이드 크림' });
    const actives = detectItemActives(item);
    expect(actives.has('vitaminC')).toBe(true);
    expect(actives.has('soothing')).toBe(true);
  });

  it('should 활성 없는 제품은 빈 세트 (지어내지 않음)', () => {
    const item = makeShelf({ productName: '수분 미스트' });
    expect(detectItemActives(item).size).toBe(0);
  });

  it('should 결정론적 (같은 입력 → 같은 출력)', () => {
    const item = makeShelf({ productName: '글리콜릭 AHA 토너' });
    expect([...detectItemActives(item)]).toEqual([...detectItemActives(item)]);
  });
});

describe('detectOwnedActives', () => {
  it('should 여러 제품의 활성 합집합', () => {
    const items = [
      makeShelf({ id: 'a', productName: '레티놀 크림' }),
      makeShelf({ id: 'b', productName: 'AHA 필링 패드' }),
      makeShelf({ id: 'c', productName: '수분 크림' }),
    ];
    const owned = detectOwnedActives(items);
    expect(owned.has('retinoid')).toBe(true);
    expect(owned.has('exfoliantAHA')).toBe(true);
    expect(owned.size).toBe(2);
  });

  it('should 빈 목록은 빈 세트', () => {
    expect(detectOwnedActives([]).size).toBe(0);
  });
});
