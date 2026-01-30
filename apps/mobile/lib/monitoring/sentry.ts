/**
 * Sentry 크래시 리포팅
 * 프로덕션 에러 모니터링 및 추적
 */

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
export async function initSentry(): Promise<void> {
  if (IS_DEV) {
    sentryLogger.info('개발 모드에서는 비활성화됩니다.');
    return;
  }

  if (!SENTRY_DSN) {
    sentryLogger.warn('DSN이 설정되지 않았습니다.');
    return;
  }

  try {
    // Sentry SDK 동적 import (프로덕션에서만)
    const Sentry = await import('@sentry/react-native');

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: IS_DEV ? 'development' : 'production',
      release: Constants.expoConfig?.version,
      dist: Constants.expoConfig?.extra?.buildNumber,
      // 샘플링 비율
      tracesSampleRate: 0.2,
      // 에러 필터링
      beforeSend(event) {
        // 개발 모드 에러 무시
        if (IS_DEV) return null;
        return event;
      },
      // 브레드크럼 필터링
      beforeBreadcrumb(breadcrumb) {
        // 민감한 데이터 제거
        if (breadcrumb.data?.password) {
          breadcrumb.data.password = '[REDACTED]';
        }
        return breadcrumb;
      },
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
export async function captureError(
  error: Error,
  context?: ErrorContext
): Promise<void> {
  errorLogger.error(error.message, context);

  if (!isInitialized || IS_DEV) return;

  try {
    const Sentry = await import('@sentry/react-native');

    Sentry.withScope((scope) => {
      // 사용자 설정
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }

      // 태그 설정
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // 추가 데이터
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // 화면 정보
      if (context?.screen) {
        scope.setTag('screen', context.screen);
      }

      Sentry.captureException(error);
    });
  } catch (e) {
    sentryLogger.error('에러 캡처 실패:', e);
  }
}

/**
 * 메시지 캡처
 */
export async function captureMessage(
  message: string,
  severity: ErrorSeverity = 'info',
  context?: ErrorContext
): Promise<void> {
  sentryLogger.info(`[${severity.toUpperCase()}] ${message}`);

  if (!isInitialized || IS_DEV) return;

  try {
    const Sentry = await import('@sentry/react-native');

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
  } catch (e) {
    sentryLogger.error('메시지 캡처 실패:', e);
  }
}

/**
 * 사용자 설정
 */
export async function setUser(userId: string | null): Promise<void> {
  if (!isInitialized || IS_DEV) return;

  try {
    const Sentry = await import('@sentry/react-native');

    if (userId) {
      Sentry.setUser({ id: userId });
    } else {
      Sentry.setUser(null);
    }
  } catch (e) {
    sentryLogger.error('사용자 설정 실패:', e);
  }
}

/**
 * 브레드크럼 추가
 */
export async function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!isInitialized || IS_DEV) return;

  try {
    const Sentry = await import('@sentry/react-native');

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  } catch (e) {
    sentryLogger.error('브레드크럼 추가 실패:', e);
  }
}

/**
 * 태그 설정
 */
export async function setTag(key: string, value: string): Promise<void> {
  if (!isInitialized || IS_DEV) return;

  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.setTag(key, value);
  } catch (e) {
    sentryLogger.error('태그 설정 실패:', e);
  }
}

/**
 * 컨텍스트 설정
 */
export async function setContext(
  name: string,
  context: Record<string, unknown>
): Promise<void> {
  if (!isInitialized || IS_DEV) return;

  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.setContext(name, context);
  } catch (e) {
    sentryLogger.error('컨텍스트 설정 실패:', e);
  }
}
