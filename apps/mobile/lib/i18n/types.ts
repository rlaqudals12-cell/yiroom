/** 모바일에 번들된 카탈로그 언어. 공개 활성 언어와 구분한다. */
export const CATALOG_LOCALES = ['ko', 'en'] as const;
export type SupportedLocale = (typeof CATALOG_LOCALES)[number];

/** 영어 핵심 여정 QA 전에는 혼합 언어 노출을 막기 위해 한국어만 공개한다. */
export const ENABLED_LOCALES = ['ko'] as const;
export type EnabledLocale = (typeof ENABLED_LOCALES)[number];

export interface TranslationOptions {
  params?: Record<string, string | number>;
  defaultValue?: string;
  count?: number;
}
