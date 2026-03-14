/**
 * 웹훅 서명 검증 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createHmacSignature,
  verifyWebhookSignature,
  getSignatureFromHeaders,
  isTimestampValid,
} from '@/lib/affiliate/webhook-verify';

describe('webhook-verify', () => {
  // ============================================
  // createHmacSignature
  // ============================================
  describe('createHmacSignature', () => {
    it('동일 입력에 동일 서명 생성', async () => {
      const sig1 = await createHmacSignature('payload', 'secret');
      const sig2 = await createHmacSignature('payload', 'secret');
      expect(sig1).toBe(sig2);
    });

    it('다른 페이로드에 다른 서명 생성', async () => {
      const sig1 = await createHmacSignature('payload1', 'secret');
      const sig2 = await createHmacSignature('payload2', 'secret');
      expect(sig1).not.toBe(sig2);
    });

    it('다른 시크릿에 다른 서명 생성', async () => {
      const sig1 = await createHmacSignature('payload', 'secret1');
      const sig2 = await createHmacSignature('payload', 'secret2');
      expect(sig1).not.toBe(sig2);
    });

    it('hex 문자열 반환', async () => {
      const sig = await createHmacSignature('test', 'key');
      expect(sig).toMatch(/^[0-9a-f]+$/);
    });

    it('64자 hex (SHA-256)', async () => {
      const sig = await createHmacSignature('test', 'key');
      expect(sig).toHaveLength(64);
    });
  });

  // ============================================
  // verifyWebhookSignature
  // ============================================
  describe('verifyWebhookSignature', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('유효한 서명 검증 통과', async () => {
      process.env.COUPANG_WEBHOOK_SECRET = 'test-secret';
      const payload = '{"orderId":"123"}';
      const sig = await createHmacSignature(payload, 'test-secret');

      const result = await verifyWebhookSignature('coupang', payload, sig);
      expect(result).toBe(true);
    });

    it('잘못된 서명 검증 실패', async () => {
      process.env.COUPANG_WEBHOOK_SECRET = 'test-secret';
      const result = await verifyWebhookSignature('coupang', 'payload', 'wrong-sig');
      expect(result).toBe(false);
    });

    it('알 수 없는 파트너 거부', async () => {
      const result = await verifyWebhookSignature('unknown' as 'coupang', 'payload', 'sig');
      expect(result).toBe(false);
    });

    it('개발 환경에서 시크릿 미설정 시 통과', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      });
      delete process.env.COUPANG_WEBHOOK_SECRET;

      const result = await verifyWebhookSignature('coupang', 'payload', 'any');
      expect(result).toBe(true);
    });

    it('프로덕션에서 시크릿 미설정 시 거부', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
      delete process.env.COUPANG_WEBHOOK_SECRET;

      const result = await verifyWebhookSignature('coupang', 'payload', 'any');
      expect(result).toBe(false);
    });

    it('iherb 파트너 검증', async () => {
      process.env.IHERB_WEBHOOK_SECRET = 'iherb-secret';
      const payload = '{"conversion":true}';
      const sig = await createHmacSignature(payload, 'iherb-secret');

      const result = await verifyWebhookSignature('iherb', payload, sig);
      expect(result).toBe(true);
    });

    it('musinsa 파트너 검증', async () => {
      process.env.MUSINSA_WEBHOOK_SECRET = 'musinsa-secret';
      const payload = '{"order":"abc"}';
      const sig = await createHmacSignature(payload, 'musinsa-secret');

      const result = await verifyWebhookSignature('musinsa', payload, sig);
      expect(result).toBe(true);
    });
  });

  // ============================================
  // getSignatureFromHeaders
  // ============================================
  describe('getSignatureFromHeaders', () => {
    it('쿠팡 서명 헤더 추출', () => {
      const headers = new Headers({ 'x-coupang-signature': 'abc123' });
      expect(getSignatureFromHeaders('coupang', headers)).toBe('abc123');
    });

    it('iherb 서명 헤더 추출', () => {
      const headers = new Headers({ 'x-iherb-signature': 'def456' });
      expect(getSignatureFromHeaders('iherb', headers)).toBe('def456');
    });

    it('musinsa 서명 헤더 추출', () => {
      const headers = new Headers({ 'x-musinsa-signature': 'ghi789' });
      expect(getSignatureFromHeaders('musinsa', headers)).toBe('ghi789');
    });

    it('헤더 없으면 null', () => {
      const headers = new Headers();
      expect(getSignatureFromHeaders('coupang', headers)).toBeNull();
    });

    it('알 수 없는 파트너 null', () => {
      const headers = new Headers({ 'x-test': 'value' });
      expect(getSignatureFromHeaders('unknown' as 'coupang', headers)).toBeNull();
    });
  });

  // ============================================
  // isTimestampValid
  // ============================================
  describe('isTimestampValid', () => {
    it('현재 시간은 유효', () => {
      expect(isTimestampValid(new Date().toISOString())).toBe(true);
    });

    it('5분 이내 과거는 유효', () => {
      const fourMinAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
      expect(isTimestampValid(fourMinAgo)).toBe(true);
    });

    it('6분 전은 무효', () => {
      const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      expect(isTimestampValid(sixMinAgo)).toBe(false);
    });

    it('미래 5분 이내는 유효', () => {
      const fourMinLater = new Date(Date.now() + 4 * 60 * 1000).toISOString();
      expect(isTimestampValid(fourMinLater)).toBe(true);
    });

    it('미래 6분 이상은 무효', () => {
      const tenMinLater = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      expect(isTimestampValid(tenMinLater)).toBe(false);
    });

    it('잘못된 날짜 문자열 무효', () => {
      expect(isTimestampValid('not-a-date')).toBe(false);
    });

    it('빈 문자열 무효', () => {
      expect(isTimestampValid('')).toBe(false);
    });

    it('커스텀 tolerance 적용', () => {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      // 1분 tolerance → 2분 전은 무효
      expect(isTimestampValid(twoMinAgo, 60_000)).toBe(false);
      // 3분 tolerance → 2분 전은 유효
      expect(isTimestampValid(twoMinAgo, 180_000)).toBe(true);
    });
  });
});
