/**
 * iHerb API 클라이언트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchIHerbProducts,
  createIHerbDeeplink,
  getIHerbCategoryProducts,
  isIHerbConfigured,
  IHERB_CATEGORIES,
} from '@/lib/affiliate/iherb';

describe('iHerb API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchIHerbProducts', () => {
    it('키워드로 Mock 제품을 검색한다', async () => {
      const products = await searchIHerbProducts({
        keyword: '비타민',
        limit: 10,
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
    });

    it('검색 결과는 AffiliateProduct 형태를 따른다', async () => {
      const products = await searchIHerbProducts({
        keyword: '오메가',
        limit: 5,
      });

      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('partnerId');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('priceKrw');
        expect(product).toHaveProperty('affiliateUrl');
        expect(product.partnerId).toBe('iherb');
      }
    });

    it('limit을 적용한다', async () => {
      const products = await searchIHerbProducts({
        keyword: '',
        limit: 3,
      });

      expect(products.length).toBeLessThanOrEqual(3);
    });

    it('subId를 딥링크에 포함시킨다', async () => {
      const products = await searchIHerbProducts({
        keyword: '단백질',
        subId: 'test-campaign',
      });

      if (products.length > 0) {
        expect(products[0].affiliateUrl).toContain('test-campaign');
      }
    });

    it('가격을 KRW로 변환한다', async () => {
      const products = await searchIHerbProducts({
        keyword: '비타민',
        limit: 1,
      });

      if (products.length > 0) {
        // USD to KRW 환율 적용 확인 (대략 1300~1400 사이)
        expect(products[0].priceKrw).toBeGreaterThan(1000);
      }
    });
  });

  describe('createIHerbDeeplink', () => {
    it('Mock 딥링크를 생성한다', async () => {
      const url = 'https://kr.iherb.com/pr/test-product/12345';
      const deeplink = await createIHerbDeeplink(url);

      expect(deeplink).toContain('kr.iherb.com');
      expect(deeplink).toContain('rcode=MOCK');
    });

    it('subId를 포함한 딥링크를 생성한다', async () => {
      const url = 'https://kr.iherb.com/pr/test-product/12345';
      const deeplink = await createIHerbDeeplink(url, 'my-campaign');

      expect(deeplink).toContain('pcode=my-campaign');
    });

    it('쿼리 파라미터가 있는 URL도 처리한다', async () => {
      const url = 'https://kr.iherb.com/pr/test-product/12345?ref=popular';
      const deeplink = await createIHerbDeeplink(url);

      expect(deeplink).toContain('rcode=MOCK');
      expect(deeplink).toContain('ref=popular');
    });
  });

  describe('getIHerbCategoryProducts', () => {
    it('카테고리별 제품을 조회한다', async () => {
      const products = await getIHerbCategoryProducts('supplements', 5);

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
    });

    it('subId를 전달할 수 있다', async () => {
      const products = await getIHerbCategoryProducts('vitamins', 5, 'category-test');

      if (products.length > 0) {
        expect(products[0].affiliateUrl).toContain('category-test');
      }
    });
  });

  describe('isIHerbConfigured', () => {
    it('환경변수 미설정 시 false를 반환한다', () => {
      // 테스트 환경에서는 환경변수가 없으므로 false
      expect(isIHerbConfigured()).toBe(false);
    });
  });

  describe('IHERB_CATEGORIES', () => {
    it('모든 카테고리가 정의되어 있다', () => {
      expect(IHERB_CATEGORIES).toHaveProperty('supplements');
      expect(IHERB_CATEGORIES).toHaveProperty('vitamins');
      expect(IHERB_CATEGORIES).toHaveProperty('sports');
      expect(IHERB_CATEGORIES).toHaveProperty('beauty');
      expect(IHERB_CATEGORIES).toHaveProperty('bath');
      expect(IHERB_CATEGORIES).toHaveProperty('grocery');
      expect(IHERB_CATEGORIES).toHaveProperty('baby');
      expect(IHERB_CATEGORIES).toHaveProperty('pets');
    });

    it('각 카테고리에 한국어 이름과 ID가 있다', () => {
      Object.values(IHERB_CATEGORIES).forEach((category) => {
        expect(category).toHaveProperty('ko');
        expect(category).toHaveProperty('id');
        expect(typeof category.ko).toBe('string');
        expect(typeof category.id).toBe('string');
      });
    });
  });
});
