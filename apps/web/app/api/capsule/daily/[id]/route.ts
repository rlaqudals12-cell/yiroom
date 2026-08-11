/**
 * Daily Capsule 아이템 체크 API
 *
 * PATCH — 아이템 완료 체크/해제
 * @see docs/adr/ADR-073-one-button-daily.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { checkDailyItems } from '@/lib/capsule/daily';

// 단수(itemId) 계약은 하위호환 유지 — 배포된 모바일 APK가 단수 형태를 하드코딩하고 있다.
// 복수(itemIds)는 "모두 완료" 배치용: 단건 PATCH 병렬 발사가 items JSONB
// read-modify-write 경합으로 체크를 유실시키던 결함의 근본 수리.
const checkSchema = z
  .object({
    itemId: z.string().min(1).optional(),
    itemIds: z.array(z.string().min(1)).min(1).optional(),
    isChecked: z.boolean(),
  })
  .refine((data) => Boolean(data.itemId) || Boolean(data.itemIds), {
    message: 'itemId 또는 itemIds가 필요합니다.',
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

    // 단수·복수 계약을 배열 하나로 정규화 — 저장은 항상 단일 read-modify-write
    const itemIds = parsed.data.itemIds ?? (parsed.data.itemId ? [parsed.data.itemId] : []);

    const updated = await checkDailyItems(dailyCapsuleId, itemIds, parsed.data.isChecked, userId);

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
