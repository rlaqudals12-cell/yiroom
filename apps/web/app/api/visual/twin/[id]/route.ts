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

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedError();

    const { id } = await context.params;

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return validationError('입력값이 올바르지 않아요', parsed.error.issues[0]?.message);
    }

    const twin =
      parsed.data.action === 'approve'
        ? await approveTwin(userId, id)
        : await rejectTwin(userId, id);

    return NextResponse.json(twin);
  } catch (error) {
    if (error instanceof TwinNotFoundError) {
      return notFoundError(error.message);
    }
    console.error('[API] PATCH /api/visual/twin/[id] error:', error);
    return internalError('트윈 상태 변경 중 오류가 발생했어요');
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorizedError();

    const { id } = await context.params;

    await deleteTwin(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TwinNotFoundError) {
      return notFoundError(error.message);
    }
    console.error('[API] DELETE /api/visual/twin/[id] error:', error);
    return internalError('트윈 삭제 중 오류가 발생했어요');
  }
}
