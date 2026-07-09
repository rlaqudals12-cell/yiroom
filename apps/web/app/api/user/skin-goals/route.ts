/**
 * 피부 목표 조회·저장 API (ADR-117 루틴 v2)
 * GET/PATCH /api/user/skin-goals
 *
 * 사용자가 직접 고른 피부 목표를 beauty_profiles.skin.userGoals JSONB에 저장한다.
 * 분석 파생 concerns와 별도 키 — 루틴 개인화에서 목표가 우선 병합된다.
 */
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBeautyProfile, updateBeautyProfileField } from '@/lib/capsule';
import { SKIN_GOAL_IDS, type SkinGoalId } from '@/lib/skincare';

// goals = SkinGoalId 배열 (중복은 저장 시 제거, 최대 6개)
const patchSchema = z.object({
  goals: z
    .array(z.enum([...SKIN_GOAL_IDS] as [SkinGoalId, ...SkinGoalId[]]))
    .max(SKIN_GOAL_IDS.length),
});

/**
 * GET: 저장된 피부 목표 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'AUTH_ERROR', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const profile = await getBeautyProfile(userId);
    const goals = profile.skin?.userGoals ?? [];

    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('[API] GET /user/skin-goals error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR', message: '피부 목표를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: 피부 목표 저장 (기존 skin JSONB에 userGoals 병합, 다른 필드 보존)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'AUTH_ERROR', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', message: '잘못된 요청입니다.' },
        { status: 400 }
      );
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '올바른 목표를 선택해주세요.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 중복 제거 (선택 순서 보존)
    const goals = [...new Set(parsed.data.goals)];

    // 기존 skin 필드에 userGoals만 병합 — 분석 파생 데이터(type/concerns/scores) 보존
    const profile = await getBeautyProfile(userId);
    const mergedSkin = { ...(profile.skin ?? {}), userGoals: goals };
    await updateBeautyProfileField(userId, 'S', mergedSkin);

    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('[API] PATCH /user/skin-goals error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR', message: '피부 목표를 저장할 수 없습니다.' },
      { status: 500 }
    );
  }
}
