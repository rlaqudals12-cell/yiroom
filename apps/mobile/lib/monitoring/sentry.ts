/**
 * Sentry 크래시 리포팅
 * 프로덕션 에러 모니터링 및 추적
 */
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { ErrorContext, ErrorSeverity } from './types';
import { sentryLogger, errorLogger } from '../utils/logger';

// Sentry DSN (환경변수에서 로드)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// 개발 모드 여부
const IS_DEV = __DEV__;

// Sentry 초기화 상태
let isInitialized = false;

/**
 * Sentry 초기화
 * 앱 시작 시 호출
 */
export function initSentry(): void {
  if (IS_DEV) {
    sentryLogger.info('개발 모드에서는 비활성화됩니다.');
    return;
  }

  if (!SENTRY_DSN) {
    sentryLogger.warn('DSN이 설정되지 않았습니다.');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: IS_DEV ? 'development' : 'production',
      release: Constants.expoConfig?.version,
      dist: Constants.expoConfig?.extra?.buildNumber,
      // 성능 추적
      tracesSampleRate: 0.2,
      profilesSampleRate: 0.1,
      // 에러 필터링
      beforeSend(event) {
        if (IS_DEV) return null;
        return event;
      },
      // 브레드크럼 필터링
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.data?.password) {
          breadcrumb.data.password = '[REDACTED]';
        }
        return breadcrumb;
      },
      enableAutoSessionTracking: true,
      enableAutoPerformanceTracing: true,
    });

    isInitialized = true;
    sentryLogger.info('초기화 완료');
  } catch (error) {
    sentryLogger.error('초기화 실패:', error);
  }
}

/**
 * 에러 캡처
 */
export function captureError(error: Error, context?: ErrorContext): void {
  errorLogger.error(error.message, context);

  if (!isInitialized || IS_DEV) return;

  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.screen) {
      scope.setTag('screen', context.screen);
    }
    Sentry.captureException(error);
  });
}

/**
 * 메시지 캡처
 */
export function captureMessage(
  message: string,
  severity: ErrorSeverity = 'info',
  context?: ErrorContext
): void {
  sentryLogger.info(`[${severity.toUpperCase()}] ${message}`);

  if (!isInitialized || IS_DEV) return;

  Sentry.withScope((scope) => {
    scope.setLevel(severity);
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
}

/**
 * 사용자 설정
 */
export function setUser(userId: string | null): void {
  if (!isInitialized || IS_DEV) return;
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * 브레드크럼 추가
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  if (!isInitialized || IS_DEV) return;
  Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}

/**
 * 태그 설정
 */
export function setTag(key: string, value: string): void {
  if (!isInitialized || IS_DEV) return;
  Sentry.setTag(key, value);
}

/**
 * 컨텍스트 설정
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!isInitialized || IS_DEV) return;
  Sentry.setContext(name, context);
}

/**
 * Sentry ErrorBoundary (React 컴포넌트용 re-export)
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * 네비게이션 라우팅 계측 wrapper
 */
export const sentryWrap = Sentry.wrap;
