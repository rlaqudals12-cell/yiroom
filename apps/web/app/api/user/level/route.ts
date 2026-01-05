/**
 * 사용자 레벨 API
 * GET /api/user/level - 현재 사용자 레벨 조회
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getUserLevel, calculateUserLevelState } from '@/lib/levels';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();
    const userLevel = await getUserLevel(supabase, userId);

    if (!userLevel) {
      // 레벨 정보가 없으면 기본값으로 응답
      const defaultState = calculateUserLevelState(0);
      return NextResponse.json({
        level: defaultState.level,
        totalActivityCount: 0,
        nextLevelThreshold: defaultState.nextLevelThreshold,
        progress: defaultState.progress,
        levelInfo: defaultState.levelInfo,
        levelUpdatedAt: null,
      });
    }

    const levelState = calculateUserLevelState(userLevel.totalActivityCount);

    return NextResponse.json({
      level: levelState.level,
      totalActivityCount: userLevel.totalActivityCount,
      nextLevelThreshold: levelState.nextLevelThreshold,
      progress: levelState.progress,
      levelInfo: levelState.levelInfo,
      levelUpdatedAt: userLevel.levelUpdatedAt,
    });
  } catch (error) {
    console.error('[API] GET /api/user/level error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
