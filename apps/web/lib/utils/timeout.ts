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
  /** 통합 분석 라우트 전체 예산 — Vercel 60초 상한에서 응답 전송 여유 8초 예약 */
  INTEGRATED_ROUTE: 52_000,
  /** 통합 분석 Gemini 축별 단일 시도 상한 */
  INTEGRATED_AXIS_ATTEMPT: 25_000,
  /** 통합 분석 persona Gemini 상한 — 초과 시 결정론 폴백 */
  INTEGRATED_PERSONA: 4_000,
} as const;

/** 절대 실행 예산이 소진됐음을 구분하는 오류. */
export class DeadlineExceededError extends Error {
  constructor(message = 'Execution deadline exceeded') {
    super(message);
    this.name = 'DeadlineExceededError';
  }
}

/**
 * 하나의 요청이 공유하는 단조시계 기반 절대 deadline.
 * 하위 단계는 새 상대 타이머를 만들지 않고 이 객체의 잔여 예산만 소비한다.
 */
export interface ExecutionDeadline {
  readonly expiresAt: number;
  readonly signal: AbortSignal;
  remainingMs(reserveMs?: number): number;
  expired(reserveMs?: number): boolean;
  throwIfExpired(reserveMs?: number, message?: string): void;
  clear(): void;
  abort(reason?: unknown): void;
}

/**
 * 요청 전체가 공유할 절대 deadline을 만든다.
 * `performance.now()`는 시스템 시각 변경의 영향을 받지 않는 단조시계다.
 */
export function createExecutionDeadline(totalMs: number): ExecutionDeadline {
  if (!Number.isFinite(totalMs) || totalMs < 0) {
    throw new RangeError('Deadline duration must be a non-negative finite number');
  }

  const controller = new AbortController();
  const expiresAt = performance.now() + totalMs;
  let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    timeoutId = null;
    controller.abort(new DeadlineExceededError());
  }, totalMs);

  const clear = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const remainingMs = (reserveMs = 0) =>
    Math.max(0, Math.ceil(expiresAt - performance.now() - Math.max(0, reserveMs)));

  return {
    expiresAt,
    signal: controller.signal,
    remainingMs,
    expired: (reserveMs = 0) => controller.signal.aborted || remainingMs(reserveMs) <= 0,
    throwIfExpired: (reserveMs = 0, message = 'Execution deadline exceeded') => {
      if (controller.signal.aborted || remainingMs(reserveMs) <= 0) {
        throw new DeadlineExceededError(message);
      }
    },
    clear,
    abort: (reason = new DeadlineExceededError('Execution aborted')) => {
      clear();
      if (!controller.signal.aborted) controller.abort(reason);
    },
  };
}

/**
 * 부모 deadline의 끝에서 일정 시간을 예약한 하위 단계용 view.
 * 별도 타이머나 시작 시각을 만들지 않으며 부모 signal을 그대로 공유한다.
 */
export function reserveExecutionDeadline(
  deadline: ExecutionDeadline,
  reserveMs: number
): ExecutionDeadline {
  const reserved = Math.max(0, reserveMs);
  return {
    expiresAt: deadline.expiresAt - reserved,
    signal: deadline.signal,
    remainingMs: (extraReserveMs = 0) => deadline.remainingMs(reserved + extraReserveMs),
    expired: (extraReserveMs = 0) => deadline.expired(reserved + extraReserveMs),
    throwIfExpired: (extraReserveMs = 0, message = 'Execution deadline exceeded') =>
      deadline.throwIfExpired(reserved + extraReserveMs, message),
    // view는 부모 타이머를 소유하지 않는다.
    clear: () => {},
    abort: (reason?: unknown) => deadline.abort(reason),
  };
}

export interface DeadlineOptions {
  /** 이 단계 자체의 상대 상한. 절대 deadline보다 길 수 없다. */
  maxMs?: number;
  /** 다음 단계에 반드시 남겨둘 시간. */
  reserveMs?: number;
}

/**
 * Promise를 요청의 절대 deadline 안에서만 기다린다.
 * stage max와 reserve가 있어도 기준 시각은 언제나 부모 deadline 하나다.
 */
export async function withDeadline<T>(
  promise: PromiseLike<T>,
  deadline: ExecutionDeadline,
  errorMessage = 'Execution deadline exceeded',
  options: DeadlineOptions = {}
): Promise<T> {
  const remaining = deadline.remainingMs(options.reserveMs ?? 0);
  const maxMs = options.maxMs ?? remaining;
  const timeoutMs = Math.min(remaining, Math.max(0, maxMs));

  if (deadline.signal.aborted || timeoutMs <= 0) {
    throw new DeadlineExceededError(errorMessage);
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let onAbort: (() => void) | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    const rejectDeadline = () => reject(new DeadlineExceededError(errorMessage));
    onAbort = rejectDeadline;
    deadline.signal.addEventListener('abort', rejectDeadline, { once: true });
    timeoutId = setTimeout(rejectDeadline, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
    if (onAbort) deadline.signal.removeEventListener('abort', onAbort);
  }
}

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
  /** 여러 시도와 대기가 함께 소비할 상위 절대 deadline */
  deadline?: ExecutionDeadline;
}

/**
 * 재시도 로직이 포함된 함수 실행
 *
 * @param fn - 실행할 함수
 * @param options - 재시도 옵션
 * @returns 함수 결과
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    delayMs = RETRY_CONFIG.DELAY_MS,
    exponential = RETRY_CONFIG.EXPONENTIAL,
    shouldRetry = () => true,
    onRetry,
    deadline,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    deadline?.throwIfExpired(0, 'Retry deadline exceeded');
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 단계별 max 타임아웃은 부모 예산이 남아 있으면 재시도할 수 있다.
      // 부모 자체가 끝났거나 부모 없는 호출이 명시적 deadline 오류를 냈을 때만 즉시 중단한다.
      if (deadline?.expired() || (!deadline && error instanceof DeadlineExceededError)) {
        throw deadline?.expired() ? new DeadlineExceededError('Retry deadline exceeded') : error;
      }

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
      const waitTime = exponential ? delayMs * Math.pow(2, attempt) : delayMs;
      let waitTimer: ReturnType<typeof setTimeout> | null = null;
      const waitPromise = new Promise<void>((resolve) => {
        waitTimer = setTimeout(resolve, waitTime);
      });
      try {
        if (deadline) {
          await withDeadline(waitPromise, deadline, 'Retry delay exceeded deadline');
        } else {
          await waitPromise;
        }
      } finally {
        if (waitTimer !== null) clearTimeout(waitTimer);
      }
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
    const result = await withRetry(() => withTimeout(primaryFn(), timeout, 'AI analysis timeout'), {
      maxRetries,
      delayMs,
    });

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
