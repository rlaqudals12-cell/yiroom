import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewForm, ReviewPromptCard } from '@/components/products/reviews/ReviewForm';
import type { ProductReview } from '@/types/review';

// StarRating 모킹
vi.mock('@/components/products/reviews/StarRating', () => ({
  StarRating: ({
    rating,
    editable,
    onChange,
  }: {
    rating: number;
    size?: string;
    editable?: boolean;
    onChange?: (rating: number) => void;
  }) => (
    <div data-testid="star-rating">
      {editable ? (
        <div>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              data-testid={`star-${star}`}
              onClick={() => onChange?.(star)}
              className={star <= rating ? 'filled' : ''}
            >
              ★
            </button>
          ))}
        </div>
      ) : (
        <span>{rating}점</span>
      )}
    </div>
  ),
}));

// getRatingText 모킹
vi.mock('@/lib/products/services/reviews', () => ({
  getRatingText: vi.fn((rating: number) => {
    const texts: Record<number, string> = {
      1: '별로예요',
      2: '그저 그래요',
      3: '보통이에요',
      4: '좋아요',
      5: '최고예요',
    };
    return texts[rating] || '';
  }),
}));

// Mock 리뷰 (수정용)
const mockReview: ProductReview = {
  id: 'review-1',
  clerkUserId: 'user-123',
  productType: 'cosmetic',
  productId: 'product-1',
  rating: 4,
  title: '기존 제목',
  content: '기존 내용입니다.',
  helpfulCount: 0,
  verifiedPurchase: false,
  createdAt: '2025-12-20T10:00:00Z',
  updatedAt: '2025-12-20T10:00:00Z',
};

describe('ReviewForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('기본 렌더링', () => {
    it('폼 컨테이너 렌더링', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    it('별점 선택 영역 표시', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('별점을 선택해 주세요')).toBeInTheDocument();
      expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    });

    it('제목 입력 필드 표시', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('리뷰 제목을 입력해 주세요')).toBeInTheDocument();
    });

    it('내용 입력 필드 표시', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/내용/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('제품 사용 후기를 자유롭게 작성해 주세요')).toBeInTheDocument();
    });

    it('등록 버튼 표시', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: '등록' })).toBeInTheDocument();
    });

    it('글자수 카운터 표시', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('0/1000')).toBeInTheDocument();
    });
  });

  describe('취소 버튼', () => {
    it('onCancel 있으면 취소 버튼 표시', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('onCancel 없으면 취소 버튼 미표시', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
    });

    it('취소 버튼 클릭 시 onCancel 호출', async () => {
      render(<ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByRole('button', { name: '취소' }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('수정 모드', () => {
    it('기존 리뷰 데이터로 초기화', () => {
      render(<ReviewForm review={mockReview} onSubmit={mockOnSubmit} />);

      expect(screen.getByDisplayValue('기존 제목')).toBeInTheDocument();
      expect(screen.getByDisplayValue('기존 내용입니다.')).toBeInTheDocument();
    });

    it('수정 버튼 표시', () => {
      render(<ReviewForm review={mockReview} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    });
  });

  describe('별점 선택', () => {
    it('기본 별점 5점', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('최고예요')).toBeInTheDocument();
    });

    it('별점 클릭 시 변경', async () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      fireEvent.click(screen.getByTestId('star-3'));

      await waitFor(() => {
        expect(screen.getByText('보통이에요')).toBeInTheDocument();
      });
    });
  });

  describe('폼 제출', () => {
    it('기본 값으로 제출', async () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: '등록' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          rating: 5,
          title: undefined,
          content: undefined,
        });
      });
    });

    it('제목과 내용 입력 후 제출', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByPlaceholderText('리뷰 제목을 입력해 주세요'), '훌륭한 제품');
      await user.type(screen.getByPlaceholderText('제품 사용 후기를 자유롭게 작성해 주세요'), '정말 좋습니다');

      fireEvent.click(screen.getByRole('button', { name: '등록' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          rating: 5,
          title: '훌륭한 제품',
          content: '정말 좋습니다',
        });
      });
    });

    it('공백만 있는 제목/내용은 undefined로 전송', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByPlaceholderText('리뷰 제목을 입력해 주세요'), '   ');
      await user.type(screen.getByPlaceholderText('제품 사용 후기를 자유롭게 작성해 주세요'), '   ');

      fireEvent.click(screen.getByRole('button', { name: '등록' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          rating: 5,
          title: undefined,
          content: undefined,
        });
      });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중 버튼 텍스트 변경', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByRole('button', { name: '등록 중...' })).toBeInTheDocument();
    });

    it('로딩 중 입력 필드 비활성화', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByPlaceholderText('리뷰 제목을 입력해 주세요')).toBeDisabled();
      expect(screen.getByPlaceholderText('제품 사용 후기를 자유롭게 작성해 주세요')).toBeDisabled();
    });

    it('로딩 중 버튼 비활성화', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByRole('button', { name: '등록 중...' })).toBeDisabled();
    });
  });

  describe('에러 처리', () => {
    it('제출 실패 시 에러 메시지 표시', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Failed'));
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: '등록' }));

      await waitFor(() => {
        expect(screen.getByText('리뷰 등록에 실패했습니다. 다시 시도해 주세요.')).toBeInTheDocument();
      });
    });
  });

  describe('글자수 제한', () => {
    it('제목 최대 100자', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText('리뷰 제목을 입력해 주세요');
      expect(titleInput).toHaveAttribute('maxLength', '100');
    });

    it('내용 최대 1000자', () => {
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      const contentInput = screen.getByPlaceholderText('제품 사용 후기를 자유롭게 작성해 주세요');
      expect(contentInput).toHaveAttribute('maxLength', '1000');
    });

    it('내용 입력 시 글자수 업데이트', async () => {
      const user = userEvent.setup();
      render(<ReviewForm onSubmit={mockOnSubmit} />);

      const contentInput = screen.getByPlaceholderText('제품 사용 후기를 자유롭게 작성해 주세요');
      await user.type(contentInput, 'hello');

      // 글자수가 0에서 변경되었는지 확인
      expect(screen.queryByText('0/1000')).not.toBeInTheDocument();
    });
  });
});

describe('ReviewPromptCard', () => {
  it('제목 표시', () => {
    render(<ReviewPromptCard onWrite={vi.fn()} />);

    expect(screen.getByText('이 제품을 사용해 보셨나요?')).toBeInTheDocument();
  });

  it('설명 표시', () => {
    render(<ReviewPromptCard onWrite={vi.fn()} />);

    expect(screen.getByText('다른 사용자들에게 도움이 되는 리뷰를 남겨주세요')).toBeInTheDocument();
  });

  it('리뷰 작성하기 버튼 표시', () => {
    render(<ReviewPromptCard onWrite={vi.fn()} />);

    expect(screen.getByRole('button', { name: '리뷰 작성하기' })).toBeInTheDocument();
  });

  it('버튼 클릭 시 onWrite 호출', () => {
    const onWrite = vi.fn();
    render(<ReviewPromptCard onWrite={onWrite} />);

    fireEvent.click(screen.getByRole('button', { name: '리뷰 작성하기' }));

    expect(onWrite).toHaveBeenCalled();
  });
});
