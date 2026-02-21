/**
 * 피드 시스템 API
 * 소셜 피드 조회 및 상호작용
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { FeedItem, FeedItemType } from './types';
import { feedLogger } from '../utils/logger';

// 피드 아이템 타입별 아이콘
export const feedTypeConfig: Record<FeedItemType, { emoji: string; label: string; color: string }> =
  {
    badge: { emoji: '🏆', label: '배지', color: '#eab308' },
    challenge: { emoji: '🔥', label: '챌린지', color: '#f97316' },
    analysis: { emoji: '🎨', label: '분석', color: '#ec4899' },
    workout: { emoji: '💪', label: '운동', color: '#3b82f6' },
    nutrition: { emoji: '🥗', label: '영양', color: '#22c55e' },
  };

/**
 * 친구 피드 조회
 */
export async function getFriendsFeed(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedItem[]> {
  // 친구 ID 목록 조회
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

  // 피드 아이템 조회 (user_activities 테이블 기반)
  const { data: activities, error } = await supabase
    .from('user_activities')
    .select('id, clerk_user_id, activity_type, title, description, metadata, created_at')
    .in('clerk_user_id', friendIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !activities) {
    feedLogger.error(' 친구 피드 조회 실패:', error);
    return [];
  }

  // 사용자 정보 조회
  const userIds = [...new Set(activities.map((a) => a.clerk_user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level')
    .in('clerk_user_id', userIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map((levels ?? []).map((l) => [l.clerk_user_id, l.level]));

  return activities.map((activity) => {
    const user = userMap.get(activity.clerk_user_id);
    return {
      id: activity.id,
      userId: activity.clerk_user_id,
      userName: user?.display_name ?? '사용자',
      userAvatar: user?.avatar_url ?? null,
      userLevel: levelMap.get(activity.clerk_user_id) ?? 1,
      type: mapActivityType(activity.activity_type),
      content: activity.title,
      detail: activity.description,
      createdAt: new Date(activity.created_at),
      likes: activity.metadata?.likes ?? 0,
      comments: activity.metadata?.comments ?? 0,
      isLiked: false, // 별도 조회 필요
    };
  });
}

/**
 * 내 피드 조회
 */
export async function getMyFeed(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedItem[]> {
  const { data: activities, error } = await supabase
    .from('user_activities')
    .select('id, clerk_user_id, activity_type, title, description, metadata, created_at')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !activities) {
    feedLogger.error(' 내 피드 조회 실패:', error);
    return [];
  }

  const { data: user } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  const { data: level } = await supabase
    .from('user_levels')
    .select('level')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  return activities.map((activity) => ({
    id: activity.id,
    userId: activity.clerk_user_id,
    userName: user?.display_name ?? '나',
    userAvatar: user?.avatar_url ?? null,
    userLevel: level?.level ?? 1,
    type: mapActivityType(activity.activity_type),
    content: activity.title,
    detail: activity.description,
    createdAt: new Date(activity.created_at),
    likes: activity.metadata?.likes ?? 0,
    comments: activity.metadata?.comments ?? 0,
    isLiked: false,
  }));
}

/**
 * 전체 피드 조회
 */
export async function getAllFeed(
  supabase: SupabaseClient,
  limit: number = 20,
  offset: number = 0
): Promise<FeedItem[]> {
  const { data: activities, error } = await supabase
    .from('user_activities')
    .select('id, clerk_user_id, activity_type, title, description, metadata, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !activities) {
    feedLogger.error(' 전체 피드 조회 실패:', error);
    return [];
  }

  const userIds = [...new Set(activities.map((a) => a.clerk_user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('clerk_user_id, display_name, avatar_url')
    .in('clerk_user_id', userIds);

  const { data: levels } = await supabase
    .from('user_levels')
    .select('clerk_user_id, level')
    .in('clerk_user_id', userIds);

  const userMap = new Map((users ?? []).map((u) => [u.clerk_user_id, u]));
  const levelMap = new Map((levels ?? []).map((l) => [l.clerk_user_id, l.level]));

  return activities.map((activity) => {
    const user = userMap.get(activity.clerk_user_id);
    return {
      id: activity.id,
      userId: activity.clerk_user_id,
      userName: user?.display_name ?? '사용자',
      userAvatar: user?.avatar_url ?? null,
      userLevel: levelMap.get(activity.clerk_user_id) ?? 1,
      type: mapActivityType(activity.activity_type),
      content: activity.title,
      detail: activity.description,
      createdAt: new Date(activity.created_at),
      likes: activity.metadata?.likes ?? 0,
      comments: activity.metadata?.comments ?? 0,
      isLiked: false,
    };
  });
}

/**
 * 좋아요 토글
 */
export async function toggleLike(
  supabase: SupabaseClient,
  clerkUserId: string,
  activityId: string
): Promise<{ success: boolean; isLiked: boolean }> {
  // 간단한 구현: metadata의 likes 수 증감
  const { data: activity, error: fetchError } = await supabase
    .from('user_activities')
    .select('metadata')
    .eq('id', activityId)
    .maybeSingle();

  if (fetchError || !activity) {
    return { success: false, isLiked: false };
  }

  const currentLikes = activity.metadata?.likes ?? 0;
  const likedBy = activity.metadata?.liked_by ?? [];
  const isCurrentlyLiked = likedBy.includes(clerkUserId);

  const newLikedBy = isCurrentlyLiked
    ? likedBy.filter((id: string) => id !== clerkUserId)
    : [...likedBy, clerkUserId];

  const { error: updateError } = await supabase
    .from('user_activities')
    .update({
      metadata: {
        ...activity.metadata,
        likes: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
        liked_by: newLikedBy,
      },
    })
    .eq('id', activityId);

  if (updateError) {
    feedLogger.error(' 좋아요 토글 실패:', updateError);
    return { success: false, isLiked: isCurrentlyLiked };
  }

  return { success: true, isLiked: !isCurrentlyLiked };
}

/**
 * 활동 타입 매핑
 */
function mapActivityType(activityType: string): FeedItemType {
  const typeMap: Record<string, FeedItemType> = {
    badge_earned: 'badge',
    challenge_completed: 'challenge',
    analysis_completed: 'analysis',
    workout_completed: 'workout',
    nutrition_logged: 'nutrition',
  };
  return typeMap[activityType] ?? 'workout';
}

/**
 * 상대 시간 포맷
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export * from './types';
