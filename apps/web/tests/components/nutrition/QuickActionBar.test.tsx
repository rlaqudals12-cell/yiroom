/**
 * N-1 QuickActionBar 컴포넌트 테스트
 * Task 2.7: 식단 기록 화면
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickActionBar, {
  FloatingCameraButton,
} from '@/components/nutrition/QuickActionBar';

describe('QuickActionBar', () => {
  describe('렌더링', () => {
    it('4개의 빠른 액션 버튼을 렌더링한다', () => {
      render(<QuickActionBar />);

      expect(screen.getByTestId('quick-action-camera')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-search')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-barcode')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-water')).toBeInTheDocument();
    });

    it('각 버튼의 라벨을 표시한다', () => {
      render(<QuickActionBar />);

      expect(screen.getByText('사진')).toBeInTheDocument();
      expect(screen.getByText('검색')).toBeInTheDocument();
      expect(screen.getByText('바코드')).toBeInTheDocument();
      expect(screen.getByText('물')).toBeInTheDocument();
    });

    it('물 섭취량이 있을 때 진행률을 표시한다', () => {
      render(<QuickActionBar waterAmount={1000} waterGoal={2000} />);

      // 1000/2000 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('물 섭취량이 0일 때 진행률을 표시하지 않는다', () => {
      render(<QuickActionBar waterAmount={0} waterGoal={2000} />);

      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });
  });

  describe('이벤트 핸들링', () => {
    it.each([
      ['camera', 'quick-action-camera'],
      ['search', 'quick-action-search'],
      ['barcode', 'quick-action-barcode'],
      ['water', 'quick-action-water'],
    ] as const)('%s 버튼 클릭 시 onAction을 호출한다', (actionType, testId) => {
      const onAction = vi.fn();
      render(<QuickActionBar onAction={onAction} />);

      fireEvent.click(screen.getByTestId(testId));

      expect(onAction).toHaveBeenCalledWith(actionType);
    });
  });

  describe('접근성', () => {
    it('각 버튼에 aria-label이 있다', () => {
      render(<QuickActionBar />);

      expect(screen.getByLabelText('사진으로 기록')).toBeInTheDocument();
      expect(screen.getByLabelText('음식 검색')).toBeInTheDocument();
      expect(screen.getByLabelText('바코드 스캔')).toBeInTheDocument();
      expect(screen.getByLabelText('물 250ml 추가')).toBeInTheDocument();
    });
  });

  describe('스타일', () => {
    it('기본적으로 fixed 스타일이 적용된다', () => {
      const { container } = render(<QuickActionBar />);
      const bar = container.querySelector('[data-testid="quick-action-bar"]');

      expect(bar).toHaveClass('fixed');
    });

    it('fixed=false일 때 fixed 스타일이 적용되지 않는다', () => {
      const { container } = render(<QuickActionBar fixed={false} />);
      const bar = container.querySelector('[data-testid="quick-action-bar"]');

      expect(bar).not.toHaveClass('fixed');
    });
  });

  describe('testid', () => {
    it('올바른 testid가 렌더링된다', () => {
      render(<QuickActionBar />);

      expect(screen.getByTestId('quick-action-bar')).toBeInTheDocument();
    });
  });
});

describe('FloatingCameraButton', () => {
  it('버튼을 렌더링한다', () => {
    render(<FloatingCameraButton />);

    expect(screen.getByTestId('floating-camera-button')).toBeInTheDocument();
  });

  it('클릭 시 onClick을 호출한다', () => {
    const onClick = vi.fn();
    render(<FloatingCameraButton onClick={onClick} />);

    fireEvent.click(screen.getByTestId('floating-camera-button'));

    expect(onClick).toHaveBeenCalled();
  });

  it('적절한 aria-label이 있다', () => {
    render(<FloatingCameraButton />);

    expect(
      screen.getByLabelText('사진으로 음식 기록하기')
    ).toBeInTheDocument();
  });
});
