/**
 * 선택적 의존성 타입 선언
 * 설치하지 않아도 타입 오류가 발생하지 않도록 함
 */

// Sentry
declare module '@sentry/react-native' {
  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

  export interface Scope {
    setUser(user: { id: string } | null): void;
    setTag(key: string, value: string): void;
    setExtra(key: string, value: unknown): void;
    setLevel(level: SeverityLevel): void;
  }

  export function init(options: {
    dsn?: string;
    environment?: string;
    release?: string;
    dist?: string;
    tracesSampleRate?: number;
    beforeSend?: (event: unknown) => unknown | null;
    beforeBreadcrumb?: (breadcrumb: { data?: Record<string, unknown> }) => unknown;
  }): void;

  export function withScope(callback: (scope: Scope) => void): void;
  export function captureException(error: Error): void;
  export function captureMessage(message: string): void;
  export function setUser(user: { id: string } | null): void;
  export function addBreadcrumb(breadcrumb: {
    message: string;
    category: string;
    data?: Record<string, unknown>;
    level?: string;
  }): void;
  export function setTag(key: string, value: string): void;
  export function setContext(name: string, context: Record<string, unknown>): void;
}

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
  export function getCalendars(): { calendar: string; timeZone: string; uses24hourClock: boolean; firstWeekday: number }[];
}
