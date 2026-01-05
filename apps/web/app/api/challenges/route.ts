/**
 * 챌린지 API
 * GET: 챌린지 목록 조회
 * POST: 챌린지 참여
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getActiveChallenges,
  getChallengesByDomain,
  getUserChallenges,
  getActiveUserChallenges,
  joinChallenge,
} from '@/lib/challenges';
import type { ChallengeDomain } from '@/types/challenges';

/**
 * GET /api/challenges
 * Query params:
 * - domain: 'workout' | 'nutrition' | 'combined' (필터)
 * - user: 'true' (내 챌린지만 조회)
 * - active: 'true' (진행 중인 챌린지만)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();
    const { searchParams } = new URL(request.url);

    const domain = searchParams.get('domain') as ChallengeDomain | null;
    const isUserOnly = searchParams.get('user') === 'true';
    const isActiveOnly = searchParams.get('active') === 'true';

    // 내 챌린지 조회
    if (isUserOnly) {
      const challenges = isActiveOnly
        ? await getActiveUserChallenges(supabase, userId)
        : await getUserChallenges(supabase, userId);

      return NextResponse.json({
        success: true,
        challenges,
        count: challenges.length,
      });
    }

    // 전체 챌린지 조회
    const challenges = domain
      ? await getChallengesByDomain(supabase, domain)
      : await getActiveChallenges(supabase);

    return NextResponse.json({
      success: true,
      challenges,
      count: challenges.length,
    });
  } catch (error) {
    console.error('[Challenges API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/challenges
 * Body: { challengeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.challengeId) {
      return NextResponse.json({ error: 'challengeId is required' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();
    const result = await joinChallenge(supabase, userId, body.challengeId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userChallenge: result.userChallenge,
      message: result.message,
    });
  } catch (error) {
    console.error('[Challenges API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
