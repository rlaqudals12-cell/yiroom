import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppTour } from '@/components/common/AppTour';

// useAppTour 훅 모킹
const mockUseAppTour = {
  isActive: true,
  currentStep: {
    id: 'test-step',
    title: '테스트 스텝',
    description: '이것은 테스트 스텝입니다.',
    targetSelector: '[data-tutorial="test"]',
    position: 'bottom' as const,
  },
  currentStepIndex: 0,
  totalSteps: 3,
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  skipTour: vi.fn(),
  startTour: vi.fn(),
  completeTour: vi.fn(),
  resetTour: vi.fn(),
  goToStep: vi.fn(),
  isCompleted: false,
};

vi.mock('@/hooks/useAppTour', () => ({
  useAppTour: () => mockUseAppTour,
  DEFAULT_APP_TOUR_STEPS: [],
}));

// createPortal 모킹
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('AppTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppTour.isActive = true;
    mockUseAppTour.currentStepIndex = 0;
  });

  describe('렌더링', () => {
    it('투어가 활성화되면 렌더링됨', () => {
      render(<AppTour />);

      expect(screen.getByTestId('app-tour')).toBeInTheDocument();
    });

    it('제목이 표시됨', () => {
      render(<AppTour />);

      expect(screen.getByText('테스트 스텝')).toBeInTheDocument();
    });

    it('설명이 표시됨', () => {
      render(<AppTour />);

      expect(screen.getByText('이것은 테스트 스텝입니다.')).toBeInTheDocument();
    });

    it('진행률이 표시됨', () => {
      render(<AppTour />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('진행률 인디케이터(dots)가 표시됨', () => {
      render(<AppTour />);

      const tooltip = screen.getByTestId('app-tour-tooltip');
      const dots = tooltip.querySelectorAll('.rounded-full');
      expect(dots.length).toBe(3);
    });

    it('투어가 비활성화되면 렌더링되지 않음', () => {
      mockUseAppTour.isActive = false;

      render(<AppTour />);

      expect(screen.queryByTestId('app-tour')).not.toBeInTheDocument();
    });
  });

  describe('네비게이션 버튼', () => {
    it('첫 스텝에서 이전 버튼이 비활성화됨', () => {
      mockUseAppTour.currentStepIndex = 0;

      render(<AppTour />);

      const prevButton = screen.getByRole('button', { name: /이전/i });
      expect(prevButton).toBeDisabled();
    });

    it('다음 버튼 클릭 시 nextStep 호출', () => {
      render(<AppTour />);

      const nextButton = screen.getByRole('button', { name: /다음/i });
      fireEvent.click(nextButton);

      expect(mockUseAppTour.nextStep).toHaveBeenCalled();
    });

    it('마지막 스텝에서 완료 버튼 표시', () => {
      mockUseAppTour.currentStepIndex = 2;

      render(<AppTour />);

      expect(screen.getByRole('button', { name: /완료/i })).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('닫기 버튼 클릭 시 skipTour 호출', () => {
      render(<AppTour />);

      const closeButton = screen.getByRole('button', { name: '투어 건너뛰기' });
      fireEvent.click(closeButton);

      expect(mockUseAppTour.skipTour).toHaveBeenCalled();
    });

    it('오버레이 클릭 시 skipTour 호출', () => {
      render(<AppTour />);

      const overlay = screen.getByTestId('app-tour').querySelector('[aria-hidden="true"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(mockUseAppTour.skipTour).toHaveBeenCalled();
    });

    it('이전 버튼 클릭 시 prevStep 호출 (중간 스텝에서)', () => {
      mockUseAppTour.currentStepIndex = 1;

      render(<AppTour />);

      const prevButton = screen.getByRole('button', { name: /이전/i });
      fireEvent.click(prevButton);

      expect(mockUseAppTour.prevStep).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('dialog 역할이 있음', () => {
      render(<AppTour />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-label이 설정됨', () => {
      render(<AppTour />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', '앱 투어');
    });
  });
});
