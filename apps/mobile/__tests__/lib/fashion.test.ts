/**
 * 패션/코디 추천 모듈 테스트
 */

import {
  calculateStyleCompatibility,
  getRecommendedStyles,
  generateOutfitCombination,
  determineHeightFit,
  recommendSize,
  STYLE_LABELS,
  STYLE_DESCRIPTIONS,
  STYLE_BY_PERSONAL_COLOR,
  STYLE_BY_BODY_TYPE,
} from '../../lib/fashion';

describe('fashion', () => {
  describe('calculateStyleCompatibility', () => {
    it('기본 점수 50', () => {
      expect(calculateStyleCompatibility('casual')).toBe(50);
    });

    it('퍼스널컬러 매칭 시 점수 상승', () => {
      const score = calculateStyleCompatibility('casual', 'spring');
      expect(score).toBeGreaterThan(50);
    });

    it('체형 매칭 시 점수 상승', () => {
      const score = calculateStyleCompatibility('casual', null, 'S');
      expect(score).toBeGreaterThan(50);
    });

    it('둘 다 매칭 시 최고 점수', () => {
      const score = calculateStyleCompatibility('casual', 'spring', 'S');
      expect(score).toBeGreaterThan(70);
    });

    it('최대 100점', () => {
      const score = calculateStyleCompatibility('casual', 'spring', 'S');
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecommendedStyles', () => {
    it('10개 스타일 모두 반환', () => {
      const styles = getRecommendedStyles();
      expect(styles.length).toBe(10);
    });

    it('호환성 내림차순 정렬', () => {
      const styles = getRecommendedStyles('spring', 'S');
      for (let i = 1; i < styles.length; i++) {
        expect(styles[i - 1].compatibility).toBeGreaterThanOrEqual(
          styles[i].compatibility
        );
      }
    });

    it('각 항목에 style, label, compatibility 포함', () => {
      const styles = getRecommendedStyles();
      styles.forEach((s) => {
        expect(s).toHaveProperty('style');
        expect(s).toHaveProperty('label');
        expect(s).toHaveProperty('compatibility');
      });
    });
  });

  describe('generateOutfitCombination', () => {
    it('코디 조합 생성', () => {
      const outfit = generateOutfitCombination('casual', 'spring', '출근');
      expect(outfit).toHaveProperty('id');
      expect(outfit).toHaveProperty('items');
      expect(outfit).toHaveProperty('style', 'casual');
      expect(outfit).toHaveProperty('occasion', '출근');
      expect(outfit).toHaveProperty('score');
      expect(outfit.items.length).toBeGreaterThan(0);
    });

    it('겨울에는 아우터 포함', () => {
      const outfit = generateOutfitCombination('classic', 'winter', '데이트');
      const hasOuter = outfit.items.some((i) => i.category === 'outer');
      expect(hasOuter).toBe(true);
    });

    it('여름에는 아우터 미포함', () => {
      const outfit = generateOutfitCombination('casual', 'summer', '나들이');
      const hasOuter = outfit.items.some((i) => i.category === 'outer');
      expect(hasOuter).toBe(false);
    });
  });

  describe('determineHeightFit', () => {
    it('여성 150cm는 petite', () => {
      expect(determineHeightFit(150, 'female')).toBe('petite');
    });

    it('여성 160cm는 short', () => {
      expect(determineHeightFit(160, 'female')).toBe('short');
    });

    it('여성 165cm는 regular', () => {
      expect(determineHeightFit(165, 'female')).toBe('regular');
    });

    it('남성 175cm는 regular', () => {
      expect(determineHeightFit(175, 'male')).toBe('regular');
    });
  });

  describe('recommendSize', () => {
    it('사이즈 추천 구조 반환', () => {
      const size = recommendSize(165, 55, 'female');
      expect(size).toHaveProperty('top');
      expect(size).toHaveProperty('bottom');
      expect(size).toHaveProperty('outer');
      expect(size).toHaveProperty('shoes');
      expect(size).toHaveProperty('fit');
    });

    it('BMI에 따라 사이즈 변동', () => {
      const small = recommendSize(165, 45, 'female');
      const large = recommendSize(165, 80, 'female');
      expect(small.top).not.toBe(large.top);
    });
  });

  describe('상수 검증', () => {
    it('10개 스타일 라벨', () => {
      expect(Object.keys(STYLE_LABELS).length).toBe(10);
    });

    it('10개 스타일 설명', () => {
      expect(Object.keys(STYLE_DESCRIPTIONS).length).toBe(10);
    });

    it('4계절 스타일 매핑', () => {
      expect(Object.keys(STYLE_BY_PERSONAL_COLOR).length).toBe(4);
    });

    it('3체형 스타일 매핑', () => {
      expect(Object.keys(STYLE_BY_BODY_TYPE).length).toBe(3);
    });
  });
});
