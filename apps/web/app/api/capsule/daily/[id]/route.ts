/**
 * Daily Capsule 아이템 체크 API
 *
 * PATCH — 아이템 완료 체크/해제
 * @see docs/adr/ADR-073-one-button-daily.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { checkDailyItem } from '@/lib/capsule/daily';

const checkSchema = z.object({
  itemId: z.string().min(1),
  isChecked: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const { id: dailyCapsuleId } = await context.params;
    const body = await request.json();
    const parsed = checkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '입력 정보를 확인해주세요.' },
        },
        { status: 400 }
      );
    }

    const updated = await checkDailyItem(dailyCapsuleId, parsed.data.itemId, parsed.data.isChecked);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND_ERROR', message: '캡슐을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[API] PATCH /capsule/daily/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
