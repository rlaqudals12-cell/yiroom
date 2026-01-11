/**
 * 성별 적응형 콘텐츠 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getAccessoryRecommendations,
  getGenderAdaptiveTerm,
  filterCategoriesByGender,
  MALE_ACCESSORY_RECOMMENDATIONS,
  FEMALE_ACCESSORY_RECOMMENDATIONS,
  UNISEX_ACCESSORY_RECOMMENDATIONS,
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
    });

    it('매핑되지 않은 용어는 그대로 반환한다', () => {
      expect(getGenderAdaptiveTerm('멋진', 'male')).toBe('멋진');
      expect(getGenderAdaptiveTerm('클래식한', 'neutral')).toBe('클래식한');
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
  });

  describe('악세서리 데이터 구조', () => {
    it('모든 시즌에 남성용 악세서리가 존재한다', () => {
      const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];
      seasons.forEach((season) => {
        expect(MALE_ACCESSORY_RECOMMENDATIONS[season]).toBeDefined();
        expect(MALE_ACCESSORY_RECOMMENDATIONS[season].length).toBeGreaterThan(0);
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
  });
});
