/**
 * 게이미피케이션 상수 및 계산 함수
 * - 레벨 XP 계산
 * - 티어 결정
 * - 색상/표시 상수
 */

import type { LevelTier, BadgeCategory, BadgeRarity, LevelInfo } from '@/types/gamification';

// ============================================================
// 레벨 XP 계산
// ============================================================

/**
 * 레벨별 필요 XP 계산
 * - 레벨 1→2: 100 XP
 * - 레벨 N→N+1: 100 * N XP (점점 증가)
 */
export function getXpForLevel(level: number): number {
  if (level < 1) return 0;
  return 100 * level;
}

/**
 * 특정 레벨까지 필요한 총 누적 XP
 */
export function getTotalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // 1 + 2 + ... + (level-1) = (level-1) * level / 2
  // 100 * sum = 100 * (level-1) * level / 2 = 50 * level * (level-1)
  return 50 * level * (level - 1);
}

/**
 * 총 XP로 레벨 계산
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  // 50 * L * (L-1) <= totalXp
  // L^2 - L <= totalXp / 50
  // L = (1 + sqrt(1 + 4 * totalXp / 50)) / 2
  const discriminant = 1 + (4 * totalXp) / 50;
  const level = Math.floor((1 + Math.sqrt(discriminant)) / 2);
  return Math.max(1, level);
}

/**
 * 현재 레벨에서의 진행률 계산 (0-100)
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = getLevelFromTotalXp(totalXp);
  const xpAtCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpForNextLevel = getXpForLevel(currentLevel);
  const xpInCurrentLevel = totalXp - xpAtCurrentLevel;

  if (xpForNextLevel <= 0) return 100;
  return Math.min(100, Math.floor((xpInCurrentLevel / xpForNextLevel) * 100));
}

/**
 * 레벨 정보 전체 계산
 */
export function calculateLevelInfo(totalXp: number): LevelInfo {
  const level = getLevelFromTotalXp(totalXp);
  const tier = getTierForLevel(level);
  const xpAtCurrentLevel = getTotalXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level);
  const currentXp = totalXp - xpAtCurrentLevel;
  const xpProgress = getLevelProgress(totalXp);

  return {
    level,
    tier,
    tierName: TIER_NAMES[tier],
    currentXp,
    xpForNextLevel,
    xpProgress,
    totalXp,
  };
}

// ============================================================
// 티어 결정
// ============================================================

/**
 * 레벨에 따른 티어 결정
 * - 1-10: 비기너 (Beginner)
 * - 11-30: 프랙티셔너 (Practitioner)
 * - 31-50: 엑스퍼트 (Expert)
 * - 51+: 마스터 (Master)
 */
export function getTierForLevel(level: number): LevelTier {
  if (level <= 10) return 'beginner';
  if (level <= 30) return 'practitioner';
  if (level <= 50) return 'expert';
  return 'master';
}

// ============================================================
// 표시 상수
// ============================================================

export const TIER_NAMES: Record<LevelTier, string> = {
  beginner: '비기너',
  practitioner: '프랙티셔너',
  expert: '엑스퍼트',
  master: '마스터',
};

export const TIER_COLORS: Record<LevelTier, { bg: string; text: string; border: string }> = {
  beginner: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  practitioner: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  expert: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },
  master: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
};

export const TIER_GRADIENT: Record<LevelTier, string> = {
  beginner: 'from-slate-400 to-slate-600',
  practitioner: 'from-blue-400 to-blue-600',
  expert: 'from-purple-400 to-purple-600',
  master: 'from-amber-400 to-amber-600',
};

export const CATEGORY_NAMES: Record<BadgeCategory, string> = {
  streak: '연속 달성',
  workout: '운동',
  nutrition: '영양',
  analysis: '분석',
  special: '특별',
};

export const CATEGORY_ICONS: Record<BadgeCategory, string> = {
  streak: '',
  workout: '',
  nutrition: '',
  analysis: '',
  special: '',
};

export const RARITY_NAMES: Record<BadgeRarity, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
};

export const RARITY_COLORS: Record<
  BadgeRarity,
  { bg: string; text: string; border: string; glow: string }
> = {
  common: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    glow: '',
  },
  rare: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-400',
    glow: 'shadow-blue-200',
  },
  epic: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-400',
    glow: 'shadow-purple-200 shadow-md',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-100 to-orange-100',
    text: 'text-amber-700',
    border: 'border-amber-400',
    glow: 'shadow-amber-300 shadow-lg',
  },
};

// ============================================================
// XP 보상 기본값
// ============================================================

export const DEFAULT_XP_REWARDS = {
  // 스트릭 달성
  streak3: 10,
  streak7: 25,
  streak14: 50,
  streak30: 100,
  streak60: 200,
  streak100: 500,

  // 일반 활동
  workout: 5, // 운동 1회
  mealRecord: 2, // 식단 기록 1회
  waterGoal: 3, // 수분 목표 달성

  // 분석 완료
  analysis: 20, // 분석 1회 완료
} as const;

// ============================================================
// 스트릭 마일스톤
// ============================================================

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

/**
 * 새로 달성한 마일스톤 확인
 */
export function getNewMilestones(previousDays: number, currentDays: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter(
    (milestone) => previousDays < milestone && currentDays >= milestone
  );
}
