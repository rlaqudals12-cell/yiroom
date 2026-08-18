/**
 * 피드 시스템 API
 * 소셜 피드 조회 및 상호작용
 */

import { getFeedPosts, toggleFeedLike } from './api';
import type { FeedItem, FeedItemType } from './types';

// 피드 아이템 타입별 아이콘
export const feedTypeConfig: Record<FeedItemType, { emoji: string; label: string; color: string }> =
  {
    general: { emoji: '•', label: '소식', color: '#64748b' },
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
  clerkToken: string,
  _clerkUserId: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedItem[]> {
  return getFeedPosts(clerkToken, {
    page: Math.floor(offset / limit) + 1,
    limit,
    sort: 'friends',
  });
}

/**
 * 내 피드 조회
 */
export async function getMyFeed(
  clerkToken: string,
  clerkUserId: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedItem[]> {
  return getFeedPosts(clerkToken, {
    page: Math.floor(offset / limit) + 1,
    limit,
    userId: clerkUserId,
  });
}

/**
 * 전체 피드 조회
 */
export async function getAllFeed(
  clerkToken: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedItem[]> {
  return getFeedPosts(clerkToken, {
    page: Math.floor(offset / limit) + 1,
    limit,
  });
}

/**
 * 좋아요 토글
 */
export async function toggleLike(
  clerkToken: string,
  _clerkUserId: string,
  activityId: string
): Promise<{ success: boolean; isLiked: boolean }> {
  try {
    const isLiked = await toggleFeedLike(activityId, clerkToken);
    return { success: true, isLiked };
  } catch {
    return { success: false, isLiked: false };
  }
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
