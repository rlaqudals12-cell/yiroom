/**
 * 친구 시스템 모듈
 *
 * 친구 CRUD, 요청, 검색 — lib/social/ 기반 barrel export + 확장
 *
 * @module lib/friends
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// 기존 social 모듈에서 re-export
export {
  getFriends,
  getReceivedRequests,
  getFriendStats,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from '../social';

export type {
  Friend,
  FriendRequest,
  FriendStats,
  UserSearchResult,
} from '../social';

// ─── 확장 타입 ────────────────────────────────────────

export interface FriendActivity {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  activityType: 'analysis' | 'workout' | 'badge' | 'level_up' | 'streak';
  description: string;
  createdAt: string;
}

export interface FriendSuggestion {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  mutualFriends: number;
  reason: string;
}

// ─── 친구 활동 피드 ───────────────────────────────────

/**
 * 친구 활동 피드 조회
 */
export async function getFriendActivities(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<FriendActivity[]> {
  // 친구 ID 조회
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (!friendships || friendships.length === 0) return [];

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  // 활동 로그 조회
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('clerk_user_id, activity_type, description, created_at')
    .in('clerk_user_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!activities || activities.length === 0) return [];

  // 사용자 정보 조회
  const activityUserIds = [...new Set(activities.map((a) => a.clerk_user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', activityUserIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.clerk_user_id, u])
  );

  return activities.map((activity) => {
    const user = userMap.get(activity.clerk_user_id);
    return {
      userId: activity.clerk_user_id,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      activityType: activity.activity_type,
      description: activity.description ?? '',
      createdAt: activity.created_at,
    };
  });
}

/**
 * 친구 추천 목록
 */
export async function getFriendSuggestions(
  supabase: SupabaseClient,
  userId: string,
  limit = 5
): Promise<FriendSuggestion[]> {
  // 내 친구 ID 조회
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  // 비슷한 레벨의 사용자 추천 (친구 아닌)
  const excludeIds = [userId, ...friendIds];

  const { data: myLevel } = await supabase
    .from('user_levels')
    .select('level')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  const level = myLevel?.level ?? 1;

  const { data: candidates } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level')
    .not('clerk_user_id', 'in', `(${excludeIds.join(',')})`)
    .gte('level', Math.max(1, level - 3))
    .lte('level', level + 3)
    .limit(limit);

  if (!candidates || candidates.length === 0) return [];

  const candidateIds = candidates.map((c) => c.clerk_user_id);
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', candidateIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.clerk_user_id, u])
  );

  return candidates.map((c) => {
    const user = userMap.get(c.clerk_user_id);
    return {
      userId: c.clerk_user_id,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      level: c.level,
      mutualFriends: 0,
      reason: `비슷한 레벨 (Lv.${c.level})`,
    };
  });
}

// ─── 친구 수 뱃지 ─────────────────────────────────────

export const FRIEND_COUNT_BADGES: Record<number, string> = {
  1: '첫 친구',
  5: '사교적인',
  10: '인기인',
  25: '소셜 나비',
  50: '뷰티 커뮤니티',
};

/**
 * 현재 달성한 친구 뱃지
 */
export function getEarnedFriendBadges(friendCount: number): string[] {
  return Object.entries(FRIEND_COUNT_BADGES)
    .filter(([threshold]) => friendCount >= parseInt(threshold))
    .map(([, label]) => label);
}
