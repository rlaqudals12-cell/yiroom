/**
 * 피드 시스템 타입 정의
 */

export type FeedItemType =
  | 'badge'
  | 'challenge'
  | 'analysis'
  | 'workout'
  | 'nutrition';

export interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userLevel: number;
  type: FeedItemType;
  content: string;
  detail?: string;
  createdAt: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
}

export type FeedTab = 'my' | 'friends' | 'all';

export interface FeedStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
}
