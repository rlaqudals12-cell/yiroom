/**
 * 게이미피케이션 모듈
 *
 * XP 계산, 뱃지 해금, 레벨 시스템, 티어
 *
 * @module lib/gamification
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement: string;
  xpReward: number;
}

export interface UserBadge {
  badgeId: string;
  badge: Badge;
  unlockedAt: string;
}

export type BadgeCategory =
  | 'analysis'
  | 'workout'
  | 'nutrition'
  | 'social'
  | 'streak'
  | 'milestone'
  | 'special';

export interface LevelInfo {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progress: number;
  tier: Tier;
  tierLabel: string;
}

export type Tier =
  | 'beginner'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master';

export interface XpEvent {
  action: XpAction;
  xp: number;
  description: string;
}

export type XpAction =
  | 'analysis_complete'
  | 'workout_complete'
  | 'meal_logged'
  | 'streak_bonus'
  | 'badge_earned'
  | 'friend_added'
  | 'daily_login'
  | 'challenge_complete';

// ─── XP 상수 ──────────────────────────────────────────

// 레벨당 필요 XP = 100 × level
export const XP_PER_LEVEL_MULTIPLIER = 100;

// 액션별 XP 보상
export const XP_REWARDS: Record<XpAction, number> = {
  analysis_complete: 50,
  workout_complete: 30,
  meal_logged: 10,
  streak_bonus: 20,
  badge_earned: 100,
  friend_added: 15,
  daily_login: 5,
  challenge_complete: 75,
};

// ─── XP / 레벨 계산 ──────────────────────────────────

/**
 * 특정 레벨 달성에 필요한 XP
 *
 * XP(N) = 100 × N
 */
export function getXpForLevel(level: number): number {
  return XP_PER_LEVEL_MULTIPLIER * level;
}

/**
 * 특정 레벨까지의 누적 XP
 *
 * Total(L) = 50 × L × (L - 1)
 */
export function getTotalXpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

/**
 * 누적 XP로 현재 레벨 계산
 *
 * L = floor((1 + sqrt(1 + totalXp/25)) / 2)
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return Math.floor((1 + Math.sqrt(1 + totalXp / 25)) / 2);
}

/**
 * 현재 레벨 내 진행률 (0-1)
 */
export function getLevelProgress(totalXp: number): number {
  const level = getLevelFromTotalXp(totalXp);
  const currentLevelStart = getTotalXpForLevel(level);
  const nextLevelStart = getTotalXpForLevel(level + 1);
  const range = nextLevelStart - currentLevelStart;
  if (range <= 0) return 1;
  return Math.min(1, (totalXp - currentLevelStart) / range);
}

/**
 * 종합 레벨 정보 계산
 */
export function calculateLevelInfo(totalXp: number): LevelInfo {
  const level = getLevelFromTotalXp(totalXp);
  const currentLevelStart = getTotalXpForLevel(level);
  const nextLevelStart = getTotalXpForLevel(level + 1);
  const tier = getTierForLevel(level);

  return {
    level,
    totalXp,
    currentLevelXp: totalXp - currentLevelStart,
    xpToNextLevel: nextLevelStart - totalXp,
    progress: getLevelProgress(totalXp),
    tier,
    tierLabel: TIER_LABELS[tier],
  };
}

// ─── 티어 시스템 ──────────────────────────────────────

export const TIER_THRESHOLDS: { tier: Tier; minLevel: number }[] = [
  { tier: 'master', minLevel: 50 },
  { tier: 'diamond', minLevel: 40 },
  { tier: 'platinum', minLevel: 30 },
  { tier: 'gold', minLevel: 20 },
  { tier: 'silver', minLevel: 10 },
  { tier: 'bronze', minLevel: 5 },
  { tier: 'beginner', minLevel: 1 },
];

export const TIER_LABELS: Record<Tier, string> = {
  beginner: '초보자',
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
  diamond: '다이아몬드',
  master: '마스터',
};

export const TIER_COLORS: Record<Tier, string> = {
  beginner: '#9ca3af',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00d4ff',
  diamond: '#b9f2ff',
  master: '#ff6b6b',
};

/**
 * 레벨에 해당하는 티어
 */
export function getTierForLevel(level: number): Tier {
  for (const { tier, minLevel } of TIER_THRESHOLDS) {
    if (level >= minLevel) return tier;
  }
  return 'beginner';
}

// ─── 뱃지 ─────────────────────────────────────────────

/**
 * 기본 뱃지 정의
 */
export const DEFAULT_BADGES: Badge[] = [
  // 분석 뱃지
  { id: 'b-first-analysis', key: 'first_analysis', name: '첫 분석', description: '첫 AI 분석을 완료했어요', icon: '🔬', category: 'analysis', requirement: '분석 1회 완료', xpReward: 50 },
  { id: 'b-analysis-5', key: 'analysis_5', name: '분석 매니아', description: '5번의 분석을 완료했어요', icon: '🧪', category: 'analysis', requirement: '분석 5회 완료', xpReward: 100 },
  { id: 'b-all-types', key: 'all_analysis_types', name: '올라운더', description: '모든 분석 유형을 경험했어요', icon: '🎯', category: 'analysis', requirement: '퍼스널컬러+피부+체형 분석', xpReward: 200 },

  // 운동 뱃지
  { id: 'b-first-workout', key: 'first_workout', name: '첫 운동', description: '첫 운동을 기록했어요', icon: '💪', category: 'workout', requirement: '운동 1회 기록', xpReward: 30 },
  { id: 'b-workout-7', key: 'workout_7days', name: '일주일 전사', description: '7일 연속 운동했어요', icon: '🔥', category: 'workout', requirement: '7일 연속 운동', xpReward: 150 },

  // 영양 뱃지
  { id: 'b-first-meal', key: 'first_meal', name: '첫 식단', description: '첫 식단을 기록했어요', icon: '🍎', category: 'nutrition', requirement: '식단 1회 기록', xpReward: 30 },
  { id: 'b-balanced-meal', key: 'balanced_meal', name: '균형 잡힌 식단', description: '영양 균형 달성!', icon: '🥗', category: 'nutrition', requirement: '매크로 균형 달성', xpReward: 100 },

  // 소셜 뱃지
  { id: 'b-first-friend', key: 'first_friend', name: '첫 친구', description: '첫 친구를 만들었어요', icon: '🤝', category: 'social', requirement: '친구 1명 추가', xpReward: 30 },
  { id: 'b-popular', key: 'popular', name: '인기인', description: '10명의 친구와 함께해요', icon: '🌟', category: 'social', requirement: '친구 10명', xpReward: 150 },

  // 스트릭 뱃지
  { id: 'b-streak-3', key: 'streak_3', name: '3일 연속', description: '3일 연속 앱을 사용했어요', icon: '✨', category: 'streak', requirement: '3일 연속 접속', xpReward: 30 },
  { id: 'b-streak-7', key: 'streak_7', name: '일주일 습관', description: '7일 연속 앱을 사용했어요', icon: '🔥', category: 'streak', requirement: '7일 연속 접속', xpReward: 75 },
  { id: 'b-streak-30', key: 'streak_30', name: '한 달 루틴', description: '30일 연속 앱을 사용했어요', icon: '💎', category: 'streak', requirement: '30일 연속 접속', xpReward: 300 },
];

// ─── DB 연동 ──────────────────────────────────────────

/**
 * 사용자 뱃지 조회
 */
export async function getUserBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBadge[]> {
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('clerk_user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const badge = DEFAULT_BADGES.find((b) => b.id === row.badge_id) ?? {
      id: row.badge_id,
      key: row.badge_id,
      name: '알 수 없는 뱃지',
      description: '',
      icon: '❓',
      category: 'special' as BadgeCategory,
      requirement: '',
      xpReward: 0,
    };

    return {
      badgeId: row.badge_id,
      badge,
      unlockedAt: row.unlocked_at,
    };
  });
}

/**
 * 뱃지 해금
 */
export async function unlockBadge(
  supabase: SupabaseClient,
  userId: string,
  badgeId: string
): Promise<{ success: boolean; alreadyUnlocked: boolean }> {
  // 이미 보유 여부 확인
  const { count } = await supabase
    .from('user_badges')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .eq('badge_id', badgeId);

  if ((count ?? 0) > 0) {
    return { success: true, alreadyUnlocked: true };
  }

  const { error } = await supabase.from('user_badges').insert({
    clerk_user_id: userId,
    badge_id: badgeId,
  });

  if (error) return { success: false, alreadyUnlocked: false };

  // XP 보상 지급
  const badge = DEFAULT_BADGES.find((b) => b.id === badgeId);
  if (badge && badge.xpReward > 0) {
    await addXp(supabase, userId, badge.xpReward);
  }

  return { success: true, alreadyUnlocked: false };
}

/**
 * XP 추가
 */
export async function addXp(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<LevelInfo | null> {
  // 현재 XP 조회
  const { data: current } = await supabase
    .from('user_levels')
    .select('total_xp, level')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  const currentXp = current?.total_xp ?? 0;
  const newTotalXp = currentXp + amount;
  const newLevel = getLevelFromTotalXp(newTotalXp);
  const tier = getTierForLevel(newLevel);

  // XP 업데이트 (upsert)
  await supabase.from('user_levels').upsert({
    clerk_user_id: userId,
    total_xp: newTotalXp,
    level: newLevel,
    tier,
    updated_at: new Date().toISOString(),
  });

  return calculateLevelInfo(newTotalXp);
}

/**
 * 현재 레벨 정보 조회
 */
export async function getUserLevelInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<LevelInfo> {
  const { data } = await supabase
    .from('user_levels')
    .select('total_xp')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  return calculateLevelInfo(data?.total_xp ?? 0);
}
