/**
 * 지역/로케일 감지 모듈
 *
 * 국가, 시간대, 단위계 감지 및 변환
 *
 * @module lib/region
 */

import { Platform, NativeModules } from 'react-native';

// ─── 타입 ────────────────────────────────────────────

export type MeasurementSystem = 'metric' | 'imperial';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface RegionInfo {
  country: string;
  language: string;
  timezone: string;
  measurementSystem: MeasurementSystem;
  temperatureUnit: TemperatureUnit;
  currencyCode: string;
}

// ─── 상수 ─────────────────────────────────────────────

const IMPERIAL_COUNTRIES = ['US', 'LR', 'MM'];
const FAHRENHEIT_COUNTRIES = ['US', 'BS', 'KY', 'PW'];

export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const COUNTRY_LABELS: Record<string, string> = {
  KR: '대한민국',
  US: '미국',
  JP: '일본',
  CN: '중국',
};

// ─── 지역 감지 ───────────────────────────────────────

/**
 * 기기 로케일 감지
 */
export function getDeviceLocale(): string {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      const locale = settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
      return locale ?? 'ko-KR';
    }

    if (Platform.OS === 'android') {
      const locale = NativeModules.I18nManager?.localeIdentifier;
      return locale ?? 'ko_KR';
    }

    return 'ko-KR';
  } catch {
    return 'ko-KR';
  }
}

/**
 * 로케일에서 국가 코드 추출
 */
export function getCountryFromLocale(locale: string): string {
  // ko-KR, en-US, ja-JP 등
  const parts = locale.replace('_', '-').split('-');
  return parts[1]?.toUpperCase() ?? 'KR';
}

/**
 * 로케일에서 언어 코드 추출
 */
export function getLanguageFromLocale(locale: string): SupportedLanguage {
  const lang = locale.split(/[-_]/)[0]?.toLowerCase();
  if (lang === 'ko') return 'ko';
  return 'en';
}

/**
 * 기기 시간대 감지
 */
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Asia/Seoul';
  }
}

/**
 * 종합 지역 정보
 */
export function getRegionInfo(): RegionInfo {
  const locale = getDeviceLocale();
  const country = getCountryFromLocale(locale);

  return {
    country,
    language: getLanguageFromLocale(locale),
    timezone: getDeviceTimezone(),
    measurementSystem: IMPERIAL_COUNTRIES.includes(country) ? 'imperial' : 'metric',
    temperatureUnit: FAHRENHEIT_COUNTRIES.includes(country) ? 'fahrenheit' : 'celsius',
    currencyCode: getCurrencyCode(country),
  };
}

// ─── 단위 변환 ───────────────────────────────────────

/**
 * kg ↔ lbs
 */
export function convertWeight(
  value: number,
  from: MeasurementSystem,
  to: MeasurementSystem
): number {
  if (from === to) return value;
  return from === 'metric'
    ? Math.round(value * 2.20462 * 10) / 10  // kg → lbs
    : Math.round(value / 2.20462 * 10) / 10; // lbs → kg
}

/**
 * cm ↔ inches
 */
export function convertHeight(
  value: number,
  from: MeasurementSystem,
  to: MeasurementSystem
): number {
  if (from === to) return value;
  return from === 'metric'
    ? Math.round(value / 2.54 * 10) / 10  // cm → in
    : Math.round(value * 2.54 * 10) / 10; // in → cm
}

/**
 * °C ↔ °F
 */
export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit
): number {
  if (from === to) return value;
  return from === 'celsius'
    ? Math.round((value * 9 / 5 + 32) * 10) / 10
    : Math.round(((value - 32) * 5 / 9) * 10) / 10;
}

// ─── 포맷팅 ──────────────────────────────────────────

/**
 * 체중 포맷 (단위 포함)
 */
export function formatWeight(kg: number, system: MeasurementSystem): string {
  if (system === 'imperial') {
    return `${convertWeight(kg, 'metric', 'imperial')}lbs`;
  }
  return `${kg}kg`;
}

/**
 * 키 포맷 (단위 포함)
 */
export function formatHeight(cm: number, system: MeasurementSystem): string {
  if (system === 'imperial') {
    const totalInches = convertHeight(cm, 'metric', 'imperial');
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${cm}cm`;
}

/**
 * 온도 포맷 (단위 포함)
 */
export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit
): string {
  if (unit === 'fahrenheit') {
    return `${convertTemperature(celsius, 'celsius', 'fahrenheit')}°F`;
  }
  return `${celsius}°C`;
}

// ─── 내부 유틸리티 ───────────────────────────────────

function getCurrencyCode(country: string): string {
  const currencies: Record<string, string> = {
    KR: 'KRW',
    US: 'USD',
    JP: 'JPY',
    CN: 'CNY',
    GB: 'GBP',
    EU: 'EUR',
  };
  return currencies[country] ?? 'KRW';
}
