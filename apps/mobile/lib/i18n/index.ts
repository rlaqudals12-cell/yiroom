/**
 * 국제화 (i18n) 모듈
 * 다국어 지원
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { useState, useCallback, useEffect } from 'react';

import en from './locales/en';
import ko from './locales/ko';
import { SupportedLocale, TranslationOptions } from './types';

// 번역 데이터
const translations = { ko, en } as const;

// 저장 키
const LOCALE_KEY = '@yiroom/locale';

// 기본 언어
const DEFAULT_LOCALE: SupportedLocale = 'ko';

// 현재 언어
let currentLocale: SupportedLocale = DEFAULT_LOCALE;

/**
 * 시스템 언어 가져오기
 */
function getSystemLocale(): SupportedLocale {
  const locales = getLocales();
  const systemLocale = locales[0]?.languageCode?.toLowerCase();

  if (systemLocale === 'ko') return 'ko';
  return 'en';
}

/**
 * 저장된 언어 로드
 */
async function loadSavedLocale(): Promise<SupportedLocale> {
  try {
    const saved = await AsyncStorage.getItem(LOCALE_KEY);
    if (saved && (saved === 'ko' || saved === 'en')) {
      return saved;
    }
  } catch {
    // 무시
  }
  return getSystemLocale();
}

/**
 * 언어 저장
 */
async function saveLocale(locale: SupportedLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}

/**
 * 번역 함수
 */
export function t(key: string, options?: TranslationOptions): string {
  const keys = key.split('.');
  let value: unknown = translations[currentLocale];

  for (const k of keys) {
    if (typeof value === 'object' && value !== null) {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value !== 'string') {
    // 영어 폴백
    value = translations.en;
    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }
  }

  if (typeof value !== 'string') {
    return options?.defaultValue || key;
  }

  // 변수 치환
  let result = value;
  if (options?.params) {
    Object.entries(options.params).forEach(([param, val]) => {
      result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(val));
    });
  }

  return result;
}

/**
 * 현재 언어 가져오기
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * 언어 설정
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  currentLocale = locale;
  await saveLocale(locale);
}

/**
 * i18n 초기화
 */
export async function initI18n(): Promise<SupportedLocale> {
  currentLocale = await loadSavedLocale();
  return currentLocale;
}

// ---- React Hook ----

/**
 * i18n Hook
 */
export function useI18n() {
  const [locale, setLocaleState] = useState<SupportedLocale>(currentLocale);

  useEffect(() => {
    initI18n().then(setLocaleState);
  }, []);

  const changeLocale = useCallback(async (newLocale: SupportedLocale) => {
    await setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return {
    locale,
    setLocale: changeLocale,
    t,
  };
}

/**
 * 번역 Hook (간단 버전)
 */
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

// 타입 export
export type { SupportedLocale, TranslationOptions } from './types';
