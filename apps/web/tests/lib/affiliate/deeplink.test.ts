/**
 * 딥링크 생성 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDeeplink,
  createMultipleDeeplinks,
  extractProductId,
  isValidDeeplink,
  getDeeplinkFormat,
} from '@/lib/affiliate/deeplink';
import type { AffiliatePartnerName } from '@/types/affiliate';

// coupang 모듈 모킹
vi.mock('@/lib/affiliate/coupang', () => ({
  createCoupangDeeplink: vi.fn().mockResolvedValue(
    'https://link.coupang.com/a/mock?subId=test'
  ),
}));

describe('deeplink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDeeplink', () => {
    it('쿠팡 딥링크를 생성한다', async () => {
      const result = await createDeeplink({
        partner: 'coupang',
        productUrl: 'https://www.coupang.com/vp/products/123456',
        subId: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('coupang');
      expect(result.url).toContain('link.coupang.com');
    });

    it('iHerb 딥링크를 생성한다', async () => {
      const result = await createDeeplink({
        partner: 'iherb',
        productUrl: 'https://kr.iherb.com/pr/product/12345',
        subId: 'campaign1',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('iherb');
      expect(result.url).toContain('pcode=');
      expect(result.url).toContain('rcode=campaign1');
    });

    it('무신사 딥링크를 생성한다', async () => {
      const result = await createDeeplink({
        partner: 'musinsa',
        productUrl: 'https://www.musinsa.com/app/goods/123456',
        subId: 'general',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('musinsa');
      expect(result.url).toContain('utm_source=curator');
    });

    it('지원하지 않는 파트너는 실패를 반환한다', async () => {
      const result = await createDeeplink({
        partner: 'unknown' as AffiliatePartnerName,
        productUrl: 'https://example.com/product',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('지원하지 않는');
    });
  });

  describe('createMultipleDeeplinks', () => {
    it('여러 파트너의 딥링크를 일괄 생성한다', async () => {
      const urls = new Map<AffiliatePartnerName, string>([
        ['coupang', 'https://www.coupang.com/vp/products/123'],
        ['iherb', 'https://kr.iherb.com/pr/product/456'],
      ]);

      const results = await createMultipleDeeplinks(urls, 'bulk-test');

      expect(results.size).toBe(2);
      expect(results.get('coupang')?.success).toBe(true);
      expect(results.get('iherb')?.success).toBe(true);
    });
  });

  describe('extractProductId', () => {
    it('쿠팡 URL에서 제품 ID를 추출한다', () => {
      const id = extractProductId(
        'https://www.coupang.com/vp/products/123456789',
        'coupang'
      );
      expect(id).toBe('123456789');
    });

    it('iHerb URL에서 제품 ID를 추출한다', () => {
      const id = extractProductId(
        'https://kr.iherb.com/pr/product-name/12345',
        'iherb'
      );
      expect(id).toBe('12345');
    });

    it('무신사 URL에서 제품 ID를 추출한다', () => {
      const id = extractProductId(
        'https://www.musinsa.com/app/goods/123456',
        'musinsa'
      );
      expect(id).toBe('123456');
    });

    it('유효하지 않은 URL은 null을 반환한다', () => {
      const id = extractProductId('invalid-url', 'coupang');
      expect(id).toBeNull();
    });

    it('패턴이 맞지 않으면 null을 반환한다', () => {
      const id = extractProductId(
        'https://www.coupang.com/other/path',
        'coupang'
      );
      expect(id).toBeNull();
    });
  });

  describe('isValidDeeplink', () => {
    it('유효한 쿠팡 딥링크를 검증한다', () => {
      expect(isValidDeeplink('https://link.coupang.com/a/123')).toBe(true);
      expect(isValidDeeplink('https://www.coupang.com/vp/products/123')).toBe(true);
    });

    it('유효한 iHerb 딥링크를 검증한다', () => {
      expect(isValidDeeplink('https://kr.iherb.com/pr/product/123')).toBe(true);
      expect(isValidDeeplink('https://www.iherb.com/pr/product/123')).toBe(true);
    });

    it('유효한 무신사 딥링크를 검증한다', () => {
      expect(isValidDeeplink('https://www.musinsa.com/app/goods/123')).toBe(true);
    });

    it('유효하지 않은 URL은 false를 반환한다', () => {
      expect(isValidDeeplink('https://example.com/product')).toBe(false);
      expect(isValidDeeplink('invalid-url')).toBe(false);
    });
  });

  describe('getDeeplinkFormat', () => {
    it('쿠팡 딥링크 형식을 반환한다', () => {
      const format = getDeeplinkFormat('coupang');
      expect(format).toContain('link.coupang.com');
      expect(format).toContain('{productId}');
    });

    it('iHerb 딥링크 형식을 반환한다', () => {
      const format = getDeeplinkFormat('iherb');
      expect(format).toContain('iherb.com');
      expect(format).toContain('{productId}');
    });

    it('무신사 딥링크 형식을 반환한다', () => {
      const format = getDeeplinkFormat('musinsa');
      expect(format).toContain('musinsa.com');
      expect(format).toContain('{productId}');
    });

    it('지원하지 않는 파트너는 빈 문자열을 반환한다', () => {
      const format = getDeeplinkFormat('unknown' as AffiliatePartnerName);
      expect(format).toBe('');
    });
  });
});
