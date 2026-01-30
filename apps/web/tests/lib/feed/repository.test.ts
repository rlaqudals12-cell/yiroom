/**
 * 피드 Repository 테스트
 *
 * @module tests/lib/feed/repository
 * @description 피드 포스트, 인터랙션, 댓글 CRUD 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFeedPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleInteraction,
  getComments,
  createComment,
  deleteComment,
} from '@/lib/feed/repository';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(),
}));

import { createClerkSupabaseClient } from '@/lib/supabase/server';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockUserId = 'user_123';
const mockPostId = 'post_001';
const mockCommentId = 'comment_001';

const mockPost = {
  id: mockPostId,
  clerk_user_id: mockUserId,
  content: '테스트 포스트입니다',
  media_urls: ['https://example.com/image.jpg'],
  product_ids: ['product_001'],
  hashtags: ['테스트', '뷰티'],
  post_type: 'general',
  likes_count: 10,
  comments_count: 5,
  saves_count: 3,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  users: {
    name: 'TestUser',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

const mockComment = {
  id: mockCommentId,
  post_id: mockPostId,
  clerk_user_id: mockUserId,
  content: '좋은 글이네요!',
  parent_id: null,
  likes_count: 2,
  created_at: '2026-01-15T11:00:00Z',
  users: {
    name: 'TestUser',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

const mockInteraction = {
  id: 'interaction_001',
  post_id: mockPostId,
  clerk_user_id: mockUserId,
  interaction_type: 'like',
  created_at: '2026-01-15T12:00:00Z',
};

// =============================================================================
// 테스트
// =============================================================================

describe('lib/feed/repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getFeedPosts
  // ---------------------------------------------------------------------------

  describe('getFeedPosts', () => {
    it('should return feed posts with pagination', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [mockPost],
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getFeedPosts({ page: 1, limit: 20 });

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.posts[0].author.name).toBe('TestUser');
    });

    it('should filter posts by post_type', async () => {
      const selectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [mockPost],
              error: null,
              count: 1,
            }),
          }),
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: selectMock,
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getFeedPosts({ post_type: 'review' });

      expect(result.posts).toHaveLength(1);
    });

    it('should filter posts by hashtag', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockReturnValue({
                contains: vi.fn().mockResolvedValue({
                  data: [mockPost],
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getFeedPosts({ hashtag: '뷰티' });

      expect(result.posts).toHaveLength(1);
    });

    it('should filter posts by user_id', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [mockPost],
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getFeedPosts({ user_id: mockUserId });

      expect(result.posts).toHaveLength(1);
    });

    it('should include user interaction status when currentUserId provided', async () => {
      const mockSupabase = {
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [mockPost],
                  error: null,
                  count: 1,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockInteraction],
                  error: null,
                }),
              }),
            }),
          }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getFeedPosts({}, mockUserId);

      expect(result.posts[0].is_liked).toBe(true);
      expect(result.posts[0].is_saved).toBe(false);
    });

    it('should throw error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(getFeedPosts()).rejects.toEqual({ message: 'DB error' });
    });

    it('should return empty posts when no data', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getFeedPosts();

      expect(result.posts).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle anonymous author', async () => {
      const postWithNoUser = { ...mockPost, users: null };
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [postWithNoUser],
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getFeedPosts();

      expect(result.posts[0].author.name).toBe('익명');
      expect(result.posts[0].author.avatar_url).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getPostById
  // ---------------------------------------------------------------------------

  describe('getPostById', () => {
    it('should return post by id', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPost,
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getPostById(mockPostId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockPostId);
      expect(result?.author.name).toBe('TestUser');
    });

    it('should return null when post not found (PGRST116)', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getPostById('non_existent');

      expect(result).toBeNull();
    });

    it('should throw error on other DB errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST500', message: 'Server error' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(getPostById(mockPostId)).rejects.toEqual({
        code: 'PGRST500',
        message: 'Server error',
      });
    });

    it('should include user interaction status when currentUserId provided', async () => {
      const mockSupabase = {
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPost,
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ interaction_type: 'like' }, { interaction_type: 'save' }],
                  error: null,
                }),
              }),
            }),
          }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getPostById(mockPostId, mockUserId);

      expect(result?.is_liked).toBe(true);
      expect(result?.is_saved).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // createPost
  // ---------------------------------------------------------------------------

  describe('createPost', () => {
    it('should create a new post', async () => {
      const newPost = { ...mockPost };
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: newPost,
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await createPost(mockUserId, {
        content: '테스트 포스트입니다',
        hashtags: ['테스트', '뷰티'],
      });

      expect(result.id).toBe(mockPostId);
      expect(result.content).toBe('테스트 포스트입니다');
    });

    it('should create post with all optional fields', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPost,
            error: null,
          }),
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await createPost(mockUserId, {
        content: '테스트',
        media_urls: ['https://example.com/img.jpg'],
        product_ids: ['product_001'],
        hashtags: ['테스트'],
        post_type: 'review',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          clerk_user_id: mockUserId,
          content: '테스트',
          post_type: 'review',
        })
      );
    });

    it('should throw error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(createPost(mockUserId, { content: '테스트' })).rejects.toEqual({
        message: 'Insert failed',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updatePost
  // ---------------------------------------------------------------------------

  describe('updatePost', () => {
    it('should update post content', async () => {
      const updatedPost = { ...mockPost, content: '수정된 내용' };
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedPost,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await updatePost(mockPostId, mockUserId, { content: '수정된 내용' });

      expect(result.content).toBe('수정된 내용');
    });

    it('should update post hashtags', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockPost, hashtags: ['새로운', '해시태그'] },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: updateMock,
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await updatePost(mockPostId, mockUserId, { hashtags: ['새로운', '해시태그'] });

      expect(updateMock).toHaveBeenCalledWith({ hashtags: ['새로운', '해시태그'] });
    });

    it('should throw error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Update failed' },
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(updatePost(mockPostId, mockUserId, { content: '수정' })).rejects.toEqual({
        message: 'Update failed',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deletePost
  // ---------------------------------------------------------------------------

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(deletePost(mockPostId, mockUserId)).resolves.toBeUndefined();
    });

    it('should throw error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: 'Delete failed' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(deletePost(mockPostId, mockUserId)).rejects.toEqual({
        message: 'Delete failed',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // toggleInteraction
  // ---------------------------------------------------------------------------

  describe('toggleInteraction', () => {
    it('should add like when not exists', async () => {
      const mockSupabase = {
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockResolvedValue({ error: null }),
          }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await toggleInteraction(mockPostId, mockUserId, 'like');

      expect(result.added).toBe(true);
    });

    it('should remove like when exists', async () => {
      const mockSupabase = {
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'interaction_001' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await toggleInteraction(mockPostId, mockUserId, 'like');

      expect(result.added).toBe(false);
    });

    it('should toggle save interaction', async () => {
      const mockSupabase = {
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockResolvedValue({ error: null }),
          }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await toggleInteraction(mockPostId, mockUserId, 'save');

      expect(result.added).toBe(true);
    });

    it('should throw error on insert failure', async () => {
      const mockSupabase = {
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
          }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(toggleInteraction(mockPostId, mockUserId, 'like')).rejects.toEqual({
        message: 'Insert failed',
      });
    });

    it('should throw error on delete failure', async () => {
      const mockSupabase = {
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'interaction_001' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
            }),
          }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(toggleInteraction(mockPostId, mockUserId, 'like')).rejects.toEqual({
        message: 'Delete failed',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getComments
  // ---------------------------------------------------------------------------

  describe('getComments', () => {
    it('should return comments with author info', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockComment],
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getComments(mockPostId);

      expect(result).toHaveLength(1);
      expect(result[0].author.name).toBe('TestUser');
      expect(result[0].content).toBe('좋은 글이네요!');
    });

    it('should nest replies under parent comments', async () => {
      const parentComment = { ...mockComment, id: 'comment_parent' };
      const replyComment = {
        ...mockComment,
        id: 'comment_reply',
        parent_id: 'comment_parent',
        content: '대댓글입니다',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [parentComment, replyComment],
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getComments(mockPostId);

      expect(result).toHaveLength(1); // parent만 최상위에
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies?.[0].content).toBe('대댓글입니다');
    });

    it('should handle multiple nested replies', async () => {
      const parent1 = { ...mockComment, id: 'parent_1' };
      const parent2 = { ...mockComment, id: 'parent_2', content: '두번째 댓글' };
      const reply1 = {
        ...mockComment,
        id: 'reply_1',
        parent_id: 'parent_1',
        content: '첫번째 대댓글',
      };
      const reply2 = {
        ...mockComment,
        id: 'reply_2',
        parent_id: 'parent_1',
        content: '두번째 대댓글',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [parent1, parent2, reply1, reply2],
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getComments(mockPostId);

      expect(result).toHaveLength(2); // 2개의 최상위 댓글
      expect(result[0].replies).toHaveLength(2); // 첫번째 댓글에 2개의 대댓글
      expect(result[1].replies).toHaveLength(0); // 두번째 댓글에는 대댓글 없음
    });

    it('should return empty array when no comments', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getComments(mockPostId);

      expect(result).toEqual([]);
    });

    it('should throw error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(getComments(mockPostId)).rejects.toEqual({ message: 'DB error' });
    });

    it('should handle anonymous author in comments', async () => {
      const commentWithNoUser = { ...mockComment, users: null };
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [commentWithNoUser],
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await getComments(mockPostId);

      expect(result[0].author.name).toBe('익명');
      expect(result[0].author.avatar_url).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // createComment
  // ---------------------------------------------------------------------------

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockComment,
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await createComment(mockUserId, {
        post_id: mockPostId,
        content: '좋은 글이네요!',
      });

      expect(result.id).toBe(mockCommentId);
      expect(result.content).toBe('좋은 글이네요!');
    });

    it('should create a reply comment', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockComment, parent_id: 'parent_001' },
            error: null,
          }),
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await createComment(mockUserId, {
        post_id: mockPostId,
        content: '대댓글입니다',
        parent_id: 'parent_001',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_id: 'parent_001',
        })
      );
      expect(result.parent_id).toBe('parent_001');
    });

    it('should throw error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(
        createComment(mockUserId, { post_id: mockPostId, content: '댓글' })
      ).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteComment
  // ---------------------------------------------------------------------------

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(deleteComment(mockCommentId, mockUserId)).resolves.toBeUndefined();
    });

    it('should throw error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: 'Delete failed' },
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await expect(deleteComment(mockCommentId, mockUserId)).rejects.toEqual({
        message: 'Delete failed',
      });
    });
  });
});
