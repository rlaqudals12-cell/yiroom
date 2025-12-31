// ============================================================
// 리더보드 조회 함수
// Phase H Sprint 2
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { leaderboardLogger } from '@/lib/utils/logger';
import type {
  Leaderboard,
  LeaderboardPeriod,
  LeaderboardCategory,
  LeaderboardCacheRow,
  MyRanking,
  RankingEntry,
} from '@/types/leaderboard';
import { toLeaderboard } from '@/types/leaderboard';
import {
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
  calculatePercentile,
  TOP_RANKINGS_COUNT,
} from './constants';

// 리더보드 조회 (캐시)
export async function getLeaderboard(
  supabase: SupabaseClient,
  period: LeaderboardPeriod,
  category: LeaderboardCategory,
  date?: Date
): Promise<Leaderboard | null> {
  let startDate: string;
  let _endDate: string;

  const targetDate = date ?? new Date();

  switch (period) {
    case 'weekly':
      startDate = getWeekStartDate(targetDate);
      _endDate = getWeekEndDate(targetDate);
      break;
    case 'monthly':
      startDate = getMonthStartDate(targetDate);
      _endDate = getMonthEndDate(targetDate);
      break;
    case 'all_time':
      startDate = '2024-01-01';
      _endDate = '2099-12-31';
      break;
  }

  const { data, error } = await supabase
    .from('leaderboard_cache')
    .select('*')
    .eq('period', period)
    .eq('category', category)
    .eq('start_date', startDate)
    .maybeSingle();

  if (error) {
    leaderboardLogger.error(' Error fetching leaderboard:', error);
    return null;
  }

  if (!data) return null;

  return toLeaderboard(data as LeaderboardCacheRow);
}

// 상위 N명 조회
export async function getTopRankings(
  supabase: SupabaseClient,
  period: LeaderboardPeriod,
  category: LeaderboardCategory,
  limit: number = TOP_RANKINGS_COUNT
): Promise<RankingEntry[]> {
  const leaderboard = await getLeaderboard(supabase, period, category);

  if (!leaderboard) return [];

  return leaderboard.rankings.slice(0, limit);
}

// 내 순위 조회
export async function getMyRanking(
  supabase: SupabaseClient,
  clerkUserId: string,
  period: LeaderboardPeriod,
  category: LeaderboardCategory
): Promise<MyRanking | null> {
  const leaderboard = await getLeaderboard(supabase, period, category);

  if (!leaderboard) return null;

  const myEntry = leaderboard.rankings.find((r) => r.userId === clerkUserId);

  if (!myEntry) {
    // 랭킹에 없는 경우 (점수 0)
    return {
      rank: leaderboard.totalParticipants + 1,
      score: 0,
      percentile: 0,
      category,
      period,
    };
  }

  return {
    rank: myEntry.rank,
    score: myEntry.score,
    percentile: calculatePercentile(myEntry.rank, leaderboard.totalParticipants),
    change: myEntry.change,
    category,
    period,
  };
}

// 실시간 XP 리더보드 계산 (캐시 없이)
export async function calculateXpLeaderboard(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from('user_levels')
    .select(
      `
      clerk_user_id,
      level,
      total_xp,
      tier
    `
    )
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error || !data) {
    leaderboardLogger.error(' Error calculating XP leaderboard:', error);
    return [];
  }

  // 사용자 정보 조회
  const userIds = data.map((d) => d.clerk_user_id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));

  return data.map((entry, index) => {
    const user = userMap.get(entry.clerk_user_id);
    return {
      rank: index + 1,
      userId: entry.clerk_user_id,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      score: entry.total_xp,
      level: entry.level,
      tier: entry.tier,
    };
  });
}

// 실시간 레벨 리더보드 계산
export async function calculateLevelLeaderboard(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from('user_levels')
    .select(
      `
      clerk_user_id,
      level,
      total_xp,
      tier
    `
    )
    .order('level', { ascending: false })
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error || !data) {
    leaderboardLogger.error(' Error calculating level leaderboard:', error);
    return [];
  }

  const userIds = data.map((d) => d.clerk_user_id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));

  return data.map((entry, index) => {
    const user = userMap.get(entry.clerk_user_id);
    return {
      rank: index + 1,
      userId: entry.clerk_user_id,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      score: entry.level,
      level: entry.level,
      tier: entry.tier,
    };
  });
}

// 실시간 웰니스 스코어 리더보드 계산
export async function calculateWellnessLeaderboard(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<RankingEntry[]> {
  // 가장 최근 웰니스 스코어 기준
  const { data, error } = await supabase
    .from('wellness_scores')
    .select(
      `
      clerk_user_id,
      total_score,
      workout_score,
      nutrition_score,
      wellness_date
    `
    )
    .order('wellness_date', { ascending: false })
    .order('total_score', { ascending: false });

  if (error || !data) {
    leaderboardLogger.error(' Error calculating wellness leaderboard:', error);
    return [];
  }

  // 사용자별 최신 점수만 추출
  const latestScores = new Map<string, (typeof data)[0]>();
  for (const entry of data) {
    if (!latestScores.has(entry.clerk_user_id)) {
      latestScores.set(entry.clerk_user_id, entry);
    }
  }

  // 점수 기준 정렬
  const sortedScores = Array.from(latestScores.values())
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, limit);

  // 사용자 정보 조회
  const userIds = sortedScores.map((d) => d.clerk_user_id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  // 레벨 정보 조회
  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, tier')
    .in('clerk_user_id', userIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map((levels ?? []).map((l) => [l.clerk_user_id, l]));

  return sortedScores.map((entry, index) => {
    const user = userMap.get(entry.clerk_user_id);
    const level = levelMap.get(entry.clerk_user_id);
    return {
      rank: index + 1,
      userId: entry.clerk_user_id,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      score: entry.total_score,
      level: level?.level ?? 1,
      tier: level?.tier ?? 'bronze',
    };
  });
}

// 실시간 운동 리더보드 계산 (이번 주 운동 시간 기준)
export async function calculateWorkoutLeaderboard(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<RankingEntry[]> {
  // 이번 주 운동 기록 집계
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();

  const { data, error } = await supabase
    .from('workout_logs')
    .select(
      `
      user_id,
      actual_duration,
      actual_calories,
      completed_at
    `
    )
    .gte('completed_at', weekStart)
    .lte('completed_at', weekEnd + 'T23:59:59')
    .not('completed_at', 'is', null);

  if (error || !data) {
    leaderboardLogger.error(' Error calculating workout leaderboard:', error);
    return [];
  }

  // user_id → clerk_user_id 매핑 조회
  const userIdSet = new Set(data.map((d) => d.user_id));
  const { data: userMappings } = await supabase
    .from('users')
    .select('id, clerk_user_id')
    .in('id', Array.from(userIdSet));

  const userIdToClerkId = new Map((userMappings ?? []).map((u) => [u.id, u.clerk_user_id]));

  // 사용자별 운동 시간 집계
  const workoutStats = new Map<string, { duration: number; calories: number }>();
  for (const entry of data) {
    const clerkUserId = userIdToClerkId.get(entry.user_id);
    if (!clerkUserId) continue;

    const existing = workoutStats.get(clerkUserId) || { duration: 0, calories: 0 };
    existing.duration += entry.actual_duration ?? 0;
    existing.calories += entry.actual_calories ?? 0;
    workoutStats.set(clerkUserId, existing);
  }

  // 시간 기준 정렬
  const sortedStats = Array.from(workoutStats.entries())
    .sort((a, b) => b[1].duration - a[1].duration)
    .slice(0, limit);

  // 사용자 정보 조회
  const clerkUserIds = sortedStats.map(([id]) => id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', clerkUserIds);

  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, tier')
    .in('clerk_user_id', clerkUserIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map((levels ?? []).map((l) => [l.clerk_user_id, l]));

  return sortedStats.map(([clerkUserId, stats], index) => {
    const user = userMap.get(clerkUserId);
    const level = levelMap.get(clerkUserId);
    return {
      rank: index + 1,
      userId: clerkUserId,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      score: stats.duration, // 분 단위
      level: level?.level ?? 1,
      tier: level?.tier ?? 'bronze',
    };
  });
}

// 실시간 영양 리더보드 계산 (이번 주 기록 일수 기준)
export async function calculateNutritionLeaderboard(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<RankingEntry[]> {
  // 이번 주 식단 기록 집계
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();

  const { data, error } = await supabase
    .from('daily_nutrition_summary')
    .select(
      `
      clerk_user_id,
      record_date,
      total_calories,
      goal_met
    `
    )
    .gte('record_date', weekStart)
    .lte('record_date', weekEnd);

  if (error || !data) {
    leaderboardLogger.error(' Error calculating nutrition leaderboard:', error);
    return [];
  }

  // 사용자별 기록 일수 및 목표 달성일 집계
  const nutritionStats = new Map<string, { recordDays: number; goalMetDays: number }>();
  for (const entry of data) {
    const existing = nutritionStats.get(entry.clerk_user_id) || { recordDays: 0, goalMetDays: 0 };
    existing.recordDays++;
    if (entry.goal_met) {
      existing.goalMetDays++;
    }
    nutritionStats.set(entry.clerk_user_id, existing);
  }

  // 목표 달성일 → 기록일 순 정렬
  const sortedStats = Array.from(nutritionStats.entries())
    .sort((a, b) => {
      if (b[1].goalMetDays !== a[1].goalMetDays) {
        return b[1].goalMetDays - a[1].goalMetDays;
      }
      return b[1].recordDays - a[1].recordDays;
    })
    .slice(0, limit);

  // 사용자 정보 조회
  const clerkUserIds = sortedStats.map(([id]) => id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', clerkUserIds);

  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, tier')
    .in('clerk_user_id', clerkUserIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map((levels ?? []).map((l) => [l.clerk_user_id, l]));

  return sortedStats.map(([clerkUserId, stats], index) => {
    const user = userMap.get(clerkUserId);
    const level = levelMap.get(clerkUserId);
    return {
      rank: index + 1,
      userId: clerkUserId,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      score: stats.goalMetDays, // 목표 달성 일수
      level: level?.level ?? 1,
      tier: level?.tier ?? 'bronze',
    };
  });
}

// 친구 리더보드 조회
export async function getFriendsLeaderboard(
  supabase: SupabaseClient,
  clerkUserId: string,
  category: LeaderboardCategory = 'xp'
): Promise<RankingEntry[]> {
  // 친구 ID 조회
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${clerkUserId},addressee_id.eq.${clerkUserId}`)
    .eq('status', 'accepted');

  if (!friendships || friendships.length === 0) {
    return [];
  }

  const friendIds = friendships.map((f) =>
    f.requester_id === clerkUserId ? f.addressee_id : f.requester_id
  );

  // 본인도 포함
  const allUserIds = [clerkUserId, ...friendIds];

  // 레벨 정보 조회
  const { data: levels, error } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, total_xp, tier')
    .in('clerk_user_id', allUserIds)
    .order(category === 'level' ? 'level' : 'total_xp', { ascending: false });

  if (error || !levels) {
    leaderboardLogger.error(' Error fetching friends leaderboard:', error);
    return [];
  }

  // 사용자 정보 조회
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', allUserIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));

  return levels.map((entry, index) => {
    const user = userMap.get(entry.clerk_user_id);
    return {
      rank: index + 1,
      userId: entry.clerk_user_id,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      score: category === 'level' ? entry.level : entry.total_xp,
      level: entry.level,
      tier: entry.tier,
    };
  });
}
