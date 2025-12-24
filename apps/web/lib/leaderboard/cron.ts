// ============================================================
// 리더보드 캐시 업데이트 (Cron Job)
// Phase H Sprint 2
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LeaderboardPeriod,
  LeaderboardCategory,
  RankingEntry,
} from '@/types/leaderboard';
import {
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
} from './constants';

// 리더보드 캐시 업데이트 (전체)
export async function updateAllLeaderboards(
  supabase: SupabaseClient
): Promise<{ success: boolean; updated: number; errors: string[] }> {
  const periods: LeaderboardPeriod[] = ['weekly', 'monthly', 'all_time'];
  const categories: LeaderboardCategory[] = ['xp', 'level'];

  let updated = 0;
  const errors: string[] = [];

  for (const period of periods) {
    for (const category of categories) {
      try {
        const result = await updateLeaderboardCache(supabase, period, category);
        if (result.success) {
          updated++;
        } else if (result.error) {
          errors.push(`${period}-${category}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${period}-${category}: ${String(error)}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    updated,
    errors,
  };
}

// 개별 리더보드 캐시 업데이트
export async function updateLeaderboardCache(
  supabase: SupabaseClient,
  period: LeaderboardPeriod,
  category: LeaderboardCategory
): Promise<{ success: boolean; error?: string }> {
  const now = new Date();
  let startDate: string;
  let endDate: string;

  switch (period) {
    case 'weekly':
      startDate = getWeekStartDate(now);
      endDate = getWeekEndDate(now);
      break;
    case 'monthly':
      startDate = getMonthStartDate(now);
      endDate = getMonthEndDate(now);
      break;
    case 'all_time':
      startDate = '2024-01-01';
      endDate = '2099-12-31';
      break;
  }

  // 랭킹 계산
  const rankings = await calculateRankings(supabase, category);

  // 캐시 upsert
  const { error } = await supabase
    .from('leaderboard_cache')
    .upsert(
      {
        period,
        category,
        start_date: startDate,
        end_date: endDate,
        rankings,
        total_participants: rankings.length,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'period,category,start_date',
      }
    );

  if (error) {
    console.error('[Leaderboard] Cache update error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 랭킹 계산
async function calculateRankings(
  supabase: SupabaseClient,
  category: LeaderboardCategory,
  limit: number = 100
): Promise<RankingEntry[]> {
  // XP 또는 레벨 기준 정렬
  const orderColumn = category === 'level' ? 'level' : 'total_xp';

  const { data, error } = await supabase
    .from('user_levels')
    .select(`
      clerk_user_id,
      level,
      total_xp,
      tier
    `)
    .order(orderColumn, { ascending: false })
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[Leaderboard] Error calculating rankings:', error);
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

  // RankingEntry 배열 생성
  return data.map((entry, index) => {
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

// 특정 사용자의 모든 리더보드 순위 갱신
export async function refreshUserRankings(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<void> {
  // 전체 리더보드 업데이트 대신 사용자의 순위만 재계산
  // 실시간 조회에 의존하므로 별도 작업 불필요
  console.log(`[Leaderboard] User ${clerkUserId} rankings will be calculated on-demand`);
}

// 오래된 캐시 정리
export async function cleanupOldCache(
  supabase: SupabaseClient,
  daysOld: number = 90
): Promise<{ success: boolean; deleted: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('leaderboard_cache')
    .delete()
    .lt('updated_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('[Leaderboard] Cleanup error:', error);
    return { success: false, deleted: 0 };
  }

  return { success: true, deleted: data?.length ?? 0 };
}
