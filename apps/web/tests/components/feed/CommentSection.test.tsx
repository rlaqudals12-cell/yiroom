import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentSection } from '@/components/feed/CommentSection';
import type { FeedCommentWithAuthor } from '@/lib/feed/types';

// Clerk 모킹
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user-1',
    isSignedIn: true,
  }),
}));

describe('CommentSection', () => {
  const mockComments: FeedCommentWithAuthor[] = [
    {
      id: 'comment-1',
      post_id: 'post-1',
      clerk_user_id: 'user-1',
      content: '좋은 글이에요!',
      parent_id: null,
      likes_count: 0,
      created_at: new Date().toISOString(),
      author: {
        name: '김이룸',
        avatar_url: null,
      },
      replies: [],
    },
    {
      id: 'comment-2',
      post_id: 'post-1',
      clerk_user_id: 'user-2',
      content: '저도 동감합니다',
      parent_id: null,
      likes_count: 0,
      created_at: new Date().toISOString(),
      author: {
        name: '박이룸',
        avatar_url: null,
      },
      replies: [],
    },
  ];

  const mockHandlers = {
    onAddComment: vi.fn(),
    onDeleteComment: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('정상 케이스', () => {
    it('렌더링 성공', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );
      expect(screen.getByTestId('comment-section')).toBeInTheDocument();
    });

    it('댓글 목록 표시', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );
      expect(screen.getByText('좋은 글이에요!')).toBeInTheDocument();
      expect(screen.getByText('저도 동감합니다')).toBeInTheDocument();
    });

    it('작성자 이름 표시', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );
      expect(screen.getByText('김이룸')).toBeInTheDocument();
      expect(screen.getByText('박이룸')).toBeInTheDocument();
    });
  });

  describe('댓글 없을 때', () => {
    it('빈 상태 메시지 표시', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={[]}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );
      expect(screen.getByText('아직 댓글이 없습니다. 첫 댓글을 남겨보세요!')).toBeInTheDocument();
    });
  });

  describe('댓글 작성', () => {
    it('댓글 입력 필드 표시', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );
      expect(screen.getByLabelText('댓글 입력')).toBeInTheDocument();
    });

    it('댓글 입력 시 버튼 활성화', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );
      const textarea = screen.getByLabelText('댓글 입력');
      const submitButton = screen.getByLabelText('댓글 작성');

      expect(submitButton).toBeDisabled();

      fireEvent.change(textarea, { target: { value: '새 댓글입니다' } });
      expect(submitButton).not.toBeDisabled();
    });

    it('댓글 제출 시 onAddComment 호출', async () => {
      mockHandlers.onAddComment.mockResolvedValue(undefined);

      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      const textarea = screen.getByLabelText('댓글 입력');
      const submitButton = screen.getByLabelText('댓글 작성');

      fireEvent.change(textarea, { target: { value: '새 댓글입니다' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onAddComment).toHaveBeenCalledWith('새 댓글입니다', undefined);
      });
    });

    it('제출 후 입력창 초기화', async () => {
      mockHandlers.onAddComment.mockResolvedValue(undefined);

      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      const textarea = screen.getByLabelText('댓글 입력') as HTMLTextAreaElement;
      const submitButton = screen.getByLabelText('댓글 작성');

      fireEvent.change(textarea, { target: { value: '새 댓글입니다' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('공백만 입력 시 제출 불가', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      const textarea = screen.getByLabelText('댓글 입력');
      const submitButton = screen.getByLabelText('댓글 작성');

      fireEvent.change(textarea, { target: { value: '   ' } });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('답글 기능', () => {
    it('답글 버튼 클릭 시 답글 입력창 표시', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      const replyButton = screen.getAllByLabelText('답글 달기')[0];
      fireEvent.click(replyButton);

      expect(screen.getByText(/님에게 답글 작성 중/)).toBeInTheDocument();
    });

    it('답글 취소 버튼 작동', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      const replyButton = screen.getAllByLabelText('답글 달기')[0];
      fireEvent.click(replyButton);

      const cancelButton = screen.getByText('취소');
      fireEvent.click(cancelButton);

      expect(screen.queryByText(/님에게 답글 작성 중/)).not.toBeInTheDocument();
    });

    it('답글 제출 시 parentId 포함', async () => {
      mockHandlers.onAddComment.mockResolvedValue(undefined);

      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      const replyButton = screen.getAllByLabelText('답글 달기')[0];
      fireEvent.click(replyButton);

      const textarea = screen.getByLabelText('답글 입력');
      const submitButton = screen.getByLabelText('댓글 작성');

      fireEvent.change(textarea, { target: { value: '답글입니다' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onAddComment).toHaveBeenCalledWith('답글입니다', 'comment-1');
      });
    });
  });

  describe('대댓글 표시', () => {
    it('대댓글이 있을 때 표시', () => {
      const commentsWithReplies: FeedCommentWithAuthor[] = [
        {
          ...mockComments[0],
          replies: [
            {
              id: 'reply-1',
              post_id: 'post-1',
              clerk_user_id: 'user-3',
              content: '대댓글입니다',
              parent_id: 'comment-1',
              likes_count: 0,
              created_at: new Date().toISOString(),
              author: {
                name: '이이룸',
                avatar_url: null,
              },
              replies: [],
            },
          ],
        },
      ];

      render(
        <CommentSection
          postId="post-1"
          comments={commentsWithReplies}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      expect(screen.getByText('대댓글입니다')).toBeInTheDocument();
      expect(screen.getByText('이이룸')).toBeInTheDocument();
    });

    it('대댓글에 답글 버튼 미표시', () => {
      const commentsWithReplies: FeedCommentWithAuthor[] = [
        {
          ...mockComments[0],
          replies: [
            {
              id: 'reply-1',
              post_id: 'post-1',
              clerk_user_id: 'user-3',
              content: '대댓글입니다',
              parent_id: 'comment-1',
              likes_count: 0,
              created_at: new Date().toISOString(),
              author: {
                name: '이이룸',
                avatar_url: null,
              },
              replies: [],
            },
          ],
        },
      ];

      render(
        <CommentSection
          postId="post-1"
          comments={commentsWithReplies}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      // 원댓글에는 답글 버튼 있음
      const replyButtons = screen.getAllByLabelText('답글 달기');
      expect(replyButtons).toHaveLength(1);
    });
  });

  describe('댓글 삭제', () => {
    it('본인 댓글에 삭제 버튼 표시', () => {
      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      // 첫 번째 댓글(user-1)은 본인 댓글
      const commentItems = screen.getAllByTestId('comment-item');
      expect(commentItems[0]).toBeInTheDocument();
    });

    it('삭제 버튼 클릭 시 onDeleteComment 호출', async () => {
      mockHandlers.onDeleteComment.mockResolvedValue(undefined);

      render(
        <CommentSection
          postId="post-1"
          comments={mockComments}
          onAddComment={mockHandlers.onAddComment}
          onDeleteComment={mockHandlers.onDeleteComment}
        />
      );

      const deleteButton = screen.getByLabelText('댓글 삭제');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockHandlers.onDeleteComment).toHaveBeenCalledWith('comment-1');
      });
    });
  });
});
