/**
 * 타임아웃 및 재시도 유틸리티
 *
 * AI 분석 API 등 외부 서비스 호출 시 사용
 *
 * @example
 * ```ts
 * // 기본 타임아웃
 * const result = await withTimeout(
 *   analyzeImage(data),
 *   AI_TIMEOUT.DEFAULT,
 *   'Image analysis timeout'
 * );
 *
 * // 타임아웃 + 재시도 + 폴백
 * const result = await withTimeoutAndFallback(
 *   () => analyzeWithAI(data),
 *   () => generateMockResult(data),
 *   { timeout: 3000, maxRetries: 2 }
 * );
 * ```
 */

/**
 * 표준 타임아웃 설정 (밀리초)
 */
export const AI_TIMEOUT = {
  /** 기본 AI 분석 (3초) */
  DEFAULT: 3000,
  /** 복잡한 분석 - 다각도 이미지 등 (10초) */
  COMPLEX: 10000,
  /** 퍼스널컬러 분석 - 색상 보정 포함 (30초) */
  PERSONAL_COLOR: 30000,
  /** 빠른 응답 필요 (1.5초) */
  FAST: 1500,
} as const;

/**
 * 재시도 설정
 */
export const RETRY_CONFIG = {
  /** 기본 최대 재시도 횟수 */
  MAX_RETRIES: 2,
  /** 재시도 간 대기 시간 (밀리초) */
  DELAY_MS: 1000,
  /** 지수 백오프 사용 여부 */
  EXPONENTIAL: true,
} as const;

/**
 * 타임아웃이 있는 Promise 실행
 *
 * @param promise - 실행할 Promise
 * @param timeoutMs - 타임아웃 (밀리초)
 * @param errorMessage - 타임아웃 시 에러 메시지
 * @returns Promise 결과
 * @throws 타임아웃 시 Error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  /** 최대 재시도 횟수 (기본: 2) */
  maxRetries?: number;
  /** 재시도 간 대기 시간 (밀리초, 기본: 1000) */
  delayMs?: number;
  /** 지수 백오프 사용 (기본: true) */
  exponential?: boolean;
  /** 재시도 여부 판단 함수 */
  shouldRetry?: (error: unknown) => boolean;
  /** 재시도 시 호출되는 콜백 */
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * 재시도 로직이 포함된 함수 실행
 *
 * @param fn - 실행할 함수
 * @param options - 재시도 옵션
 * @returns 함수 결과
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    delayMs = RETRY_CONFIG.DELAY_MS,
    exponential = RETRY_CONFIG.EXPONENTIAL,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 재시도 불가 에러인지 확인
      if (!shouldRetry(error)) {
        throw lastError;
      }

      // 마지막 시도였으면 에러 throw
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // 재시도 콜백 호출
      onRetry?.(attempt + 1, error);

      // 대기 (지수 백오프)
      const waitTime = exponential
        ? delayMs * Math.pow(2, attempt)
        : delayMs;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * 타임아웃 + 폴백 옵션
 */
export interface TimeoutFallbackOptions {
  /** 타임아웃 (밀리초) */
  timeout?: number;
  /** 최대 재시도 횟수 */
  maxRetries?: number;
  /** 재시도 간 대기 시간 */
  delayMs?: number;
  /** 폴백 사용 시 로깅 함수 */
  onFallback?: (error: unknown) => void;
}

/**
 * 타임아웃 + 폴백 결과
 */
export interface TimeoutFallbackResult<T> {
  /** 결과 데이터 */
  result: T;
  /** 폴백 사용 여부 */
  usedFallback: boolean;
  /** 에러 (폴백 사용 시) */
  error?: Error;
}

/**
 * 타임아웃, 재시도, 폴백이 모두 포함된 함수 실행
 *
 * @param primaryFn - 주 실행 함수
 * @param fallbackFn - 폴백 함수 (주 함수 실패 시)
 * @param options - 옵션
 * @returns 결과 + 폴백 사용 여부
 */
export async function withTimeoutAndFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => T | Promise<T>,
  options: TimeoutFallbackOptions = {}
): Promise<TimeoutFallbackResult<T>> {
  const {
    timeout = AI_TIMEOUT.DEFAULT,
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    delayMs = RETRY_CONFIG.DELAY_MS,
    onFallback,
  } = options;

  try {
    const result = await withRetry(
      () => withTimeout(primaryFn(), timeout, 'AI analysis timeout'),
      { maxRetries, delayMs }
    );

    return {
      result,
      usedFallback: false,
    };
  } catch (error) {
    // 폴백 로깅
    onFallback?.(error);

    // 폴백 실행
    const result = await fallbackFn();

    return {
      result,
      usedFallback: true,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * AbortController 기반 타임아웃 (fetch 등에 사용)
 *
 * @param timeoutMs - 타임아웃 (밀리초)
 * @returns AbortController와 타임아웃 ID
 */
export function createAbortTimeout(timeoutMs: number): {
  controller: AbortController;
  clear: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    clear: () => clearTimeout(timeoutId),
  };
}
