/**
 * 소셜 기능 API 클라이언트
 * 친구 시스템 및 리더보드
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { socialLogger } from '../utils/logger';

// ============================================
// 타입 정의
// ============================================

export interface Friend {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  tier: string;
  friendshipId: string;
  friendSince: Date;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string | null;
  requesterLevel: number;
  createdAt: Date;
}

export interface FriendStats {
  totalFriends: number;
  pendingRequests: number;
  sentRequests: number;
}

export interface UserSearchResult {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  tier: string;
  isFriend: boolean;
  isPending: boolean;
  isBlocked: boolean;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  level: number;
  tier: string;
}

export type LeaderboardCategory =
  | 'xp'
  | 'level'
  | 'workout'
  | 'nutrition'
  | 'wellness';

// ============================================
// 친구 조회 함수
// ============================================

/**
 * 친구 목록 조회
 */
export async function getFriends(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<Friend[]> {
  // 수락된 친구 관계 조회
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status, created_at')
    .or(`requester_id.eq.${clerkUserId},addressee_id.eq.${clerkUserId}`)
    .eq('status', 'accepted');

  if (error || !friendships) {
    socialLogger.error(' 친구 목록 조회 실패:', error);
    return [];
  }

  // 친구 ID 목록 추출
  const friendIds = friendships.map((f) =>
    f.requester_id === clerkUserId ? f.addressee_id : f.requester_id
  );

  if (friendIds.length === 0) return [];

  // 친구 사용자 정보 조회
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', friendIds);

  // 친구 레벨 정보 조회
  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, tier')
    .in('clerk_user_id', friendIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map(
    (levels ?? []).map((l) => [
      l.clerk_user_id,
      { level: l.level, tier: l.tier },
    ])
  );

  return friendships.map((friendship) => {
    const friendId =
      friendship.requester_id === clerkUserId
        ? friendship.addressee_id
        : friendship.requester_id;
    const user = userMap.get(friendId);
    const levelInfo = levelMap.get(friendId) ?? { level: 1, tier: 'beginner' };

    return {
      userId: friendId,
      displayName: user?.display_name ?? '사용자',
      avatarUrl: user?.avatar_url ?? null,
      level: levelInfo.level,
      tier: levelInfo.tier,
      friendshipId: friendship.id,
      friendSince: new Date(friendship.created_at),
    };
  });
}

/**
 * 받은 친구 요청 조회
 */
export async function getReceivedRequests(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, created_at')
    .eq('addressee_id', clerkUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) return [];

  const requesterIds = data.map((d) => d.requester_id);

  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', requesterIds);

  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level')
    .in('clerk_user_id', requesterIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map(
    (levels ?? []).map((l) => [l.clerk_user_id, l.level])
  );

  return data.map((request) => {
    const user = userMap.get(request.requester_id);
    return {
      id: request.id,
      requesterId: request.requester_id,
      requesterName: user?.display_name ?? '사용자',
      requesterAvatar: user?.avatar_url ?? null,
      requesterLevel: levelMap.get(request.requester_id) ?? 1,
      createdAt: new Date(request.created_at),
    };
  });
}

/**
 * 친구 통계 조회
 */
export async function getFriendStats(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<FriendStats> {
  const { count: friendCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${clerkUserId},addressee_id.eq.${clerkUserId}`)
    .eq('status', 'accepted');

  const { count: pendingCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('addressee_id', clerkUserId)
    .eq('status', 'pending');

  const { count: sentCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('requester_id', clerkUserId)
    .eq('status', 'pending');

  return {
    totalFriends: friendCount ?? 0,
    pendingRequests: pendingCount ?? 0,
    sentRequests: sentCount ?? 0,
  };
}

/**
 * 사용자 검색
 */
export async function searchUsers(
  supabase: SupabaseClient,
  clerkUserId: string,
  query: string,
  limit: number = 10
): Promise<UserSearchResult[]> {
  if (!query || query.length < 2) return [];

  const { data: users, error } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .neq('clerk_user_id', clerkUserId)
    .ilike('display_name', `%${query}%`)
    .limit(limit);

  if (error || !users || users.length === 0) return [];

  const userIds = users.map((u) => u.clerk_user_id);

  // 친구 관계 확인
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${clerkUserId},addressee_id.in.(${userIds.join(',')})),` +
        `and(addressee_id.eq.${clerkUserId},requester_id.in.(${userIds.join(',')}))`
    );

  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, tier')
    .in('clerk_user_id', userIds);

  const levelMap = new Map(
    (levels ?? []).map((l) => [
      l.clerk_user_id,
      { level: l.level, tier: l.tier },
    ])
  );

  const friendshipMap = new Map<
    string,
    { isFriend: boolean; isPending: boolean; isBlocked: boolean }
  >();

  (friendships ?? []).forEach((f) => {
    const friendId =
      f.requester_id === clerkUserId ? f.addressee_id : f.requester_id;
    friendshipMap.set(friendId, {
      isFriend: f.status === 'accepted',
      isPending: f.status === 'pending',
      isBlocked: f.status === 'blocked',
    });
  });

  return users.map((user) => {
    const levelInfo = levelMap.get(user.clerk_user_id) ?? {
      level: 1,
      tier: 'beginner',
    };
    const friendship = friendshipMap.get(user.clerk_user_id) ?? {
      isFriend: false,
      isPending: false,
      isBlocked: false,
    };

    return {
      userId: user.clerk_user_id,
      displayName: user.display_name ?? '사용자',
      avatarUrl: user.avatar_url,
      level: levelInfo.level,
      tier: levelInfo.tier,
      ...friendship,
    };
  });
}

// ============================================
// 친구 요청 함수
// ============================================

/**
 * 친구 요청 보내기
 */
export async function sendFriendRequest(
  supabase: SupabaseClient,
  clerkUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('friendships').insert({
    requester_id: clerkUserId,
    addressee_id: targetUserId,
    status: 'pending',
  });

  if (error) {
    socialLogger.error(' 친구 요청 실패:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 친구 요청 수락
 */
export async function acceptFriendRequest(
  supabase: SupabaseClient,
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId);

  if (error) {
    socialLogger.error(' 친구 요청 수락 실패:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 친구 요청 거절/삭제
 */
export async function rejectFriendRequest(
  supabase: SupabaseClient,
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) {
    socialLogger.error(' 친구 요청 거절 실패:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// 리더보드 함수
// ============================================

/**
 * XP 리더보드 조회
 */
export async function getXpLeaderboard(
  supabase: SupabaseClient,
  limit: number = 50
): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, total_xp, tier')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error || !data) {
    socialLogger.error(' XP 리더보드 조회 실패:', error);
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
      score: entry.total_xp,
      level: entry.level,
      tier: entry.tier,
    };
  });
}

/**
 * 친구 리더보드 조회
 */
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
    socialLogger.error(' 친구 리더보드 조회 실패:', error);
    return [];
  }

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

/**
 * 내 순위 조회
 */
export async function getMyRanking(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<{ rank: number; totalUsers: number } | null> {
  // 전체 사용자 수
  const { count: totalUsers } = await supabase
    .from('user_levels')
    .select('*', { count: 'exact', head: true });

  // 내 XP보다 높은 사용자 수
  const { data: myLevel } = await supabase
    .from('user_levels')
    .select('total_xp')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (!myLevel) return null;

  const { count: higherCount } = await supabase
    .from('user_levels')
    .select('*', { count: 'exact', head: true })
    .gt('total_xp', myLevel.total_xp);

  return {
    rank: (higherCount ?? 0) + 1,
    totalUsers: totalUsers ?? 0,
  };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 티어 한글명
 */
export function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    beginner: '초보자',
    bronze: '브론즈',
    silver: '실버',
    gold: '골드',
    platinum: '플래티넘',
    diamond: '다이아몬드',
    master: '마스터',
  };
  return labels[tier] ?? tier;
}

/**
 * 티어 색상
 */
export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    beginner: '#9ca3af',
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#00d4ff',
    diamond: '#b9f2ff',
    master: '#ff6b6b',
  };
  return colors[tier] ?? '#9ca3af';
}
