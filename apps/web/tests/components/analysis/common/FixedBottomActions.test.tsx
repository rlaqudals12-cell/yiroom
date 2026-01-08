import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ...actual,
    RefreshCw: createMockIcon('RefreshCw'),
    Share2: createMockIcon('Share2'),
  };
});

// ShareButton mock
vi.mock('@/components/share', () => ({
  ShareButton: ({
    onShare,
    loading,
    variant,
  }: {
    onShare: () => Promise<void>;
    loading: boolean;
    variant: string;
  }) => (
    <button
      data-testid="share-button"
      data-loading={loading}
      data-variant={variant}
      onClick={onShare}
    >
      공유
    </button>
  ),
}));

import { FixedBottomActions } from '@/components/analysis/common/FixedBottomActions';

describe('FixedBottomActions', () => {
  const mockOnRetry = vi.fn();
  const mockOnShare = vi.fn().mockResolvedValue(undefined);
  const mockPrimaryAction = {
    label: '제품 추천 보기',
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} />);

      expect(screen.getByTestId('fixed-bottom-actions')).toBeInTheDocument();
    });

    it('다시 분석하기 버튼이 기본적으로 표시된다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} />);

      expect(screen.getByText('다시 분석하기')).toBeInTheDocument();
      expect(screen.getByTestId('icon-RefreshCw')).toBeInTheDocument();
    });

    it('커스텀 retryLabel을 표시한다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} retryLabel="재촬영하기" />);

      expect(screen.getByText('재촬영하기')).toBeInTheDocument();
    });

    it('커스텀 className을 적용한다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} className="custom-class" />);

      expect(screen.getByTestId('fixed-bottom-actions')).toHaveClass('custom-class');
    });
  });

  describe('다시 분석하기 버튼', () => {
    it('클릭 시 onRetry가 호출된다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} />);

      fireEvent.click(screen.getByText('다시 분석하기'));
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('primaryAction이 있으면 outline variant로 표시된다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} primaryAction={mockPrimaryAction} />);

      const retryButton = screen.getByText('다시 분석하기').closest('button');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('공유 버튼', () => {
    it('showShare=true이고 onShare가 있으면 공유 버튼을 표시한다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} onShare={mockOnShare} showShare={true} />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('showShare=false이면 공유 버튼을 표시하지 않는다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} onShare={mockOnShare} showShare={false} />);

      expect(screen.queryByTestId('share-button')).not.toBeInTheDocument();
    });

    it('onShare가 없으면 공유 버튼을 표시하지 않는다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} showShare={true} />);

      expect(screen.queryByTestId('share-button')).not.toBeInTheDocument();
    });

    it('shareLoading 상태가 ShareButton에 전달된다', () => {
      render(
        <FixedBottomActions onRetry={mockOnRetry} onShare={mockOnShare} shareLoading={true} />
      );

      expect(screen.getByTestId('share-button')).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('주요 액션 버튼', () => {
    it('primaryAction이 있으면 주요 액션 버튼을 표시한다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} primaryAction={mockPrimaryAction} />);

      expect(screen.getByText('제품 추천 보기')).toBeInTheDocument();
    });

    it('primaryAction 클릭 시 onClick이 호출된다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} primaryAction={mockPrimaryAction} />);

      fireEvent.click(screen.getByText('제품 추천 보기'));
      expect(mockPrimaryAction.onClick).toHaveBeenCalledTimes(1);
    });

    it('primaryAction에 아이콘이 있으면 표시된다', () => {
      const actionWithIcon = {
        ...mockPrimaryAction,
        icon: <span data-testid="primary-icon">🎁</span>,
      };

      render(<FixedBottomActions onRetry={mockOnRetry} primaryAction={actionWithIcon} />);

      expect(screen.getByTestId('primary-icon')).toBeInTheDocument();
    });

    it('primaryAction이 없으면 주요 액션 버튼을 표시하지 않는다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} />);

      expect(screen.queryByText('제품 추천 보기')).not.toBeInTheDocument();
    });
  });

  describe('레이아웃', () => {
    it('모든 요소가 함께 렌더링된다', () => {
      render(
        <FixedBottomActions
          onRetry={mockOnRetry}
          onShare={mockOnShare}
          showShare={true}
          primaryAction={mockPrimaryAction}
        />
      );

      expect(screen.getByText('제품 추천 보기')).toBeInTheDocument();
      expect(screen.getByText('다시 분석하기')).toBeInTheDocument();
      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('fixed positioning 클래스가 적용된다', () => {
      render(<FixedBottomActions onRetry={mockOnRetry} />);

      const container = screen.getByTestId('fixed-bottom-actions');
      expect(container).toHaveClass('fixed');
      expect(container).toHaveClass('bottom-20');
    });
  });
});
