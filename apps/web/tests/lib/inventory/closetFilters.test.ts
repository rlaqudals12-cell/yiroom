/**
 * 옷장 목록 필터 테스트 (filterClosetItems)
 *
 * 배경: 옷장 페이지가 카테고리를 `in('sub_category', ['top'])`으로, 시즌을
 * `overlaps('metadata->season', ...)`로 DB에 물어 두 필터가 완전 무동작이었다
 * (한글 sub_category라 항상 0건 / jsonb에 배열 연산자라 쿼리 실패).
 * 클라이언트 정규화 필터로 옮긴 뒤의 계약을 고정한다.
 */

import { describe, it, expect } from 'vitest';
import { filterClosetItems, buildClosetSearchFilter } from '@/lib/inventory/closetFilters';
import type { InventoryItem } from '@/types/inventory';

function createItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: '티셔츠',
    name: '화이트 티셔츠',
    imageUrl: 'https://example.com/a.png',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: { color: ['화이트'], season: ['summer'], occasion: [] },
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

describe('filterClosetItems', () => {
  describe('카테고리 필터 (한글 sub_category 정규화)', () => {
    it('한글 세부종류 아이템을 영문 대분류 칩으로 거른다', () => {
      const tee = createItem({ id: 'tee', subCategory: '티셔츠' });
      const jeans = createItem({ id: 'jeans', subCategory: '청바지' });

      const result = filterClosetItems([tee, jeans], { categories: ['top'] });

      expect(result.map((i) => i.id)).toEqual(['tee']);
    });

    it('여러 카테고리를 고르면 그중 하나라도 맞는 아이템을 남긴다', () => {
      const tee = createItem({ id: 'tee', subCategory: '티셔츠' });
      const jeans = createItem({ id: 'jeans', subCategory: '청바지' });
      const bag = createItem({ id: 'bag', subCategory: '토트백' });

      const result = filterClosetItems([tee, jeans, bag], { categories: ['top', 'bottom'] });

      expect(result.map((i) => i.id)).toEqual(['tee', 'jeans']);
    });

    it('영문 대분류로 저장된 구 폴백 행도 같은 칩으로 걸러진다', () => {
      const legacy = createItem({ id: 'legacy', subCategory: 'top' });

      expect(filterClosetItems([legacy], { categories: ['top'] })).toHaveLength(1);
    });

    it('metadata.clothingCategory가 있으면 그 대분류를 우선한다', () => {
      const hoodie = createItem({
        id: 'hoodie',
        subCategory: '후드티', // 목록 밖 자유 응답
        metadata: { color: [], season: [], occasion: [], clothingCategory: 'top' },
      });

      expect(filterClosetItems([hoodie], { categories: ['top'] }).map((i) => i.id)).toEqual([
        'hoodie',
      ]);
    });

    it('대분류를 알 수 없는 아이템은 추측하지 않고 제외한다', () => {
      const unknown = createItem({ id: 'unknown', subCategory: '알 수 없는 무언가' });

      expect(filterClosetItems([unknown], { categories: ['top'] })).toHaveLength(0);
      // 필터가 없을 때는 그대로 보인다 (숨기는 게 아니라 필터에서만 제외)
      expect(filterClosetItems([unknown], {})).toHaveLength(1);
    });
  });

  describe('시즌 필터 (다중 선택 = OR)', () => {
    const spring = createItem({
      id: 'spring',
      metadata: { color: [], season: ['spring'], occasion: [] },
    });
    const winter = createItem({
      id: 'winter',
      metadata: { color: [], season: ['winter'], occasion: [] },
    });
    const summer = createItem({
      id: 'summer',
      metadata: { color: [], season: ['summer'], occasion: [] },
    });

    it('여러 시즌을 고르면 하나라도 겹치는 아이템을 남긴다 (OR)', () => {
      const result = filterClosetItems([spring, winter, summer], {
        seasons: ['spring', 'winter'],
      });

      expect(result.map((i) => i.id)).toEqual(['spring', 'winter']);
    });

    it('여러 시즌 태그 중 하나만 겹쳐도 남는다', () => {
      const allSeason = createItem({
        id: 'all',
        metadata: { color: [], season: ['spring', 'autumn'], occasion: [] },
      });

      expect(filterClosetItems([allSeason], { seasons: ['autumn'] })).toHaveLength(1);
    });

    it('시즌 태그가 없는 아이템은 시즌 필터에서 제외된다', () => {
      const untagged = createItem({ id: 'untagged', metadata: { color: [], occasion: [] } });

      expect(filterClosetItems([untagged], { seasons: ['spring'] })).toHaveLength(0);
      expect(filterClosetItems([untagged], {})).toHaveLength(1);
    });
  });

  describe('축 조합·통과 조건', () => {
    it('카테고리와 시즌은 AND로 결합된다', () => {
      const summerTee = createItem({
        id: 'summer-tee',
        subCategory: '티셔츠',
        metadata: { color: [], season: ['summer'], occasion: [] },
      });
      const winterTee = createItem({
        id: 'winter-tee',
        subCategory: '티셔츠',
        metadata: { color: [], season: ['winter'], occasion: [] },
      });
      const summerJeans = createItem({
        id: 'summer-jeans',
        subCategory: '청바지',
        metadata: { color: [], season: ['summer'], occasion: [] },
      });

      const result = filterClosetItems([summerTee, winterTee, summerJeans], {
        categories: ['top'],
        seasons: ['summer'],
      });

      expect(result.map((i) => i.id)).toEqual(['summer-tee']);
    });

    it('선택이 없으면 원본을 그대로 통과시킨다', () => {
      const items = [createItem({ id: 'a' }), createItem({ id: 'b' })];

      expect(filterClosetItems(items, {})).toBe(items);
      expect(filterClosetItems(items, { categories: [], seasons: [] })).toBe(items);
    });

    it('빈 목록은 빈 목록을 반환한다', () => {
      expect(filterClosetItems([], { categories: ['top'] })).toEqual([]);
    });
  });
});

/**
 * 검색 필터 조립 (buildClosetSearchFilter)
 *
 * 배경: 검색어를 `name.ilike.%${q}%,brand.ilike.%${q}%`에 그대로 끼워 넣어,
 * 쉼표·괄호가 들어간 검색어는 필터가 쪼개지거나 쿼리 자체가 실패했다
 * (사용자에겐 "검색만 하면 옷장이 빈다"로 보인다).
 */
describe('buildClosetSearchFilter', () => {
  it('이름·브랜드 두 컬럼을 OR로 묶는다', () => {
    expect(buildClosetSearchFilter('셔츠')).toBe('name.ilike."%셔츠%",brand.ilike."%셔츠%"');
  });

  it('예약문자(쉼표·괄호)가 있어도 값이 따옴표 안에 갇힌다 (필터 구분자로 새지 않음)', () => {
    const filter = buildClosetSearchFilter('셔츠, (여름)');

    // 컬럼 구분자는 정확히 1개 — 값 안의 쉼표가 조건을 쪼개지 않는다
    expect(filter.split('",').length - 1).toBe(1);
    expect(filter).toBe('name.ilike."%셔츠, (여름)%",brand.ilike."%셔츠, (여름)%"');
  });

  it('따옴표·역슬래시는 이스케이프한다 (따옴표 조기 종료 방지)', () => {
    // 입력: 12" 백\  →  값 안의 " 와 \ 가 각각 백슬래시로 이스케이프돼야 한다
    expect(buildClosetSearchFilter('12" 백\\')).toBe(
      'name.ilike."%12\\" 백\\\\%",brand.ilike."%12\\" 백\\\\%"'
    );
  });

  it('빈 검색어도 안전한 문자열을 만든다', () => {
    expect(buildClosetSearchFilter('')).toBe('name.ilike."%%",brand.ilike."%%"');
  });
});
