/**
 * 뱃지 API
 * GET /api/badges - 전체 뱃지 + 사용자 획득 상태 조회
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getAllBadges, getUserBadges } from '@/lib/gamification/badges';

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();
    const [allBadges, userBadges] = await Promise.all([
      getAllBadges(supabase),
      getUserBadges(supabase, userId),
    ]);

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

    // 페이지에서 기대하는 형식으로 변환
    const badges = allBadges.map((badge) => {
      const userBadge = userBadges.find((ub) => ub.badgeId === badge.id);
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earned: earnedBadgeIds.has(badge.id),
        earnedAt: userBadge?.earnedAt?.toISOString(),
        category: badge.category,
      };
    });

    return NextResponse.json({ success: true, data: { badges } });
  } catch (error) {
    console.error('[API] GET /api/badges error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          userMessage: '뱃지 데이터를 불러올 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}
