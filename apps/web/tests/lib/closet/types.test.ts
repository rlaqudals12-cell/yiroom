/**
 * 옷장 모듈 타입 테스트
 * @see apps/web/lib/closet/types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  CLOTHING_CATEGORY_LABELS,
  CLOSET_SORT_LABELS,
  type ClosetFilterOptions,
  type ClosetSortOption,
  type ClosetStats,
  type OutfitRecommendOptions,
} from '@/lib/closet/types';

describe('CLOTHING_CATEGORY_LABELS', () => {
  it('should have all expected categories', () => {
    const expectedCategories = ['outer', 'top', 'bottom', 'dress', 'shoes', 'bag', 'accessory'];
    for (const category of expectedCategories) {
      expect(CLOTHING_CATEGORY_LABELS).toHaveProperty(category);
    }
  });

  it('should have Korean labels', () => {
    expect(CLOTHING_CATEGORY_LABELS.outer).toBe('아우터');
    expect(CLOTHING_CATEGORY_LABELS.top).toBe('상의');
    expect(CLOTHING_CATEGORY_LABELS.bottom).toBe('하의');
    expect(CLOTHING_CATEGORY_LABELS.dress).toBe('원피스');
    expect(CLOTHING_CATEGORY_LABELS.shoes).toBe('신발');
    expect(CLOTHING_CATEGORY_LABELS.bag).toBe('가방');
    expect(CLOTHING_CATEGORY_LABELS.accessory).toBe('액세서리');
  });

  it('should have 7 categories total', () => {
    expect(Object.keys(CLOTHING_CATEGORY_LABELS)).toHaveLength(7);
  });
});

describe('CLOSET_SORT_LABELS', () => {
  it('should have all sort options', () => {
    const expectedOptions: ClosetSortOption[] = [
      'newest',
      'oldest',
      'name',
      'mostWorn',
      'recentlyWorn',
    ];
    for (const option of expectedOptions) {
      expect(CLOSET_SORT_LABELS).toHaveProperty(option);
    }
  });

  it('should have Korean labels', () => {
    expect(CLOSET_SORT_LABELS.newest).toBe('최신순');
    expect(CLOSET_SORT_LABELS.oldest).toBe('오래된순');
    expect(CLOSET_SORT_LABELS.name).toBe('이름순');
    expect(CLOSET_SORT_LABELS.mostWorn).toBe('많이 입은순');
    expect(CLOSET_SORT_LABELS.recentlyWorn).toBe('최근 착용순');
  });

  it('should have 5 sort options total', () => {
    expect(Object.keys(CLOSET_SORT_LABELS)).toHaveLength(5);
  });
});

describe('ClosetFilterOptions type', () => {
  it('should accept valid filter options', () => {
    const validFilter: ClosetFilterOptions = {
      category: 'top',
      season: ['spring', 'summer'],
      occasion: ['casual'],
      color: '#FF0000',
      isFavorite: true,
      search: '셔츠',
    };

    expect(validFilter.category).toBe('top');
    expect(validFilter.season).toEqual(['spring', 'summer']);
    expect(validFilter.isFavorite).toBe(true);
  });

  it('should accept partial filter options', () => {
    const partialFilter: ClosetFilterOptions = {
      category: 'outer',
    };

    expect(partialFilter.category).toBe('outer');
    expect(partialFilter.season).toBeUndefined();
  });

  it('should accept empty filter options', () => {
    const emptyFilter: ClosetFilterOptions = {};
    expect(Object.keys(emptyFilter)).toHaveLength(0);
  });
});

describe('ClosetSortOption type', () => {
  it('should have all valid sort options as keys in labels', () => {
    const sortOptions: ClosetSortOption[] = [
      'newest',
      'oldest',
      'name',
      'mostWorn',
      'recentlyWorn',
    ];

    sortOptions.forEach((option) => {
      expect(CLOSET_SORT_LABELS[option]).toBeDefined();
    });
  });
});

describe('ClosetStats type', () => {
  it('should accept valid stats object', () => {
    const validStats: ClosetStats = {
      totalItems: 50,
      favoriteCount: 10,
      categoryCount: {
        top: 15,
        bottom: 12,
        outer: 8,
        shoes: 10,
        accessory: 5,
      },
      unwornItems: 5,
      avgWearCount: 3.5,
    };

    expect(validStats.totalItems).toBe(50);
    expect(validStats.favoriteCount).toBe(10);
    expect(validStats.categoryCount.top).toBe(15);
    expect(validStats.unwornItems).toBe(5);
    expect(validStats.avgWearCount).toBe(3.5);
  });

  it('should handle empty category count', () => {
    const emptyStats: ClosetStats = {
      totalItems: 0,
      favoriteCount: 0,
      categoryCount: {},
      unwornItems: 0,
      avgWearCount: 0,
    };

    expect(emptyStats.totalItems).toBe(0);
    expect(Object.keys(emptyStats.categoryCount)).toHaveLength(0);
  });
});

describe('OutfitRecommendOptions type', () => {
  it('should accept valid recommendation options', () => {
    const validOptions: OutfitRecommendOptions = {
      personalColor: 'spring_bright',
      bodyType: 'S',
      temperature: 20,
      occasion: 'office',
    };

    expect(validOptions.personalColor).toBe('spring_bright');
    expect(validOptions.bodyType).toBe('S');
    expect(validOptions.temperature).toBe(20);
    expect(validOptions.occasion).toBe('office');
  });

  it('should accept null values', () => {
    const nullOptions: OutfitRecommendOptions = {
      personalColor: null,
      bodyType: null,
      temperature: null,
      occasion: null,
    };

    expect(nullOptions.personalColor).toBeNull();
    expect(nullOptions.bodyType).toBeNull();
  });

  it('should accept partial options', () => {
    const partialOptions: OutfitRecommendOptions = {
      temperature: 25,
    };

    expect(partialOptions.temperature).toBe(25);
    expect(partialOptions.personalColor).toBeUndefined();
  });

  it('should validate body type values', () => {
    const validBodyTypes: Array<OutfitRecommendOptions['bodyType']> = ['S', 'W', 'N', null];

    validBodyTypes.forEach((bodyType) => {
      const options: OutfitRecommendOptions = { bodyType };
      expect(['S', 'W', 'N', null, undefined]).toContain(options.bodyType);
    });
  });
});
