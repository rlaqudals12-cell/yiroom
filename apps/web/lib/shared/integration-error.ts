/**
 * Cross-Module Integration Error Handling
 * CMP-A6: 에러 처리 모듈
 *
 * @module lib/shared/integration-error
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 *
 * 5가지 에러 시나리오 처리:
 * 1. INTEGRATION_DATA_NOT_FOUND - 소스 데이터 없음
 * 2. INTEGRATION_DATA_EXPIRED - 소스 데이터 만료
 * 3. INTEGRATION_SCHEMA_MISMATCH - 스키마 불일치
 * 4. INTEGRATION_TIMEOUT - 타임아웃
 * 5. INTEGRATION_VALIDATION_ERROR - 검증 실패
 */

import type { SourceModule } from './integration-types';

// ============================================
// 에러 코드 정의
// ============================================

export const INTEGRATION_ERROR_CODES = {
  DATA_NOT_FOUND: 'INTEGRATION_DATA_NOT_FOUND',
  DATA_EXPIRED: 'INTEGRATION_DATA_EXPIRED',
  SCHEMA_MISMATCH: 'INTEGRATION_SCHEMA_MISMATCH',
  TIMEOUT: 'INTEGRATION_TIMEOUT',
  VALIDATION_ERROR: 'INTEGRATION_VALIDATION_ERROR',
} as const;

export type IntegrationErrorCode =
  (typeof INTEGRATION_ERROR_CODES)[keyof typeof INTEGRATION_ERROR_CODES];

// ============================================
// 에러 클래스
// ============================================

export interface IntegrationErrorContext {
  sourceModule?: SourceModule | string;
  targetModule?: string;
  userId?: string;
  schemaVersion?: string;
  expectedVersion?: string;
  validationErrors?: string[];
  timeoutMs?: number;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * 크로스 모듈 연동 에러
 */
export class IntegrationError extends Error {
  public readonly code: IntegrationErrorCode;
  public readonly context: IntegrationErrorContext;
  public readonly timestamp: string;

  constructor(
    code: IntegrationErrorCode,
    message: string,
    context: IntegrationErrorContext = {}
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // V8 스택 트레이스 캡처
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IntegrationError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

// ============================================
// 특화 에러 클래스
// ============================================

/**
 * 소스 데이터 없음 에러
 */
export class IntegrationDataNotFoundError extends IntegrationError {
  constructor(sourceModule: SourceModule | string, userId: string) {
    super(
      INTEGRATION_ERROR_CODES.DATA_NOT_FOUND,
      `${sourceModule} 분석 결과가 없습니다`,
      { sourceModule, userId }
    );
  }
}

/**
 * 소스 데이터 만료 에러
 */
export class IntegrationDataExpiredError extends IntegrationError {
  constructor(
    sourceModule: SourceModule | string,
    userId: string,
    expiredAt: string
  ) {
    super(
      INTEGRATION_ERROR_CODES.DATA_EXPIRED,
      `${sourceModule} 분석 결과가 만료되었습니다 (${expiredAt})`,
      { sourceModule, userId, expiredAt }
    );
  }
}

/**
 * 스키마 불일치 에러
 */
export class IntegrationSchemaMismatchError extends IntegrationError {
  constructor(
    sourceModule: SourceModule | string,
    currentVersion: string,
    expectedVersion: string
  ) {
    super(
      INTEGRATION_ERROR_CODES.SCHEMA_MISMATCH,
      `스키마 버전 불일치: ${currentVersion} (예상: ${expectedVersion})`,
      { sourceModule, schemaVersion: currentVersion, expectedVersion }
    );
  }
}

/**
 * 타임아웃 에러
 */
export class IntegrationTimeoutError extends IntegrationError {
  constructor(
    sourceModule: SourceModule | string,
    timeoutMs: number
  ) {
    super(
      INTEGRATION_ERROR_CODES.TIMEOUT,
      `${sourceModule} 데이터 조회 타임아웃 (${timeoutMs}ms)`,
      { sourceModule, timeoutMs }
    );
  }
}

/**
 * 검증 실패 에러
 */
export class IntegrationValidationError extends IntegrationError {
  constructor(
    sourceModule: SourceModule | string,
    validationErrors: string[]
  ) {
    super(
      INTEGRATION_ERROR_CODES.VALIDATION_ERROR,
      `${sourceModule} 데이터 검증 실패: ${validationErrors.join(', ')}`,
      { sourceModule, validationErrors }
    );
  }
}

// ============================================
// 에러 결과 타입
// ============================================

export interface IntegrationResultFlags {
  fromCache?: boolean;
  usedDefault?: boolean;
  requiresAnalysis?: boolean;
  suggestReanalysis?: boolean;
  temporaryFailure?: boolean;
}

export interface IntegrationResult<T> extends IntegrationResultFlags {
  data: T;
  error?: IntegrationError;
}

// ============================================
// 에러 핸들러
// ============================================

/**
 * 사용자 메시지 매핑
 */
export const USER_MESSAGES: Record<IntegrationErrorCode, string> = {
  [INTEGRATION_ERROR_CODES.DATA_NOT_FOUND]: '먼저 분석을 완료해주세요',
  [INTEGRATION_ERROR_CODES.DATA_EXPIRED]:
    '분석 결과가 오래되었습니다. 다시 분석하시겠습니까?',
  [INTEGRATION_ERROR_CODES.SCHEMA_MISMATCH]: '', // 내부 처리, 사용자 노출 없음
  [INTEGRATION_ERROR_CODES.TIMEOUT]: '일시적인 문제가 발생했습니다',
  [INTEGRATION_ERROR_CODES.VALIDATION_ERROR]: '', // 내부 처리
};

/**
 * 에러 코드별 사용자 메시지 반환
 */
export function getUserMessage(error: IntegrationError): string {
  const baseMessage = USER_MESSAGES[error.code];
  if (!baseMessage) return '';

  // 모듈명 치환
  if (error.context.sourceModule) {
    const moduleName = getModuleDisplayName(error.context.sourceModule);
    return baseMessage.replace('분석', `${moduleName} 분석`);
  }

  return baseMessage;
}

/**
 * 모듈 표시명 반환
 */
export function getModuleDisplayName(module: SourceModule | string): string {
  const names: Record<string, string> = {
    'PC-1': '퍼스널컬러',
    'PC-2': '퍼스널컬러',
    'S-1': '피부',
    'S-2': '피부',
    'C-1': '체형',
    'C-2': '체형',
    'OH-1': '구강건강',
    'M-1': '메이크업',
    'H-1': '헤어',
    'SK-1': '시술',
    'W-1': '운동',
    'W-2': '스트레칭',
    'N-1': '영양',
  };
  return names[module] ?? module;
}

/**
 * 에러 처리 및 Fallback 반환
 * @param error - 처리할 에러
 * @param fallbackData - Fallback 데이터
 * @returns 에러 처리 결과
 */
export function handleIntegrationError<T>(
  error: IntegrationError,
  fallbackData: T
): IntegrationResult<T> {
  // 로깅 (프로덕션에서는 실제 로거 사용)
  console.warn('[Integration] Error handled', {
    code: error.code,
    message: error.message,
    context: error.context,
  });

  // 에러 유형별 처리
  switch (error.code) {
    case INTEGRATION_ERROR_CODES.DATA_NOT_FOUND:
      return {
        data: fallbackData,
        usedDefault: true,
        requiresAnalysis: true,
      };

    case INTEGRATION_ERROR_CODES.DATA_EXPIRED:
      return {
        data: fallbackData,
        usedDefault: true,
        suggestReanalysis: true,
      };

    case INTEGRATION_ERROR_CODES.TIMEOUT:
      return {
        data: fallbackData,
        usedDefault: true,
        temporaryFailure: true,
      };

    case INTEGRATION_ERROR_CODES.SCHEMA_MISMATCH:
    case INTEGRATION_ERROR_CODES.VALIDATION_ERROR:
    default:
      return {
        data: fallbackData,
        usedDefault: true,
      };
  }
}

// ============================================
// 에러 유틸리티
// ============================================

/**
 * IntegrationError 인스턴스 여부 확인
 */
export function isIntegrationError(error: unknown): error is IntegrationError {
  return error instanceof IntegrationError;
}

/**
 * 특정 에러 코드인지 확인
 */
export function hasErrorCode(
  error: unknown,
  code: IntegrationErrorCode
): boolean {
  return isIntegrationError(error) && error.code === code;
}

/**
 * 재시도 가능한 에러인지 확인
 */
export function isRetryableError(error: IntegrationError): boolean {
  return error.code === INTEGRATION_ERROR_CODES.TIMEOUT;
}

/**
 * 사용자에게 표시할 에러인지 확인
 */
export function isUserFacingError(error: IntegrationError): boolean {
  const userFacingCodes: IntegrationErrorCode[] = [
    INTEGRATION_ERROR_CODES.DATA_NOT_FOUND,
    INTEGRATION_ERROR_CODES.DATA_EXPIRED,
    INTEGRATION_ERROR_CODES.TIMEOUT,
  ];
  return userFacingCodes.includes(error.code);
}

/**
 * 에러를 안전하게 래핑
 */
export function wrapError(
  error: unknown,
  sourceModule?: SourceModule | string
): IntegrationError {
  if (isIntegrationError(error)) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : 'Unknown error occurred';

  return new IntegrationError(
    INTEGRATION_ERROR_CODES.VALIDATION_ERROR,
    message,
    { sourceModule, originalError: String(error) }
  );
}
