import { getApiBaseUrl } from '@/lib/api/base-url';

import type { FeedItem, FeedItemType } from './types';

interface FeedPostRow {
  id: string;
  clerk_user_id: string;
  content: string;
  hashtags?: string[];
  likes_count?: number;
  comments_count?: number;
  created_at: string;
  author?: { name?: string; avatar_url?: string | null };
  is_liked?: boolean;
}

interface FeedCommentRow {
  id: string;
  clerk_user_id: string;
  content: string;
  created_at: string;
  author?: { name?: string };
}

export interface FeedComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

interface FeedPostInput {
  content: string;
  type: FeedItemType;
}

interface FeedListOptions {
  page: number;
  limit: number;
  sort?: 'recent' | 'friends';
  userId?: string;
}

function requireToken(clerkToken: string): void {
  if (!clerkToken.trim()) throw new Error('로그인이 필요합니다.');
}

async function requestFeed(
  path: string,
  clerkToken: string,
  init: RequestInit = {},
  baseUrl?: string
): Promise<Record<string, unknown>> {
  requireToken(clerkToken);
  const response = await fetch(`${getApiBaseUrl(baseUrl)}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${clerkToken}`,
      'x-yiroom-client': 'mobile',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok || payload.success === false) {
    throw new Error('피드 요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
  }
  return payload;
}

function parseType(hashtags: string[] | undefined): FeedItemType {
  const type = hashtags?.find((tag) => tag.startsWith('yiroom-'))?.slice('yiroom-'.length) as
    | FeedItemType
    | undefined;
  return type &&
    ['general', 'badge', 'challenge', 'analysis', 'workout', 'nutrition'].includes(type)
    ? type
    : 'general';
}

function toFeedItem(post: FeedPostRow): FeedItem {
  const [title, ...detail] = post.content.split('\n');
  return {
    id: post.id,
    userId: post.clerk_user_id,
    userName: post.author?.name || '사용자',
    userAvatar: post.author?.avatar_url ?? null,
    userLevel: 0,
    type: parseType(post.hashtags),
    content: title || post.content,
    detail: detail.join('\n') || undefined,
    createdAt: new Date(post.created_at),
    likes: post.likes_count ?? 0,
    comments: post.comments_count ?? 0,
    isLiked: post.is_liked ?? false,
  };
}

function toFeedComment(comment: FeedCommentRow): FeedComment {
  return {
    id: comment.id,
    userId: comment.clerk_user_id,
    userName: comment.author?.name || '사용자',
    content: comment.content,
    createdAt: new Date(comment.created_at),
  };
}

export async function getFeedPosts(
  clerkToken: string,
  options: FeedListOptions,
  baseUrl?: string
): Promise<FeedItem[]> {
  const params = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
    sort: options.sort ?? 'recent',
  });
  if (options.userId) params.set('user_id', options.userId);

  const payload = await requestFeed(`/api/feed?${params.toString()}`, clerkToken, {}, baseUrl);
  const posts = Array.isArray(payload.posts) ? (payload.posts as FeedPostRow[]) : [];
  return posts.map(toFeedItem);
}

export async function getFeedPost(
  postId: string,
  clerkToken: string,
  baseUrl?: string
): Promise<FeedItem> {
  const payload = await requestFeed(
    `/api/feed/${encodeURIComponent(postId)}`,
    clerkToken,
    {},
    baseUrl
  );
  if (!payload.post) throw new Error('게시물을 찾을 수 없어요.');
  return toFeedItem(payload.post as FeedPostRow);
}

export async function createFeedPost(
  clerkToken: string,
  input: FeedPostInput,
  baseUrl?: string
): Promise<void> {
  await requestFeed(
    '/api/feed',
    clerkToken,
    {
      method: 'POST',
      body: JSON.stringify({
        content: input.content,
        post_type: 'general',
        hashtags: [`yiroom-${input.type}`],
      }),
    },
    baseUrl
  );
}

export async function toggleFeedLike(
  postId: string,
  clerkToken: string,
  baseUrl?: string
): Promise<boolean> {
  const payload = await requestFeed(
    `/api/feed/${encodeURIComponent(postId)}/like`,
    clerkToken,
    { method: 'POST' },
    baseUrl
  );
  return payload.liked === true;
}

export async function getFeedComments(
  postId: string,
  clerkToken: string,
  baseUrl?: string
): Promise<FeedComment[]> {
  const payload = await requestFeed(
    `/api/feed/${encodeURIComponent(postId)}/comments`,
    clerkToken,
    {},
    baseUrl
  );
  const comments = Array.isArray(payload.comments) ? (payload.comments as FeedCommentRow[]) : [];
  return comments.map(toFeedComment);
}

export async function createFeedComment(
  postId: string,
  content: string,
  clerkToken: string,
  baseUrl?: string
): Promise<FeedComment> {
  const payload = await requestFeed(
    `/api/feed/${encodeURIComponent(postId)}/comments`,
    clerkToken,
    { method: 'POST', body: JSON.stringify({ content }) },
    baseUrl
  );
  if (!payload.comment) throw new Error('댓글 저장 결과를 확인하지 못했어요.');
  return toFeedComment(payload.comment as FeedCommentRow);
}
