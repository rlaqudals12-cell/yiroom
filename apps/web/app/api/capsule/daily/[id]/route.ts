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
import { getTodayActivityCount, trackActivity } from '@/lib/levels';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

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

/**
 * 등급 시스템 활동 기록 (checkin, 1점) — 하루 1회만.
 *
 * 루틴 체크는 뷰티 사용자의 유일한 매일 활동인데 activity_logs 호출처가 숨김 모듈
 * (운동·영양)뿐이라 등급이 영영 오르지 않았다. 아이템마다 적립하면 체크/해제 반복으로
 * 등급을 부풀릴 수 있으므로 당일 checkin 로그 존재 여부로 중복을 막는다.
 * 비차단 — 계측 실패가 체크 응답을 깨면 안 되므로 예외는 로깅만 한다.
 */
async function recordCheckinActivity(userId: string, dailyCapsuleId: string): Promise<void> {
  try {
    // 트리거가 user_levels를 갱신하려면 RLS 우회가 필요 — service-role (기존 호출처와 동일)
    const supabase = createServiceRoleClient();
    const todayCount = await getTodayActivityCount(supabase, userId, 'checkin');
    if (todayCount > 0) return;

    await trackActivity(supabase, userId, 'checkin', dailyCapsuleId);
  } catch (error) {
    console.error('[API] PATCH /capsule/daily/[id] activity tracking failed:', error);
  }
}

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

    // 체크 해제(false)는 활동이 아니므로 기록하지 않는다
    if (parsed.data.isChecked) {
      await recordCheckinActivity(userId, dailyCapsuleId);
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
