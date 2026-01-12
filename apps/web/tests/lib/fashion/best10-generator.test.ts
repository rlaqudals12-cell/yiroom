/**
 * 패션 Best 10 생성기 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getStyleBest10,
  getAllStyleBest10,
  filterByPersonalColor,
  filterBySeason,
  filterByOccasion,
  getPersonalizedBest10,
  STYLE_CATEGORY_LABELS,
  type StyleCategory,
} from '@/lib/fashion/best10-generator';

describe('getStyleBest10', () => {
  it('캐주얼 스타일 Best 10을 반환한다', () => {
    const result = getStyleBest10('casual');

    expect(result.category).toBe('casual');
    expect(result.label).toBe('캐주얼');
    expect(result.outfits).toHaveLength(10);
    expect(result.description).toBeDefined();
  });

  it('각 코디에 필수 필드가 있다', () => {
    const result = getStyleBest10('formal');

    for (const outfit of result.outfits) {
      expect(outfit.id).toBeDefined();
      expect(outfit.name).toBeDefined();
      expect(outfit.description).toBeDefined();
      expect(outfit.items.length).toBeGreaterThan(0);
      expect(outfit.occasions.length).toBeGreaterThan(0);
      expect(outfit.seasons.length).toBeGreaterThan(0);
      expect(outfit.personalColors.length).toBeGreaterThan(0);
    }
  });

  it('모든 스타일 카테고리를 지원한다', () => {
    const categories: StyleCategory[] = [
      'casual',
      'formal',
      'street',
      'minimal',
      'sporty',
      'classic',
      'preppy',
      'hiphop',
      'romantic',
      'workwear',
    ];

    for (const category of categories) {
      const result = getStyleBest10(category);
      expect(result.category).toBe(category);
      expect(result.label).toBe(STYLE_CATEGORY_LABELS[category]);
    }
  });
});

describe('getAllStyleBest10', () => {
  it('모든 스타일의 Best 10을 반환한다', () => {
    const results = getAllStyleBest10();

    expect(results).toHaveLength(10); // 10개 스타일 카테고리 (기본 7개 + hiphop, romantic, workwear)
  });

  it('총 100개의 코디를 포함한다', () => {
    const results = getAllStyleBest10();
    const totalOutfits = results.reduce((sum, style) => sum + style.outfits.length, 0);

    expect(totalOutfits).toBe(100); // 10개 카테고리 x 10개 코디
  });
});

describe('filterByPersonalColor', () => {
  it('Spring 퍼스널컬러에 맞는 코디만 필터링한다', () => {
    const allOutfits = getStyleBest10('casual').outfits;
    const filtered = filterByPersonalColor(allOutfits, 'Spring');

    for (const outfit of filtered) {
      expect(outfit.personalColors).toContain('Spring');
    }
  });

  it('Winter 퍼스널컬러에 맞는 코디만 필터링한다', () => {
    const allOutfits = getStyleBest10('minimal').outfits;
    const filtered = filterByPersonalColor(allOutfits, 'Winter');

    for (const outfit of filtered) {
      expect(outfit.personalColors).toContain('Winter');
    }
  });
});

describe('filterBySeason', () => {
  it('여름 시즌에 맞는 코디만 필터링한다', () => {
    const allOutfits = getStyleBest10('sporty').outfits;
    const filtered = filterBySeason(allOutfits, 'summer');

    for (const outfit of filtered) {
      expect(outfit.seasons).toContain('summer');
    }
  });

  it('겨울 시즌에 맞는 코디만 필터링한다', () => {
    const allOutfits = getStyleBest10('classic').outfits;
    const filtered = filterBySeason(allOutfits, 'winter');

    for (const outfit of filtered) {
      expect(outfit.seasons).toContain('winter');
    }
  });
});

describe('filterByOccasion', () => {
  it('포멀 상황에 맞는 코디만 필터링한다', () => {
    const allOutfits = getStyleBest10('formal').outfits;
    const filtered = filterByOccasion(allOutfits, 'formal');

    for (const outfit of filtered) {
      expect(outfit.occasions).toContain('formal');
    }
  });

  it('캐주얼 상황에 맞는 코디만 필터링한다', () => {
    const allOutfits = getStyleBest10('street').outfits;
    const filtered = filterByOccasion(allOutfits, 'casual');

    for (const outfit of filtered) {
      expect(outfit.occasions).toContain('casual');
    }
  });
});

describe('getPersonalizedBest10', () => {
  it('퍼스널컬러 옵션을 적용한다', () => {
    const result = getPersonalizedBest10('casual', {
      seasonType: 'Summer',
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('계절 옵션을 적용한다', () => {
    const result = getPersonalizedBest10('sporty', {
      currentSeason: 'summer',
    });

    for (const outfit of result) {
      expect(outfit.seasons).toContain('summer');
    }
  });

  it('상황 옵션을 적용한다', () => {
    const result = getPersonalizedBest10('formal', {
      occasion: 'formal',
    });

    for (const outfit of result) {
      expect(outfit.occasions).toContain('formal');
    }
  });

  it('복합 옵션을 적용한다', () => {
    const result = getPersonalizedBest10('classic', {
      seasonType: 'Autumn',
      currentSeason: 'autumn',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('필터 결과가 3개 미만이면 기본 목록을 반환한다', () => {
    // 매우 제한적인 조건
    const result = getPersonalizedBest10('preppy', {
      seasonType: 'Winter',
      currentSeason: 'summer',
      occasion: 'formal',
    });

    expect(result.length).toBeGreaterThanOrEqual(3);
  });
});

describe('STYLE_CATEGORY_LABELS', () => {
  it('모든 카테고리에 한글 라벨이 있다', () => {
    expect(STYLE_CATEGORY_LABELS.casual).toBe('캐주얼');
    expect(STYLE_CATEGORY_LABELS.formal).toBe('포멀');
    expect(STYLE_CATEGORY_LABELS.street).toBe('스트릿');
    expect(STYLE_CATEGORY_LABELS.minimal).toBe('미니멀');
    expect(STYLE_CATEGORY_LABELS.sporty).toBe('스포티');
    expect(STYLE_CATEGORY_LABELS.classic).toBe('클래식');
    expect(STYLE_CATEGORY_LABELS.preppy).toBe('프레피');
    expect(STYLE_CATEGORY_LABELS.hiphop).toBe('힙합');
    expect(STYLE_CATEGORY_LABELS.romantic).toBe('로맨틱');
    expect(STYLE_CATEGORY_LABELS.workwear).toBe('워크웨어');
  });
});
