/**
 * 분석 API 인증 + Rate Limit 헬퍼
 *
 * @see ADR-085
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { unauthorizedError } from '@/lib/api/error-response';
import type { AuthOrError } from './types';

/**
 * Clerk 인증 확인 + Rate Limit 적용
 *
 * @param req - Next.js 요청 객체
 * @returns 성공 시 userId, 실패 시 에러 응답
 *
 * @example
 * const authResult = await withAnalysisAuth(req);
 * if (!authResult.ok) return authResult.response;
 * const { userId } = authResult;
 */
export async function withAnalysisAuth(req: NextRequest): Promise<AuthOrError> {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, response: unauthorizedError() };
  }

  // Rate Limit 체크
  const rateLimitResult = applyRateLimit(req, userId);
  if (!rateLimitResult.success) {
    return { ok: false, response: rateLimitResult.response! };
  }

  return { ok: true, userId };
}
