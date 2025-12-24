// ============================================================
// 리더보드 조회 함수
// Phase H Sprint 2
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
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
  let endDate: string;

  const targetDate = date ?? new Date();

  switch (period) {
    case 'weekly':
      startDate = getWeekStartDate(targetDate);
      endDate = getWeekEndDate(targetDate);
      break;
    case 'monthly':
      startDate = getMonthStartDate(targetDate);
      endDate = getMonthEndDate(targetDate);
      break;
    case 'all_time':
      startDate = '2024-01-01';
      endDate = '2099-12-31';
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
    console.error('[Leaderboard] Error fetching leaderboard:', error);
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
    .select(`
      clerk_user_id,
      level,
      total_xp,
      tier
    `)
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[Leaderboard] Error calculating XP leaderboard:', error);
    return [];
  }

  // 사용자 정보 조회
  const userIds = data.map((d) => d.clerk_user_id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.clerk_user_id, u])
  );

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
    .select(`
      clerk_user_id,
      level,
      total_xp,
      tier
    `)
    .order('level', { ascending: false })
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[Leaderboard] Error calculating level leaderboard:', error);
    return [];
  }

  const userIds = data.map((d) => d.clerk_user_id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.clerk_user_id, u])
  );

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
    console.error('[Leaderboard] Error fetching friends leaderboard:', error);
    return [];
  }

  // 사용자 정보 조회
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', allUserIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.clerk_user_id, u])
  );

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
