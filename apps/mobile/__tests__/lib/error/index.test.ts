/**
 * lib/error 모듈 테스트
 *
 * AppError 팩토리, 타입 가드, 사용자 메시지
 */

import {
  createAppError,
  isAppError,
  getUserMessage,
  type ErrorCode,
  type AppError,
} from '../../../lib/error';

describe('createAppError', () => {
  it('올바른 AppError 객체를 생성해야 한다', () => {
    const error = createAppError('AUTH_ERROR', 'Token expired');
    expect(error.code).toBe('AUTH_ERROR');
    expect(error.message).toBe('Token expired');
    expect(error.userMessage).toBe('로그인이 필요합니다.');
  });

  it('details를 포함할 수 있어야 한다', () => {
    const error = createAppError('VALIDATION_ERROR', 'Invalid email', {
      field: 'email',
    });
    expect(error.details).toEqual({ field: 'email' });
  });

  it('모든 ErrorCode에 대해 userMessage가 매핑되어야 한다', () => {
    const codes: ErrorCode[] = [
      'VALIDATION_ERROR',
      'AUTH_ERROR',
      'FORBIDDEN_ERROR',
      'NOT_FOUND_ERROR',
      'CONFLICT_ERROR',
      'RATE_LIMIT_ERROR',
      'AI_TIMEOUT_ERROR',
      'AI_SERVICE_ERROR',
      'DB_ERROR',
      'NETWORK_ERROR',
      'UNKNOWN_ERROR',
    ];

    for (const code of codes) {
      const error = createAppError(code, 'test');
      expect(error.userMessage).toBeTruthy();
      expect(typeof error.userMessage).toBe('string');
    }
  });

  it('각 에러 코드별 한국어 메시지가 올바른지 확인', () => {
    expect(createAppError('VALIDATION_ERROR', '').userMessage).toBe(
      '입력 정보를 확인해주세요.'
    );
    expect(createAppError('NETWORK_ERROR', '').userMessage).toBe(
      '네트워크 연결을 확인해주세요.'
    );
    expect(createAppError('AI_TIMEOUT_ERROR', '').userMessage).toBe(
      '분석 시간이 초과되었습니다. 다시 시도해주세요.'
    );
    expect(createAppError('RATE_LIMIT_ERROR', '').userMessage).toBe(
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    );
  });
});

describe('isAppError', () => {
  it('유효한 AppError를 감지해야 한다', () => {
    const error = createAppError('AUTH_ERROR', 'test');
    expect(isAppError(error)).toBe(true);
  });

  it('일반 Error는 false', () => {
    expect(isAppError(new Error('test'))).toBe(false);
  });

  it('문자열은 false', () => {
    expect(isAppError('error string')).toBe(false);
  });

  it('null/undefined는 false', () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });

  it('부분적 객체는 false', () => {
    expect(isAppError({ code: 'AUTH_ERROR', message: 'test' })).toBe(false);
    expect(isAppError({ code: 'AUTH_ERROR', userMessage: 'test' })).toBe(false);
  });

  it('모든 필드가 있는 일반 객체는 true', () => {
    const fakeError = {
      code: 'CUSTOM',
      message: 'msg',
      userMessage: 'user msg',
    };
    expect(isAppError(fakeError)).toBe(true);
  });
});

describe('getUserMessage', () => {
  it('AppError에서 userMessage 추출', () => {
    const error = createAppError('AUTH_ERROR', 'Token expired');
    expect(getUserMessage(error)).toBe('로그인이 필요합니다.');
  });

  it('일반 Error는 기본 메시지 반환', () => {
    expect(getUserMessage(new Error('test'))).toBe(
      '알 수 없는 오류가 발생했습니다.'
    );
  });

  it('문자열은 기본 메시지 반환', () => {
    expect(getUserMessage('error')).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('null은 기본 메시지 반환', () => {
    expect(getUserMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
  });
});
