/**
 * 피부 타입별 성분 매칭 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  SKIN_TYPE_INGREDIENTS,
  checkIngredientForSkinType,
  calculateSkinTypeScore,
} from '@/lib/scan/skin-ingredient-match';

describe('SKIN_TYPE_INGREDIENTS', () => {
  it('모든 피부 타입에 대한 데이터 존재', () => {
    expect(SKIN_TYPE_INGREDIENTS.dry).toBeDefined();
    expect(SKIN_TYPE_INGREDIENTS.oily).toBeDefined();
    expect(SKIN_TYPE_INGREDIENTS.sensitive).toBeDefined();
    expect(SKIN_TYPE_INGREDIENTS.combination).toBeDefined();
    expect(SKIN_TYPE_INGREDIENTS.normal).toBeDefined();
  });

  it('각 피부 타입에 beneficial, caution, avoid 배열 존재', () => {
    for (const skinType of ['dry', 'oily', 'sensitive', 'combination', 'normal'] as const) {
      const rec = SKIN_TYPE_INGREDIENTS[skinType];
      expect(Array.isArray(rec.beneficial)).toBe(true);
      expect(Array.isArray(rec.caution)).toBe(true);
      expect(Array.isArray(rec.avoid)).toBe(true);
    }
  });
});

describe('checkIngredientForSkinType', () => {
  describe('건성 피부', () => {
    it('히알루론산은 beneficial', () => {
      expect(checkIngredientForSkinType('HYALURONIC ACID', 'dry')).toBe('beneficial');
      expect(checkIngredientForSkinType('Sodium Hyaluronate', 'dry')).toBe('beneficial');
    });

    it('세라마이드는 beneficial', () => {
      expect(checkIngredientForSkinType('CERAMIDE', 'dry')).toBe('beneficial');
      expect(checkIngredientForSkinType('Ceramide NP', 'dry')).toBe('beneficial');
    });

    it('알코올은 caution', () => {
      expect(checkIngredientForSkinType('ALCOHOL DENAT.', 'dry')).toBe('caution');
    });

    it('이소프로필 알코올은 avoid', () => {
      expect(checkIngredientForSkinType('ISOPROPYL ALCOHOL', 'dry')).toBe('avoid');
    });

    it('일반 성분은 neutral', () => {
      expect(checkIngredientForSkinType('WATER', 'dry')).toBe('neutral');
    });
  });

  describe('지성 피부', () => {
    it('나이아신아마이드는 beneficial', () => {
      expect(checkIngredientForSkinType('NIACINAMIDE', 'oily')).toBe('beneficial');
    });

    it('살리실릭애씨드는 beneficial', () => {
      expect(checkIngredientForSkinType('SALICYLIC ACID', 'oily')).toBe('beneficial');
    });

    it('코코넛오일은 avoid', () => {
      expect(checkIngredientForSkinType('COCONUT OIL', 'oily')).toBe('avoid');
    });

    it('미네랄오일은 caution', () => {
      expect(checkIngredientForSkinType('MINERAL OIL', 'oily')).toBe('caution');
    });
  });

  describe('민감성 피부', () => {
    it('센텔라는 beneficial', () => {
      expect(checkIngredientForSkinType('CENTELLA ASIATICA', 'sensitive')).toBe('beneficial');
    });

    it('알란토인은 beneficial', () => {
      expect(checkIngredientForSkinType('ALLANTOIN', 'sensitive')).toBe('beneficial');
    });

    it('향료는 caution', () => {
      expect(checkIngredientForSkinType('FRAGRANCE', 'sensitive')).toBe('caution');
      expect(checkIngredientForSkinType('PARFUM', 'sensitive')).toBe('caution');
    });

    it('알코올은 avoid', () => {
      expect(checkIngredientForSkinType('ALCOHOL DENAT.', 'sensitive')).toBe('avoid');
    });

    it('SLS는 avoid', () => {
      expect(checkIngredientForSkinType('SODIUM LAURYL SULFATE', 'sensitive')).toBe('avoid');
    });
  });
});

describe('calculateSkinTypeScore', () => {
  it('좋은 성분만 있으면 높은 점수', () => {
    const ingredients = ['HYALURONIC ACID', 'CERAMIDE', 'SQUALANE', 'GLYCERIN'];
    const result = calculateSkinTypeScore(ingredients, 'dry');

    expect(result.score).toBeGreaterThan(80);
    expect(result.beneficial.length).toBe(4);
    expect(result.caution.length).toBe(0);
    expect(result.avoid.length).toBe(0);
  });

  it('피해야 할 성분 있으면 낮은 점수', () => {
    const ingredients = ['HYALURONIC ACID', 'ISOPROPYL ALCOHOL'];
    const result = calculateSkinTypeScore(ingredients, 'dry');

    expect(result.score).toBeLessThan(70);
    expect(result.avoid.length).toBe(1);
  });

  it('주의 성분 있으면 약간 감점', () => {
    const ingredients = ['HYALURONIC ACID', 'ALCOHOL DENAT.'];
    const result = calculateSkinTypeScore(ingredients, 'dry');

    expect(result.caution.length).toBe(1);
    // 좋은 성분도 있어서 점수가 너무 낮지 않음
    expect(result.score).toBeGreaterThan(60);
    expect(result.score).toBeLessThan(90);
  });

  it('빈 성분 목록은 기본 점수', () => {
    const result = calculateSkinTypeScore([], 'normal');

    expect(result.score).toBe(70); // 기본 점수
    expect(result.beneficial.length).toBe(0);
  });

  it('지성 피부에 지성 추천 성분 높은 점수', () => {
    const ingredients = ['NIACINAMIDE', 'SALICYLIC ACID', 'TEA TREE OIL', 'ZINC'];
    const result = calculateSkinTypeScore(ingredients, 'oily');

    expect(result.score).toBeGreaterThan(80);
    expect(result.beneficial.length).toBe(4);
  });
});
