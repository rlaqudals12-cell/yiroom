/**
 * 모바일 국제화 공개 어댑터.
 *
 * 기존 `@/lib/i18n` 호출 경로는 유지하되, 전역 변경 전파와 폴백은 i18next가 맡는다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next, useTranslation as useReactTranslation } from 'react-i18next';

import en from './locales/en';
import ko from './locales/ko';
import {
  CATALOG_LOCALES,
  ENABLED_LOCALES,
  type EnabledLocale,
  type SupportedLocale,
  type TranslationOptions,
} from './types';

const LOCALE_KEY = '@yiroom/locale';
const DEFAULT_LOCALE: EnabledLocale = 'ko';
// 로컬 저장소 조회가 멈춰도 앱 시작 화면을 영구 차단하지 않도록 짧은 상한을 둔다.
const LOCALE_STORAGE_TIMEOUT_MS = 1000;

const resources = {
  ko: { translation: ko },
  en: { translation: en },
} as const;

function includesLocale<T extends string>(locales: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && locales.some((locale) => locale === value);
}

function getDeviceLocale(): EnabledLocale {
  const languageCode = getLocales()[0]?.languageCode?.toLowerCase();
  return includesLocale(ENABLED_LOCALES, languageCode) ? languageCode : DEFAULT_LOCALE;
}

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: CATALOG_LOCALES,
    defaultNS: 'translation',
    initAsync: false,
    returnNull: false,
    // 빈 번역도 누락으로 취급하며 저장 대신 handler에서 개발 오류를 즉시 드러낸다.
    returnEmptyString: false,
    saveMissing: true,
    missingKeyHandler: (_languages, namespace, key) => {
      if (__DEV__ || process.env.NODE_ENV === 'test') {
        throw new Error(`[i18n] Missing translation: ${namespace}:${key}`);
      }
    },
    // 한국어에도 없는 오타 키는 운영 화면에 식별자 대신 정직한 한국어 안내를 표시한다.
    parseMissingKeyHandler: () => ko.common.translationUnavailable,
    interpolation: {
      escapeValue: false,
      prefix: '{',
      suffix: '}',
    },
  });
}

export const i18n = i18next;

function readStoredLocaleWithTimeout(): Promise<string | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), LOCALE_STORAGE_TIMEOUT_MS);
  });

  // Promise.race가 한 번 결정된 뒤 늦게 도착한 저장소 값은 초기 언어를 다시 바꾸지 않는다.
  return Promise.race([AsyncStorage.getItem(LOCALE_KEY), timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}

async function loadInitialLocale(): Promise<EnabledLocale> {
  try {
    const savedLocale = await readStoredLocaleWithTimeout();
    if (includesLocale(ENABLED_LOCALES, savedLocale)) {
      return savedLocale;
    }
  } catch {
    // 저장소 오류는 앱 진입을 막지 않고 공개 기본 언어로 폴백한다.
  }

  return getDeviceLocale();
}

export function t(key: string, options?: TranslationOptions): string {
  return i18n.t(key, {
    ...options?.params,
    count: options?.count,
    defaultValue: options?.defaultValue,
  });
}

export function getLocale(): SupportedLocale {
  const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;
  return includesLocale(CATALOG_LOCALES, resolvedLanguage) ? resolvedLanguage : DEFAULT_LOCALE;
}

/**
 * 공개 활성 locale만 저장한다. 카탈로그가 있어도 미완성 언어는 사용자에게 열지 않는다.
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  const enabledLocale = includesLocale(ENABLED_LOCALES, locale) ? locale : DEFAULT_LOCALE;
  await i18n.changeLanguage(enabledLocale);
  await AsyncStorage.setItem(LOCALE_KEY, enabledLocale);
}

export async function initI18n(): Promise<EnabledLocale> {
  const locale = await loadInitialLocale();
  await i18n.changeLanguage(locale);
  return locale;
}

export function useTranslation() {
  const translation = useReactTranslation();
  return {
    ...translation,
    locale: getLocale(),
  };
}

export type { EnabledLocale, SupportedLocale, TranslationOptions } from './types';
