/**
 * AES-256-GCM 암호화/복호화 테스트
 *
 * @module tests/lib/safety/crypto
 * @description encrypt/decrypt 왕복, 키 부재 처리, isEncryptionAvailable
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, isEncryptionAvailable } from '@/lib/safety/crypto';

// 테스트용 32바이트 hex 키 (64자)
const TEST_KEY = 'a'.repeat(64);
const INVALID_SHORT_KEY = 'abcd';
const INVALID_LENGTH_KEY = 'b'.repeat(32); // 16바이트 (32자 hex)

describe('Safety Crypto', () => {
  const originalEnv = process.env.SAFETY_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.SAFETY_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SAFETY_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.SAFETY_ENCRYPTION_KEY;
    }
  });

  // ===========================================================================
  // encrypt → decrypt 왕복
  // ===========================================================================

  describe('encrypt/decrypt roundtrip', () => {
    it('should encrypt and decrypt string array correctly', () => {
      const data = ['almond', 'walnut', 'cashew'];
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should handle empty array', () => {
      const data: string[] = [];
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual([]);
    });

    it('should handle single element', () => {
      const data = ['retinol'];
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(['retinol']);
    });

    it('should handle Korean characters', () => {
      const data = ['견과류', '라텍스', '국화과'];
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should handle special characters', () => {
      const data = ['sodium lauryl sulfate', 'bha (2%)', 'vitamin c/ascorbic acid'];
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should produce different ciphertext for same input (random IV)', () => {
      const data = ['test'];
      const encrypted1 = encrypt(data);
      const encrypted2 = encrypt(data);
      // IV가 매번 달라서 암호문도 다름
      expect(encrypted1).not.toBe(encrypted2);
      // 하지만 복호화 결과는 동일
      expect(decrypt(encrypted1)).toEqual(decrypt(encrypted2));
    });

    it('should produce base64 encoded output', () => {
      const data = ['test'];
      const encrypted = encrypt(data);
      // base64 문자만 포함
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  // ===========================================================================
  // 키 부재 / 잘못된 키
  // ===========================================================================

  describe('key validation', () => {
    it('should throw when SAFETY_ENCRYPTION_KEY is not set', () => {
      delete process.env.SAFETY_ENCRYPTION_KEY;
      expect(() => encrypt(['test'])).toThrow('SAFETY_ENCRYPTION_KEY');
    });

    it('should throw when key is wrong length', () => {
      process.env.SAFETY_ENCRYPTION_KEY = INVALID_LENGTH_KEY;
      expect(() => encrypt(['test'])).toThrow('32바이트');
    });

    it('should throw on decrypt with wrong key', () => {
      const data = ['test'];
      const encrypted = encrypt(data);

      // 다른 키로 복호화 시도
      process.env.SAFETY_ENCRYPTION_KEY = 'c'.repeat(64);
      expect(() => decrypt(encrypted)).toThrow();
    });
  });

  // ===========================================================================
  // 데이터 변조 감지
  // ===========================================================================

  describe('tamper detection', () => {
    it('should detect tampered ciphertext', () => {
      const data = ['test'];
      const encrypted = encrypt(data);

      // 암호문 변조 (마지막 문자 변경)
      const tampered = encrypted.slice(0, -2) + 'XX';
      expect(() => decrypt(tampered)).toThrow();
    });

    it('should reject too-short data', () => {
      // IV(16) + authTag(16) = 32바이트 미만이면 에러
      const shortData = Buffer.from('short').toString('base64');
      expect(() => decrypt(shortData)).toThrow('형식이 올바르지 않습니다');
    });
  });

  // ===========================================================================
  // isEncryptionAvailable
  // ===========================================================================

  describe('isEncryptionAvailable', () => {
    it('should return true when key is set', () => {
      expect(isEncryptionAvailable()).toBe(true);
    });

    it('should return false when key is not set', () => {
      delete process.env.SAFETY_ENCRYPTION_KEY;
      expect(isEncryptionAvailable()).toBe(false);
    });

    it('should return false when key is invalid length', () => {
      process.env.SAFETY_ENCRYPTION_KEY = INVALID_LENGTH_KEY;
      expect(isEncryptionAvailable()).toBe(false);
    });
  });
});
