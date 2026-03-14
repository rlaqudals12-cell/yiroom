/**
 * 클릭 가드 (중복/어뷰징 방지) 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  isDuplicateClick,
  isRateLimited,
  isSuspiciousUserAgent,
  validateClick,
  _resetClickGuardCache,
} from '@/lib/affiliate/click-guard';

describe('click-guard', () => {
  beforeEach(() => {
    _resetClickGuardCache();
  });

  // ============================================
  // isDuplicateClick
  // ============================================
  describe('isDuplicateClick', () => {
    it('첫 클릭은 중복 아님', () => {
      expect(isDuplicateClick('user1', 'product1')).toBe(false);
    });

    it('같은 사용자+제품 연속 클릭은 중복', () => {
      isDuplicateClick('user1', 'product1');
      expect(isDuplicateClick('user1', 'product1')).toBe(true);
    });

    it('같은 사용자 다른 제품은 중복 아님', () => {
      isDuplicateClick('user1', 'product1');
      expect(isDuplicateClick('user1', 'product2')).toBe(false);
    });

    it('다른 사용자 같은 제품은 중복 아님', () => {
      isDuplicateClick('user1', 'product1');
      expect(isDuplicateClick('user2', 'product1')).toBe(false);
    });

    it('userId 없으면 sessionId 사용', () => {
      isDuplicateClick(null, 'product1', 'session1');
      expect(isDuplicateClick(null, 'product1', 'session1')).toBe(true);
    });

    it('식별자 없으면 통과', () => {
      expect(isDuplicateClick(null, 'product1')).toBe(false);
      expect(isDuplicateClick(null, 'product1')).toBe(false);
    });

    it('userId 우선 사용', () => {
      isDuplicateClick('user1', 'product1', 'session1');
      // 같은 userId → 중복
      expect(isDuplicateClick('user1', 'product1', 'session2')).toBe(true);
    });
  });

  // ============================================
  // isRateLimited
  // ============================================
  describe('isRateLimited', () => {
    it('첫 요청은 제한 안 됨', () => {
      expect(isRateLimited('ip-hash-1')).toBe(false);
    });

    it('10회까지 허용', () => {
      for (let i = 0; i < 10; i++) {
        expect(isRateLimited('ip-hash-2')).toBe(false);
      }
    });

    it('11회째부터 제한', () => {
      for (let i = 0; i < 10; i++) {
        isRateLimited('ip-hash-3');
      }
      expect(isRateLimited('ip-hash-3')).toBe(true);
    });

    it('다른 IP는 독립 카운트', () => {
      for (let i = 0; i < 10; i++) {
        isRateLimited('ip-a');
      }
      // ip-a는 제한됨
      expect(isRateLimited('ip-a')).toBe(true);
      // ip-b는 아직 여유
      expect(isRateLimited('ip-b')).toBe(false);
    });
  });

  // ============================================
  // isSuspiciousUserAgent
  // ============================================
  describe('isSuspiciousUserAgent', () => {
    it('null UA는 의심', () => {
      expect(isSuspiciousUserAgent(null)).toBe(true);
    });

    it('일반 브라우저 UA 통과', () => {
      expect(
        isSuspiciousUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      ).toBe(false);
    });

    it('bot 포함 UA 차단', () => {
      expect(isSuspiciousUserAgent('Googlebot/2.1')).toBe(true);
    });

    it('crawler 차단', () => {
      expect(isSuspiciousUserAgent('Yahoo! Slurp/3.0 crawler')).toBe(true);
    });

    it('curl 차단', () => {
      expect(isSuspiciousUserAgent('curl/7.68.0')).toBe(true);
    });

    it('python-requests 차단', () => {
      expect(isSuspiciousUserAgent('python-requests/2.28.0')).toBe(true);
    });

    it('puppeteer 차단', () => {
      expect(isSuspiciousUserAgent('HeadlessChrome puppeteer')).toBe(true);
    });

    it('selenium 차단', () => {
      expect(isSuspiciousUserAgent('selenium/4.0')).toBe(true);
    });

    it('postman 차단', () => {
      expect(isSuspiciousUserAgent('PostmanRuntime/7.28.4')).toBe(true);
    });

    it('대소문자 무시', () => {
      expect(isSuspiciousUserAgent('MyBot/1.0')).toBe(true);
      expect(isSuspiciousUserAgent('CRAWLER')).toBe(true);
    });
  });

  // ============================================
  // validateClick (종합)
  // ============================================
  describe('validateClick', () => {
    it('정상 클릭 허용', () => {
      const result = validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: 'Mozilla/5.0 Chrome/120',
        ipHash: 'hash1',
      });
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('봇 UA 차단', () => {
      const result = validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: 'Googlebot/2.1',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('bot_detected');
    });

    it('null UA 차단', () => {
      const result = validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: null,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('bot_detected');
    });

    it('중복 클릭 차단', () => {
      validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: 'Chrome/120',
      });
      const result = validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: 'Chrome/120',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('duplicate_click');
    });

    it('IP rate limit 차단', () => {
      // 10회 소진
      for (let i = 0; i < 11; i++) {
        validateClick({
          userId: `user-${i}`,
          productId: `product-${i}`,
          userAgent: 'Chrome/120',
          ipHash: 'same-ip',
        });
      }
      const result = validateClick({
        userId: 'user-new',
        productId: 'product-new',
        userAgent: 'Chrome/120',
        ipHash: 'same-ip',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate_limited');
    });

    it('ipHash 없으면 rate limit 스킵', () => {
      const result = validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: 'Chrome/120',
        // ipHash 생략
      });
      expect(result.allowed).toBe(true);
    });

    it('봇 체크가 중복 체크보다 먼저 실행', () => {
      // 정상 클릭 1회
      validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: 'Chrome/120',
      });
      // 봇 UA로 같은 user+product → bot_detected가 먼저
      const result = validateClick({
        userId: 'user1',
        productId: 'product1',
        userAgent: 'Googlebot/2.1',
      });
      expect(result.reason).toBe('bot_detected');
    });
  });
});
