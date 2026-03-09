import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedCard } from '@/components/feed/FeedCard';
import type { FeedPostWithAuthor } from '@/lib/feed/types';

// useRouter 모킹
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('FeedCard', () => {
  const mockPost: FeedPostWithAuthor = {
    id: 'post-1',
    clerk_user_id: 'user-1',
    content: '오늘 운동 정말 힘들었어요! 💪',
    post_type: 'general',
    media_urls: [],
    product_ids: [],
    hashtags: ['운동', '건강'],
    likes_count: 10,
    comments_count: 5,
    saves_count: 2,
    is_liked: false,
    is_saved: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: {
      name: '김이룸',
      avatar_url: null,
    },
  };

  const mockHandlers = {
    onLike: vi.fn(),
    onSave: vi.fn(),
    onShare: vi.fn(),
    onDelete: vi.fn(),
  };

  describe('정상 케이스', () => {
    it('렌더링 성공', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByTestId('feed-card')).toBeInTheDocument();
    });

    it('작성자 정보 표시', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText('김이룸')).toBeInTheDocument();
    });

    it('콘텐츠 표시', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText(/오늘 운동 정말 힘들었어요/)).toBeInTheDocument();
    });

    it('해시태그 표시', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText('#운동')).toBeInTheDocument();
      expect(screen.getByText('#건강')).toBeInTheDocument();
    });

    it('좋아요 수 표시', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('댓글 수 표시', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('좋아요 인터랙션', () => {
    it('좋아요 클릭 시 onLike 호출', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      const likeButton = screen.getByLabelText('좋아요');
      fireEvent.click(likeButton);
      expect(mockHandlers.onLike).toHaveBeenCalledWith('post-1');
    });

    it('좋아요된 상태 표시', () => {
      const likedPost = { ...mockPost, is_liked: true };
      render(
        <FeedCard post={likedPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      const likeButton = screen.getByLabelText('좋아요 취소');
      expect(likeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('저장 인터랙션', () => {
    it('저장 클릭 시 onSave 호출', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      const saveButton = screen.getByLabelText('저장');
      fireEvent.click(saveButton);
      expect(mockHandlers.onSave).toHaveBeenCalledWith('post-1');
    });

    it('저장된 상태 표시', () => {
      const savedPost = { ...mockPost, is_saved: true };
      render(
        <FeedCard post={savedPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      const saveButton = screen.getByLabelText('저장 취소');
      expect(saveButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('공유 인터랙션', () => {
    it('공유 버튼 클릭 시 onShare 호출', () => {
      render(
        <FeedCard
          post={mockPost}
          onLike={mockHandlers.onLike}
          onSave={mockHandlers.onSave}
          onShare={mockHandlers.onShare}
        />
      );
      const shareButton = screen.getByLabelText('공유하기');
      fireEvent.click(shareButton);
      expect(mockHandlers.onShare).toHaveBeenCalledWith(mockPost);
    });
  });

  describe('본인 게시물', () => {
    it('본인 게시물에 더보기 메뉴 표시', () => {
      render(
        <FeedCard
          post={mockPost}
          onLike={mockHandlers.onLike}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          isOwnPost={true}
        />
      );
      expect(screen.getByRole('button', { name: /더보기/ })).toBeInTheDocument();
    });

    it('타인 게시물에도 더보기 메뉴 표시 (신고/차단)', () => {
      render(
        <FeedCard
          post={mockPost}
          onLike={mockHandlers.onLike}
          onSave={mockHandlers.onSave}
          isOwnPost={false}
        />
      );
      expect(screen.getByRole('button', { name: /더보기/ })).toBeInTheDocument();
    });
  });

  describe('미디어 이미지', () => {
    it('이미지 없을 때 미표시', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.queryByAltText(/이미지/)).not.toBeInTheDocument();
    });

    it('이미지 1개일 때 표시', () => {
      const postWithImage = {
        ...mockPost,
        media_urls: ['https://example.com/image1.jpg'],
      };
      render(
        <FeedCard post={postWithImage} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByAltText('이미지 1')).toBeInTheDocument();
    });

    it('이미지 4개 초과 시 오버레이 표시', () => {
      const postWithManyImages = {
        ...mockPost,
        media_urls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
          'https://example.com/6.jpg',
        ],
      };
      render(
        <FeedCard
          post={postWithManyImages}
          onLike={mockHandlers.onLike}
          onSave={mockHandlers.onSave}
        />
      );
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  describe('포스트 타입', () => {
    it('일반 타입 배지 표시', () => {
      render(
        <FeedCard post={mockPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText('일반')).toBeInTheDocument();
    });

    it('리뷰 타입 배지 표시', () => {
      const reviewPost = { ...mockPost, post_type: 'review' as const };
      render(
        <FeedCard post={reviewPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText('리뷰')).toBeInTheDocument();
    });

    it('질문 타입 배지 표시', () => {
      const questionPost = { ...mockPost, post_type: 'question' as const };
      render(
        <FeedCard post={questionPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />
      );
      expect(screen.getByText('질문')).toBeInTheDocument();
    });

    it('팁 타입 배지 표시', () => {
      const tipPost = { ...mockPost, post_type: 'tip' as const };
      render(<FeedCard post={tipPost} onLike={mockHandlers.onLike} onSave={mockHandlers.onSave} />);
      expect(screen.getByText('팁')).toBeInTheDocument();
    });
  });
});
