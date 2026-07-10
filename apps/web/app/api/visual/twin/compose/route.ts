/**
 * 표현 레이어: AI 트윈 착장(결합) API (ADR-115)
 *
 * POST /api/visual/twin/compose — { twinId, garmentImageUrl } → 착장 이미지(data URL).
 *   승인된 트윈에만 적용(그 외 403). 결과는 저장하지 않는다(다운로드/공유용).
 *
 * 인증 필수 · 사용자·일 5회 상한(보정+착장+트윈 공유).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  composeOnTwin,
  TwinNotFoundError,
  TwinNotApprovedError,
  TwinGenerationError,
} from '@/lib/visual-expression/twin';
import { checkAndConsumeBudget } from '@/lib/visual-expression';
import {
  unauthorizedError,
  validationError,
  notFoundError,
  forbiddenError,
  internalError,
} from '@/lib/api/error-response';

// 결합 이미지 생성 — 함수 제한 방지
export const maxDuration = 60;

const composeSchema = z.object({
  twinId: z.string().uuid('올바른 트윈 식별자가 아니에요'),
  garmentImageUrl: z.string().url('올바른 의류 이미지 주소가 아니에요'),
});

/** 모바일 크로스 오리진 허용(ADR-103/ADR-118) — 이 라우트만 개방, 인증은 Bearer JWT가 담당 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-yiroom-client',
  'Access-Control-Max-Age': '86400',
};

function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return withCors(unauthorizedError());

    const body = await req.json().catch(() => null);
    const parsed = composeSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(validationError('입력값이 올바르지 않아요', parsed.error.issues[0]?.message));
    }

    // 비용 가드 (보정+착장+트윈 합산 일 5회)
    const budget = checkAndConsumeBudget(userId);
    if (!budget.allowed) {
      return withCors(
        NextResponse.json(
          {
            error: '오늘의 AI 이미지 생성 횟수를 모두 사용했어요. 내일 다시 시도해 주세요.',
            code: 'VISUAL_BUDGET_EXCEEDED',
            remaining: 0,
            limit: budget.limit,
          },
          { status: 429 }
        )
      );
    }

    const result = await composeOnTwin(userId, parsed.data.twinId, {
      kind: 'outfit',
      garmentImageUrl: parsed.data.garmentImageUrl,
    });

    return withCors(NextResponse.json(result));
  } catch (error) {
    if (error instanceof TwinNotFoundError) {
      return withCors(notFoundError(error.message));
    }
    if (error instanceof TwinNotApprovedError) {
      return withCors(forbiddenError(error.message));
    }
    if (error instanceof TwinGenerationError) {
      return withCors(internalError(error.message));
    }
    console.error('[API] POST /api/visual/twin/compose error:', error);
    return withCors(internalError('착장 이미지 생성 중 오류가 발생했어요'));
  }
}
