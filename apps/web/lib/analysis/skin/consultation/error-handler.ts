/**
 * Phase D: 피부 상담 에러 핸들링 유틸리티
 *
 * AI 상담 중 발생하는 에러를 분류하고 사용자 친화적 메시지로 변환
 */

/**
 * 상담 에러 코드
 */
export type ConsultationErrorCode =
  | 'RATE_LIMIT'
  | 'AI_TIMEOUT'
  | 'AI_SERVICE_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * 상담 에러 인터페이스
 */
export interface ConsultationError {
  code: ConsultationErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

/**
 * 에러 코드별 사용자 메시지
 */
const ERROR_MESSAGES: Record<ConsultationErrorCode, { message: string; retryable: boolean }> = {
  RATE_LIMIT: {
    message: '오늘 상담 횟수를 초과했어요. 내일 다시 시도해주세요.',
    retryable: false,
  },
  AI_TIMEOUT: {
    message: '응답 시간이 초과되었어요. 잠시 후 다시 시도해주세요.',
    retryable: true,
  },
  AI_SERVICE_ERROR: {
    message: 'AI 서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요.',
    retryable: true,
  },
  VALIDATION_ERROR: {
    message: '질문이 너무 길거나 부적절해요. 다시 작성해주세요.',
    retryable: false,
  },
  AUTH_ERROR: {
    message: '로그인이 필요해요.',
    retryable: false,
  },
  NETWORK_ERROR: {
    message: '네트워크 연결을 확인해주세요.',
    retryable: true,
  },
  UNKNOWN_ERROR: {
    message: '알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    retryable: true,
  },
};

/**
 * 에러를 ConsultationError로 변환
 */
export function createConsultationError(
  code: ConsultationErrorCode,
  originalMessage?: string,
  details?: Record<string, unknown>
): ConsultationError {
  const { message: userMessage, retryable } = ERROR_MESSAGES[code];

  return {
    code,
    message: originalMessage || userMessage,
    userMessage,
    retryable,
    details,
  };
}

/**
 * HTTP 상태 코드를 에러 코드로 변환
 */
export function httpStatusToErrorCode(status: number): ConsultationErrorCode {
  switch (status) {
    case 401:
    case 403:
      return 'AUTH_ERROR';
    case 400:
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMIT';
    case 504:
    case 408:
      return 'AI_TIMEOUT';
    case 500:
    case 502:
    case 503:
      return 'AI_SERVICE_ERROR';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * 네이티브 에러를 ConsultationError로 변환
 */
export function parseError(error: unknown): ConsultationError {
  // AbortError (타임아웃)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return createConsultationError('AI_TIMEOUT');
  }

  // TypeError (네트워크 에러)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createConsultationError('NETWORK_ERROR');
  }

  // 일반 에러
  if (error instanceof Error) {
    // 에러 메시지에서 코드 추출 시도
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return createConsultationError('RATE_LIMIT', error.message);
    }
    if (error.message.includes('timeout') || error.message.includes('시간 초과')) {
      return createConsultationError('AI_TIMEOUT', error.message);
    }
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return createConsultationError('AUTH_ERROR', error.message);
    }

    return createConsultationError('UNKNOWN_ERROR', error.message);
  }

  return createConsultationError('UNKNOWN_ERROR');
}

/**
 * 재시도 가능 여부 확인
 */
export function isRetryableError(error: ConsultationError): boolean {
  return error.retryable;
}

/**
 * 재시도 지연 시간 계산 (지수 백오프)
 */
export function calculateRetryDelay(attempt: number, baseDelay = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
}
