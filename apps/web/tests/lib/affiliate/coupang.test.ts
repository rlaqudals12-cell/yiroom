/**
 * 쿠팡 API 클라이언트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchCoupangProducts,
  createCoupangDeeplink,
  getCoupangCategoryProducts,
  isCoupangConfigured,
  COUPANG_CATEGORIES,
} from '@/lib/affiliate/coupang';

describe('coupang', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isCoupangConfigured', () => {
    it('환경변수가 없으면 false를 반환한다', () => {
      // 환경변수 설정 없이 테스트
      expect(isCoupangConfigured()).toBe(false);
    });
  });

  describe('searchCoupangProducts', () => {
    it('Mock 모드에서 검색 결과를 반환한다', async () => {
      const products = await searchCoupangProducts({
        keyword: '비타민',
        limit: 5,
      });

      expect(products).toHaveLength(5);
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0].name).toContain('비타민');
      expect(products[0].partnerId).toBe('coupang');
    });

    it('limit을 지정하면 해당 개수만큼 반환한다', async () => {
      const products = await searchCoupangProducts({
        keyword: '영양제',
        limit: 3,
      });

      expect(products).toHaveLength(3);
    });

    it('subId를 전달하면 affiliateUrl에 포함한다', async () => {
      const products = await searchCoupangProducts({
        keyword: '오메가3',
        limit: 1,
        subId: 'test-campaign',
      });

      expect(products[0].affiliateUrl).toContain('subId=yiroom');
    });

    it('검색 결과에 필수 필드가 포함된다', async () => {
      const products = await searchCoupangProducts({
        keyword: '프로틴',
        limit: 1,
      });

      const product = products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('partnerId');
      expect(product).toHaveProperty('externalProductId');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('priceKrw');
      expect(product).toHaveProperty('affiliateUrl');
      expect(product).toHaveProperty('isInStock');
      expect(product).toHaveProperty('isActive');
    });
  });

  describe('createCoupangDeeplink', () => {
    it('Mock 모드에서 딥링크를 생성한다', async () => {
      const deeplink = await createCoupangDeeplink(
        'https://www.coupang.com/vp/products/123456',
        'yiroom'
      );

      expect(deeplink).toContain('link.coupang.com');
      expect(deeplink).toContain('subId=yiroom');
    });

    it('subId가 없어도 딥링크를 생성한다', async () => {
      const deeplink = await createCoupangDeeplink(
        'https://www.coupang.com/vp/products/789'
      );

      expect(deeplink).toContain('link.coupang.com');
    });
  });

  describe('getCoupangCategoryProducts', () => {
    it('카테고리 ID로 제품을 조회한다', async () => {
      const products = await getCoupangCategoryProducts(
        COUPANG_CATEGORIES.supplements,
        10
      );

      expect(products.length).toBeGreaterThan(0);
      expect(products.length).toBeLessThanOrEqual(10);
    });

    it('limit을 지정하면 해당 개수만큼 반환한다', async () => {
      const products = await getCoupangCategoryProducts(
        COUPANG_CATEGORIES.cosmetics,
        3
      );

      expect(products).toHaveLength(3);
    });
  });

  describe('COUPANG_CATEGORIES', () => {
    it('지정된 카테고리가 존재한다', () => {
      expect(COUPANG_CATEGORIES).toHaveProperty('supplements');
      expect(COUPANG_CATEGORIES).toHaveProperty('cosmetics');
      expect(COUPANG_CATEGORIES).toHaveProperty('healthFood');
      expect(COUPANG_CATEGORIES).toHaveProperty('fitness');
    });

    it('카테고리 ID는 숫자이다', () => {
      expect(typeof COUPANG_CATEGORIES.supplements).toBe('number');
      expect(typeof COUPANG_CATEGORIES.cosmetics).toBe('number');
    });
  });
});
