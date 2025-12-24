import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialStep } from '@/components/onboarding/TutorialStep';
import type { TutorialStep as TutorialStepType } from '@/hooks/useOnboardingTutorial';

const mockStep: TutorialStepType = {
  id: 'test-step',
  title: '테스트 스텝',
  description: '이것은 테스트 스텝입니다.',
  position: 'bottom',
};

const defaultProps = {
  step: mockStep,
  stepIndex: 0,
  totalSteps: 5,
  onNext: vi.fn(),
  onPrev: vi.fn(),
  onSkip: vi.fn(),
  onComplete: vi.fn(),
};

describe('TutorialStep', () => {
  describe('렌더링', () => {
    it('카드가 렌더링됨', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step-card')).toBeInTheDocument();
    });

    it('오버레이가 렌더링됨', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
    });

    it('제목이 표시됨', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByText('테스트 스텝')).toBeInTheDocument();
    });

    it('설명이 표시됨', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByText('이것은 테스트 스텝입니다.')).toBeInTheDocument();
    });

    it('진행률 인디케이터가 표시됨', () => {
      render(<TutorialStep {...defaultProps} />);

      const card = screen.getByTestId('tutorial-step-card');
      const indicators = card.querySelectorAll('.rounded-full');
      expect(indicators.length).toBe(5);
    });
  });

  describe('첫 번째 스텝', () => {
    it('이전 버튼이 없음', () => {
      render(<TutorialStep {...defaultProps} stepIndex={0} />);

      expect(screen.queryByText('이전')).not.toBeInTheDocument();
    });

    it('건너뛰기 버튼이 표시됨', () => {
      render(<TutorialStep {...defaultProps} stepIndex={0} />);

      expect(screen.getByText('건너뛰기')).toBeInTheDocument();
    });

    it('다음 버튼이 표시됨', () => {
      render(<TutorialStep {...defaultProps} stepIndex={0} />);

      expect(screen.getByText('다음')).toBeInTheDocument();
    });
  });

  describe('중간 스텝', () => {
    it('이전 버튼이 표시됨', () => {
      render(<TutorialStep {...defaultProps} stepIndex={2} />);

      expect(screen.getByText('이전')).toBeInTheDocument();
    });

    it('다음 버튼이 표시됨', () => {
      render(<TutorialStep {...defaultProps} stepIndex={2} />);

      expect(screen.getByText('다음')).toBeInTheDocument();
    });
  });

  describe('마지막 스텝', () => {
    it('시작하기 버튼이 표시됨', () => {
      render(<TutorialStep {...defaultProps} stepIndex={4} totalSteps={5} />);

      expect(screen.getByText('시작하기')).toBeInTheDocument();
    });

    it('다음 버튼이 없음', () => {
      render(<TutorialStep {...defaultProps} stepIndex={4} totalSteps={5} />);

      expect(screen.queryByText('다음')).not.toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('다음 버튼 클릭 시 onNext 호출', () => {
      const onNext = vi.fn();
      render(<TutorialStep {...defaultProps} stepIndex={1} onNext={onNext} />);

      fireEvent.click(screen.getByText('다음'));
      expect(onNext).toHaveBeenCalled();
    });

    it('이전 버튼 클릭 시 onPrev 호출', () => {
      const onPrev = vi.fn();
      render(<TutorialStep {...defaultProps} stepIndex={2} onPrev={onPrev} />);

      fireEvent.click(screen.getByText('이전'));
      expect(onPrev).toHaveBeenCalled();
    });

    it('건너뛰기 버튼 클릭 시 onSkip 호출', () => {
      const onSkip = vi.fn();
      render(<TutorialStep {...defaultProps} stepIndex={0} onSkip={onSkip} />);

      fireEvent.click(screen.getByText('건너뛰기'));
      expect(onSkip).toHaveBeenCalled();
    });

    it('시작하기 버튼 클릭 시 onComplete 호출', () => {
      const onComplete = vi.fn();
      render(
        <TutorialStep
          {...defaultProps}
          stepIndex={4}
          totalSteps={5}
          onComplete={onComplete}
        />
      );

      fireEvent.click(screen.getByText('시작하기'));
      expect(onComplete).toHaveBeenCalled();
    });

    it('닫기 버튼 클릭 시 onSkip 호출', () => {
      const onSkip = vi.fn();
      render(<TutorialStep {...defaultProps} onSkip={onSkip} />);

      const closeButton = screen.getByRole('button', { name: '튜토리얼 닫기' });
      fireEvent.click(closeButton);
      expect(onSkip).toHaveBeenCalled();
    });

    it('오버레이 클릭 시 onSkip 호출', () => {
      const onSkip = vi.fn();
      render(<TutorialStep {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByTestId('tutorial-overlay'));
      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe('타겟 선택자', () => {
    it('타겟 선택자가 없으면 스포트라이트 없음', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.queryByTestId('tutorial-spotlight')).not.toBeInTheDocument();
    });

    it('타겟 요소가 없으면 스포트라이트 없음', () => {
      const stepWithSelector: TutorialStepType = {
        ...mockStep,
        targetSelector: '[data-tutorial="nonexistent"]',
      };

      render(<TutorialStep {...defaultProps} step={stepWithSelector} />);

      expect(screen.queryByTestId('tutorial-spotlight')).not.toBeInTheDocument();
    });
  });
});
