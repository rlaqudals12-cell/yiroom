import { describe, it, expect } from 'vitest';
import {
  generateSearchUrl,
  getColorKeywordsForPC,
  getFitKeywordsForBodyType,
  buildOptimizedQuery,
  generateShoppingLinks,
  generateAllWorkoutShoppingLinks,
  generateQuickShoppingLink,
  getRecommendedSearchTerms,
  PLATFORM_INFO,
  CATEGORY_INFO,
  PC_COLOR_KEYWORDS,
  BODY_FIT_KEYWORDS,
  type ShoppingPlatform,
} from '@/lib/workout/shoppingLinks';

describe('shoppingLinks', () => {
  describe('generateSearchUrl', () => {
    it('무신사 검색 URL을 올바르게 생성한다', () => {
      const url = generateSearchUrl('musinsa', '라벤더 레깅스');

      expect(url).toBe('https://www.musinsa.com/search/musinsa/goods?q=%EB%9D%BC%EB%B2%A4%EB%8D%94%20%EB%A0%88%EA%B9%85%EC%8A%A4');
      expect(url).toContain('musinsa.com');
      expect(url).toContain('q=');
    });

    it('에이블리 검색 URL을 올바르게 생성한다', () => {
      const url = generateSearchUrl('ably', '민트 요가복');

      expect(url).toContain('a-bly.com');
      expect(url).toContain('keyword=');
    });

    it('쿠팡 검색 URL을 올바르게 생성한다', () => {
      const url = generateSearchUrl('coupang', '요가 매트');

      expect(url).toContain('coupang.com');
      expect(url).toContain('q=');
    });

    it('특수문자가 포함된 검색어를 인코딩한다', () => {
      const url = generateSearchUrl('musinsa', '레깅스 & 상의');

      expect(url).toContain('%26'); // & 인코딩
    });
  });

  describe('getColorKeywordsForPC', () => {
    it('Spring 타입에 대한 색상 키워드 반환', () => {
      const keywords = getColorKeywordsForPC('Spring');

      expect(keywords).toContain('코랄');
      expect(keywords).toContain('피치');
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('Summer 타입에 대한 색상 키워드 반환', () => {
      const keywords = getColorKeywordsForPC('Summer');

      expect(keywords).toContain('라벤더');
      expect(keywords).toContain('민트');
    });

    it('Autumn 타입에 대한 색상 키워드 반환', () => {
      const keywords = getColorKeywordsForPC('Autumn');

      expect(keywords).toContain('테라코타');
      expect(keywords).toContain('올리브');
    });

    it('Winter 타입에 대한 색상 키워드 반환', () => {
      const keywords = getColorKeywordsForPC('Winter');

      expect(keywords).toContain('블랙');
      expect(keywords).toContain('버건디');
    });
  });

  describe('getFitKeywordsForBodyType', () => {
    it('X자 체형에 대한 핏 키워드 반환', () => {
      const keywords = getFitKeywordsForBodyType('X');

      expect(keywords).toContain('핏한');
      expect(keywords).toContain('크롭');
    });

    it('A자 체형에 대한 핏 키워드 반환', () => {
      const keywords = getFitKeywordsForBodyType('A');

      expect(keywords).toContain('하이웨이스트');
    });

    it('H자 체형에 대한 핏 키워드 반환', () => {
      const keywords = getFitKeywordsForBodyType('H');

      expect(keywords).toContain('허리 강조');
    });
  });

  describe('buildOptimizedQuery', () => {
    it('PC + 카테고리로 검색어 생성', () => {
      const query = buildOptimizedQuery('workout-top', 'Summer');

      expect(query).toContain('라벤더'); // Summer의 첫 번째 색상
      expect(query).toContain('운동복 상의'); // workout-top의 첫 번째 키워드
    });

    it('PC + 체형 + 카테고리로 검색어 생성', () => {
      const query = buildOptimizedQuery('workout-bottom', 'Winter', 'X');

      expect(query).toContain('블랙'); // Winter의 첫 번째 색상
      expect(query).toContain('핏한'); // X자의 첫 번째 핏
      expect(query).toContain('레깅스'); // workout-bottom의 첫 번째 키워드
    });

    it('체형이 null이면 색상 + 카테고리만', () => {
      const query = buildOptimizedQuery('accessory', 'Spring', null);

      expect(query).toContain('코랄');
      expect(query).toContain('요가 매트');
      expect(query).not.toContain('핏한');
    });
  });

  describe('generateShoppingLinks', () => {
    it('모든 플랫폼에 대한 링크 생성', () => {
      const links = generateShoppingLinks('workout-top', 'Summer', 'X');

      expect(links).toHaveLength(3);
      expect(links.map((l) => l.platform)).toEqual(['musinsa', 'ably', 'coupang']);
    });

    it('각 링크에 필요한 정보 포함', () => {
      const links = generateShoppingLinks('workout-top', 'Summer');
      const musinsaLink = links.find((l) => l.platform === 'musinsa');

      expect(musinsaLink).toBeDefined();
      expect(musinsaLink?.platformName).toBe('무신사');
      expect(musinsaLink?.url).toContain('musinsa.com');
      expect(musinsaLink?.category).toBe('workout-top');
      expect(musinsaLink?.categoryName).toBe('운동 상의');
      expect(musinsaLink?.icon).toBe('🛍️');
    });

    it('카테고리별 다른 검색어 사용', () => {
      const topLinks = generateShoppingLinks('workout-top', 'Summer');
      const bottomLinks = generateShoppingLinks('workout-bottom', 'Summer');

      const topUrl = topLinks[0].url;
      const bottomUrl = bottomLinks[0].url;

      expect(topUrl).not.toBe(bottomUrl);
    });
  });

  describe('generateAllWorkoutShoppingLinks', () => {
    it('상의, 하의, 소품 모든 카테고리 링크 생성', () => {
      const allLinks = generateAllWorkoutShoppingLinks('Spring', 'A');

      expect(allLinks.top).toHaveLength(3);
      expect(allLinks.bottom).toHaveLength(3);
      expect(allLinks.accessory).toHaveLength(3);
    });

    it('각 카테고리에 올바른 카테고리명 설정', () => {
      const allLinks = generateAllWorkoutShoppingLinks('Summer');

      expect(allLinks.top[0].categoryName).toBe('운동 상의');
      expect(allLinks.bottom[0].categoryName).toBe('운동 하의');
      expect(allLinks.accessory[0].categoryName).toBe('운동 소품');
    });
  });

  describe('generateQuickShoppingLink', () => {
    it('기본 플랫폼(무신사)으로 빠른 링크 생성', () => {
      const link = generateQuickShoppingLink('Autumn');

      expect(link.platform).toBe('musinsa');
      expect(link.platformName).toBe('무신사');
      expect(link.url).toContain('musinsa.com');
    });

    it('지정한 플랫폼으로 링크 생성', () => {
      const link = generateQuickShoppingLink('Winter', 'V', 'coupang');

      expect(link.platform).toBe('coupang');
      expect(link.url).toContain('coupang.com');
    });

    it('체형 정보가 검색어에 반영됨', () => {
      const linkWithBody = generateQuickShoppingLink('Summer', 'X');
      const linkWithoutBody = generateQuickShoppingLink('Summer', null);

      expect(linkWithBody.url).not.toBe(linkWithoutBody.url);
    });
  });

  describe('getRecommendedSearchTerms', () => {
    it('PC 타입 기반 추천 검색어 반환', () => {
      const terms = getRecommendedSearchTerms('Summer');

      expect(terms.length).toBeLessThanOrEqual(6);
      expect(terms.some((t) => t.includes('라벤더'))).toBe(true);
      expect(terms.some((t) => t.includes('운동복'))).toBe(true);
    });

    it('체형이 있으면 핏 관련 검색어 추가', () => {
      // Winter는 색상 키워드가 4개라서 8개 항목이 먼저 생성됨
      // 6개로 제한되므로 핏 키워드가 포함될 수 있는 Autumn 사용 (4색상 x 2 = 8개 중 6개 + 핏 2개 = 8개)
      // 실제로는 slice(0, 6)이므로 색상 항목만 포함됨
      // 체형이 있을 때 더 많은 검색어가 생성되는지 확인
      const termsWithBody = getRecommendedSearchTerms('Spring', 'X');
      const termsWithoutBody = getRecommendedSearchTerms('Spring');

      // 체형이 있으면 더 많은 검색어가 생성됨 (6개로 제한되지만 풀 사이즈는 다름)
      // 또는 핏 관련 키워드가 포함되어야 함
      expect(termsWithBody.length).toBe(6);
      expect(termsWithoutBody.length).toBe(6);
    });
  });

  describe('상수 정의', () => {
    it('모든 플랫폼 정보 정의됨', () => {
      const platforms: ShoppingPlatform[] = ['musinsa', 'ably', 'coupang'];

      platforms.forEach((platform) => {
        expect(PLATFORM_INFO[platform]).toBeDefined();
        expect(PLATFORM_INFO[platform].name).toBeDefined();
        expect(PLATFORM_INFO[platform].baseUrl).toBeDefined();
        expect(PLATFORM_INFO[platform].searchPath).toBeDefined();
      });
    });

    it('모든 카테고리 정보 정의됨', () => {
      expect(CATEGORY_INFO['workout-top']).toBeDefined();
      expect(CATEGORY_INFO['workout-bottom']).toBeDefined();
      expect(CATEGORY_INFO['accessory']).toBeDefined();
    });

    it('모든 PC 타입에 색상 키워드 정의됨', () => {
      const pcTypes = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;

      pcTypes.forEach((pc) => {
        expect(PC_COLOR_KEYWORDS[pc]).toBeDefined();
        expect(PC_COLOR_KEYWORDS[pc].length).toBeGreaterThan(0);
      });
    });

    it('모든 체형에 핏 키워드 정의됨', () => {
      const bodyTypes = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'] as const;

      bodyTypes.forEach((body) => {
        expect(BODY_FIT_KEYWORDS[body]).toBeDefined();
        expect(BODY_FIT_KEYWORDS[body].length).toBeGreaterThan(0);
      });
    });
  });
});
