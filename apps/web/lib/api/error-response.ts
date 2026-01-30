/**
 * API 에러 응답 표준화 헬퍼
 *
 * 모든 API 라우트에서 일관된 에러 응답 형식을 제공합니다.
 *
 * @example
 * ```ts
 * import { createErrorResponse, ApiErrorCode } from '@/lib/api/error-response';
 *
 * // 기본 사용
 * return createErrorResponse('사용자를 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');
 *
 * // 개발 환경에서 상세 정보 포함
 * return createErrorResponse(
 *   '데이터베이스 오류',
 *   500,
 *   'DB_ERROR',
 *   error instanceof Error ? error.message : undefined
 * );
 * ```
 */

import { NextResponse } from 'next/server';

/**
 * 표준 에러 코드
 */
export type ApiErrorCode =
  // 인증/인가
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  // 요청 오류
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'MISSING_REQUIRED_FIELD'
  // 리소스
  | 'NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  // 비즈니스 로직
  | 'RATE_LIMIT_EXCEEDED'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'ALREADY_EXISTS'
  | 'CONFLICT'
  // 외부 서비스
  | 'AI_SERVICE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'PAYMENT_ERROR'
  // 서버 오류
  | 'INTERNAL_ERROR'
  | 'DB_ERROR'
  | 'STORAGE_ERROR'
  // 분석 관련
  | 'ANALYSIS_FAILED'
  | 'IMAGE_PROCESSING_ERROR'
  | 'IMAGE_QUALITY_ERROR'
  | 'INSUFFICIENT_DATA';

/**
 * 표준 API 에러 응답 인터페이스
 */
export interface ApiErrorResponse {
  /** 사용자에게 표시할 에러 메시지 (한국어) */
  error: string;
  /** 에러 코드 (클라이언트 처리용) */
  code: ApiErrorCode;
  /** 상세 정보 (개발 환경에서만 포함) */
  details?: string;
  /** 재시도 대기 시간 (Rate Limit 시) */
  retryAfter?: number;
}

/**
 * 개발 환경 여부
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 표준화된 에러 응답 생성
 *
 * @param message - 사용자에게 표시할 에러 메시지 (한국어)
 * @param status - HTTP 상태 코드
 * @param code - 에러 코드
 * @param details - 상세 정보 (개발 환경에서만 포함됨)
 * @param retryAfter - 재시도 대기 시간 (초)
 */
export function createErrorResponse(
  message: string,
  status: number,
  code: ApiErrorCode,
  details?: string,
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    error: message,
    code,
  };

  // 개발 환경에서만 상세 정보 포함
  if (isDevelopment && details) {
    body.details = details;
  }

  // Rate Limit 시 재시도 시간 포함
  if (retryAfter !== undefined) {
    body.retryAfter = retryAfter;
  }

  const headers: Record<string, string> = {};
  if (retryAfter !== undefined) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return NextResponse.json(body, {
    status,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}

/**
 * 자주 사용되는 에러 응답 헬퍼
 */

/** 401 Unauthorized */
export function unauthorizedError(message = '인증이 필요합니다.'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 401, 'UNAUTHORIZED');
}

/** 403 Forbidden */
export function forbiddenError(message = '권한이 없습니다.'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 403, 'FORBIDDEN');
}

/** 404 Not Found */
export function notFoundError(
  message = '요청한 리소스를 찾을 수 없습니다.',
  code: ApiErrorCode = 'NOT_FOUND'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 404, code);
}

/** 400 Bad Request */
export function badRequestError(
  message = '잘못된 요청입니다.',
  details?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400, 'BAD_REQUEST', details);
}

/** 400 Validation Error */
export function validationError(
  message = '입력값이 올바르지 않습니다.',
  details?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400, 'VALIDATION_ERROR', details);
}

/** 429 Rate Limit */
export function rateLimitError(retryAfter: number): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    429,
    'RATE_LIMIT_EXCEEDED',
    undefined,
    retryAfter
  );
}

/** 500 Internal Server Error */
export function internalError(
  message = '서버 오류가 발생했습니다.',
  details?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 500, 'INTERNAL_ERROR', details);
}

/** 500 Database Error */
export function dbError(
  message = '데이터베이스 오류가 발생했습니다.',
  details?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 500, 'DB_ERROR', details);
}

/** 500 AI Service Error */
export function aiServiceError(
  message = 'AI 분석 서비스 오류가 발생했습니다.',
  details?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 500, 'AI_SERVICE_ERROR', details);
}

/** 500 Analysis Failed */
export function analysisFailedError(
  message = '분석에 실패했습니다.',
  details?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 500, 'ANALYSIS_FAILED', details);
}

/** 429 Daily Limit Exceeded */
export function dailyLimitError(retryAfter: number): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    '일일 요청 한도를 초과했습니다. 내일 다시 시도해주세요.',
    429,
    'DAILY_LIMIT_EXCEEDED',
    undefined,
    retryAfter
  );
}

/** 422 Image Quality Error */
export function imageQualityError(
  message = '이미지 품질이 분석에 적합하지 않습니다.',
  details?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 422, 'IMAGE_QUALITY_ERROR', details);
}

/**
 * 표준 성공 응답 인터페이스
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * 표준화된 성공 응답 생성
 *
 * @param data - 응답 데이터
 * @param status - HTTP 상태 코드 (기본: 200)
 * @param headers - 추가 헤더
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status, headers }
  );
}

/**
 * 빈 성공 응답 (201 Created, 204 No Content 등)
 */
export function emptySuccessResponse(status = 204): NextResponse {
  return new NextResponse(null, { status });
}

/**
 * 통합 API 응답 타입
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 에러 응답인지 확인하는 타입 가드
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return 'error' in response && 'code' in response;
}
