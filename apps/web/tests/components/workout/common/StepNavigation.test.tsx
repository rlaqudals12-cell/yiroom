import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  ChevronLeft: (props: Record<string, unknown>) => (
    <div data-testid="icon-ChevronLeft" {...props} />
  ),
  ChevronRight: (props: Record<string, unknown>) => (
    <div data-testid="icon-ChevronRight" {...props} />
  ),
  Loader2: (props: Record<string, unknown>) => <div data-testid="icon-Loader2" {...props} />,
}));

import StepNavigation from '@/components/workout/common/StepNavigation';

describe('StepNavigation', () => {
  const defaultProps = {
    isFirstStep: false,
    isLastStep: false,
    canProceed: true,
    onPrev: vi.fn(),
    onNext: vi.fn(),
  };

  describe('기본 렌더링', () => {
    it('이전/다음 버튼이 모두 표시된다', () => {
      render(<StepNavigation {...defaultProps} />);
      expect(screen.getByText('이전')).toBeInTheDocument();
      expect(screen.getByText('다음')).toBeInTheDocument();
    });
  });

  describe('첫 번째 단계', () => {
    it('이전 버튼이 표시되지 않는다', () => {
      render(<StepNavigation {...defaultProps} isFirstStep={true} />);
      expect(screen.queryByText('이전')).not.toBeInTheDocument();
    });

    it('다음 버튼만 표시된다', () => {
      render(<StepNavigation {...defaultProps} isFirstStep={true} />);
      expect(screen.getByText('다음')).toBeInTheDocument();
    });
  });

  describe('마지막 단계', () => {
    it('분석 시작 버튼이 표시된다', () => {
      render(<StepNavigation {...defaultProps} isLastStep={true} />);
      expect(screen.getByText('분석 시작')).toBeInTheDocument();
    });

    it('커스텀 submitLabel이 적용된다', () => {
      render(<StepNavigation {...defaultProps} isLastStep={true} submitLabel="결과 확인" />);
      expect(screen.getByText('결과 확인')).toBeInTheDocument();
    });
  });

  describe('진행 불가 상태', () => {
    it('canProceed가 false면 다음 버튼이 비활성화된다', () => {
      render(<StepNavigation {...defaultProps} canProceed={false} />);
      const nextButton = screen.getByLabelText('다음 단계로 이동');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중이면 처리 중 텍스트가 표시된다', () => {
      render(<StepNavigation {...defaultProps} isLoading={true} />);
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });

    it('로딩 중이면 다음 버튼이 비활성화된다', () => {
      render(<StepNavigation {...defaultProps} isLoading={true} />);
      const nextButton = screen.getByLabelText('다음 단계로 이동');
      expect(nextButton).toBeDisabled();
    });

    it('로딩 중이면 이전 버튼도 비활성화된다', () => {
      render(<StepNavigation {...defaultProps} isLoading={true} />);
      const prevButton = screen.getByLabelText('이전 단계로 이동');
      expect(prevButton).toBeDisabled();
    });

    it('로딩 아이콘이 표시된다', () => {
      render(<StepNavigation {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('이벤트 핸들러', () => {
    it('이전 버튼 클릭 시 onPrev가 호출된다', () => {
      const onPrev = vi.fn();
      render(<StepNavigation {...defaultProps} onPrev={onPrev} />);
      fireEvent.click(screen.getByText('이전'));
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('다음 버튼 클릭 시 onNext가 호출된다', () => {
      const onNext = vi.fn();
      render(<StepNavigation {...defaultProps} onNext={onNext} />);
      fireEvent.click(screen.getByText('다음'));
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성', () => {
    it('다음 버튼에 aria-label이 있다', () => {
      render(<StepNavigation {...defaultProps} />);
      expect(screen.getByLabelText('다음 단계로 이동')).toBeInTheDocument();
    });

    it('마지막 단계에서 aria-label이 분석 시작하기이다', () => {
      render(<StepNavigation {...defaultProps} isLastStep={true} />);
      expect(screen.getByLabelText('분석 시작하기')).toBeInTheDocument();
    });

    it('로딩 중이면 aria-busy가 true이다', () => {
      render(<StepNavigation {...defaultProps} isLoading={true} />);
      const nextButton = screen.getByLabelText('다음 단계로 이동');
      expect(nextButton).toHaveAttribute('aria-busy', 'true');
    });

    it('이전 버튼에 aria-label이 있다', () => {
      render(<StepNavigation {...defaultProps} />);
      expect(screen.getByLabelText('이전 단계로 이동')).toBeInTheDocument();
    });
  });

  describe('커스텀 라벨', () => {
    it('커스텀 nextLabel이 적용된다', () => {
      render(<StepNavigation {...defaultProps} nextLabel="계속" />);
      expect(screen.getByText('계속')).toBeInTheDocument();
    });
  });
});
