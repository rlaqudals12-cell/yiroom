/**
 * 콘텐츠 적응 모듈 테스트
 */

import {
  getGenderAdaptiveTerm,
  filterCategoriesByGender,
  getProductCategoryLabel,
  getStyleSectionTitle,
  getAccessoryRecommendations,
  isValidGenderProfile,
  createDefaultGenderProfile,
} from '../../lib/content';

describe('content', () => {
  describe('getGenderAdaptiveTerm', () => {
    it('여성용 용어 반환', () => {
      expect(getGenderAdaptiveTerm('화사한', 'female')).toBe('화사한');
    });

    it('남성용 용어 반환', () => {
      expect(getGenderAdaptiveTerm('화사한', 'male')).toBe('깔끔한');
    });

    it('중립 용어 반환', () => {
      expect(getGenderAdaptiveTerm('화사한', 'neutral')).toBe('밝은');
    });

    it('없는 용어는 원본 반환', () => {
      expect(getGenderAdaptiveTerm('알 수 없는 용어', 'female')).toBe('알 수 없는 용어');
    });
  });

  describe('filterCategoriesByGender', () => {
    it('남성에서 립스틱 제외', () => {
      const categories = ['moisturizer', 'lipstick', 'sunscreen'];
      const filtered = filterCategoriesByGender(categories, 'male');
      expect(filtered).not.toContain('lipstick');
      expect(filtered).toContain('moisturizer');
    });

    it('여성에서 넥타이 제외', () => {
      const categories = ['moisturizer', 'tie', 'sunscreen'];
      const filtered = filterCategoriesByGender(categories, 'female');
      expect(filtered).not.toContain('tie');
    });

    it('중립은 모두 포함', () => {
      const categories = ['moisturizer', 'lipstick', 'tie'];
      const filtered = filterCategoriesByGender(categories, 'neutral');
      expect(filtered.length).toBe(3);
    });
  });

  describe('getProductCategoryLabel', () => {
    it('수분크림 라벨', () => {
      expect(getProductCategoryLabel('moisturizer', 'female')).toBe('수분크림');
    });

    it('향수/코롱 성별 차이', () => {
      expect(getProductCategoryLabel('fragrance', 'female')).toBe('향수');
      expect(getProductCategoryLabel('fragrance', 'male')).toBe('코롱');
    });

    it('없는 카테고리는 원본 반환', () => {
      expect(getProductCategoryLabel('unknown', 'female')).toBe('unknown');
    });
  });

  describe('getStyleSectionTitle', () => {
    it('액세서리 섹션 성별 차이', () => {
      expect(getStyleSectionTitle('accessories', 'female')).toBe('액세서리 추천');
      expect(getStyleSectionTitle('accessories', 'male')).toBe('소품 추천');
    });
  });

  describe('getAccessoryRecommendations', () => {
    it('특정 시즌 추천', () => {
      const recs = getAccessoryRecommendations('female', 'spring');
      expect(recs.length).toBe(1);
      expect(recs[0].season).toBe('spring');
      expect(recs[0].items.length).toBeGreaterThan(0);
    });

    it('전체 시즌 추천', () => {
      const recs = getAccessoryRecommendations('male');
      expect(recs.length).toBe(4);
    });

    it('없는 시즌은 빈 배열', () => {
      const recs = getAccessoryRecommendations('female', 'nonexistent');
      expect(recs.length).toBe(0);
    });
  });

  describe('isValidGenderProfile', () => {
    it('유효한 프로필', () => {
      expect(isValidGenderProfile({ gender: 'female', stylePreference: 'feminine' })).toBe(true);
    });

    it('null은 유효하지 않음', () => {
      expect(isValidGenderProfile(null)).toBe(false);
    });

    it('잘못된 값은 유효하지 않음', () => {
      expect(isValidGenderProfile({ gender: 'invalid', stylePreference: 'unisex' })).toBe(false);
    });
  });

  describe('createDefaultGenderProfile', () => {
    it('기본 프로필은 neutral/unisex', () => {
      const profile = createDefaultGenderProfile();
      expect(profile.gender).toBe('neutral');
      expect(profile.stylePreference).toBe('unisex');
    });
  });
});
