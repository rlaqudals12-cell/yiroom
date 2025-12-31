// ============================================================
// 친구 시스템 조회 함수
// Phase H Sprint 2
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { socialLogger } from '@/lib/utils/logger';
import type {
  Friend,
  FriendRequest,
  FriendStats,
  UserSearchResult,
  FriendshipRow,
} from '@/types/friends';

// 친구 목록 조회
export async function getFriends(supabase: SupabaseClient, clerkUserId: string): Promise<Friend[]> {
  // 수락된 친구 관계 조회
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select(
      `
      id,
      requester_id,
      addressee_id,
      status,
      created_at,
      updated_at
    `
    )
    .or(`requester_id.eq.${clerkUserId},addressee_id.eq.${clerkUserId}`)
    .eq('status', 'accepted');

  if (error || !friendships) {
    socialLogger.error('친구 목록 조회 실패:', error);
    return [];
  }

  // 친구 ID 목록 추출
  const friendIds = friendships.map((f: FriendshipRow) =>
    f.requester_id === clerkUserId ? f.addressee_id : f.requester_id
  );

  if (friendIds.length === 0) return [];

  // 친구 사용자 정보 조회
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', friendIds);

  if (usersError || !users) {
    socialLogger.error('사용자 정보 조회 실패:', usersError);
    return [];
  }

  // 친구 레벨 정보 조회
  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, total_xp, tier')
    .in('clerk_user_id', friendIds);

  const levelMap = new Map(
    (levels ?? []).map(
      (l: { clerk_user_id: string; level: number; total_xp: number; tier: string }) => [
        l.clerk_user_id,
        { level: l.level, totalXp: l.total_xp, tier: l.tier },
      ]
    )
  );

  // Friend 객체 생성
  return users.map((user) => {
    const friendship = friendships.find(
      (f: FriendshipRow) =>
        f.requester_id === user.clerk_user_id || f.addressee_id === user.clerk_user_id
    ) as FriendshipRow;

    const levelInfo = levelMap.get(user.clerk_user_id) ?? {
      level: 1,
      totalXp: 0,
      tier: 'beginner',
    };

    return {
      userId: user.clerk_user_id,
      displayName: user.display_name ?? '사용자',
      avatarUrl: user.avatar_url,
      level: levelInfo.level,
      totalXp: levelInfo.totalXp,
      tier: levelInfo.tier,
      friendshipId: friendship.id,
      friendSince: new Date(friendship.created_at),
    };
  });
}

// 받은 친구 요청 조회
export async function getReceivedRequests(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      id,
      requester_id,
      created_at
    `
    )
    .eq('addressee_id', clerkUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data) {
    socialLogger.error('친구 요청 조회 실패:', error);
    return [];
  }

  if (data.length === 0) return [];

  // 요청자 정보 조회
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
  const levelMap = new Map((levels ?? []).map((l) => [l.clerk_user_id, l.level]));

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

// 보낸 친구 요청 조회
export async function getSentRequests(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      id,
      addressee_id,
      created_at
    `
    )
    .eq('requester_id', clerkUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data) {
    socialLogger.error('보낸 요청 조회 실패:', error);
    return [];
  }

  if (data.length === 0) return [];

  const addresseeIds = data.map((d) => d.addressee_id);

  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', addresseeIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));

  return data.map((request) => {
    const user = userMap.get(request.addressee_id);
    return {
      id: request.id,
      requesterId: request.addressee_id,
      requesterName: user?.display_name ?? '사용자',
      requesterAvatar: user?.avatar_url ?? null,
      requesterLevel: 1,
      createdAt: new Date(request.created_at),
    };
  });
}

// 친구 통계 조회
export async function getFriendStats(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<FriendStats> {
  // 친구 수
  const { count: friendCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${clerkUserId},addressee_id.eq.${clerkUserId}`)
    .eq('status', 'accepted');

  // 받은 요청 수
  const { count: pendingCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('addressee_id', clerkUserId)
    .eq('status', 'pending');

  // 보낸 요청 수
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

// 사용자 검색
export async function searchUsers(
  supabase: SupabaseClient,
  clerkUserId: string,
  query: string,
  limit: number = 10
): Promise<UserSearchResult[]> {
  if (!query || query.length < 2) return [];

  // 사용자 검색
  const { data: users, error } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .neq('clerk_user_id', clerkUserId)
    .ilike('display_name', `%${query}%`)
    .limit(limit);

  if (error || !users) {
    socialLogger.error('사용자 검색 실패:', error);
    return [];
  }

  if (users.length === 0) return [];

  const userIds = users.map((u) => u.clerk_user_id);

  // 친구 관계 확인
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${clerkUserId},addressee_id.in.(${userIds.join(',')})),` +
        `and(addressee_id.eq.${clerkUserId},requester_id.in.(${userIds.join(',')}))`
    );

  // 레벨 정보 조회
  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level, tier')
    .in('clerk_user_id', userIds);

  const levelMap = new Map(
    (levels ?? []).map((l) => [l.clerk_user_id, { level: l.level, tier: l.tier }])
  );

  const friendshipMap = new Map<
    string,
    { isFriend: boolean; isPending: boolean; isBlocked: boolean }
  >();

  (friendships ?? []).forEach((f) => {
    const friendId = f.requester_id === clerkUserId ? f.addressee_id : f.requester_id;
    friendshipMap.set(friendId, {
      isFriend: f.status === 'accepted',
      isPending: f.status === 'pending',
      isBlocked: f.status === 'blocked',
    });
  });

  return users.map((user) => {
    const levelInfo = levelMap.get(user.clerk_user_id) ?? { level: 1, tier: 'beginner' };
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

// 친구 관계 확인
export async function checkFriendship(
  supabase: SupabaseClient,
  clerkUserId: string,
  targetUserId: string
): Promise<{ isFriend: boolean; isPending: boolean; isBlocked: boolean; friendshipId?: string }> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_id.eq.${clerkUserId},addressee_id.eq.${targetUserId}),` +
        `and(addressee_id.eq.${clerkUserId},requester_id.eq.${targetUserId})`
    )
    .maybeSingle();

  if (error || !data) {
    return { isFriend: false, isPending: false, isBlocked: false };
  }

  return {
    isFriend: data.status === 'accepted',
    isPending: data.status === 'pending',
    isBlocked: data.status === 'blocked',
    friendshipId: data.id,
  };
}
