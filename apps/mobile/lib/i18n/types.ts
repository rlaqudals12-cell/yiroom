/**
 * 국제화 타입 정의
 */

// 지원 언어
export type SupportedLocale = 'ko' | 'en';

// 번역 키
export type TranslationKey = keyof typeof import('./locales/ko').default;

// 번역 옵션
export interface TranslationOptions {
  // 변수 치환
  params?: Record<string, string | number>;
  // 기본값
  defaultValue?: string;
  // 복수형
  count?: number;
}
