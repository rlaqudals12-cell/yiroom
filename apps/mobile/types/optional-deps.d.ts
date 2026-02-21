/**
 * 선택적 의존성 타입 선언
 * 설치하지 않아도 타입 오류가 발생하지 않도록 함
 */

// @sentry/react-native — 실제 패키지 설치됨, 커스텀 타입 불필요

// Expo Store Review
declare module 'expo-store-review' {
  export function isAvailableAsync(): Promise<boolean>;
  export function requestReview(): Promise<void>;
}

// Expo Localization
declare module 'expo-localization' {
  export interface Locale {
    languageCode: string | null;
    languageTag: string;
    regionCode: string | null;
    currencyCode: string | null;
    currencySymbol: string | null;
    decimalSeparator: string | null;
    digitGroupingSeparator: string | null;
    textDirection: 'ltr' | 'rtl' | null;
    measurementSystem: 'metric' | 'us' | 'uk' | null;
    temperatureUnit: 'celsius' | 'fahrenheit' | null;
  }

  export function getLocales(): Locale[];
  export function getCalendars(): {
    calendar: string;
    timeZone: string;
    uses24hourClock: boolean;
    firstWeekday: number;
  }[];
}
