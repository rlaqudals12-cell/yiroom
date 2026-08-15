/**
 * 옷장 등록 메타데이터 계약 테스트
 *
 * 회귀 방지 대상 (2026-08 수리):
 *   모바일 등록 화면이 복수형 키(colors/seasons/occasions)와 이탈 어휘('fall', 'daily')로
 *   저장해 매칭 점수(색·계절·TPO)가 전부 기본값 50에 고정됐던 결함.
 *   "등록한 옷이 실제로 점수를 받는가"를 직접 못박는다.
 */

import { calculateMatchScore } from '../../../lib/inventory/closetMatcher';
import { buildClosetMetadata } from '../../../lib/inventory/closetMetadata';
import type { InventoryItem } from '../../../lib/inventory/types';

/**
 * 등록 직후 아이템 형상 (name은 소재 키워드가 없는 중립값 —
 * 계절 점수가 metadata가 아닌 이름 폴백으로 오르는 것을 배제하기 위함)
 */
function createItem(metadata: Record<string, unknown>): InventoryItem {
  return {
    id: 'item-1',
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: 'bottom',
    name: '브라운 팬츠',
    imageUrl: 'file:///image.jpg',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('buildClosetMetadata — 웹 키 계약', () => {
  it('단수 키(color/season/occasion)로 저장한다', () => {
    const metadata = buildClosetMetadata({
      colors: ['brown'],
      seasons: ['autumn'],
      occasions: ['casual'],
      clothingCategory: 'bottom',
    });

    expect(metadata.color).toEqual(['brown']);
    expect(metadata.season).toEqual(['autumn']);
    expect(metadata.occasion).toEqual(['casual']);

    // 복수형 키는 남지 않아야 한다 (매처가 못 읽는 형상)
    const keys = Object.keys(metadata);
    expect(keys).not.toContain('colors');
    expect(keys).not.toContain('seasons');
    expect(keys).not.toContain('occasions');
  });

  it('영문 대분류를 clothingCategory로 보존한다 (조립기 필터 기준)', () => {
    const metadata = buildClosetMetadata({
      colors: [],
      seasons: [],
      occasions: [],
      clothingCategory: 'outer',
    });

    expect(metadata.clothingCategory).toBe('outer');
  });

  it('빈 메모·미선택 패턴은 저장하지 않는다', () => {
    const metadata = buildClosetMetadata({
      colors: [],
      seasons: [],
      occasions: [],
      clothingCategory: 'top',
      notes: '   ',
    });

    expect(metadata).not.toHaveProperty('notes');
    expect(metadata).not.toHaveProperty('pattern');
  });

  it('메모·패턴이 있으면 보존한다', () => {
    const metadata = buildClosetMetadata({
      colors: [],
      seasons: [],
      occasions: [],
      clothingCategory: 'top',
      pattern: 'stripe',
      notes: '  선물받은 옷  ',
    });

    expect(metadata.pattern).toBe('stripe');
    expect(metadata.notes).toBe('선물받은 옷');
  });
});

describe('등록 아이템 매칭 점수 — 기본값 50 탈출', () => {
  it('등록 경로로 만든 메타데이터는 색·계절 점수가 기본값(50)을 벗어난다', () => {
    const item = createItem(
      buildClosetMetadata({
        colors: ['brown'],
        seasons: ['autumn'],
        occasions: ['casual'],
        clothingCategory: 'bottom',
      })
    );

    const score = calculateMatchScore(item, { personalColor: 'Autumn', season: 'autumn' });

    expect(score.colorScore).toBeGreaterThan(50);
    expect(score.seasonScore).toBeGreaterThan(50);
  });

  it('TPO가 일치하면 총점에 보너스가 반영된다', () => {
    const metadata = buildClosetMetadata({
      colors: ['brown'],
      seasons: ['autumn'],
      occasions: ['casual'],
      clothingCategory: 'bottom',
    });
    const item = createItem(metadata);

    const withOccasion = calculateMatchScore(item, {
      personalColor: 'Autumn',
      season: 'autumn',
      occasion: 'casual',
    });
    const withoutOccasion = calculateMatchScore(item, {
      personalColor: 'Autumn',
      season: 'autumn',
    });

    expect(withOccasion.total).toBeGreaterThan(withoutOccasion.total);
  });

  it('[회귀 증거] 구 형상(복수 키·fall 어휘)은 색·계절 점수가 50에 고정된다', () => {
    // 수리 전 모바일이 저장하던 형상 — 매처가 단수 키를 읽으므로 전부 빈 값 취급됐다
    const legacyItem = createItem({
      colors: ['brown'],
      seasons: ['fall'],
      occasions: ['daily'],
      notes: '',
    });

    const score = calculateMatchScore(legacyItem, { personalColor: 'Autumn', season: 'autumn' });

    expect(score.colorScore).toBe(50);
    expect(score.seasonScore).toBe(50);
  });
});
