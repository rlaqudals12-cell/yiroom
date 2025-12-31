/**
 * 챌린지 시스템 변경 함수
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { challengeLogger } from '@/lib/utils/logger';
import type {
  UserChallenge,
  UserChallengeRow,
  ChallengeProgress,
  JoinChallengeResult,
  CompleteChallengeResult,
  UpdateProgressResult,
} from '@/types/challenges';
import {
  userChallengeRowToUserChallenge,
  calculateTargetEndAt,
  isChallengeCompleted,
} from './constants';
import { getChallengeById, isUserParticipating } from './queries';
import { addXp, awardBadgeById } from '@/lib/gamification';

// ============================================================
// 챌린지 참여
// ============================================================

/**
 * 챌린지 참여
 */
export async function joinChallenge(
  supabase: SupabaseClient,
  clerkUserId: string,
  challengeId: string
): Promise<JoinChallengeResult> {
  // 1. 챌린지 존재 확인
  const challenge = await getChallengeById(supabase, challengeId);
  if (!challenge) {
    return {
      success: false,
      userChallenge: null as unknown as UserChallenge,
      message: '챌린지를 찾을 수 없습니다.',
    };
  }

  // 2. 이미 참여 중인지 확인
  const isParticipating = await isUserParticipating(supabase, clerkUserId, challengeId);
  if (isParticipating) {
    return {
      success: false,
      userChallenge: null as unknown as UserChallenge,
      message: '이미 참여 중인 챌린지입니다.',
    };
  }

  // 3. 시작일 및 종료일 계산
  const startedAt = new Date();
  const targetEndAt = calculateTargetEndAt(startedAt, challenge.durationDays);

  // 4. 초기 진행 상황
  const initialProgress: ChallengeProgress = {
    currentDays: 0,
    totalDays: challenge.durationDays,
    completedDays: [],
    missedDays: [],
    completedCount: 0,
    percentage: 0,
  };

  // 5. DB 저장
  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      clerk_user_id: clerkUserId,
      challenge_id: challengeId,
      status: 'in_progress',
      started_at: startedAt.toISOString(),
      target_end_at: targetEndAt.toISOString(),
      progress: initialProgress,
      reward_claimed: false,
    })
    .select('*, challenges(*)')
    .single();

  if (error) {
    challengeLogger.error(' Join challenge error:', error);
    return {
      success: false,
      userChallenge: null as unknown as UserChallenge,
      message: '챌린지 참여에 실패했습니다.',
    };
  }

  return {
    success: true,
    userChallenge: userChallengeRowToUserChallenge(data as UserChallengeRow),
    message: '챌린지에 참여했습니다!',
  };
}

// ============================================================
// 진행 상황 업데이트
// ============================================================

/**
 * 챌린지 진행 상황 업데이트
 */
export async function updateChallengeProgress(
  supabase: SupabaseClient,
  userChallengeId: string,
  progress: ChallengeProgress
): Promise<UpdateProgressResult> {
  // 1. 현재 상태 조회
  const { data: current, error: fetchError } = await supabase
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('id', userChallengeId)
    .single();

  if (fetchError || !current) {
    challengeLogger.error(' Fetch for update error:', fetchError);
    return {
      success: false,
      progress: {},
      isCompleted: false,
    };
  }

  const userChallenge = userChallengeRowToUserChallenge(current as UserChallengeRow);

  // 2. 이미 완료/실패/포기된 챌린지는 업데이트 불가
  if (userChallenge.status !== 'in_progress') {
    return {
      success: false,
      progress: userChallenge.progress,
      isCompleted: userChallenge.status === 'completed',
    };
  }

  // 3. 진행 상황 업데이트
  const { error: updateError } = await supabase
    .from('user_challenges')
    .update({
      progress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userChallengeId);

  if (updateError) {
    challengeLogger.error(' Update progress error:', updateError);
    return {
      success: false,
      progress: userChallenge.progress,
      isCompleted: false,
    };
  }

  // 4. 완료 여부 확인
  const isCompleted = userChallenge.challenge
    ? isChallengeCompleted(progress, userChallenge.challenge.target)
    : false;

  return {
    success: true,
    progress,
    isCompleted,
  };
}

// ============================================================
// 챌린지 완료
// ============================================================

/**
 * 챌린지 완료 처리 및 보상 지급
 */
export async function completeChallenge(
  supabase: SupabaseClient,
  userChallengeId: string,
  clerkUserId: string
): Promise<CompleteChallengeResult> {
  // 1. 현재 상태 조회
  const { data: current, error: fetchError } = await supabase
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('id', userChallengeId)
    .single();

  if (fetchError || !current) {
    challengeLogger.error(' Fetch for complete error:', fetchError);
    return {
      success: false,
      xpAwarded: 0,
    };
  }

  const userChallenge = userChallengeRowToUserChallenge(current as UserChallengeRow);

  // 2. 이미 보상을 받았는지 확인
  if (userChallenge.rewardClaimed) {
    return {
      success: false,
      xpAwarded: 0,
    };
  }

  // 3. 완료 상태로 업데이트
  const { error: updateError } = await supabase
    .from('user_challenges')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      reward_claimed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userChallengeId);

  if (updateError) {
    challengeLogger.error(' Complete challenge error:', updateError);
    return {
      success: false,
      xpAwarded: 0,
    };
  }

  // 4. XP 보상 지급
  const rewardXp = userChallenge.challenge?.rewardXp || 0;
  if (rewardXp > 0) {
    await addXp(supabase, clerkUserId, rewardXp);
  }

  // 5. 배지 보상 지급 (있는 경우)
  let badgeAwarded: CompleteChallengeResult['badgeAwarded'];
  const rewardBadgeId = userChallenge.challenge?.rewardBadgeId;
  if (rewardBadgeId) {
    const userBadge = await awardBadgeById(supabase, clerkUserId, rewardBadgeId);
    // awardBadgeById returns UserBadge | null (null if already owned or error)
    if (userBadge?.badge) {
      badgeAwarded = {
        id: userBadge.badge.id,
        name: userBadge.badge.name,
        icon: userBadge.badge.icon,
      };
    }
  }

  return {
    success: true,
    xpAwarded: rewardXp,
    badgeAwarded,
  };
}

// ============================================================
// 챌린지 포기
// ============================================================

/**
 * 챌린지 포기
 */
export async function abandonChallenge(
  supabase: SupabaseClient,
  userChallengeId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_challenges')
    .update({
      status: 'abandoned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userChallengeId);

  if (error) {
    challengeLogger.error(' Abandon challenge error:', error);
    return false;
  }

  return true;
}

// ============================================================
// 챌린지 실패 처리
// ============================================================

/**
 * 챌린지 실패 처리 (만료된 챌린지)
 */
export async function failChallenge(
  supabase: SupabaseClient,
  userChallengeId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_challenges')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userChallengeId);

  if (error) {
    challengeLogger.error(' Fail challenge error:', error);
    return false;
  }

  return true;
}

// ============================================================
// 만료된 챌린지 일괄 처리 (Cron Job용)
// ============================================================

/**
 * 만료된 진행 중 챌린지를 실패 처리
 */
export async function processExpiredChallenges(supabase: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_challenges')
    .update({
      status: 'failed',
      updated_at: now,
    })
    .eq('status', 'in_progress')
    .lt('target_end_at', now)
    .select('id');

  if (error) {
    challengeLogger.error(' Process expired challenges error:', error);
    return 0;
  }

  return data?.length || 0;
}
