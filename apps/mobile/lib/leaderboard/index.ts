/**
 * 리더보드 모듈
 *
 * 랭킹 조회, 카테고리별 리더보드 — lib/social/ 기반 barrel export + 확장
 *
 * @module lib/leaderboard
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// 기존 social 모듈에서 re-export
export {
  getXpLeaderboard,
  getFriendsLeaderboard,
  getMyRanking,
  getTierLabel,
  getTierColor,
} from '../social';

export type {
  RankingEntry,
  LeaderboardCategory,
} from '../social';

// ─── 확장 타입 ────────────────────────────────────────

export interface LeaderboardPeriod {
  period: 'weekly' | 'monthly' | 'all_time';
  label: string;
}

export interface CategoryLeaderboard {
  category: string;
  label: string;
  entries: LeaderboardEntry[];
  myRank: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  level: number;
  tier: string;
  isCurrentUser: boolean;
}

// ─── 기간 상수 ────────────────────────────────────────

export const LEADERBOARD_PERIODS: LeaderboardPeriod[] = [
  { period: 'weekly', label: '이번 주' },
  { period: 'monthly', label: '이번 달' },
  { period: 'all_time', label: '전체' },
];

export const LEADERBOARD_CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'xp', label: '총 경험치', icon: '⚡' },
  { key: 'level', label: '레벨', icon: '🏆' },
  { key: 'workout', label: '운동', icon: '💪' },
  { key: 'nutrition', label: '영양', icon: '🥗' },
  { key: 'wellness', label: '웰니스', icon: '🌟' },
];

// ─── 카테고리별 리더보드 ──────────────────────────────

/**
 * 운동 리더보드 (주간 총 운동 시간 기준)
 */
export async function getWorkoutLeaderboard(
  supabase: SupabaseClient,
  limit = 20
): Promise<LeaderboardEntry[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data } = await supabase
    .from('workout_logs')
    .select('clerk_user_id, duration_minutes')
    .gte('created_at', weekAgo.toISOString());

  if (!data || data.length === 0) return [];

  // 사용자별 합산
  const totals = new Map<string, number>();
  data.forEach((d) => {
    const current = totals.get(d.clerk_user_id) ?? 0;
    totals.set(d.clerk_user_id, current + (d.duration_minutes ?? 0));
  });

  // 정렬 + limit
  const sorted = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const userIds = sorted.map(([id]) => id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, tier')
    .in('clerk_user_id', userIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map(
    (levels ?? []).map((l) => [l.clerk_user_id, { level: l.level, tier: l.tier }])
  );

  return sorted.map(([userId, score], index) => {
    const user = userMap.get(userId);
    const levelInfo = levelMap.get(userId) ?? { level: 1, tier: 'beginner' };
    return {
      rank: index + 1,
      userId,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      score,
      level: levelInfo.level,
      tier: levelInfo.tier,
      isCurrentUser: false,
    };
  });
}

/**
 * 리더보드 엔트리에 현재 사용자 표시 추가
 */
export function markCurrentUser(
  entries: LeaderboardEntry[],
  currentUserId: string
): LeaderboardEntry[] {
  return entries.map((entry) => ({
    ...entry,
    isCurrentUser: entry.userId === currentUserId,
  }));
}

// ─── 순위 유틸리티 ────────────────────────────────────

/**
 * 순위 뱃지 이모지
 */
export function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
}

/**
 * 순위 백분위 계산
 */
export function calculatePercentile(rank: number, totalUsers: number): number {
  if (totalUsers <= 0) return 0;
  return Math.round(((totalUsers - rank) / totalUsers) * 100);
}

/**
 * 순위 라벨 (상위 N%)
 */
export function getRankLabel(rank: number, totalUsers: number): string {
  const percentile = calculatePercentile(rank, totalUsers);
  if (percentile >= 99) return '상위 1%';
  if (percentile >= 95) return '상위 5%';
  if (percentile >= 90) return '상위 10%';
  if (percentile >= 75) return '상위 25%';
  if (percentile >= 50) return '상위 50%';
  return `${rank}위`;
}
