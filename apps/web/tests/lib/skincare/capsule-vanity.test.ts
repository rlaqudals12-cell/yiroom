/**
 * 캡슐 화장대 (중복 자산 지적) 테스트
 * @see lib/skincare/capsule-vanity.ts
 */
import { describe, it, expect } from 'vitest';
import { findRedundantProducts } from '@/lib/skincare/capsule-vanity';
import type { ShelfItem } from '@/lib/scan/product-shelf';

function makeShelf(overrides: Partial<ShelfItem>): ShelfItem {
  return {
    id: Math.random().toString(36).slice(2),
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

describe('findRedundantProducts', () => {
  it('should 같은 제품 카테고리 3개 이상 → 중복 알림', () => {
    const items = [
      makeShelf({ productName: '수분 토너' }),
      makeShelf({ productName: '진정 토너' }),
      makeShelf({ productName: '데일리 토너' }),
    ];
    const notes = findRedundantProducts(items);
    const tonerNote = notes.find((n) => n.category === '토너');
    expect(tonerNote).toBeDefined();
    expect(tonerNote?.count).toBe(3);
    expect(tonerNote?.message).toContain('참고');
  });

  it('should 같은 제품 카테고리 2개 → 알림 없음 (임계 미만)', () => {
    const items = [
      makeShelf({ productName: '수분 토너' }),
      makeShelf({ productName: '진정 토너' }),
    ];
    expect(findRedundantProducts(items).some((n) => n.category === '토너')).toBe(false);
  });

  it('should 같은 활성 카테고리 2개 이상 → 중복 알림', () => {
    const items = [
      makeShelf({ productName: '레티놀 세럼' }),
      makeShelf({ productName: '레티날 크림' }),
    ];
    const notes = findRedundantProducts(items);
    const retNote = notes.find((n) => n.category === '레티노이드');
    expect(retNote).toBeDefined();
    expect(retNote?.count).toBe(2);
  });

  it('should owned 아닌 제품은 제외', () => {
    const items = [
      makeShelf({ productName: '수분 토너' }),
      makeShelf({ productName: '진정 토너' }),
      makeShelf({ productName: '데일리 토너', status: 'wishlist' }),
    ];
    expect(findRedundantProducts(items).some((n) => n.category === '토너')).toBe(false);
  });

  it('should 중복 없으면 빈 배열', () => {
    const items = [
      makeShelf({ productName: '수분 토너' }),
      makeShelf({ productName: '보습 크림' }),
    ];
    expect(findRedundantProducts(items)).toEqual([]);
  });

  it('should count 내림차순 정렬 (결정론)', () => {
    const items = [
      makeShelf({ productName: '토너 A' }),
      makeShelf({ productName: '토너 B' }),
      makeShelf({ productName: '토너 C' }),
      makeShelf({ productName: '토너 D' }),
      makeShelf({ productName: '레티놀 세럼' }),
      makeShelf({ productName: '레티날 크림' }),
    ];
    const notes = findRedundantProducts(items);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i - 1].count).toBeGreaterThanOrEqual(notes[i].count);
    }
  });
});
