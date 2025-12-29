/**
 * 에러 컨텍스트 강화
 * @description Sentry에 추가 컨텍스트 정보 전달
 */

import * as Sentry from '@sentry/nextjs';

// 에러 카테고리
export type ErrorCategory =
  | 'api'         // API 호출 에러
  | 'ai'          // AI 분석 에러
  | 'auth'        // 인증 에러
  | 'database'    // DB 에러
  | 'network'     // 네트워크 에러
  | 'validation'  // 유효성 검증 에러
  | 'ui'          // UI 렌더링 에러
  | 'unknown';    // 알 수 없는 에러

// 에러 컨텍스트 인터페이스
export interface ErrorContext {
  category: ErrorCategory;
  feature?: string;          // 기능 식별자 (예: 'workout-onboarding')
  action?: string;           // 사용자 액션 (예: 'submit_form')
  metadata?: Record<string, unknown>;
}

// 최근 사용자 액션 히스토리 (에러 발생 시 컨텍스트로 전송)
const actionHistory: Array<{ action: string; timestamp: number }> = [];
const MAX_HISTORY = 10;

/**
 * 사용자 액션 기록 (에러 컨텍스트용)
 */
export function recordUserAction(action: string): void {
  actionHistory.push({
    action,
    timestamp: Date.now(),
  });

  // 최대 개수 유지
  if (actionHistory.length > MAX_HISTORY) {
    actionHistory.shift();
  }
}

/**
 * 에러 컨텍스트와 함께 에러 보고
 */
export function captureErrorWithContext(
  error: Error,
  context: ErrorContext
): void {
  Sentry.withScope((scope) => {
    // 카테고리 태그
    scope.setTag('error_category', context.category);

    // 기능 및 액션 태그
    if (context.feature) {
      scope.setTag('feature', context.feature);
    }
    if (context.action) {
      scope.setTag('action', context.action);
    }

    // 추가 메타데이터
    if (context.metadata) {
      scope.setContext('metadata', context.metadata);
    }

    // 최근 사용자 액션 히스토리
    scope.setContext('user_actions', {
      history: actionHistory.slice(-5).map((a) => ({
        action: a.action,
        timestamp: new Date(a.timestamp).toISOString(),
      })),
    });

    // 브라우저/페이지 정보
    if (typeof window !== 'undefined') {
      scope.setContext('page', {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
      });
    }

    Sentry.captureException(error);
  });
}

/**
 * API 에러 캡처
 */
export function captureApiError(
  error: Error,
  endpoint: string,
  method: string,
  statusCode?: number
): void {
  captureErrorWithContext(error, {
    category: 'api',
    action: `${method} ${endpoint}`,
    metadata: {
      endpoint,
      method,
      statusCode,
    },
  });
}

/**
 * AI 분석 에러 캡처
 */
export function captureAiError(
  error: Error,
  analysisType: string,
  inputType?: string
): void {
  captureErrorWithContext(error, {
    category: 'ai',
    feature: analysisType,
    metadata: {
      analysisType,
      inputType,
    },
  });
}

/**
 * DB 에러 캡처
 */
export function captureDatabaseError(
  error: Error,
  operation: string,
  table?: string
): void {
  captureErrorWithContext(error, {
    category: 'database',
    action: operation,
    metadata: {
      operation,
      table,
    },
  });
}

/**
 * 유효성 검증 에러 캡처
 */
export function captureValidationError(
  error: Error,
  field: string,
  value?: unknown
): void {
  captureErrorWithContext(error, {
    category: 'validation',
    action: `validate_${field}`,
    metadata: {
      field,
      valueType: typeof value,
    },
  });
}

/**
 * 네트워크 에러 캡처
 */
export function captureNetworkError(
  error: Error,
  url: string,
  timeout?: boolean
): void {
  captureErrorWithContext(error, {
    category: 'network',
    metadata: {
      url,
      timeout,
      online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
    },
  });
}

/**
 * UI 렌더링 에러 캡처
 */
export function captureUiError(
  error: Error,
  componentName: string,
  props?: Record<string, unknown>
): void {
  // props에서 민감 정보 제거
  const sanitizedProps = props
    ? Object.fromEntries(
        Object.entries(props).filter(
          ([key]) => !['password', 'token', 'secret', 'apiKey'].includes(key.toLowerCase())
        )
      )
    : undefined;

  captureErrorWithContext(error, {
    category: 'ui',
    feature: componentName,
    metadata: {
      componentName,
      props: sanitizedProps,
    },
  });
}

/**
 * Sentry 사용자 컨텍스트 설정
 */
export function setUserContext(userId: string, metadata?: Record<string, unknown>): void {
  Sentry.setUser({
    id: userId,
    ...metadata,
  });
}

/**
 * Sentry 사용자 컨텍스트 초기화
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * 브레드크럼 추가 (에러 추적용 히스토리)
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}
