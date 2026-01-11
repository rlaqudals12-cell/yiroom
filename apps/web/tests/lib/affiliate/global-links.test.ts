/**
 * 글로벌 어필리에이트 링크 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  createGlobalDeeplink,
  createRegionalDeeplinks,
  getRegionalPartners,
  getPartnerInfo,
  isAffiliateSupported,
  GLOBAL_PARTNER_CONFIG,
} from '@/lib/affiliate/global-links';

describe('Global Affiliate Links', () => {
  describe('createGlobalDeeplink', () => {
    it('iHerb 검색 링크 생성', () => {
      const result = createGlobalDeeplink({
        partner: 'iherb',
        query: 'vitamin c',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('iherb');
      expect(result.displayName).toBe('아이허브');
      expect(result.url).toContain('kr.iherb.com');
      expect(result.url).toContain('kw=vitamin');
    });

    it('Amazon US 검색 링크 생성', () => {
      const result = createGlobalDeeplink({
        partner: 'amazon_us',
        query: 'serum',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('amazon_us');
      expect(result.displayName).toBe('아마존 (미국)');
      expect(result.url).toContain('amazon.com');
      expect(result.url).toContain('k=serum');
    });

    it('Amazon JP 검색 링크 생성', () => {
      const result = createGlobalDeeplink({
        partner: 'amazon_jp',
        query: '化粧水',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('amazon_jp');
      expect(result.url).toContain('amazon.co.jp');
    });

    it('Rakuten 검색 링크 생성', () => {
      const result = createGlobalDeeplink({
        partner: 'rakuten',
        query: 'スキンケア',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('rakuten');
      expect(result.displayName).toBe('라쿠텐');
      expect(result.url).toContain('rakuten.co.jp');
    });

    it('쿠팡 검색 링크 생성', () => {
      const result = createGlobalDeeplink({
        partner: 'coupang',
        query: '선크림',
      });

      expect(result.success).toBe(true);
      expect(result.partner).toBe('coupang');
      expect(result.displayName).toBe('쿠팡');
      expect(result.url).toContain('coupang.com');
    });

    it('subId가 있으면 포함', () => {
      const result = createGlobalDeeplink({
        partner: 'iherb',
        query: 'vitamin',
        subId: 'campaign123',
      });

      expect(result.url).toContain('rcode=campaign123');
    });

    it('지원하지 않는 파트너는 실패', () => {
      const result = createGlobalDeeplink({
        partner: 'unknown_partner' as any,
        query: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('지원하지 않는 파트너');
    });
  });

  describe('createRegionalDeeplinks', () => {
    it('한국 지역은 coupang, iherb 링크 생성', () => {
      const results = createRegionalDeeplinks('KR', '비타민');

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.partner)).toContain('coupang');
      expect(results.map((r) => r.partner)).toContain('iherb');
    });

    it('미국 지역은 amazon_us, iherb 링크 생성', () => {
      const results = createRegionalDeeplinks('US', 'vitamin');

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.partner)).toContain('amazon_us');
      expect(results.map((r) => r.partner)).toContain('iherb');
    });

    it('일본 지역은 amazon_jp, rakuten 링크 생성', () => {
      const results = createRegionalDeeplinks('JP', '化粧品');

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.partner)).toContain('amazon_jp');
      expect(results.map((r) => r.partner)).toContain('rakuten');
    });

    it('유럽 지역은 amazon_eu, iherb 링크 생성', () => {
      const results = createRegionalDeeplinks('EU', 'skincare');

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.partner)).toContain('amazon_eu');
      expect(results.map((r) => r.partner)).toContain('iherb');
    });

    it('어필리에이트 미지원 지역은 빈 배열', () => {
      const results = createRegionalDeeplinks('CN', '护肤品');

      expect(results).toHaveLength(0);
    });
  });

  describe('getRegionalPartners', () => {
    it('한국 파트너 목록 반환', () => {
      const partners = getRegionalPartners('KR');

      expect(partners).toContain('coupang');
      expect(partners).toContain('iherb');
    });

    it('미국 파트너 목록 반환', () => {
      const partners = getRegionalPartners('US');

      expect(partners).toContain('amazon_us');
      expect(partners).toContain('iherb');
    });

    it('일본 파트너 목록 반환', () => {
      const partners = getRegionalPartners('JP');

      expect(partners).toContain('amazon_jp');
      expect(partners).toContain('rakuten');
    });
  });

  describe('getPartnerInfo', () => {
    it('파트너 정보 반환', () => {
      const info = getPartnerInfo('iherb');

      expect(info).not.toBeNull();
      expect(info?.displayName).toBe('iHerb');
      expect(info?.displayNameKo).toBe('아이허브');
    });

    it('존재하지 않는 파트너는 null', () => {
      const info = getPartnerInfo('unknown' as any);

      expect(info).toBeNull();
    });
  });

  describe('isAffiliateSupported', () => {
    it('한국은 어필리에이트 지원', () => {
      expect(isAffiliateSupported('KR')).toBe(true);
    });

    it('미국은 어필리에이트 지원', () => {
      expect(isAffiliateSupported('US')).toBe(true);
    });

    it('일본은 어필리에이트 지원', () => {
      expect(isAffiliateSupported('JP')).toBe(true);
    });

    it('중국은 어필리에이트 미지원', () => {
      expect(isAffiliateSupported('CN')).toBe(false);
    });

    it('동남아는 어필리에이트 미지원', () => {
      expect(isAffiliateSupported('SEA')).toBe(false);
    });
  });

  describe('GLOBAL_PARTNER_CONFIG', () => {
    it('모든 파트너 설정 존재', () => {
      const partners = ['coupang', 'iherb', 'amazon_us', 'amazon_jp', 'amazon_eu', 'rakuten'];

      for (const partner of partners) {
        expect(GLOBAL_PARTNER_CONFIG[partner as keyof typeof GLOBAL_PARTNER_CONFIG]).toBeDefined();
      }
    });

    it('파트너별 필수 필드 존재', () => {
      for (const [, config] of Object.entries(GLOBAL_PARTNER_CONFIG)) {
        expect(config.displayName).toBeDefined();
        expect(config.displayNameKo).toBeDefined();
        expect(config.baseUrl).toBeDefined();
        expect(config.searchPath).toBeDefined();
      }
    });
  });
});
