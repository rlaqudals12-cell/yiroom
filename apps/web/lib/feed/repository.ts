/**
 * 피드 Repository
 * 피드 포스트, 인터랙션, 댓글 CRUD
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type {
  FeedPost,
  FeedPostWithAuthor,
  FeedInteraction,
  FeedComment,
  FeedCommentWithAuthor,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  FeedListParams,
  InteractionType,
} from './types';

// ============================================================
// 포스트 CRUD
// ============================================================

/**
 * 피드 목록 조회
 */
export async function getFeedPosts(
  params: FeedListParams = {},
  currentUserId?: string
): Promise<{ posts: FeedPostWithAuthor[]; total: number }> {
  const supabase = createClerkSupabaseClient();
  const { page = 1, limit = 20, post_type, hashtag, user_id } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('feed_posts')
    .select(
      `
      *,
      users!feed_posts_clerk_user_id_fkey (
        name,
        avatar_url
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (post_type) {
    query = query.eq('post_type', post_type);
  }

  if (hashtag) {
    query = query.contains('hashtags', [hashtag]);
  }

  if (user_id) {
    query = query.eq('clerk_user_id', user_id);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Feed] Error fetching posts:', error);
    throw error;
  }

  // 현재 사용자의 좋아요/저장 여부 조회
  let userInteractions: FeedInteraction[] = [];
  if (currentUserId && data && data.length > 0) {
    const postIds = data.map((p) => p.id);
    const { data: interactions } = await supabase
      .from('feed_interactions')
      .select('*')
      .eq('clerk_user_id', currentUserId)
      .in('post_id', postIds);

    userInteractions = interactions || [];
  }

  const posts: FeedPostWithAuthor[] = (data || []).map((post) => {
    const userLike = userInteractions.find(
      (i) => i.post_id === post.id && i.interaction_type === 'like'
    );
    const userSave = userInteractions.find(
      (i) => i.post_id === post.id && i.interaction_type === 'save'
    );

    return {
      ...post,
      author: {
        name: post.users?.name || '익명',
        avatar_url: post.users?.avatar_url || null,
      },
      is_liked: !!userLike,
      is_saved: !!userSave,
    };
  });

  return { posts, total: count || 0 };
}

/**
 * 단일 포스트 조회
 */
export async function getPostById(
  postId: string,
  currentUserId?: string
): Promise<FeedPostWithAuthor | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('feed_posts')
    .select(
      `
      *,
      users!feed_posts_clerk_user_id_fkey (
        name,
        avatar_url
      )
    `
    )
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[Feed] Error fetching post:', error);
    throw error;
  }

  // 현재 사용자의 좋아요/저장 여부 조회
  let isLiked = false;
  let isSaved = false;
  if (currentUserId) {
    const { data: interactions } = await supabase
      .from('feed_interactions')
      .select('interaction_type')
      .eq('post_id', postId)
      .eq('clerk_user_id', currentUserId);

    isLiked = interactions?.some((i) => i.interaction_type === 'like') || false;
    isSaved = interactions?.some((i) => i.interaction_type === 'save') || false;
  }

  return {
    ...data,
    author: {
      name: data.users?.name || '익명',
      avatar_url: data.users?.avatar_url || null,
    },
    is_liked: isLiked,
    is_saved: isSaved,
  };
}

/**
 * 포스트 생성
 */
export async function createPost(userId: string, input: CreatePostInput): Promise<FeedPost> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      clerk_user_id: userId,
      content: input.content,
      media_urls: input.media_urls || [],
      product_ids: input.product_ids || [],
      hashtags: input.hashtags || [],
      post_type: input.post_type || 'general',
    })
    .select()
    .single();

  if (error) {
    console.error('[Feed] Error creating post:', error);
    throw error;
  }

  return data;
}

/**
 * 포스트 수정
 */
export async function updatePost(
  postId: string,
  userId: string,
  input: UpdatePostInput
): Promise<FeedPost> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('feed_posts')
    .update(input)
    .eq('id', postId)
    .eq('clerk_user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Feed] Error updating post:', error);
    throw error;
  }

  return data;
}

/**
 * 포스트 삭제
 */
export async function deletePost(postId: string, userId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase
    .from('feed_posts')
    .delete()
    .eq('id', postId)
    .eq('clerk_user_id', userId);

  if (error) {
    console.error('[Feed] Error deleting post:', error);
    throw error;
  }
}

// ============================================================
// 인터랙션 (좋아요, 저장)
// ============================================================

/**
 * 좋아요/저장 토글
 */
export async function toggleInteraction(
  postId: string,
  userId: string,
  type: InteractionType
): Promise<{ added: boolean }> {
  const supabase = createClerkSupabaseClient();

  // 기존 인터랙션 확인
  const { data: existing } = await supabase
    .from('feed_interactions')
    .select('id')
    .eq('post_id', postId)
    .eq('clerk_user_id', userId)
    .eq('interaction_type', type)
    .single();

  if (existing) {
    // 삭제
    const { error } = await supabase.from('feed_interactions').delete().eq('id', existing.id);

    if (error) throw error;
    return { added: false };
  } else {
    // 추가
    const { error } = await supabase.from('feed_interactions').insert({
      post_id: postId,
      clerk_user_id: userId,
      interaction_type: type,
    });

    if (error) throw error;
    return { added: true };
  }
}

// ============================================================
// 댓글
// ============================================================

/**
 * 포스트의 댓글 목록 조회
 */
export async function getComments(postId: string): Promise<FeedCommentWithAuthor[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('feed_comments')
    .select(
      `
      *,
      users!feed_comments_clerk_user_id_fkey (
        name,
        avatar_url
      )
    `
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Feed] Error fetching comments:', error);
    throw error;
  }

  // 대댓글 구조 변환
  const comments: FeedCommentWithAuthor[] = [];
  const commentMap = new Map<string, FeedCommentWithAuthor>();

  (data || []).forEach((comment) => {
    const formatted: FeedCommentWithAuthor = {
      ...comment,
      author: {
        name: comment.users?.name || '익명',
        avatar_url: comment.users?.avatar_url || null,
      },
      replies: [],
    };
    commentMap.set(comment.id, formatted);
  });

  commentMap.forEach((comment) => {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      }
    } else {
      comments.push(comment);
    }
  });

  return comments;
}

/**
 * 댓글 생성
 */
export async function createComment(
  userId: string,
  input: CreateCommentInput
): Promise<FeedComment> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      post_id: input.post_id,
      clerk_user_id: userId,
      content: input.content,
      parent_id: input.parent_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Feed] Error creating comment:', error);
    throw error;
  }

  return data;
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase
    .from('feed_comments')
    .delete()
    .eq('id', commentId)
    .eq('clerk_user_id', userId);

  if (error) {
    console.error('[Feed] Error deleting comment:', error);
    throw error;
  }
}
