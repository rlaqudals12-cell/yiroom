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
export const NUTRITION_STREAK_BADGES: Record<number, { id: string; name: string; emoji: string }> =
  {
    3: { id: '3day', name: '3일 기록', emoji: '🌱' },
    7: { id: '7day', name: '7일 기록', emoji: '🌿' },
    14: { id: '14day', name: '14일 기록', emoji: '🌳' },
    30: { id: '30day', name: '30일 기록', emoji: '🏆' },
    60: { id: '60day', name: '60일 기록', emoji: '⭐' },
    100: { id: '100day', name: '100일 기록', emoji: '👑' },
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
 * 최근 기록 여부 확인
 * - 마지막 기록일로부터 2일 이상 지나면 비활성
 * - 연속 끊김이 아닌, 활성 상태 판단용
 */
export function isStreakBroken(lastRecordDate: string | null | undefined): boolean {
  if (!lastRecordDate) return true;

  const today = new Date();
  const lastDate = new Date(lastRecordDate);
  const daysDiff = getDaysDifference(lastDate, today);

  // 1일까지는 활성 상태 (오늘 또는 어제 기록)
  return daysDiff > 1;
}

/**
 * 누적 기록 일수 반환
 * - 연속 여부와 무관하게 현재 기록 횟수 유지
 * - 끊김으로 리셋하지 않음 (자율성 존중)
 */
export function calculateCurrentStreak(
  lastRecordDate: string | null | undefined,
  currentStreak: number
): number {
  // 누적 방식: 기록 횟수를 그대로 반환 (리셋 없음)
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
  return NUTRITION_STREAK_MILESTONES.filter((m) => currentStreak >= m);
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

  return currentMilestones.filter((m) => !previousMilestones.includes(m));
}

// =====================================================
// 배지 관리 함수
// =====================================================

/**
 * 마일스톤에 해당하는 배지 ID 목록 생성
 */
export function getBadgesForMilestones(milestones: number[]): string[] {
  return milestones
    .filter((m) => NUTRITION_STREAK_BADGES[m])
    .map((m) => NUTRITION_STREAK_BADGES[m].id);
}

/**
 * 새로 획득해야 할 배지 확인
 */
export function getNewBadges(currentStreak: number, existingBadges: string[]): string[] {
  const achievedMilestones = getAchievedMilestones(currentStreak);
  const allBadges = getBadgesForMilestones(achievedMilestones);

  return allBadges.filter((badge) => !existingBadges.includes(badge));
}

// =====================================================
// 메시지 생성 함수
// =====================================================

/**
 * 기록 상태에 따른 메시지 생성
 * - 연속/압박 표현 대신 누적 기록 축하
 */
export function getStreakMessage(streak: NutritionStreak | null): string {
  if (!streak || streak.currentStreak === 0) {
    return '오늘 식단 기록을 시작해보세요!';
  }

  const { currentStreak } = streak;

  // 마일스톤 달성
  if (
    NUTRITION_STREAK_MILESTONES.includes(
      currentStreak as (typeof NUTRITION_STREAK_MILESTONES)[number]
    )
  ) {
    const badge = NUTRITION_STREAK_BADGES[currentStreak];
    return `${badge?.emoji || '🎉'} ${currentStreak}일 기록 달성!`;
  }

  // 누적 기록 메시지 (연속 압박 없이)
  if (currentStreak >= 30) {
    return `🌳 지금까지 ${currentStreak}일 기록했어요`;
  }

  if (currentStreak >= 7) {
    return `🌿 ${currentStreak}일째 기록 중이에요`;
  }

  if (currentStreak >= 3) {
    return `🌱 ${currentStreak}일 기록했어요`;
  }

  return `${currentStreak}일째 식단을 기록하고 있어요`;
}

/**
 * 기록 안내 메시지
 * - 압박/시간제한 없이 부드러운 안내
 */
export function getStreakWarningMessage(streak: NutritionStreak | null): string | null {
  if (!streak || streak.currentStreak === 0) return null;

  const lastDate = streak.lastRecordDate;
  if (!lastDate) return null;

  const today = new Date();
  const lastRecord = new Date(lastDate);
  const daysDiff = getDaysDifference(lastRecord, today);

  // 오늘 기록했으면 안내 없음
  if (daysDiff === 0) return null;

  // 어제 기록한 경우 — 부드러운 안내 (압박 없이)
  if (daysDiff === 1) {
    return '오늘도 기록하면 흐름이 이어져요';
  }

  return null;
}

/**
 * 복귀 안내 메시지
 * - 손실 회피/도전 프레이밍 대신 자연스러운 안내
 */
export function getReEngagementMessage(streak: NutritionStreak | null): string {
  if (!streak) {
    return '첫 식단 기록을 시작해보세요 🍽️';
  }

  if (streak.currentStreak >= 7) {
    return `지금까지 ${streak.currentStreak}일 기록했어요. 편할 때 이어가보세요`;
  }

  if (streak.currentStreak >= 3) {
    return '기록이 쌓이고 있어요. 편할 때 다시 시작해보세요';
  }

  return '식단 기록은 언제든 시작할 수 있어요';
}

/**
 * 마일스톤 달성 축하 메시지
 */
export function getMilestoneAchievementMessage(milestone: number): string {
  const badge = NUTRITION_STREAK_BADGES[milestone];
  const reward = NUTRITION_STREAK_REWARDS[milestone];

  if (!badge) return `${milestone}일 기록 달성!`;

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
  // 누적 방식: 비활성이어도 기록 횟수 유지 (리셋 없음)
  const currentStreak = streak.currentStreak;

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
