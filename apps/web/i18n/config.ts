/**
 * i18n 설정
 * @description 지원 언어 및 기본 설정
 */

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

// 언어별 날짜 포맷
export const dateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  ko: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  en: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};
