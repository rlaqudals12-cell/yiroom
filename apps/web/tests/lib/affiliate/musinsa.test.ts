/**
 * 무신사 API 클라이언트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchMusinsaProducts,
  createMusinsaDeeplink,
  getMusinsaCategoryProducts,
  isMusinsaConfigured,
  MUSINSA_CATEGORIES,
} from '@/lib/affiliate/musinsa';

describe('Musinsa API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchMusinsaProducts', () => {
    it('키워드로 Mock 제품을 검색한다', async () => {
      const products = await searchMusinsaProducts({
        keyword: '반팔',
        limit: 10,
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
    });

    it('검색 결과는 AffiliateProduct 형태를 따른다', async () => {
      const products = await searchMusinsaProducts({
        keyword: '맨투맨',
        limit: 5,
      });

      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('partnerId');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('priceKrw');
        expect(product).toHaveProperty('affiliateUrl');
        expect(product.partnerId).toBe('musinsa');
      }
    });

    it('limit을 적용한다', async () => {
      const products = await searchMusinsaProducts({
        keyword: '',
        limit: 3,
      });

      expect(products.length).toBeLessThanOrEqual(3);
    });

    it('subId를 딥링크에 포함시킨다', async () => {
      const products = await searchMusinsaProducts({
        keyword: '티셔츠',
        subId: 'test-campaign',
      });

      if (products.length > 0) {
        expect(products[0].affiliateUrl).toContain('test-campaign');
      }
    });

    it('카테고리로 필터링한다', async () => {
      const products = await searchMusinsaProducts({
        keyword: '',
        category: 'outer',
        limit: 10,
      });

      products.forEach((product) => {
        expect(product.category).toBe('outer');
      });
    });

    it('가격이 KRW로 표시된다', async () => {
      const products = await searchMusinsaProducts({
        keyword: '',
        limit: 1,
      });

      if (products.length > 0) {
        expect(products[0].currency).toBe('KRW');
        expect(products[0].priceKrw).toBeGreaterThan(0);
      }
    });
  });

  describe('createMusinsaDeeplink', () => {
    it('Mock 딥링크를 생성한다', async () => {
      const url = 'https://www.musinsa.com/app/goods/12345';
      const deeplink = await createMusinsaDeeplink(url);

      expect(deeplink).toContain('musinsa.com');
      expect(deeplink).toContain('curator=MOCK');
    });

    it('subId를 포함한 딥링크를 생성한다', async () => {
      const url = 'https://www.musinsa.com/app/goods/12345';
      const deeplink = await createMusinsaDeeplink(url, 'my-campaign');

      expect(deeplink).toContain('utm_source=my-campaign');
    });

    it('쿼리 파라미터가 있는 URL도 처리한다', async () => {
      const url = 'https://www.musinsa.com/app/goods/12345?size=M';
      const deeplink = await createMusinsaDeeplink(url);

      expect(deeplink).toContain('curator=MOCK');
      expect(deeplink).toContain('size=M');
    });
  });

  describe('getMusinsaCategoryProducts', () => {
    it('카테고리별 제품을 조회한다', async () => {
      const products = await getMusinsaCategoryProducts('top', 5);

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
    });

    it('subId를 전달할 수 있다', async () => {
      const products = await getMusinsaCategoryProducts('shoes', 5, 'category-test');

      if (products.length > 0) {
        expect(products[0].affiliateUrl).toContain('category-test');
      }
    });
  });

  describe('isMusinsaConfigured', () => {
    it('환경변수 미설정 시 false를 반환한다', () => {
      // 테스트 환경에서는 환경변수가 없으므로 false
      expect(isMusinsaConfigured()).toBe(false);
    });
  });

  describe('MUSINSA_CATEGORIES', () => {
    it('모든 카테고리가 정의되어 있다', () => {
      expect(MUSINSA_CATEGORIES).toHaveProperty('top');
      expect(MUSINSA_CATEGORIES).toHaveProperty('outer');
      expect(MUSINSA_CATEGORIES).toHaveProperty('pants');
      expect(MUSINSA_CATEGORIES).toHaveProperty('onepiece');
      expect(MUSINSA_CATEGORIES).toHaveProperty('skirt');
      expect(MUSINSA_CATEGORIES).toHaveProperty('bag');
      expect(MUSINSA_CATEGORIES).toHaveProperty('shoes');
      expect(MUSINSA_CATEGORIES).toHaveProperty('accessory');
    });

    it('각 카테고리에 한국어 이름과 ID가 있다', () => {
      Object.values(MUSINSA_CATEGORIES).forEach((category) => {
        expect(category).toHaveProperty('ko');
        expect(category).toHaveProperty('id');
        expect(typeof category.ko).toBe('string');
        expect(typeof category.id).toBe('string');
      });
    });
  });
});
