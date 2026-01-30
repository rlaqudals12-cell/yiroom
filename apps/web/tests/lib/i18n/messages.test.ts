/**
 * i18n 메시지 파일 테스트
 */

import { describe, it, expect, beforeAll } from 'vitest';

// 메시지 파일 로드
let koMessages: Record<string, unknown>;
let enMessages: Record<string, unknown>;
let jaMessages: Record<string, unknown>;
let zhMessages: Record<string, unknown>;

beforeAll(async () => {
  koMessages = (await import('@/messages/ko.json')).default;
  enMessages = (await import('@/messages/en.json')).default;
  jaMessages = (await import('@/messages/ja.json')).default;
  zhMessages = (await import('@/messages/zh.json')).default;
});

describe('i18n messages', () => {
  describe('메시지 파일 구조', () => {
    it('한국어 메시지 파일이 존재해야 함', () => {
      expect(koMessages).toBeDefined();
      expect(typeof koMessages).toBe('object');
    });

    it('영어 메시지 파일이 존재해야 함', () => {
      expect(enMessages).toBeDefined();
      expect(typeof enMessages).toBe('object');
    });

    it('일본어 메시지 파일이 존재해야 함', () => {
      expect(jaMessages).toBeDefined();
      expect(typeof jaMessages).toBe('object');
    });

    it('중국어 메시지 파일이 존재해야 함', () => {
      expect(zhMessages).toBeDefined();
      expect(typeof zhMessages).toBe('object');
    });
  });

  describe('필수 네임스페이스 존재', () => {
    const requiredNamespaces = [
      'common',
      'nav',
      'auth',
      'home',
      'beauty',
      'style',
      'record',
      'workout',
      'nutrition',
      'profile',
      'social',
      'analysis',
      'errors',
      'time',
    ];

    it.each(requiredNamespaces)('한국어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(koMessages[namespace]).toBeDefined();
      expect(typeof koMessages[namespace]).toBe('object');
    });

    it.each(requiredNamespaces)('영어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(enMessages[namespace]).toBeDefined();
      expect(typeof enMessages[namespace]).toBe('object');
    });

    it.each(requiredNamespaces)('일본어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(jaMessages[namespace]).toBeDefined();
      expect(typeof jaMessages[namespace]).toBe('object');
    });

    it.each(requiredNamespaces)('중국어 메시지에 "%s" 네임스페이스가 존재해야 함', (namespace) => {
      expect(zhMessages[namespace]).toBeDefined();
      expect(typeof zhMessages[namespace]).toBe('object');
    });
  });

  describe('common 네임스페이스', () => {
    const commonKeys = [
      'loading',
      'error',
      'retry',
      'cancel',
      'confirm',
      'save',
      'delete',
      'edit',
      'close',
      'back',
      'next',
    ];

    it.each(commonKeys)('한국어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((koMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(commonKeys)('영어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((enMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(commonKeys)('일본어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((jaMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(commonKeys)('중국어 common에 "%s" 키가 존재해야 함', (key) => {
      expect((zhMessages.common as Record<string, unknown>)[key]).toBeDefined();
    });
  });

  describe('nav 네임스페이스', () => {
    const navKeys = ['home', 'beauty', 'style', 'record', 'profile'];

    it.each(navKeys)('한국어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((koMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(navKeys)('영어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((enMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(navKeys)('일본어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((jaMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });

    it.each(navKeys)('중국어 nav에 "%s" 키가 존재해야 함', (key) => {
      expect((zhMessages.nav as Record<string, unknown>)[key]).toBeDefined();
    });
  });

  describe('메시지 일관성', () => {
    it('모든 언어의 네임스페이스가 동일해야 함', () => {
      const koNamespaces = Object.keys(koMessages).sort();
      const enNamespaces = Object.keys(enMessages).sort();
      const jaNamespaces = Object.keys(jaMessages).sort();
      const zhNamespaces = Object.keys(zhMessages).sort();
      expect(koNamespaces).toEqual(enNamespaces);
      expect(koNamespaces).toEqual(jaNamespaces);
      expect(koNamespaces).toEqual(zhNamespaces);
    });

    it('common 네임스페이스의 키가 동일해야 함', () => {
      const koKeys = Object.keys(koMessages.common as object).sort();
      const enKeys = Object.keys(enMessages.common as object).sort();
      const jaKeys = Object.keys(jaMessages.common as object).sort();
      const zhKeys = Object.keys(zhMessages.common as object).sort();
      expect(koKeys).toEqual(enKeys);
      expect(koKeys).toEqual(jaKeys);
      expect(koKeys).toEqual(zhKeys);
    });

    it('nav 네임스페이스의 키가 동일해야 함', () => {
      const koKeys = Object.keys(koMessages.nav as object).sort();
      const enKeys = Object.keys(enMessages.nav as object).sort();
      const jaKeys = Object.keys(jaMessages.nav as object).sort();
      const zhKeys = Object.keys(zhMessages.nav as object).sort();
      expect(koKeys).toEqual(enKeys);
      expect(koKeys).toEqual(jaKeys);
      expect(koKeys).toEqual(zhKeys);
    });
  });

  describe('메시지 값 형식', () => {
    it('모든 메시지 값은 문자열이어야 함', () => {
      const checkStringValues = (obj: Record<string, unknown>, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            checkStringValues(value as Record<string, unknown>, currentPath);
          } else {
            expect(typeof value).toBe('string');
          }
        }
      };

      checkStringValues(koMessages);
      checkStringValues(enMessages);
      checkStringValues(jaMessages);
      checkStringValues(zhMessages);
    });

    it('메시지에 빈 문자열이 없어야 함', () => {
      const checkNonEmptyStrings = (obj: Record<string, unknown>, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            checkNonEmptyStrings(value as Record<string, unknown>, currentPath);
          } else if (typeof value === 'string') {
            expect(value.trim().length, `${currentPath} should not be empty`).toBeGreaterThan(0);
          }
        }
      };

      checkNonEmptyStrings(koMessages);
      checkNonEmptyStrings(enMessages);
      checkNonEmptyStrings(jaMessages);
      checkNonEmptyStrings(zhMessages);
    });
  });
});
