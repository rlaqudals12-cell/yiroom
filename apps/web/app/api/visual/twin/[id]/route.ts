/**
 * 표현 레이어: AI 트윈 승인/거부/삭제 API (ADR-115)
 *
 * PATCH  /api/visual/twin/[id] — { action: 'approve' | 'reject' }.
 *   approve 시 기존 approved는 rejected로 강등(사용자당 approved 1개 원칙).
 * DELETE /api/visual/twin/[id] — Storage 파일 + DB 행 동시 삭제.
 *
 * 인증 필수 · 본인 소유만(없으면 404).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  approveTwin,
  deleteTwin,
  rejectTwin,
  TwinNotFoundError,
} from '@/lib/visual-expression/twin';
import {
  unauthorizedError,
  validationError,
  notFoundError,
  internalError,
} from '@/lib/api/error-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

/** 모바일 크로스 오리진 허용(ADR-103/ADR-118) — 이 라우트만 개방, 인증은 Bearer JWT가 담당 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
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

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return withCors(unauthorizedError());

    const { id } = await context.params;

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(validationError('입력값이 올바르지 않아요', parsed.error.issues[0]?.message));
    }

    const twin =
      parsed.data.action === 'approve'
        ? await approveTwin(userId, id)
        : await rejectTwin(userId, id);

    return withCors(NextResponse.json(twin));
  } catch (error) {
    if (error instanceof TwinNotFoundError) {
      return withCors(notFoundError(error.message));
    }
    console.error('[API] PATCH /api/visual/twin/[id] error:', error);
    return withCors(internalError('트윈 상태 변경 중 오류가 발생했어요'));
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return withCors(unauthorizedError());

    const { id } = await context.params;

    await deleteTwin(userId, id);
    return withCors(NextResponse.json({ success: true }));
  } catch (error) {
    if (error instanceof TwinNotFoundError) {
      return withCors(notFoundError(error.message));
    }
    console.error('[API] DELETE /api/visual/twin/[id] error:', error);
    return withCors(internalError('트윈 삭제 중 오류가 발생했어요'));
  }
}
