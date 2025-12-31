/**
 * 스트릭 시스템과 배지 통합
 * - 스트릭 마일스톤 달성 시 배지 부여
 * - 기존 workout_streaks, nutrition_streaks 테이블과 연동
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { gamificationLogger } from '@/lib/utils/logger';
import type { BadgeAwardResult, LevelUpResult } from '@/types/gamification';
import { STREAK_MILESTONES, getNewMilestones, type StreakMilestone } from './constants';
import { awardBadge, getBadgeByCode } from './badges';
import { addXp } from './levels';

// ============================================================
// 스트릭 배지 코드 생성
// ============================================================

/**
 * 스트릭 배지 코드 생성
 * @example getStreakBadgeCode('workout', 7) → 'workout_streak_7day'
 */
export function getStreakBadgeCode(domain: 'workout' | 'nutrition', days: StreakMilestone): string {
  return `${domain}_streak_${days}day`;
}

// ============================================================
// 스트릭 배지 부여
// ============================================================

/**
 * 스트릭 마일스톤 달성 시 배지 부여
 * @param domain 도메인 (workout | nutrition)
 * @param currentStreak 현재 스트릭 일수
 * @param previousStreak 이전 스트릭 일수 (스트릭 증가 시)
 */
export async function checkAndAwardStreakBadges(
  supabase: SupabaseClient,
  clerkUserId: string,
  domain: 'workout' | 'nutrition',
  currentStreak: number,
  previousStreak: number = 0
): Promise<BadgeAwardResult[]> {
  const results: BadgeAwardResult[] = [];

  // 새로 달성한 마일스톤 확인
  const newMilestones = getNewMilestones(previousStreak, currentStreak);

  for (const milestone of newMilestones) {
    const badgeCode = getStreakBadgeCode(domain, milestone);
    const result = await awardStreakBadge(supabase, clerkUserId, badgeCode);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * 특정 스트릭 배지 부여
 */
export async function awardStreakBadge(
  supabase: SupabaseClient,
  clerkUserId: string,
  badgeCode: string
): Promise<BadgeAwardResult | null> {
  // 배지 정보 조회
  const badge = await getBadgeByCode(supabase, badgeCode);
  if (!badge) {
    gamificationLogger.warn('Streak badge not found:', badgeCode);
    return null;
  }

  // 배지 부여
  const { userBadge, alreadyOwned, xpReward } = await awardBadge(supabase, clerkUserId, badgeCode);

  if (alreadyOwned) {
    return {
      success: false,
      badge,
      alreadyOwned: true,
      xpAwarded: 0,
    };
  }

  if (!userBadge) {
    return null;
  }

  // XP 추가
  let levelUpResult: LevelUpResult | undefined;
  if (xpReward > 0) {
    const xpResult = await addXp(supabase, clerkUserId, xpReward);
    if (xpResult) {
      levelUpResult = xpResult;
    }
  }

  return {
    success: true,
    badge,
    alreadyOwned: false,
    xpAwarded: xpReward,
    levelUpResult,
  };
}

// ============================================================
// 스트릭 배지 진행 상황
// ============================================================

/**
 * 다음 마일스톤까지 남은 일수
 */
export function getDaysToNextMilestone(currentStreak: number): number | null {
  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak);
  if (!nextMilestone) return null;
  return nextMilestone - currentStreak;
}

/**
 * 다음 마일스톤 정보
 */
export function getNextMilestoneInfo(
  domain: 'workout' | 'nutrition',
  currentStreak: number
): { milestone: StreakMilestone; daysLeft: number; badgeCode: string } | null {
  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak);
  if (!nextMilestone) return null;

  return {
    milestone: nextMilestone,
    daysLeft: nextMilestone - currentStreak,
    badgeCode: getStreakBadgeCode(domain, nextMilestone),
  };
}

// ============================================================
// 분석 완료 배지
// ============================================================

/**
 * 분석 완료 배지 코드
 */
const ANALYSIS_BADGE_CODES = {
  'personal-color': 'analysis_pc_complete',
  skin: 'analysis_skin_complete',
  body: 'analysis_body_complete',
} as const;

/**
 * 분석 완료 시 배지 부여
 */
export async function awardAnalysisBadge(
  supabase: SupabaseClient,
  clerkUserId: string,
  analysisType: 'personal-color' | 'skin' | 'body'
): Promise<BadgeAwardResult | null> {
  const badgeCode = ANALYSIS_BADGE_CODES[analysisType];
  return awardStreakBadge(supabase, clerkUserId, badgeCode);
}

// ============================================================
// 활동 배지 (첫 운동, 첫 기록 등)
// ============================================================

/**
 * 첫 운동 배지 부여
 */
export async function checkFirstWorkoutBadge(
  supabase: SupabaseClient,
  clerkUserId: string,
  workoutCount: number
): Promise<BadgeAwardResult | null> {
  if (workoutCount !== 1) return null;
  return awardStreakBadge(supabase, clerkUserId, 'workout_first');
}

/**
 * 운동 횟수 배지 확인 및 부여
 */
export async function checkWorkoutCountBadges(
  supabase: SupabaseClient,
  clerkUserId: string,
  workoutCount: number
): Promise<BadgeAwardResult[]> {
  const results: BadgeAwardResult[] = [];
  const milestones = [1, 10, 50, 100];
  const badgeCodes: Record<number, string> = {
    1: 'workout_first',
    10: 'workout_10_sessions',
    50: 'workout_50_sessions',
    100: 'workout_100_sessions',
  };

  for (const milestone of milestones) {
    if (workoutCount === milestone) {
      const result = await awardStreakBadge(supabase, clerkUserId, badgeCodes[milestone]);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * 첫 영양 기록 배지 부여
 */
export async function checkFirstNutritionBadge(
  supabase: SupabaseClient,
  clerkUserId: string,
  recordCount: number
): Promise<BadgeAwardResult | null> {
  if (recordCount !== 1) return null;
  return awardStreakBadge(supabase, clerkUserId, 'nutrition_first');
}

// ============================================================
// 전체 분석 완료 배지
// ============================================================

/**
 * 모든 분석(PC, Skin, Body) 완료 시 통합 배지 부여
 */
export async function checkAndAwardAllAnalysisBadge(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<BadgeAwardResult | null> {
  try {
    // 각 분석 완료 여부 확인
    const [pcResult, skinResult, bodyResult] = await Promise.all([
      supabase
        .from('personal_color_assessments')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .limit(1),
      supabase.from('skin_analyses').select('id').eq('clerk_user_id', clerkUserId).limit(1),
      supabase.from('body_analyses').select('id').eq('clerk_user_id', clerkUserId).limit(1),
    ]);

    const hasPC = pcResult.data && pcResult.data.length > 0;
    const hasSkin = skinResult.data && skinResult.data.length > 0;
    const hasBody = bodyResult.data && bodyResult.data.length > 0;

    // 모든 분석 완료 시 통합 배지 부여
    if (hasPC && hasSkin && hasBody) {
      return awardStreakBadge(supabase, clerkUserId, 'analysis_all_complete');
    }

    return null;
  } catch (err) {
    gamificationLogger.error('All analysis badge check error:', err);
    return null;
  }
}
