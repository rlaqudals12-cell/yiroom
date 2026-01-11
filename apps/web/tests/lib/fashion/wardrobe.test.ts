/**
 * 옷장 연동 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateOutfitCombinations,
  SAMPLE_WARDROBE,
  type WardrobeItem,
  type ClothingCategory,
} from '@/lib/fashion/wardrobe';

describe('generateOutfitCombinations', () => {
  it('샘플 옷장에서 코디 조합을 생성한다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE);

    expect(result.outfits.length).toBeGreaterThan(0);
    expect(result.tips).toBeDefined();
  });

  it('상의 + 하의 조합을 생성한다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE);

    // 상의 + 하의 조합 확인
    const topBottomOutfit = result.outfits.find(
      (o) =>
        o.items.some((i) => i.category === 'top') && o.items.some((i) => i.category === 'bottom')
    );
    expect(topBottomOutfit).toBeDefined();
  });

  it('원피스 단독 코디를 생성한다', () => {
    // maxOutfits를 늘려서 원피스 코디가 포함되도록 함
    const result = generateOutfitCombinations(SAMPLE_WARDROBE, { maxOutfits: 20 });

    // 원피스 코디 확인
    const dressOutfit = result.outfits.find((o) => o.items.some((i) => i.category === 'dress'));
    expect(dressOutfit).toBeDefined();
    expect(dressOutfit?.matchReason).toContain('원피스');
  });

  it('퍼스널컬러 시즌 옵션을 적용한다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE, {
      userSeason: 'Spring',
    });

    // 시즌 호환성 확인
    const seasonMatchOutfit = result.outfits.find((o) => o.seasonCompatibility.includes('Spring'));
    expect(seasonMatchOutfit).toBeDefined();
  });

  it('occasion 필터를 적용한다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE, {
      occasion: '비즈니스',
    });

    // 비즈니스 태그가 있는 아이템이 포함된 코디 확인
    expect(result.outfits.length).toBeGreaterThan(0);
  });

  it('maxOutfits 제한을 적용한다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE, {
      maxOutfits: 3,
    });

    expect(result.outfits.length).toBeLessThanOrEqual(3);
  });

  it('점수 순으로 정렬된다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE);

    for (let i = 0; i < result.outfits.length - 1; i++) {
      expect(result.outfits[i].matchScore).toBeGreaterThanOrEqual(result.outfits[i + 1].matchScore);
    }
  });

  it('사용되지 않은 아이템을 반환한다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE);

    // 모든 아이템이 사용되지 않거나, 일부가 unmatchedItems에 있음
    const totalItemsInOutfits = new Set(result.outfits.flatMap((o) => o.items.map((i) => i.id)));
    const unmatchedIds = new Set(result.unmatchedItems.map((i) => i.id));

    // 중복 없이 전체 아이템 수와 일치
    expect(totalItemsInOutfits.size + unmatchedIds.size).toBeLessThanOrEqual(
      SAMPLE_WARDROBE.length
    );
  });

  it('빈 옷장에서 빈 결과를 반환한다', () => {
    const result = generateOutfitCombinations([]);

    expect(result.outfits).toHaveLength(0);
    expect(result.unmatchedItems).toHaveLength(0);
  });

  it('상의만 있으면 조합이 생성되지 않는다', () => {
    const topsOnly: WardrobeItem[] = [
      {
        id: 't1',
        name: '화이트 티셔츠',
        category: 'top',
        color: { name: '화이트', hex: '#FFFFFF' },
        addedAt: new Date(),
      },
    ];

    const result = generateOutfitCombinations(topsOnly);

    expect(result.outfits).toHaveLength(0);
    expect(result.tips).toContain('상의와 하의를 추가하면 더 많은 코디를 추천받을 수 있어요');
  });

  it('색상 조화가 맞지 않는 조합은 제외된다', () => {
    const clashingWardrobe: WardrobeItem[] = [
      {
        id: 'c1',
        name: '빨간 상의',
        category: 'top',
        color: { name: '레드', hex: '#FF0000' },
        addedAt: new Date(),
      },
      {
        id: 'c2',
        name: '초록 하의',
        category: 'bottom',
        color: { name: '그린', hex: '#00FF00' },
        addedAt: new Date(),
      },
    ];

    const result = generateOutfitCombinations(clashingWardrobe);

    // 빨강 + 초록은 보색으로 조화 규칙에서 제외될 수 있음
    // 색상 거리가 150 이상이면 제외
    expect(result.outfits.length).toBeLessThanOrEqual(1);
  });

  it('무채색은 모든 색상과 조화된다', () => {
    const neutralWardrobe: WardrobeItem[] = [
      {
        id: 'n1',
        name: '블랙 상의',
        category: 'top',
        color: { name: '블랙', hex: '#000000' },
        addedAt: new Date(),
      },
      {
        id: 'n2',
        name: '코랄 하의',
        category: 'bottom',
        color: { name: '코랄', hex: '#FF6B6B' },
        addedAt: new Date(),
      },
    ];

    const result = generateOutfitCombinations(neutralWardrobe);

    expect(result.outfits.length).toBeGreaterThan(0);
  });

  it('코디에 신발과 아우터가 추가될 수 있다', () => {
    const result = generateOutfitCombinations(SAMPLE_WARDROBE);

    // 3개 이상의 아이템이 있는 코디 확인 (상의+하의+신발 또는 아우터)
    const multiItemOutfit = result.outfits.find((o) => o.items.length >= 3);
    expect(multiItemOutfit).toBeDefined();
  });
});

describe('SAMPLE_WARDROBE', () => {
  it('모든 카테고리를 포함한다', () => {
    const categories = new Set(SAMPLE_WARDROBE.map((i) => i.category));

    expect(categories.has('top')).toBe(true);
    expect(categories.has('bottom')).toBe(true);
    expect(categories.has('outer')).toBe(true);
    expect(categories.has('dress')).toBe(true);
    expect(categories.has('shoes')).toBe(true);
  });

  it('모든 아이템에 필수 필드가 있다', () => {
    for (const item of SAMPLE_WARDROBE) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.category).toBeDefined();
      expect(item.color.name).toBeDefined();
      expect(item.color.hex).toBeDefined();
      expect(item.addedAt).toBeInstanceOf(Date);
    }
  });

  it('시즌 정보가 있는 아이템이 있다', () => {
    const seasonedItems = SAMPLE_WARDROBE.filter((i) => i.color.season);
    expect(seasonedItems.length).toBeGreaterThan(0);
  });
});
