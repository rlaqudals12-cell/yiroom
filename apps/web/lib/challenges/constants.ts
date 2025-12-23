/**
 * 챌린지 시스템 상수
 */

import type {
  Challenge,
  UserChallenge,
  ChallengeRow,
  UserChallengeRow,
  ChallengeTarget,
  ChallengeProgress,
  ChallengeDomain,
  ChallengeDifficulty,
  ChallengeStatus,
} from '@/types/challenges';

// ============================================================
// Row → Entity 변환 함수
// ============================================================

/**
 * ChallengeRow → Challenge 변환
 */
export function challengeRowToChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon,
    domain: row.domain as ChallengeDomain,
    durationDays: row.duration_days,
    target: row.target as unknown as ChallengeTarget,
    rewardXp: row.reward_xp,
    rewardBadgeId: row.reward_badge_id,
    difficulty: row.difficulty as ChallengeDifficulty,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
  };
}

/**
 * UserChallengeRow → UserChallenge 변환
 */
export function userChallengeRowToUserChallenge(row: UserChallengeRow): UserChallenge {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    challengeId: row.challenge_id,
    status: row.status as ChallengeStatus,
    startedAt: new Date(row.started_at),
    targetEndAt: new Date(row.target_end_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    progress: row.progress as ChallengeProgress,
    rewardClaimed: row.reward_claimed,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    challenge: row.challenges ? challengeRowToChallenge(row.challenges) : undefined,
  };
}

// ============================================================
// 진행 상황 계산
// ============================================================

/**
 * 챌린지 시작 이후 경과 일수 계산
 * @param startedAt 챌린지 시작일
 * @param targetDate 비교 대상 날짜 (기본: 현재)
 * @returns 경과 일수 (0-based, 시작일이 0)
 */
export function getDaysSinceStart(startedAt: Date, targetDate?: Date): number {
  const now = targetDate || new Date();
  const diffMs = now.getTime() - startedAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 진행률 계산 (0-100)
 */
export function calculateProgressPercentage(
  progress: ChallengeProgress,
  target: ChallengeTarget
): number {
  switch (target.type) {
    case 'streak':
      const currentDays = progress.currentDays || 0;
      return Math.min(100, Math.round((currentDays / target.days) * 100));

    case 'count':
      const completedCount = progress.completedCount || 0;
      const targetCount = target.workouts || target.meals || target.waterCups || 1;
      return Math.min(100, Math.round((completedCount / targetCount) * 100));

    case 'daily':
      const dailyCompletedDays = progress.completedDays?.length || 0;
      const dailyTotalDays = progress.totalDays || 7;
      return Math.min(100, Math.round((dailyCompletedDays / dailyTotalDays) * 100));

    case 'combined':
      const combinedCompletedDays = progress.completedDays?.length || 0;
      const combinedTotalDays = progress.totalDays || 7;
      return Math.min(100, Math.round((combinedCompletedDays / combinedTotalDays) * 100));

    default:
      return 0;
  }
}

/**
 * 챌린지 완료 여부 확인
 */
export function isChallengeCompleted(
  progress: ChallengeProgress,
  target: ChallengeTarget
): boolean {
  return calculateProgressPercentage(progress, target) >= 100;
}

/**
 * 남은 일수 계산
 */
export function getDaysRemaining(targetEndAt: Date): number {
  const now = new Date();
  const diffMs = targetEndAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 챌린지 만료 여부 확인
 */
export function isChallengeExpired(targetEndAt: Date): boolean {
  return getDaysRemaining(targetEndAt) <= 0;
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * 오늘 날짜 문자열 (YYYY-MM-DD)
 */
export function getTodayString(): string {
  const now = new Date();
  const koreaOffset = 9 * 60; // UTC+9
  const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
  return koreaTime.toISOString().split('T')[0];
}

/**
 * 챌린지 종료일 계산
 */
export function calculateTargetEndAt(startDate: Date, durationDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}
