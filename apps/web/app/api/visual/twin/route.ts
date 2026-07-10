/**
 * 표현 레이어: AI 트윈 생성/조회 API (ADR-115)
 *
 * POST /api/visual/twin — 트윈 생성(status pending). 인증·상한·zod·이미지 ≤10MB.
 * GET  /api/visual/twin — 내 트윈(approved 우선, 없으면 최신). { twin: TwinRecord | null }.
 *
 * 승인 전 트윈은 GET에서 최신으로 노출될 수 있으나(본인 확인용), 다른 표면 노출은
 * 호출 측(UI) 책임 — 승인 게이트를 통과해야 활성.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { generateTwin, getMyTwin, TwinGenerationError } from '@/lib/visual-expression/twin';
import { checkAndConsumeBudget } from '@/lib/visual-expression';
import { unauthorizedError, validationError, internalError } from '@/lib/api/error-response';

// 나노바나나 이미지 생성은 수 초~수십 초 — 함수 제한 방지
export const maxDuration = 60;

/** 모바일 크로스 오리진 허용(ADR-103/ADR-118) — 이 라우트만 개방, 인증은 Bearer JWT가 담당 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

const imageSchema = z
  .string()
  .min(100, '이미지 데이터가 너무 짧아요')
  // 약 10MB(base64 문자 기준) 상한
  .max(14_000_000, '이미지가 너무 커요')
  .refine((v) => v.startsWith('data:image/'), '올바른 이미지 형식이 아니에요');

const createSchema = z.object({
  faceImageBase64: imageSchema,
  bodyImageBase64: imageSchema.optional(),
  bodyConstraint: z
    .object({
      bodyTypeLabel: z.string().min(1).max(100),
      ratios: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return withCors(unauthorizedError());

    const twin = await getMyTwin(userId);
    return withCors(NextResponse.json({ twin }));
  } catch (error) {
    console.error('[API] GET /api/visual/twin error:', error);
    return withCors(internalError('트윈을 불러오는 중 오류가 발생했어요'));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return withCors(unauthorizedError());

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
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

    const twin = await generateTwin(userId, {
      faceImageBase64: parsed.data.faceImageBase64,
      bodyImageBase64: parsed.data.bodyImageBase64,
      bodyConstraint: parsed.data.bodyConstraint,
    });

    return withCors(NextResponse.json(twin));
  } catch (error) {
    if (error instanceof TwinGenerationError) {
      // 가짜 트윈 금지 — 정직한 실패
      return withCors(internalError(error.message));
    }
    console.error('[API] POST /api/visual/twin error:', error);
    return withCors(internalError('트윈 생성 중 오류가 발생했어요'));
  }
}
