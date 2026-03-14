/**
 * 옷장 연동 시스템 테스트
 *
 * @module tests/lib/fashion/wardrobe
 * @description 코디 조합 생성, 색상 조화, 시즌 호환성, 태그 매칭 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateOutfitCombinations,
  SAMPLE_WARDROBE,
  type WardrobeItem,
} from '@/lib/fashion/wardrobe';

// ---------------------------------------------------------------------------
// 테스트 헬퍼: WardrobeItem 팩토리
// ---------------------------------------------------------------------------
function createItem(
  overrides: Partial<WardrobeItem> & Pick<WardrobeItem, 'id' | 'name' | 'category' | 'color'>
): WardrobeItem {
  return {
    addedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateOutfitCombinations
// ---------------------------------------------------------------------------
describe('generateOutfitCombinations', () => {
  // ─── 기본 동작 ──────────────────────────────────────────────────
  describe('기본 동작', () => {
    it('상의 + 하의 쌍에서 코디 조합을 생성한다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE);

      expect(result.outfits.length).toBeGreaterThan(0);

      const topBottomOutfit = result.outfits.find(
        (o) =>
          o.items.some((i) => i.category === 'top') && o.items.some((i) => i.category === 'bottom')
      );
      expect(topBottomOutfit).toBeDefined();
    });

    it('결과에 outfits, unmatchedItems, tips가 포함된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE);

      expect(result).toHaveProperty('outfits');
      expect(result).toHaveProperty('unmatchedItems');
      expect(result).toHaveProperty('tips');
      expect(Array.isArray(result.outfits)).toBe(true);
      expect(Array.isArray(result.unmatchedItems)).toBe(true);
      expect(Array.isArray(result.tips)).toBe(true);
    });
  });

  // ─── 색상 조화 필터링 ──────────────────────────────────────────
  describe('색상 조화 필터링', () => {
    it('색상 조화가 맞지 않는 조합은 제외된다', () => {
      // 빨강(#FF0000)과 초록(#00FF00)은 RGB 거리가 ~360으로 150 초과
      const clashingWardrobe: WardrobeItem[] = [
        createItem({
          id: 'c1',
          name: '빨간 상의',
          category: 'top',
          color: { name: '레드', hex: '#FF0000' },
        }),
        createItem({
          id: 'c2',
          name: '초록 하의',
          category: 'bottom',
          color: { name: '그린', hex: '#00FF00' },
        }),
      ];

      const result = generateOutfitCombinations(clashingWardrobe);

      // 색상 거리 > 150이므로 조합 생성되지 않음
      expect(result.outfits).toHaveLength(0);
    });

    it('무채색(블랙)은 모든 색상과 조화된다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'n1',
          name: '블랙 상의',
          category: 'top',
          color: { name: '블랙', hex: '#000000' },
        }),
        createItem({
          id: 'n2',
          name: '코랄 하의',
          category: 'bottom',
          color: { name: '코랄', hex: '#FF6B6B' },
        }),
      ];

      const result = generateOutfitCombinations(wardrobe);
      expect(result.outfits.length).toBeGreaterThan(0);
    });

    it('무채색(화이트)은 모든 색상과 조화된다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'w1',
          name: '화이트 상의',
          category: 'top',
          color: { name: '화이트', hex: '#FFFFFF' },
        }),
        createItem({
          id: 'w2',
          name: '라벤더 하의',
          category: 'bottom',
          color: { name: '라벤더', hex: '#E6E6FA' },
        }),
      ];

      const result = generateOutfitCombinations(wardrobe);
      expect(result.outfits.length).toBe(1);
    });

    it('네이비는 무채색으로서 모든 색상과 조화된다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'nv1',
          name: '네이비 셔츠',
          category: 'top',
          color: { name: '네이비', hex: '#000080' },
        }),
        createItem({
          id: 'nv2',
          name: '머스타드 팬츠',
          category: 'bottom',
          color: { name: '머스타드', hex: '#FFE66D' },
        }),
      ];

      const result = generateOutfitCombinations(wardrobe);
      expect(result.outfits.length).toBe(1);
    });

    it('같은 색상끼리는 조화된다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 's1',
          name: '코랄 상의',
          category: 'top',
          color: { name: '코랄', hex: '#FF6B6B' },
        }),
        createItem({
          id: 's2',
          name: '코랄 하의',
          category: 'bottom',
          color: { name: '코랄', hex: '#FF6B6B' },
        }),
      ];

      const result = generateOutfitCombinations(wardrobe);
      expect(result.outfits.length).toBe(1);
    });
  });

  // ─── 시즌 호환성 보너스 ────────────────────────────────────────
  describe('시즌 호환성 보너스', () => {
    it('userSeason 제공 시 시즌 호환 코디에 보너스 점수가 추가된다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'sp1',
          name: '코랄 니트',
          category: 'top',
          color: { name: '코랄', hex: '#FF6B6B', season: 'Spring' },
        }),
        createItem({
          id: 'sp2',
          name: '베이지 팬츠',
          category: 'bottom',
          color: { name: '베이지', hex: '#F5F5DC', season: 'Spring' },
        }),
      ];

      const withSeason = generateOutfitCombinations(wardrobe, { userSeason: 'Spring' });
      const withoutSeason = generateOutfitCombinations(wardrobe);

      // 시즌 매치 시 점수가 더 높다
      expect(withSeason.outfits[0].matchScore).toBeGreaterThan(withoutSeason.outfits[0].matchScore);
    });

    it('시즌 매치 코디에 seasonCompatibility 배열이 포함된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, {
        userSeason: 'Spring',
      });

      const seasonOutfit = result.outfits.find((o) => o.seasonCompatibility.includes('Spring'));
      expect(seasonOutfit).toBeDefined();
    });

    it('userSeason 미제공 시 seasonCompatibility는 빈 배열이다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE);

      result.outfits.forEach((outfit) => {
        expect(outfit.seasonCompatibility).toEqual([]);
      });
    });

    it('시즌 팁이 생성된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, {
        userSeason: 'Spring',
      });

      expect(result.tips.some((t) => t.includes('Spring'))).toBe(true);
    });
  });

  // ─── occasion 태그 매칭 보너스 ─────────────────────────────────
  describe('occasion 태그 매칭 보너스', () => {
    it('occasion이 상의+하의 태그 모두에 있으면 보너스 점수가 추가된다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'oc1',
          name: '네이비 셔츠',
          category: 'top',
          color: { name: '네이비', hex: '#000080' },
          tags: ['비즈니스'],
        }),
        createItem({
          id: 'oc2',
          name: '블랙 슬랙스',
          category: 'bottom',
          color: { name: '블랙', hex: '#000000' },
          tags: ['비즈니스'],
        }),
      ];

      const withOccasion = generateOutfitCombinations(wardrobe, { occasion: '비즈니스' });
      const withoutOccasion = generateOutfitCombinations(wardrobe);

      expect(withOccasion.outfits[0].matchScore).toBeGreaterThan(
        withoutOccasion.outfits[0].matchScore
      );
    });

    it('occasion 매칭 시 코디 이유에 occasion 이름이 포함된다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'oc3',
          name: '화이트 셔츠',
          category: 'top',
          color: { name: '화이트', hex: '#FFFFFF' },
          tags: ['데이트'],
        }),
        createItem({
          id: 'oc4',
          name: '베이지 치노',
          category: 'bottom',
          color: { name: '베이지', hex: '#F5F5DC' },
          tags: ['데이트'],
        }),
      ];

      const result = generateOutfitCombinations(wardrobe, { occasion: '데이트' });
      expect(result.outfits[0].matchReason).toContain('데이트');
    });

    it('occasion 미제공 시 기본 occasion은 데일리이다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE);

      result.outfits.forEach((outfit) => {
        expect(outfit.occasion).toBe('데일리');
      });
    });
  });

  // ─── 아우터 및 신발 포함 ───────────────────────────────────────
  describe('아우터 및 신발 포함', () => {
    it('색상 조화되는 아우터가 코디에 추가된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, { maxOutfits: 20 });

      const withOuter = result.outfits.find((o) => o.items.some((i) => i.category === 'outer'));
      expect(withOuter).toBeDefined();
    });

    it('색상 조화되는 신발이 코디에 추가된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, { maxOutfits: 20 });

      const withShoes = result.outfits.find((o) => o.items.some((i) => i.category === 'shoes'));
      expect(withShoes).toBeDefined();
    });

    it('아우터/신발 추가 시 점수에 보너스가 반영된다', () => {
      // 아우터+신발 없는 경우
      const minimalWardrobe: WardrobeItem[] = [
        createItem({
          id: 'm1',
          name: '화이트 티',
          category: 'top',
          color: { name: '화이트', hex: '#FFFFFF' },
        }),
        createItem({
          id: 'm2',
          name: '블랙 팬츠',
          category: 'bottom',
          color: { name: '블랙', hex: '#000000' },
        }),
      ];

      // 아우터+신발 있는 경우
      const fullWardrobe: WardrobeItem[] = [
        ...minimalWardrobe,
        createItem({
          id: 'm3',
          name: '베이지 코트',
          category: 'outer',
          color: { name: '베이지', hex: '#F5F5DC' },
        }),
        createItem({
          id: 'm4',
          name: '화이트 스니커즈',
          category: 'shoes',
          color: { name: '화이트', hex: '#FFFFFF' },
        }),
      ];

      const minResult = generateOutfitCombinations(minimalWardrobe);
      const fullResult = generateOutfitCombinations(fullWardrobe);

      expect(fullResult.outfits[0].matchScore).toBeGreaterThan(minResult.outfits[0].matchScore);
    });
  });

  // ─── 원피스 코디 ───────────────────────────────────────────────
  describe('원피스 코디', () => {
    it('원피스 단독 코디를 생성한다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'd1',
          name: '플로럴 원피스',
          category: 'dress',
          color: { name: '피치', hex: '#FFDAB9', season: 'Spring' },
        }),
      ];

      const result = generateOutfitCombinations(wardrobe);
      expect(result.outfits).toHaveLength(1);
      expect(result.outfits[0].matchReason).toContain('원피스');
    });

    it('원피스 코디에 신발이 추가될 수 있다', () => {
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'd2',
          name: '블랙 원피스',
          category: 'dress',
          color: { name: '블랙', hex: '#000000' },
        }),
        createItem({
          id: 'd3',
          name: '블랙 힐',
          category: 'shoes',
          color: { name: '블랙', hex: '#000000' },
        }),
      ];

      const result = generateOutfitCombinations(wardrobe);
      expect(result.outfits[0].items.length).toBe(2);
      expect(result.outfits[0].items.some((i) => i.category === 'shoes')).toBe(true);
    });

    it('SAMPLE_WARDROBE에서 원피스 코디가 생성된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, { maxOutfits: 20 });

      const dressOutfit = result.outfits.find((o) => o.items.some((i) => i.category === 'dress'));
      expect(dressOutfit).toBeDefined();
      expect(dressOutfit?.matchReason).toContain('원피스');
    });
  });

  // ─── maxOutfits 제한 ───────────────────────────────────────────
  describe('maxOutfits 제한', () => {
    it('maxOutfits 값에 따라 결과 수가 제한된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, { maxOutfits: 2 });
      expect(result.outfits.length).toBeLessThanOrEqual(2);
    });

    it('기본 maxOutfits는 5이다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE);
      expect(result.outfits.length).toBeLessThanOrEqual(5);
    });
  });

  // ─── unmatchedItems ────────────────────────────────────────────
  describe('unmatchedItems', () => {
    it('코디에 포함되지 않은 아이템을 반환한다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE);

      const usedIds = new Set(result.outfits.flatMap((o) => o.items.map((i) => i.id)));
      const unmatchedIds = new Set(result.unmatchedItems.map((i) => i.id));

      // 사용된 아이템과 미사용 아이템이 겹치지 않아야 함
      for (const id of unmatchedIds) {
        expect(usedIds.has(id)).toBe(false);
      }
    });

    it('미사용 아이템이 있으면 관련 팁이 생성된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, { maxOutfits: 1 });

      if (result.unmatchedItems.length > 0) {
        expect(result.tips.some((t) => t.includes('포함되지 않았어요'))).toBe(true);
      }
    });
  });

  // ─── 팁 생성 ───────────────────────────────────────────────────
  describe('팁 생성', () => {
    it('상의/하의가 없으면 추가 안내 팁이 생성된다', () => {
      const topsOnly: WardrobeItem[] = [
        createItem({
          id: 't1',
          name: '화이트 티셔츠',
          category: 'top',
          color: { name: '화이트', hex: '#FFFFFF' },
        }),
      ];

      const result = generateOutfitCombinations(topsOnly);
      expect(result.tips).toContain('상의와 하의를 추가하면 더 많은 코디를 추천받을 수 있어요');
    });
  });

  // ─── 정렬 ──────────────────────────────────────────────────────
  describe('정렬', () => {
    it('matchScore 내림차순으로 정렬된다', () => {
      const result = generateOutfitCombinations(SAMPLE_WARDROBE, { maxOutfits: 20 });

      for (let i = 0; i < result.outfits.length - 1; i++) {
        expect(result.outfits[i].matchScore).toBeGreaterThanOrEqual(
          result.outfits[i + 1].matchScore
        );
      }
    });
  });

  // ─── 엣지 케이스 ──────────────────────────────────────────────
  describe('엣지 케이스', () => {
    it('빈 옷장에서 빈 결과를 반환한다', () => {
      const result = generateOutfitCombinations([]);

      expect(result.outfits).toHaveLength(0);
      expect(result.unmatchedItems).toHaveLength(0);
    });

    it('상의만 있고 하의가 없으면 상의+하의 조합이 생성되지 않는다', () => {
      const topsOnly: WardrobeItem[] = [
        createItem({
          id: 'to1',
          name: '화이트 티',
          category: 'top',
          color: { name: '화이트', hex: '#FFFFFF' },
        }),
        createItem({
          id: 'to2',
          name: '블랙 티',
          category: 'top',
          color: { name: '블랙', hex: '#000000' },
        }),
      ];

      const result = generateOutfitCombinations(topsOnly);
      expect(result.outfits).toHaveLength(0);
      expect(result.unmatchedItems).toHaveLength(2);
    });

    it('matchScore는 100을 초과하지 않는다', () => {
      // 모든 보너스가 적용될 수 있는 조합
      const wardrobe: WardrobeItem[] = [
        createItem({
          id: 'mx1',
          name: '코랄 니트',
          category: 'top',
          color: { name: '코랄', hex: '#FF6B6B', season: 'Spring' },
          tags: ['데이트'],
        }),
        createItem({
          id: 'mx2',
          name: '베이지 스커트',
          category: 'bottom',
          color: { name: '베이지', hex: '#F5F5DC', season: 'Spring' },
          tags: ['데이트'],
        }),
        createItem({
          id: 'mx3',
          name: '베이지 코트',
          category: 'outer',
          color: { name: '베이지', hex: '#F5F5DC' },
        }),
        createItem({
          id: 'mx4',
          name: '화이트 스니커즈',
          category: 'shoes',
          color: { name: '화이트', hex: '#FFFFFF' },
        }),
      ];

      const result = generateOutfitCombinations(wardrobe, {
        userSeason: 'Spring',
        occasion: '데이트',
      });

      result.outfits.forEach((outfit) => {
        expect(outfit.matchScore).toBeLessThanOrEqual(100);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// SAMPLE_WARDROBE 구조 검증
// ---------------------------------------------------------------------------
describe('SAMPLE_WARDROBE', () => {
  it('올바른 카테고리를 모두 포함한다', () => {
    const categories = new Set(SAMPLE_WARDROBE.map((i) => i.category));

    expect(categories.has('top')).toBe(true);
    expect(categories.has('bottom')).toBe(true);
    expect(categories.has('outer')).toBe(true);
    expect(categories.has('dress')).toBe(true);
    expect(categories.has('shoes')).toBe(true);
  });

  it('모든 아이템에 필수 필드가 있다', () => {
    for (const item of SAMPLE_WARDROBE) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.color.name).toBeTruthy();
      expect(item.color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(item.addedAt).toBeInstanceOf(Date);
    }
  });

  it('시즌 정보가 있는 아이템이 존재한다', () => {
    const seasonedItems = SAMPLE_WARDROBE.filter((i) => i.color.season);
    expect(seasonedItems.length).toBeGreaterThan(0);
  });

  it('태그 정보가 있는 아이템이 존재한다', () => {
    const taggedItems = SAMPLE_WARDROBE.filter((i) => i.tags && i.tags.length > 0);
    expect(taggedItems.length).toBeGreaterThan(0);
  });

  it('아이템 ID가 모두 고유하다', () => {
    const ids = SAMPLE_WARDROBE.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
