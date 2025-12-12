/**
 * N-1 Task 1.0: 영양 모듈 레이아웃 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NutritionLayout from '@/app/(main)/nutrition/layout';

// next/navigation mock
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

describe('NutritionLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct max-width container', () => {
    render(
      <NutritionLayout>
        <div data-testid="child">Test Content</div>
      </NutritionLayout>
    );

    // 컨텐츠 영역에 max-w-[480px] 적용 확인
    const childElement = screen.getByTestId('child');
    const container = childElement.parentElement;
    expect(container).toHaveClass('max-w-[480px]');
  });

  it('renders main element with correct role', () => {
    render(
      <NutritionLayout>
        <div>Test</div>
      </NutritionLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('bg-[#FAFAFA]');
  });

  it('renders header with title', () => {
    render(
      <NutritionLayout>
        <div>Test</div>
      </NutritionLayout>
    );

    expect(screen.getByText('영양 관리')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(
      <NutritionLayout>
        <div>Test</div>
      </NutritionLayout>
    );

    const backButton = screen.getByRole('button', { name: /뒤로 가기/i });
    expect(backButton).toBeInTheDocument();
  });

  it('calls router.back() when back button is clicked', () => {
    render(
      <NutritionLayout>
        <div>Test</div>
      </NutritionLayout>
    );

    const backButton = screen.getByRole('button', { name: /뒤로 가기/i });
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders children content', () => {
    render(
      <NutritionLayout>
        <div data-testid="child-content">Custom Content</div>
      </NutritionLayout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('has sticky header', () => {
    render(
      <NutritionLayout>
        <div>Test</div>
      </NutritionLayout>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0');
  });
});
