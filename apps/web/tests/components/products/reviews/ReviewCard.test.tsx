import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewCard, ReviewCardSkeleton } from '@/components/products/reviews/ReviewCard';
import type { ProductReview } from '@/types/review';

// date-fns 모킹 (일관된 시간 표시)
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '3일 전'),
}));

vi.mock('date-fns/locale', () => ({
  ko: {},
}));

// Mock 리뷰 데이터
const mockReview: ProductReview = {
  id: 'review-1',
  clerkUserId: 'user-123',
  productType: 'cosmetic',
  productId: 'product-1',
  rating: 4,
  title: '좋은 제품이에요',
  content: '피부에 자극 없이 잘 흡수됩니다. 향도 은은해서 좋아요.',
  helpfulCount: 12,
  verifiedPurchase: true,
  createdAt: '2025-12-20T10:00:00Z',
  updatedAt: '2025-12-20T10:00:00Z',
  user: {
    name: '홍길동',
  },
  isHelpfulByMe: false,
};

describe('ReviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('리뷰 카드 컨테이너 렌더링', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByTestId('review-card')).toBeInTheDocument();
    });

    it('사용자 이름 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('사용자 이름 첫 글자 아바타 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('홍')).toBeInTheDocument();
    });

    it('익명 사용자 표시', () => {
      const anonymousReview = { ...mockReview, user: undefined };
      render(<ReviewCard review={anonymousReview} />);

      expect(screen.getByText('익명')).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('리뷰 제목 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('좋은 제품이에요')).toBeInTheDocument();
    });

    it('리뷰 내용 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText(/피부에 자극 없이 잘 흡수됩니다/)).toBeInTheDocument();
    });

    it('작성 시간 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('3일 전')).toBeInTheDocument();
    });
  });

  describe('구매 인증 배지', () => {
    it('구매 인증된 리뷰에 배지 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('구매 인증')).toBeInTheDocument();
    });

    it('구매 인증되지 않은 리뷰에 배지 미표시', () => {
      const unverifiedReview = { ...mockReview, verifiedPurchase: false };
      render(<ReviewCard review={unverifiedReview} />);

      expect(screen.queryByText('구매 인증')).not.toBeInTheDocument();
    });
  });

  describe('도움됨 버튼', () => {
    it('도움됨 버튼 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('도움됨')).toBeInTheDocument();
    });

    it('도움됨 카운트 표시', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('(12)')).toBeInTheDocument();
    });

    it('카운트가 0이면 숫자 미표시', () => {
      const reviewWithNoHelpful = { ...mockReview, helpfulCount: 0 };
      render(<ReviewCard review={reviewWithNoHelpful} />);

      expect(screen.queryByText('(0)')).not.toBeInTheDocument();
    });

    it('로그인하지 않으면 도움됨 버튼 비활성화', () => {
      render(<ReviewCard review={mockReview} />);

      const helpfulButton = screen.getByRole('button', { name: /도움됨/ });
      expect(helpfulButton).toBeDisabled();
    });

    it('본인 리뷰에는 도움됨 버튼 비활성화', () => {
      render(
        <ReviewCard
          review={mockReview}
          currentUserId="user-123"
          onHelpful={vi.fn()}
        />
      );

      const helpfulButton = screen.getByRole('button', { name: /도움됨/ });
      expect(helpfulButton).toBeDisabled();
    });

    it('다른 사용자 리뷰에 도움됨 버튼 활성화', () => {
      render(
        <ReviewCard
          review={mockReview}
          currentUserId="other-user"
          onHelpful={vi.fn()}
        />
      );

      const helpfulButton = screen.getByRole('button', { name: /도움됨/ });
      expect(helpfulButton).not.toBeDisabled();
    });

    it('도움됨 버튼 클릭 시 낙관적 업데이트', async () => {
      const onHelpful = vi.fn().mockResolvedValue(undefined);

      render(
        <ReviewCard
          review={mockReview}
          currentUserId="other-user"
          onHelpful={onHelpful}
        />
      );

      const helpfulButton = screen.getByRole('button', { name: /도움됨/ });
      fireEvent.click(helpfulButton);

      // 낙관적으로 카운트 증가
      await waitFor(() => {
        expect(screen.getByText('(13)')).toBeInTheDocument();
      });

      expect(onHelpful).toHaveBeenCalledWith('review-1', true);
    });

    it('도움됨 취소 시 카운트 감소', async () => {
      const helpfulReview = { ...mockReview, isHelpfulByMe: true };
      const onHelpful = vi.fn().mockResolvedValue(undefined);

      render(
        <ReviewCard
          review={helpfulReview}
          currentUserId="other-user"
          onHelpful={onHelpful}
        />
      );

      const helpfulButton = screen.getByRole('button', { name: /도움됨/ });
      fireEvent.click(helpfulButton);

      await waitFor(() => {
        expect(screen.getByText('(11)')).toBeInTheDocument();
      });

      expect(onHelpful).toHaveBeenCalledWith('review-1', false);
    });
  });

  describe('더보기 메뉴 (본인 리뷰)', () => {
    it('본인 리뷰에 더보기 메뉴 표시', () => {
      render(
        <ReviewCard
          review={mockReview}
          currentUserId="user-123"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // 버튼 이름에 아이콘 텍스트 포함
      expect(screen.getByRole('button', { name: /더보기/ })).toBeInTheDocument();
    });

    it('다른 사용자 리뷰에 더보기 메뉴 미표시', () => {
      render(
        <ReviewCard
          review={mockReview}
          currentUserId="other-user"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // aria-haspopup="menu" 버튼이 없어야 함
      expect(screen.queryByRole('button', { name: /더보기/ })).not.toBeInTheDocument();
    });

    it('핸들러 없으면 더보기 메뉴 미표시', () => {
      render(
        <ReviewCard
          review={mockReview}
          currentUserId="user-123"
        />
      );

      expect(screen.queryByRole('button', { name: /더보기/ })).not.toBeInTheDocument();
    });
  });

  describe('제목/내용 없는 경우', () => {
    it('제목 없으면 제목 미표시', () => {
      const reviewWithoutTitle = { ...mockReview, title: undefined };
      render(<ReviewCard review={reviewWithoutTitle} />);

      expect(screen.queryByText('좋은 제품이에요')).not.toBeInTheDocument();
    });

    it('내용 없으면 내용 미표시', () => {
      const reviewWithoutContent = { ...mockReview, content: undefined };
      render(<ReviewCard review={reviewWithoutContent} />);

      expect(screen.queryByText(/피부에 자극 없이/)).not.toBeInTheDocument();
    });
  });
});

describe('ReviewCardSkeleton', () => {
  it('스켈레톤 렌더링', () => {
    const { container } = render(<ReviewCardSkeleton />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
