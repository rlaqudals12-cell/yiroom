/**
 * Rate Limit Middleware 헬퍼
 *
 * @description proxy.ts에서 사용하는 Rate Limit 미들웨어 함수
 * @see SDD-RATE-LIMITING.md
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  RateLimitResult,
  RateLimitErrorResponse,
  RATE_LIMIT_HEADERS,
} from '@/types/rate-limit';
import {
  checkRateLimitWithFallback,
  getRateLimitCategory,
  getIdentifier,
  isRateLimitedPath,
  extractIpAddress,
} from './fallback';
import { logRateLimitExceeded } from './monitoring';

/**
 * Rate Limit 미들웨어 결과
 */
export interface RateLimitMiddlewareResult {
  /** Rate Limit 통과 여부 */
  allowed: boolean;
  /** Rate Limit 초과 시 응답 (429) */
  response?: NextResponse;
  /** 성공 응답에 추가할 헤더 */
  headers: Record<string, string>;
}

/**
 * Rate Limit 에러 응답 생성
 *
 * @param result Rate Limit 검사 결과
 */
function createRateLimitErrorResponse(result: RateLimitResult): NextResponse {
  // 어떤 한도가 초과되었는지 판단
  const limitType = result.minuteRemaining === 0 ? 'minute' : 'daily';
  const retryAfter = Math.ceil(
    (limitType === 'minute' ? result.resetMinute : result.resetDaily) / 1000 -
      Date.now() / 1000
  );

  const errorBody: RateLimitErrorResponse = {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message:
        limitType === 'minute'
          ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
          : '일일 요청 한도를 초과했습니다. 내일 다시 시도해주세요.',
      retryAfter: Math.max(retryAfter, 1),
      limitType,
    },
  };

  return NextResponse.json(errorBody, {
    status: 429,
    headers: {
      ...result.headers,
      [RATE_LIMIT_HEADERS.RETRY_AFTER]: Math.max(retryAfter, 1).toString(),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Rate Limit 미들웨어 적용
 *
 * @param request Next.js Request 객체
 * @param userId 사용자 ID (로그인 시)
 * @returns Rate Limit 미들웨어 결과
 *
 * @example
 * ```typescript
 * // proxy.ts에서 사용
 * const rateLimitResult = await applyRateLimitMiddleware(req, userId);
 *
 * if (!rateLimitResult.allowed) {
 *   return rateLimitResult.response;
 * }
 *
 * // Rate Limit 헤더 추가
 * const response = NextResponse.next();
 * Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
 *   response.headers.set(key, value);
 * });
 * return response;
 * ```
 */
export async function applyRateLimitMiddleware(
  request: NextRequest,
  userId: string | null = null
): Promise<RateLimitMiddlewareResult> {
  const pathname = request.nextUrl.pathname;

  // Rate Limit 대상이 아닌 경로
  if (!isRateLimitedPath(pathname)) {
    return {
      allowed: true,
      headers: {},
    };
  }

  // 카테고리 결정
  const category = getRateLimitCategory(pathname);

  // IP 추출
  const ip = extractIpAddress(request);

  // 식별자 결정
  const identifier = getIdentifier(category, userId, ip);

  // Rate Limit 검사
  const result = await checkRateLimitWithFallback(identifier, category);

  // 한도 초과 시
  if (!result.success) {
    // 로깅
    logRateLimitExceeded(identifier, category, result);

    return {
      allowed: false,
      response: createRateLimitErrorResponse(result),
      headers: result.headers,
    };
  }

  // 성공
  return {
    allowed: true,
    headers: result.headers,
  };
}

/**
 * Rate Limit 헤더를 응답에 추가
 *
 * @param response NextResponse 객체
 * @param headers Rate Limit 헤더
 */
export function addRateLimitHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
