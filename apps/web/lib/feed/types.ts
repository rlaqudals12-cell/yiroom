/**
 * 피드 시스템 타입 정의
 */

export type PostType = 'general' | 'review' | 'question' | 'tip';
export type InteractionType = 'like' | 'save' | 'share';

export interface FeedPost {
  id: string;
  clerk_user_id: string;
  content: string;
  media_urls: string[];
  product_ids: string[];
  hashtags: string[];
  post_type: PostType;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
}

export interface FeedPostWithAuthor extends FeedPost {
  author: {
    name: string;
    avatar_url: string | null;
  };
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface FeedInteraction {
  id: string;
  post_id: string;
  clerk_user_id: string;
  interaction_type: InteractionType;
  created_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  clerk_user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
}

export interface FeedCommentWithAuthor extends FeedComment {
  author: {
    name: string;
    avatar_url: string | null;
  };
  replies?: FeedCommentWithAuthor[];
}

export interface CreatePostInput {
  content: string;
  media_urls?: string[];
  product_ids?: string[];
  hashtags?: string[];
  post_type?: PostType;
}

export interface UpdatePostInput {
  content?: string;
  media_urls?: string[];
  product_ids?: string[];
  hashtags?: string[];
}

export interface CreateCommentInput {
  post_id: string;
  content: string;
  parent_id?: string;
}

export interface FeedListParams {
  page?: number;
  limit?: number;
  post_type?: PostType;
  hashtag?: string;
  user_id?: string;
}
