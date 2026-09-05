/**
 * i18n 설정 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  locales,
  defaultLocale,
  localeNames,
  dateFormats,
  isSupportedLocale,
  resolveRequestLocale,
  type Locale,
} from '@/i18n/config';

describe('i18n config', () => {
  describe('locales', () => {
    it('지원 언어 목록을 포함해야 함', () => {
      expect(locales).toContain('ko');
      expect(locales).toContain('en');
    });

    it('최소 2개 언어를 지원해야 함', () => {
      expect(locales.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('defaultLocale', () => {
    it('기본 언어는 한국어여야 함', () => {
      expect(defaultLocale).toBe('ko');
    });

    it('기본 언어는 지원 언어 목록에 포함되어야 함', () => {
      expect(locales).toContain(defaultLocale);
    });
  });

  describe('localeNames', () => {
    it('모든 언어에 대해 표시 이름이 있어야 함', () => {
      for (const locale of locales) {
        expect(localeNames[locale]).toBeDefined();
        expect(typeof localeNames[locale]).toBe('string');
        expect(localeNames[locale].length).toBeGreaterThan(0);
      }
    });

    it('한국어 표시 이름이 올바름', () => {
      expect(localeNames.ko).toBe('한국어');
    });

    it('영어 표시 이름이 올바름', () => {
      expect(localeNames.en).toBe('English');
    });
  });

  describe('dateFormats', () => {
    it('모든 언어에 대해 날짜 포맷이 있어야 함', () => {
      for (const locale of locales) {
        expect(dateFormats[locale]).toBeDefined();
        expect(typeof dateFormats[locale]).toBe('object');
      }
    });

    it('날짜 포맷에 필수 옵션이 포함되어야 함', () => {
      for (const locale of locales) {
        const format = dateFormats[locale];
        expect(format.year).toBeDefined();
        expect(format.month).toBeDefined();
        expect(format.day).toBeDefined();
      }
    });
  });

  describe('Locale type', () => {
    it('Locale 타입은 유효한 언어 코드만 허용해야 함', () => {
      const validLocale: Locale = 'ko';
      const validLocale2: Locale = 'en';

      expect(locales).toContain(validLocale);
      expect(locales).toContain(validLocale2);
    });
  });

  describe('resolveRequestLocale', () => {
    it('유효한 쿠키 선택을 Accept-Language보다 우선한다', () => {
      expect(resolveRequestLocale('ja', 'en-US,en;q=0.9')).toBe('ja');
    });

    it.each([
      ['en-US,en;q=0.9', 'en'],
      ['ja-JP,ko;q=0.8', 'ja'],
      ['zh-CN,en;q=0.8', 'zh'],
      ['zh-TW,en;q=0.8', 'zh'],
    ] as const)('지역 태그 %s를 지원 로케일 %s로 축약한다', (header, expected) => {
      expect(resolveRequestLocale(undefined, header)).toBe(expected);
    });

    it('지원 언어 중 품질 가중치가 가장 높은 언어를 선택한다', () => {
      expect(resolveRequestLocale(undefined, 'en;q=0.6, ja-JP;q=0.9, ko;q=0.7')).toBe('ja');
    });

    it('유효하지 않은 쿠키는 버리고 헤더의 지원 언어를 선택한다', () => {
      expect(resolveRequestLocale('fr', 'fr-FR, en-GB;q=0.8')).toBe('en');
    });

    it.each([undefined, null, '', 'fr-FR,de;q=0.8', 'en;q=0'])(
      '지원 가능한 선호가 없는 %s는 한국어로 폴백한다',
      (header) => {
        expect(resolveRequestLocale(undefined, header)).toBe('ko');
      }
    );

    it('지원 로케일만 타입 가드로 통과시킨다', () => {
      expect(isSupportedLocale('zh')).toBe(true);
      expect(isSupportedLocale('zh-CN')).toBe(false);
      expect(isSupportedLocale(undefined)).toBe(false);
    });
  });
});
