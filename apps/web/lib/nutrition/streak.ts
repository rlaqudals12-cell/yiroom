/**
 * N-1 Streak 계산 유틸리티 함수
 * Task 3.5: 식단 Streak 로직
 *
 * - 연속 기록일 계산
 * - 마일스톤 및 배지 관리
 * - 메시지 생성
 */

// =====================================================
// 타입 정의
// =====================================================

/**
 * 영양 Streak 데이터 타입
 * (DB 스키마: nutrition_streaks)
 */
export interface NutritionStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastRecordDate?: string;
  badgesEarned: string[];
  premiumRewardsClaimed: {
    type: string;
    claimedAt: string;
  }[];
  updatedAt: string;
}

// =====================================================
// 상수 정의
// =====================================================

/**
 * Streak 마일스톤 정의
 */
export const NUTRITION_STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

/**
 * 마일스톤별 배지 정의
 */
export const NUTRITION_STREAK_BADGES: Record<number, { id: string; name: string; emoji: string }> = {
  3: { id: '3day', name: '3일 연속', emoji: '🌱' },
  7: { id: '7day', name: '7일 연속', emoji: '🔥' },
  14: { id: '14day', name: '2주 연속', emoji: '💪' },
  30: { id: '30day', name: '30일 연속', emoji: '🏆' },
  60: { id: '60day', name: '60일 연속', emoji: '⭐' },
  100: { id: '100day', name: '100일 연속', emoji: '👑' },
};

/**
 * 마일스톤별 보상 정의
 */
export const NUTRITION_STREAK_REWARDS: Record<number, { type: string; description: string }> = {
  3: { type: 'message', description: '응원 메시지' },
  7: { type: 'insight', description: '프리미엄 인사이트 리포트' },
  14: { type: 'analysis', description: '상세 영양 분석 리포트' },
  30: { type: 'premium_week', description: '특별 배지 + 프리미엄 1주일' },
  60: { type: 'premium_2week', description: '프리미엄 2주' },
  100: { type: 'lifetime_badge', description: '영구 배지 + 프리미엄 1개월' },
};

// =====================================================
// Streak 계산 함수
// =====================================================

/**
 * 두 날짜 사이의 일수 차이 계산
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((d2.getTime() - d1.getTime()) / oneDay);
}

/**
 * Streak이 끊겼는지 확인
 * - 마지막 기록일로부터 2일 이상 지나면 끊김
 */
export function isStreakBroken(lastRecordDate: string | null | undefined): boolean {
  if (!lastRecordDate) return true;

  const today = new Date();
  const lastDate = new Date(lastRecordDate);
  const daysDiff = getDaysDifference(lastDate, today);

  // 1일까지는 연속으로 인정 (오늘 또는 어제 기록)
  return daysDiff > 1;
}

/**
 * 연속 기록 일수 계산
 * - 마지막 기록일 기준으로 현재 streak 계산
 */
export function calculateCurrentStreak(
  lastRecordDate: string | null | undefined,
  currentStreak: number
): number {
  if (!lastRecordDate) return 0;

  if (isStreakBroken(lastRecordDate)) {
    return 0;
  }

  return currentStreak;
}

/**
 * 다음 마일스톤 조회
 */
export function getNextMilestone(currentStreak: number): number | null {
  for (const milestone of NUTRITION_STREAK_MILESTONES) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * 다음 마일스톤까지 남은 일수
 */
export function getDaysToNextMilestone(currentStreak: number): number | null {
  const nextMilestone = getNextMilestone(currentStreak);
  if (nextMilestone === null) return null;
  return nextMilestone - currentStreak;
}

/**
 * 달성한 마일스톤 목록 조회
 */
export function getAchievedMilestones(currentStreak: number): number[] {
  return NUTRITION_STREAK_MILESTONES.filter(m => currentStreak >= m);
}

/**
 * 새로 달성한 마일스톤 확인
 */
export function getNewlyAchievedMilestones(
  previousStreak: number,
  currentStreak: number
): number[] {
  const previousMilestones = getAchievedMilestones(previousStreak);
  const currentMilestones = getAchievedMilestones(currentStreak);

  return currentMilestones.filter(m => !previousMilestones.includes(m));
}

// =====================================================
// 배지 관리 함수
// =====================================================

/**
 * 마일스톤에 해당하는 배지 ID 목록 생성
 */
export function getBadgesForMilestones(milestones: number[]): string[] {
  return milestones
    .filter(m => NUTRITION_STREAK_BADGES[m])
    .map(m => NUTRITION_STREAK_BADGES[m].id);
}

/**
 * 새로 획득해야 할 배지 확인
 */
export function getNewBadges(
  currentStreak: number,
  existingBadges: string[]
): string[] {
  const achievedMilestones = getAchievedMilestones(currentStreak);
  const allBadges = getBadgesForMilestones(achievedMilestones);

  return allBadges.filter(badge => !existingBadges.includes(badge));
}

// =====================================================
// 메시지 생성 함수
// =====================================================

/**
 * Streak 상태에 따른 메시지 생성
 */
export function getStreakMessage(streak: NutritionStreak | null): string {
  if (!streak || streak.currentStreak === 0) {
    return '오늘 식단 기록을 시작해보세요!';
  }

  const { currentStreak } = streak;
  const nextMilestone = getNextMilestone(currentStreak);
  const daysToNext = getDaysToNextMilestone(currentStreak);

  // 마일스톤 달성 직전
  if (daysToNext === 1 && nextMilestone) {
    const reward = NUTRITION_STREAK_REWARDS[nextMilestone];
    const rewardText = reward ? ` ${reward.description} 획득!` : '';
    return `내일이면 ${nextMilestone}일 연속!${rewardText} ${NUTRITION_STREAK_BADGES[nextMilestone]?.emoji || '🎉'}`;
  }

  // 마일스톤 달성
  if (NUTRITION_STREAK_MILESTONES.includes(currentStreak as typeof NUTRITION_STREAK_MILESTONES[number])) {
    const badge = NUTRITION_STREAK_BADGES[currentStreak];
    return `${badge?.emoji || '🎉'} ${currentStreak}일 연속 달성! 대단해요!`;
  }

  // 일반 연속
  if (currentStreak >= 7) {
    return `🔥 ${currentStreak}일 연속 기록 중! 멋져요!`;
  }

  if (currentStreak >= 3) {
    return `💪 ${currentStreak}일 연속! 좋은 습관이 만들어지고 있어요!`;
  }

  return `${currentStreak}일 연속 식단 기록 중!`;
}

/**
 * Streak 끊김 위험 메시지
 */
export function getStreakWarningMessage(streak: NutritionStreak | null): string | null {
  if (!streak || streak.currentStreak === 0) return null;

  const lastDate = streak.lastRecordDate;
  if (!lastDate) return null;

  const today = new Date();
  const lastRecord = new Date(lastDate);
  const daysDiff = getDaysDifference(lastRecord, today);

  // 오늘 기록했으면 경고 없음
  if (daysDiff === 0) return null;

  // 어제 기록했으면 오늘 해야 연속 유지
  if (daysDiff === 1) {
    const nextMilestone = getNextMilestone(streak.currentStreak);
    if (nextMilestone && streak.currentStreak >= nextMilestone - 3) {
      return `오늘 기록하면 ${nextMilestone}일 연속까지 ${nextMilestone - streak.currentStreak}일!`;
    }
    return `오늘 기록해야 ${streak.currentStreak + 1}일 연속 달성!`;
  }

  return null;
}

/**
 * 재참여 유도 메시지 (Streak 끊긴 경우)
 */
export function getReEngagementMessage(streak: NutritionStreak | null): string {
  if (!streak) {
    return '첫 식단 기록을 시작해보세요! 🍽️';
  }

  if (streak.longestStreak >= 7) {
    return `이전에 ${streak.longestStreak}일 연속 기록이 있어요! 다시 도전해볼까요?`;
  }

  if (streak.longestStreak >= 3) {
    return '식단 기록이 그리워요! 오늘 한 끼만 기록해볼까요?';
  }

  return '새로운 연속 기록을 시작해보세요!';
}

/**
 * 마일스톤 달성 축하 메시지
 */
export function getMilestoneAchievementMessage(milestone: number): string {
  const badge = NUTRITION_STREAK_BADGES[milestone];
  const reward = NUTRITION_STREAK_REWARDS[milestone];

  if (!badge) return `${milestone}일 연속 달성!`;

  let message = `${badge.emoji} ${badge.name} 달성!`;

  if (reward) {
    message += ` ${reward.description}을 획득했어요!`;
  }

  return message;
}

// =====================================================
// Streak 상태 요약
// =====================================================

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  nextMilestone: number | null;
  daysToNextMilestone: number | null;
  achievedMilestones: number[];
  badges: string[];
  message: string;
  warningMessage: string | null;
}

/**
 * Streak 상태 요약 생성
 */
export function getStreakSummary(streak: NutritionStreak | null): StreakSummary {
  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActive: false,
      nextMilestone: 3,
      daysToNextMilestone: 3,
      achievedMilestones: [],
      badges: [],
      message: '오늘 식단 기록을 시작해보세요!',
      warningMessage: null,
    };
  }

  const isActive = !isStreakBroken(streak.lastRecordDate);
  const currentStreak = isActive ? streak.currentStreak : 0;

  return {
    currentStreak,
    longestStreak: streak.longestStreak,
    isActive,
    nextMilestone: getNextMilestone(currentStreak),
    daysToNextMilestone: getDaysToNextMilestone(currentStreak),
    achievedMilestones: getAchievedMilestones(currentStreak),
    badges: streak.badgesEarned || [],
    message: isActive ? getStreakMessage(streak) : getReEngagementMessage(streak),
    warningMessage: isActive ? getStreakWarningMessage(streak) : null,
  };
}
