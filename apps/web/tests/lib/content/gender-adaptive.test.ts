/**
 * 성별 적응형 콘텐츠 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getAccessoryRecommendations,
  getGenderAdaptiveTerm,
  filterCategoriesByGender,
  getProductCategoryLabel,
  getStyleSectionTitle,
  isValidGenderProfile,
  createDefaultGenderProfile,
  MALE_ACCESSORY_RECOMMENDATIONS,
  FEMALE_ACCESSORY_RECOMMENDATIONS,
  UNISEX_ACCESSORY_RECOMMENDATIONS,
  type UserGenderProfile,
} from '@/lib/content/gender-adaptive';
import type { SeasonType } from '@/lib/mock/personal-color';

describe('gender-adaptive', () => {
  describe('getAccessoryRecommendations', () => {
    const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];

    it.each(seasons)('%s 시즌에 남성용 악세서리를 반환한다', (season) => {
      const result = getAccessoryRecommendations(season, {
        gender: 'male',
        stylePreference: 'masculine',
      });

      expect(result.length).toBeGreaterThan(0);
      // 남성용 악세서리 포함 확인
      const hasWatch = result.some((r) => r.category === 'watch');
      const hasTie = result.some((r) => r.category === 'tie');
      expect(hasWatch).toBe(true);
      expect(hasTie).toBe(true);
    });

    it.each(seasons)('%s 시즌에 여성용 악세서리를 반환한다', (season) => {
      const result = getAccessoryRecommendations(season, {
        gender: 'female',
        stylePreference: 'feminine',
      });

      expect(result.length).toBeGreaterThan(0);
      // 여성용 악세서리 포함 확인
      const hasJewelry = result.some((r) => r.category === 'jewelry');
      expect(hasJewelry).toBe(true);
    });

    it.each(seasons)('%s 시즌에 중립 프로필은 모든 악세서리를 반환한다', (season) => {
      const result = getAccessoryRecommendations(season, {
        gender: 'neutral',
        stylePreference: 'unisex',
      });

      const maleCount = MALE_ACCESSORY_RECOMMENDATIONS[season].length;
      const femaleCount = FEMALE_ACCESSORY_RECOMMENDATIONS[season].length;
      const unisexCount = UNISEX_ACCESSORY_RECOMMENDATIONS[season].length;

      expect(result.length).toBe(maleCount + femaleCount + unisexCount);
    });

    it('프로필이 없으면 중립으로 처리한다', () => {
      const result = getAccessoryRecommendations('spring');
      expect(result.length).toBeGreaterThan(0);
    });

    it('stylePreference가 masculine이면 남성용을 반환한다', () => {
      const result = getAccessoryRecommendations('spring', {
        gender: 'neutral',
        stylePreference: 'masculine',
      });

      // 남성용 악세서리 포함 확인
      const hasWatch = result.some((r) => r.category === 'watch');
      expect(hasWatch).toBe(true);
    });

    it('stylePreference가 feminine이면 여성용을 반환한다', () => {
      const result = getAccessoryRecommendations('spring', {
        gender: 'neutral',
        stylePreference: 'feminine',
      });

      // 여성용 악세서리 포함 확인
      const hasJewelry = result.some((r) => r.category === 'jewelry');
      expect(hasJewelry).toBe(true);
    });
  });

  describe('getGenderAdaptiveTerm', () => {
    it('여성은 원래 용어를 반환한다', () => {
      expect(getGenderAdaptiveTerm('화사한', 'female')).toBe('화사한');
      expect(getGenderAdaptiveTerm('여성스러운', 'female')).toBe('여성스러운');
    });

    it('남성은 대체 용어를 반환한다', () => {
      expect(getGenderAdaptiveTerm('화사한', 'male')).toBe('깔끔한');
      expect(getGenderAdaptiveTerm('여성스러운', 'male')).toBe('세련된');
      expect(getGenderAdaptiveTerm('귀여운', 'male')).toBe('캐주얼한');
      expect(getGenderAdaptiveTerm('청순한', 'male')).toBe('단정한');
      expect(getGenderAdaptiveTerm('러블리한', 'male')).toBe('스마트한');
      expect(getGenderAdaptiveTerm('우아한', 'male')).toBe('품격있는');
      expect(getGenderAdaptiveTerm('발랄한', 'male')).toBe('활동적인');
    });

    it('중립은 남성과 동일하게 대체 용어를 반환한다', () => {
      expect(getGenderAdaptiveTerm('화사한', 'neutral')).toBe('깔끔한');
      expect(getGenderAdaptiveTerm('여성스러운', 'neutral')).toBe('세련된');
    });

    it('매핑되지 않은 용어는 그대로 반환한다', () => {
      expect(getGenderAdaptiveTerm('멋진', 'male')).toBe('멋진');
      expect(getGenderAdaptiveTerm('클래식한', 'neutral')).toBe('클래식한');
      expect(getGenderAdaptiveTerm('시크한', 'female')).toBe('시크한');
    });

    it('빈 문자열은 그대로 반환한다', () => {
      expect(getGenderAdaptiveTerm('', 'male')).toBe('');
      expect(getGenderAdaptiveTerm('', 'female')).toBe('');
    });
  });

  describe('filterCategoriesByGender', () => {
    const allCategories = ['립스틱', '메이크업', '넥타이', '시계', '가방', '면도'];

    it('남성은 여성 전용 카테고리를 제외한다', () => {
      const result = filterCategoriesByGender(allCategories, 'male');
      expect(result).not.toContain('립스틱');
      expect(result).not.toContain('메이크업');
      expect(result).toContain('넥타이');
      expect(result).toContain('시계');
    });

    it('여성은 남성 전용 카테고리를 제외한다', () => {
      const result = filterCategoriesByGender(allCategories, 'female');
      expect(result).not.toContain('넥타이');
      expect(result).not.toContain('면도');
      expect(result).toContain('립스틱');
      expect(result).toContain('메이크업');
    });

    it('중립은 모든 카테고리를 반환한다', () => {
      const result = filterCategoriesByGender(allCategories, 'neutral');
      expect(result).toEqual(allCategories);
    });

    it('빈 배열은 빈 배열을 반환한다', () => {
      const result = filterCategoriesByGender([], 'male');
      expect(result).toEqual([]);
    });

    it('남성 제외 카테고리에 네일, 귀걸이가 포함된다', () => {
      const categoriesWithMore = ['네일', '귀걸이', '시계'];
      const result = filterCategoriesByGender(categoriesWithMore, 'male');
      expect(result).not.toContain('네일');
      expect(result).not.toContain('귀걸이');
      expect(result).toContain('시계');
    });
  });

  describe('getProductCategoryLabel', () => {
    it('남성은 그루밍 아이템을 반환한다', () => {
      expect(getProductCategoryLabel('male')).toBe('그루밍 아이템');
    });

    it('여성은 뷰티 제품을 반환한다', () => {
      expect(getProductCategoryLabel('female')).toBe('뷰티 제품');
    });

    it('중립은 뷰티/그루밍 제품을 반환한다', () => {
      expect(getProductCategoryLabel('neutral')).toBe('뷰티/그루밍 제품');
    });
  });

  describe('getStyleSectionTitle', () => {
    it('남성은 남성 스타일 가이드를 반환한다', () => {
      expect(getStyleSectionTitle('male')).toBe('남성 스타일 가이드');
    });

    it('여성은 여성 스타일 가이드를 반환한다', () => {
      expect(getStyleSectionTitle('female')).toBe('여성 스타일 가이드');
    });

    it('중립은 스타일 가이드를 반환한다', () => {
      expect(getStyleSectionTitle('neutral')).toBe('스타일 가이드');
    });
  });

  describe('isValidGenderProfile', () => {
    it('유효한 프로필을 true로 판단한다', () => {
      const validProfiles: UserGenderProfile[] = [
        { gender: 'male', stylePreference: 'masculine' },
        { gender: 'female', stylePreference: 'feminine' },
        { gender: 'neutral', stylePreference: 'unisex' },
        { gender: 'male', stylePreference: 'unisex' },
        { gender: 'female', stylePreference: 'masculine' },
      ];

      validProfiles.forEach((profile) => {
        expect(isValidGenderProfile(profile)).toBe(true);
      });
    });

    it('null은 false를 반환한다', () => {
      expect(isValidGenderProfile(null)).toBe(false);
    });

    it('undefined는 false를 반환한다', () => {
      expect(isValidGenderProfile(undefined)).toBe(false);
    });

    it('빈 객체는 false를 반환한다', () => {
      expect(isValidGenderProfile({})).toBe(false);
    });

    it('잘못된 gender 값은 false를 반환한다', () => {
      expect(isValidGenderProfile({ gender: 'other', stylePreference: 'unisex' })).toBe(false);
    });

    it('잘못된 stylePreference 값은 false를 반환한다', () => {
      expect(isValidGenderProfile({ gender: 'male', stylePreference: 'other' })).toBe(false);
    });

    it('문자열은 false를 반환한다', () => {
      expect(isValidGenderProfile('male')).toBe(false);
    });

    it('배열은 false를 반환한다', () => {
      expect(isValidGenderProfile(['male', 'masculine'])).toBe(false);
    });
  });

  describe('createDefaultGenderProfile', () => {
    it('male 입력 시 masculine 스타일을 반환한다', () => {
      const result = createDefaultGenderProfile('male');
      expect(result).toEqual({ gender: 'male', stylePreference: 'masculine' });
    });

    it('female 입력 시 feminine 스타일을 반환한다', () => {
      const result = createDefaultGenderProfile('female');
      expect(result).toEqual({ gender: 'female', stylePreference: 'feminine' });
    });

    it('neutral 입력 시 unisex 스타일을 반환한다', () => {
      const result = createDefaultGenderProfile('neutral');
      expect(result).toEqual({ gender: 'neutral', stylePreference: 'unisex' });
    });

    it('입력이 없으면 neutral과 unisex를 반환한다', () => {
      const result = createDefaultGenderProfile();
      expect(result).toEqual({ gender: 'neutral', stylePreference: 'unisex' });
    });

    it('undefined 입력 시 neutral과 unisex를 반환한다', () => {
      const result = createDefaultGenderProfile(undefined);
      expect(result).toEqual({ gender: 'neutral', stylePreference: 'unisex' });
    });
  });

  describe('악세서리 데이터 구조', () => {
    const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];

    it('모든 시즌에 남성용 악세서리가 존재한다', () => {
      seasons.forEach((season) => {
        expect(MALE_ACCESSORY_RECOMMENDATIONS[season]).toBeDefined();
        expect(MALE_ACCESSORY_RECOMMENDATIONS[season].length).toBeGreaterThan(0);
      });
    });

    it('모든 시즌에 여성용 악세서리가 존재한다', () => {
      seasons.forEach((season) => {
        expect(FEMALE_ACCESSORY_RECOMMENDATIONS[season]).toBeDefined();
        expect(FEMALE_ACCESSORY_RECOMMENDATIONS[season].length).toBeGreaterThan(0);
      });
    });

    it('모든 시즌에 유니섹스 악세서리가 존재한다', () => {
      seasons.forEach((season) => {
        expect(UNISEX_ACCESSORY_RECOMMENDATIONS[season]).toBeDefined();
        expect(UNISEX_ACCESSORY_RECOMMENDATIONS[season].length).toBeGreaterThan(0);
      });
    });

    it('모든 악세서리에 필수 필드가 있다', () => {
      const allAccessories = [
        ...Object.values(MALE_ACCESSORY_RECOMMENDATIONS).flat(),
        ...Object.values(FEMALE_ACCESSORY_RECOMMENDATIONS).flat(),
        ...Object.values(UNISEX_ACCESSORY_RECOMMENDATIONS).flat(),
      ];

      allAccessories.forEach((accessory) => {
        expect(accessory.name).toBeTruthy();
        expect(accessory.colorName).toBeTruthy();
        expect(accessory.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(accessory.brandExample).toBeTruthy();
        expect(accessory.easyDescription).toBeTruthy();
        expect(accessory.category).toBeTruthy();
      });
    });

    it('남성용 악세서리 카테고리가 올바르다', () => {
      const maleCategories = new Set(
        Object.values(MALE_ACCESSORY_RECOMMENDATIONS)
          .flat()
          .map((a) => a.category)
      );

      expect(maleCategories.has('watch')).toBe(true);
      expect(maleCategories.has('tie')).toBe(true);
      expect(maleCategories.has('sunglasses')).toBe(true);
      expect(maleCategories.has('belt')).toBe(true);
    });

    it('여성용 악세서리 카테고리가 올바르다', () => {
      const femaleCategories = new Set(
        Object.values(FEMALE_ACCESSORY_RECOMMENDATIONS)
          .flat()
          .map((a) => a.category)
      );

      expect(femaleCategories.has('jewelry')).toBe(true);
      expect(femaleCategories.has('scarf')).toBe(true);
    });
  });
});
