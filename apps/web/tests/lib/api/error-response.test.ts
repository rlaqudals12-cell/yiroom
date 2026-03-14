/**
 * API 에러 응답 헬퍼 테스트
 * @description lib/api/error-response.ts의 에러/성공 응답 팩토리 함수 테스트
 */
import { describe, it, expect } from 'vitest';

// NODE_ENV를 development로 설정하여 details 포함 테스트
const originalEnv = process.env.NODE_ENV;

import {
  createErrorResponse,
  createSuccessResponse,
  emptySuccessResponse,
  isApiError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  badRequestError,
  validationError,
  rateLimitError,
  internalError,
  dbError,
  aiServiceError,
  analysisFailedError,
  dailyLimitError,
  imageQualityError,
} from '@/lib/api/error-response';

describe('createErrorResponse', () => {
  it('에러 코드와 메시지를 포함한 JSON 응답을 생성한다', async () => {
    const response = createErrorResponse('테스트 에러', 400, 'BAD_REQUEST');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('테스트 에러');
    expect(body.code).toBe('BAD_REQUEST');
  });

  it('retryAfter를 포함하면 Retry-After 헤더를 설정한다', async () => {
    const response = createErrorResponse('제한 초과', 429, 'RATE_LIMIT_EXCEEDED', undefined, 60);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(body.retryAfter).toBe(60);
  });

  it('retryAfter가 없으면 Retry-After 헤더를 설정하지 않는다', async () => {
    const response = createErrorResponse('에러', 400, 'BAD_REQUEST');

    expect(response.headers.get('Retry-After')).toBeNull();
  });
});

describe('에러 헬퍼 함수', () => {
  it('unauthorizedError는 401을 반환한다', async () => {
    const response = unauthorizedError();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe('UNAUTHORIZED');
    expect(body.error).toBe('인증이 필요합니다.');
  });

  it('unauthorizedError에 커스텀 메시지를 전달한다', async () => {
    const response = unauthorizedError('세션 만료');
    const body = await response.json();

    expect(body.error).toBe('세션 만료');
  });

  it('forbiddenError는 403을 반환한다', async () => {
    const response = forbiddenError();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe('FORBIDDEN');
  });

  it('notFoundError는 404를 반환한다', async () => {
    const response = notFoundError();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('notFoundError에 커스텀 코드를 전달한다', async () => {
    const response = notFoundError('사용자 없음', 'USER_NOT_FOUND');
    const body = await response.json();

    expect(body.code).toBe('USER_NOT_FOUND');
    expect(body.error).toBe('사용자 없음');
  });

  it('badRequestError는 400을 반환한다', async () => {
    const response = badRequestError();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('BAD_REQUEST');
  });

  it('validationError는 400 VALIDATION_ERROR를 반환한다', async () => {
    const response = validationError();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('rateLimitError는 429를 반환하며 retryAfter를 포함한다', async () => {
    const response = rateLimitError(120);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.retryAfter).toBe(120);
    expect(response.headers.get('Retry-After')).toBe('120');
  });

  it('internalError는 500을 반환한다', async () => {
    const response = internalError();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('dbError는 500 DB_ERROR를 반환한다', async () => {
    const response = dbError();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe('DB_ERROR');
  });

  it('aiServiceError는 500 AI_SERVICE_ERROR를 반환한다', async () => {
    const response = aiServiceError();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe('AI_SERVICE_ERROR');
  });

  it('analysisFailedError는 500 ANALYSIS_FAILED를 반환한다', async () => {
    const response = analysisFailedError();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe('ANALYSIS_FAILED');
  });

  it('dailyLimitError는 429 DAILY_LIMIT_EXCEEDED를 반환한다', async () => {
    const response = dailyLimitError(86400);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.code).toBe('DAILY_LIMIT_EXCEEDED');
    expect(body.retryAfter).toBe(86400);
  });

  it('imageQualityError는 422를 반환한다', async () => {
    const response = imageQualityError();
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe('IMAGE_QUALITY_ERROR');
  });
});

describe('createSuccessResponse', () => {
  it('success: true와 데이터를 포함한 200 응답을 반환한다', async () => {
    const response = createSuccessResponse({ name: '테스트' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ name: '테스트' });
  });

  it('커스텀 상태 코드를 전달한다', async () => {
    const response = createSuccessResponse({ id: '1' }, 201);

    expect(response.status).toBe(201);
  });

  it('커스텀 헤더를 전달한다', async () => {
    const response = createSuccessResponse(null, 200, { 'X-Custom': 'value' });

    expect(response.headers.get('X-Custom')).toBe('value');
  });
});

describe('emptySuccessResponse', () => {
  it('기본 204 빈 응답을 반환한다', () => {
    const response = emptySuccessResponse();

    expect(response.status).toBe(204);
  });

  it('커스텀 상태 코드를 전달한다', () => {
    const response = emptySuccessResponse(201);

    expect(response.status).toBe(201);
  });
});

describe('isApiError', () => {
  it('에러 응답이면 true를 반환한다', () => {
    const errorResponse = { error: '에러', code: 'BAD_REQUEST' as const };

    expect(isApiError(errorResponse)).toBe(true);
  });

  it('성공 응답이면 false를 반환한다', () => {
    const successResponse = { success: true as const, data: { name: 'test' } };

    expect(isApiError(successResponse)).toBe(false);
  });
});
