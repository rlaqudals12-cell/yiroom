/**
 * i18n 설정
 * @description 지원 언어 및 기본 설정
 */

export const locales = ['ko', 'en', 'ja', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** 신뢰할 수 없는 쿠키·헤더 값을 지원 로케일로 좁힌다. */
export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

interface LanguagePreference {
  locale: Locale;
  quality: number;
  index: number;
}

function parseLanguagePreference(value: string, index: number): LanguagePreference | null {
  const [rawTag, ...parameters] = value.split(';');
  const tag = rawTag?.trim().toLowerCase();
  if (!tag) return null;

  const qualityValue = parameters
    .map((parameter) => parameter.trim().toLowerCase())
    .find((parameter) => parameter.startsWith('q='))
    ?.slice(2);
  const quality = qualityValue === undefined ? 1 : Number(qualityValue);
  if (!Number.isFinite(quality) || quality <= 0 || quality > 1) return null;

  // 지역 태그(en-US, ja-JP, zh-CN)는 지원하는 기본 언어로 축약한다.
  const language = tag === '*' ? defaultLocale : tag.split('-')[0];
  if (!isSupportedLocale(language)) return null;
  return { locale: language, quality, index };
}

/** 쿠키 선택을 우선하고, 없거나 유효하지 않을 때 Accept-Language를 해석한다. */
export function resolveRequestLocale(
  cookieLocale: string | null | undefined,
  acceptLanguage: string | null | undefined
): Locale {
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  const preferred = acceptLanguage
    ?.split(',')
    .map(parseLanguagePreference)
    .filter((value): value is LanguagePreference => value !== null)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)[0];

  return preferred?.locale ?? defaultLocale;
}

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
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
  ja: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  zh: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};
