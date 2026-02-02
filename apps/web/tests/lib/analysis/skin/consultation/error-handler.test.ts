/**
 * 피부 상담 에러 핸들링 테스트
 *
 * @module tests/lib/analysis/skin/consultation/error-handler
 * @description createConsultationError, httpStatusToErrorCode, parseError 등 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createConsultationError,
  httpStatusToErrorCode,
  parseError,
  isRetryableError,
  calculateRetryDelay,
  type ConsultationErrorCode,
  type ConsultationError,
} from '@/lib/analysis/skin/consultation/error-handler';

describe('createConsultationError', () => {
  describe('기본 동작', () => {
    it('에러 코드로 ConsultationError를 생성한다', () => {
      const error = createConsultationError('RATE_LIMIT');

      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('userMessage');
      expect(error).toHaveProperty('retryable');
    });

    it('code가 입력과 일치한다', () => {
      const error = createConsultationError('AI_TIMEOUT');
      expect(error.code).toBe('AI_TIMEOUT');
    });
  });

  describe('에러 코드별 userMessage 검증', () => {
    it('RATE_LIMIT 에러 메시지가 올바르다', () => {
      const error = createConsultationError('RATE_LIMIT');

      expect(error.userMessage).toContain('상담 횟수');
      expect(error.userMessage).toContain('초과');
    });

    it('AI_TIMEOUT 에러 메시지가 올바르다', () => {
      const error = createConsultationError('AI_TIMEOUT');

      expect(error.userMessage).toContain('시간');
      expect(error.userMessage).toContain('초과');
    });

    it('AI_SERVICE_ERROR 에러 메시지가 올바르다', () => {
      const error = createConsultationError('AI_SERVICE_ERROR');

      expect(error.userMessage).toContain('AI 서비스');
      expect(error.userMessage).toContain('문제');
    });

    it('VALIDATION_ERROR 에러 메시지가 올바르다', () => {
      const error = createConsultationError('VALIDATION_ERROR');

      expect(error.userMessage).toContain('질문');
    });

    it('AUTH_ERROR 에러 메시지가 올바르다', () => {
      const error = createConsultationError('AUTH_ERROR');

      expect(error.userMessage).toContain('로그인');
    });

    it('NETWORK_ERROR 에러 메시지가 올바르다', () => {
      const error = createConsultationError('NETWORK_ERROR');

      expect(error.userMessage).toContain('네트워크');
    });

    it('UNKNOWN_ERROR 에러 메시지가 올바르다', () => {
      const error = createConsultationError('UNKNOWN_ERROR');

      expect(error.userMessage).toContain('알 수 없는');
    });
  });

  describe('retryable 속성 검증', () => {
    it('RATE_LIMIT는 retryable: false이다', () => {
      const error = createConsultationError('RATE_LIMIT');
      expect(error.retryable).toBe(false);
    });

    it('AI_TIMEOUT는 retryable: true이다', () => {
      const error = createConsultationError('AI_TIMEOUT');
      expect(error.retryable).toBe(true);
    });

    it('AI_SERVICE_ERROR는 retryable: true이다', () => {
      const error = createConsultationError('AI_SERVICE_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('VALIDATION_ERROR는 retryable: false이다', () => {
      const error = createConsultationError('VALIDATION_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('AUTH_ERROR는 retryable: false이다', () => {
      const error = createConsultationError('AUTH_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('NETWORK_ERROR는 retryable: true이다', () => {
      const error = createConsultationError('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('UNKNOWN_ERROR는 retryable: true이다', () => {
      const error = createConsultationError('UNKNOWN_ERROR');
      expect(error.retryable).toBe(true);
    });
  });

  describe('originalMessage 옵션', () => {
    it('originalMessage가 제공되면 message에 사용된다', () => {
      const error = createConsultationError('AI_TIMEOUT', '원본 에러 메시지');

      expect(error.message).toBe('원본 에러 메시지');
    });

    it('originalMessage가 없으면 userMessage가 message가 된다', () => {
      const error = createConsultationError('AI_TIMEOUT');

      expect(error.message).toBe(error.userMessage);
    });
  });

  describe('details 옵션', () => {
    it('details가 제공되면 포함된다', () => {
      const error = createConsultationError('VALIDATION_ERROR', undefined, {
        field: 'question',
        maxLength: 500,
      });

      expect(error.details).toEqual({ field: 'question', maxLength: 500 });
    });

    it('details가 없으면 undefined이다', () => {
      const error = createConsultationError('VALIDATION_ERROR');

      expect(error.details).toBeUndefined();
    });
  });
});

describe('httpStatusToErrorCode', () => {
  describe('인증 에러 (4xx)', () => {
    it('401은 AUTH_ERROR이다', () => {
      expect(httpStatusToErrorCode(401)).toBe('AUTH_ERROR');
    });

    it('403은 AUTH_ERROR이다', () => {
      expect(httpStatusToErrorCode(403)).toBe('AUTH_ERROR');
    });
  });

  describe('검증 에러 (4xx)', () => {
    it('400은 VALIDATION_ERROR이다', () => {
      expect(httpStatusToErrorCode(400)).toBe('VALIDATION_ERROR');
    });

    it('422는 VALIDATION_ERROR이다', () => {
      expect(httpStatusToErrorCode(422)).toBe('VALIDATION_ERROR');
    });
  });

  describe('요청 제한', () => {
    it('429는 RATE_LIMIT이다', () => {
      expect(httpStatusToErrorCode(429)).toBe('RATE_LIMIT');
    });
  });

  describe('타임아웃', () => {
    it('504는 AI_TIMEOUT이다', () => {
      expect(httpStatusToErrorCode(504)).toBe('AI_TIMEOUT');
    });

    it('408은 AI_TIMEOUT이다', () => {
      expect(httpStatusToErrorCode(408)).toBe('AI_TIMEOUT');
    });
  });

  describe('서버 에러 (5xx)', () => {
    it('500은 AI_SERVICE_ERROR이다', () => {
      expect(httpStatusToErrorCode(500)).toBe('AI_SERVICE_ERROR');
    });

    it('502는 AI_SERVICE_ERROR이다', () => {
      expect(httpStatusToErrorCode(502)).toBe('AI_SERVICE_ERROR');
    });

    it('503은 AI_SERVICE_ERROR이다', () => {
      expect(httpStatusToErrorCode(503)).toBe('AI_SERVICE_ERROR');
    });
  });

  describe('알 수 없는 상태 코드', () => {
    it('알 수 없는 4xx 코드는 UNKNOWN_ERROR이다', () => {
      expect(httpStatusToErrorCode(404)).toBe('UNKNOWN_ERROR');
      expect(httpStatusToErrorCode(405)).toBe('UNKNOWN_ERROR');
      expect(httpStatusToErrorCode(409)).toBe('UNKNOWN_ERROR');
    });

    it('알 수 없는 5xx 코드는 UNKNOWN_ERROR이다', () => {
      expect(httpStatusToErrorCode(505)).toBe('UNKNOWN_ERROR');
      expect(httpStatusToErrorCode(599)).toBe('UNKNOWN_ERROR');
    });

    it('2xx 코드도 UNKNOWN_ERROR이다', () => {
      expect(httpStatusToErrorCode(200)).toBe('UNKNOWN_ERROR');
      expect(httpStatusToErrorCode(201)).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('parseError', () => {
  describe('DOMException (AbortError) 처리', () => {
    it('AbortError DOMException은 AI_TIMEOUT이다', () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      const result = parseError(abortError);

      expect(result.code).toBe('AI_TIMEOUT');
      expect(result.retryable).toBe(true);
    });

    it('다른 DOMException은 UNKNOWN_ERROR이다', () => {
      const otherError = new DOMException('Some error', 'NotFoundError');
      const result = parseError(otherError);

      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('TypeError (fetch) 처리', () => {
    it('fetch 관련 TypeError는 NETWORK_ERROR이다', () => {
      const fetchError = new TypeError('Failed to fetch');
      const result = parseError(fetchError);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
    });

    it('다른 TypeError는 UNKNOWN_ERROR이다', () => {
      const otherError = new TypeError('Cannot read property');
      const result = parseError(otherError);

      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('일반 Error 메시지 파싱', () => {
    it('rate limit 메시지는 RATE_LIMIT이다', () => {
      const error = new Error('rate limit exceeded');
      const result = parseError(error);

      expect(result.code).toBe('RATE_LIMIT');
      expect(result.message).toBe('rate limit exceeded');
    });

    it('429 메시지는 RATE_LIMIT이다', () => {
      const error = new Error('Error 429: Too Many Requests');
      const result = parseError(error);

      expect(result.code).toBe('RATE_LIMIT');
    });

    it('timeout 메시지는 AI_TIMEOUT이다', () => {
      const error = new Error('Request timeout');
      const result = parseError(error);

      expect(result.code).toBe('AI_TIMEOUT');
    });

    it('시간 초과 메시지는 AI_TIMEOUT이다', () => {
      const error = new Error('요청 시간 초과');
      const result = parseError(error);

      expect(result.code).toBe('AI_TIMEOUT');
    });

    it('unauthorized 메시지는 AUTH_ERROR이다', () => {
      const error = new Error('unauthorized access');
      const result = parseError(error);

      expect(result.code).toBe('AUTH_ERROR');
    });

    it('401 메시지는 AUTH_ERROR이다', () => {
      const error = new Error('HTTP 401 Unauthorized');
      const result = parseError(error);

      expect(result.code).toBe('AUTH_ERROR');
    });

    it('일반 에러는 UNKNOWN_ERROR이다', () => {
      const error = new Error('Something went wrong');
      const result = parseError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Something went wrong');
    });
  });

  describe('비 Error 타입 처리', () => {
    it('null은 UNKNOWN_ERROR이다', () => {
      const result = parseError(null);

      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('undefined은 UNKNOWN_ERROR이다', () => {
      const result = parseError(undefined);

      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('문자열은 UNKNOWN_ERROR이다', () => {
      const result = parseError('에러 문자열');

      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('객체는 UNKNOWN_ERROR이다', () => {
      const result = parseError({ message: 'error object' });

      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('isRetryableError', () => {
  describe('재시도 가능한 에러', () => {
    it('retryable: true인 에러는 true를 반환한다', () => {
      const error: ConsultationError = {
        code: 'AI_TIMEOUT',
        message: 'Timeout',
        userMessage: '시간 초과',
        retryable: true,
      };

      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe('재시도 불가능한 에러', () => {
    it('retryable: false인 에러는 false를 반환한다', () => {
      const error: ConsultationError = {
        code: 'RATE_LIMIT',
        message: 'Rate limit',
        userMessage: '요청 제한',
        retryable: false,
      };

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('에러 코드별 재시도 가능 여부', () => {
    const testCases: Array<[ConsultationErrorCode, boolean]> = [
      ['RATE_LIMIT', false],
      ['AI_TIMEOUT', true],
      ['AI_SERVICE_ERROR', true],
      ['VALIDATION_ERROR', false],
      ['AUTH_ERROR', false],
      ['NETWORK_ERROR', true],
      ['UNKNOWN_ERROR', true],
    ];

    it.each(testCases)('%s 에러의 재시도 가능 여부는 %s이다', (code, expected) => {
      const error = createConsultationError(code);
      expect(isRetryableError(error)).toBe(expected);
    });
  });
});

describe('calculateRetryDelay', () => {
  describe('지수 백오프 계산', () => {
    it('첫 번째 시도(attempt=0)는 baseDelay를 반환한다', () => {
      expect(calculateRetryDelay(0)).toBe(1000);
    });

    it('두 번째 시도(attempt=1)는 baseDelay * 2를 반환한다', () => {
      expect(calculateRetryDelay(1)).toBe(2000);
    });

    it('세 번째 시도(attempt=2)는 baseDelay * 4를 반환한다', () => {
      expect(calculateRetryDelay(2)).toBe(4000);
    });

    it('네 번째 시도(attempt=3)는 baseDelay * 8를 반환한다', () => {
      expect(calculateRetryDelay(3)).toBe(8000);
    });
  });

  describe('최대 지연 시간 제한', () => {
    it('최대 10000ms를 초과하지 않는다', () => {
      expect(calculateRetryDelay(5)).toBe(10000);
      expect(calculateRetryDelay(10)).toBe(10000);
      expect(calculateRetryDelay(100)).toBe(10000);
    });

    it('attempt=4일 때 16000ms -> 10000ms로 제한된다', () => {
      // 1000 * 2^4 = 16000 > 10000
      expect(calculateRetryDelay(4)).toBe(10000);
    });
  });

  describe('커스텀 baseDelay', () => {
    it('baseDelay=500일 때 올바르게 계산된다', () => {
      expect(calculateRetryDelay(0, 500)).toBe(500);
      expect(calculateRetryDelay(1, 500)).toBe(1000);
      expect(calculateRetryDelay(2, 500)).toBe(2000);
    });

    it('baseDelay=2000일 때 올바르게 계산된다', () => {
      expect(calculateRetryDelay(0, 2000)).toBe(2000);
      expect(calculateRetryDelay(1, 2000)).toBe(4000);
      expect(calculateRetryDelay(2, 2000)).toBe(8000);
    });

    it('baseDelay가 커도 최대 10000ms를 초과하지 않는다', () => {
      expect(calculateRetryDelay(0, 15000)).toBe(10000);
      expect(calculateRetryDelay(1, 10000)).toBe(10000);
    });
  });

  describe('경계 케이스', () => {
    it('attempt=0, baseDelay=10000이면 10000을 반환한다', () => {
      expect(calculateRetryDelay(0, 10000)).toBe(10000);
    });

    it('baseDelay=0이면 0을 반환한다', () => {
      expect(calculateRetryDelay(0, 0)).toBe(0);
      expect(calculateRetryDelay(5, 0)).toBe(0);
    });

    it('음수 attempt는 1 미만의 값을 반환한다', () => {
      // 1000 * 2^-1 = 500
      expect(calculateRetryDelay(-1)).toBe(500);
    });
  });
});
