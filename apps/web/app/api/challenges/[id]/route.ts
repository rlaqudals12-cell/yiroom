/**
 * 개별 챌린지 API
 * GET: 챌린지 상세 조회
 * PATCH: 챌린지 상태 변경 (포기 등)
 * DELETE: 챌린지 포기 (PATCH 대체)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getChallengeById,
  getUserChallengeByChallenge,
  abandonChallenge,
  completeChallenge,
} from '@/lib/challenges';

/**
 * GET /api/challenges/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createClerkSupabaseClient();

    // 챌린지 정보
    const challenge = await getChallengeById(supabase, id);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // 사용자 참여 정보
    const userChallenge = await getUserChallengeByChallenge(supabase, userId, id);

    return NextResponse.json({
      success: true,
      challenge,
      userChallenge,
      isParticipating: !!userChallenge,
    });
  } catch (error) {
    console.error('[Challenge API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/challenges/[id]
 * Body: { action: 'abandon' | 'complete' }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createClerkSupabaseClient();

    // 사용자 참여 정보 확인
    const userChallenge = await getUserChallengeByChallenge(supabase, userId, id);
    if (!userChallenge) {
      return NextResponse.json({ error: '참여 중인 챌린지가 아닙니다.' }, { status: 404 });
    }

    // 액션 처리
    if (body.action === 'abandon') {
      const success = await abandonChallenge(supabase, userChallenge.id);
      if (!success) {
        return NextResponse.json({ error: '챌린지 포기에 실패했습니다.' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: '챌린지를 포기했습니다.',
      });
    }

    if (body.action === 'complete') {
      const result = await completeChallenge(supabase, userChallenge.id, userId);
      if (!result.success) {
        return NextResponse.json({ error: '챌린지 완료 처리에 실패했습니다.' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        xpAwarded: result.xpAwarded,
        badgeAwarded: result.badgeAwarded,
        message: `챌린지를 완료했습니다! ${result.xpAwarded}XP를 획득했어요.`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "abandon" or "complete".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Challenge API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
