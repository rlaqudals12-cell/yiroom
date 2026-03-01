/**
 * 에러 처리 모듈
 *
 * 표준 AppError 타입, createAppError 팩토리
 *
 * @module lib/error
 * @see .claude/rules/error-handling-patterns.md
 */

// ---- 타입 ----

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'FORBIDDEN_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'CONFLICT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'AI_TIMEOUT_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'DB_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  /** 사용자에게 표시할 한국어 메시지 */
  userMessage: string;
  details?: Record<string, unknown>;
}

// ---- 사용자 메시지 매핑 ----

const USER_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  AUTH_ERROR: '로그인이 필요합니다.',
  FORBIDDEN_ERROR: '접근 권한이 없습니다.',
  NOT_FOUND_ERROR: '요청하신 정보를 찾을 수 없습니다.',
  CONFLICT_ERROR: '이미 존재하는 데이터입니다.',
  RATE_LIMIT_ERROR: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  AI_TIMEOUT_ERROR: '분석 시간이 초과되었습니다. 다시 시도해주세요.',
  AI_SERVICE_ERROR: '분석 서비스에 일시적인 문제가 있습니다.',
  DB_ERROR: '데이터 처리 중 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// ---- 팩토리 ----

/**
 * AppError 생성
 *
 * @example
 * throw createAppError('AUTH_ERROR', 'Token expired');
 * // → { code: 'AUTH_ERROR', message: 'Token expired', userMessage: '로그인이 필요합니다.' }
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): AppError {
  return {
    code,
    message,
    userMessage: USER_MESSAGES[code],
    details,
  };
}

/**
 * AppError 타입 가드
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error
  );
}

/**
 * unknown 에러에서 사용자 메시지 추출
 *
 * AppError면 userMessage, 아니면 기본 메시지 반환
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) return error.userMessage;
  return USER_MESSAGES.UNKNOWN_ERROR;
}
