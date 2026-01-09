import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutLayout from '@/app/(main)/workout/layout';

// next/navigation mock
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}));

describe('WorkoutLayout', () => {
  it('renders children correctly', () => {
    render(
      <WorkoutLayout>
        <div data-testid="test-child">Test Content</div>
      </WorkoutLayout>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('displays page title', () => {
    render(
      <WorkoutLayout>
        <div>Test</div>
      </WorkoutLayout>
    );
    expect(screen.getByText('운동 추천')).toBeInTheDocument();
  });

  it('has back button with aria-label', () => {
    render(
      <WorkoutLayout>
        <div>Test</div>
      </WorkoutLayout>
    );
    const backButton = screen.getByLabelText('뒤로 가기');
    expect(backButton).toBeInTheDocument();
  });

  it('has correct background color on main element', () => {
    render(
      <WorkoutLayout>
        <div>Test</div>
      </WorkoutLayout>
    );
    const main = screen.getByRole('main');
    expect(main).toHaveClass('bg-[#FAFAFA]');
  });

  it('content area has max-width 480px', () => {
    render(
      <WorkoutLayout>
        <div data-testid="content">Test</div>
      </WorkoutLayout>
    );
    // 콘텐츠를 감싸는 div가 max-w-[480px]를 가져야 함
    const content = screen.getByTestId('content');
    expect(content.parentElement).toHaveClass('max-w-[480px]');
  });

  it('back button is clickable', () => {
    render(
      <WorkoutLayout>
        <div>Test</div>
      </WorkoutLayout>
    );

    const backButton = screen.getByLabelText('뒤로 가기');
    // 버튼이 클릭 가능한지 확인 (disabled가 아닌지)
    expect(backButton).not.toBeDisabled();
    // 클릭 이벤트가 에러 없이 실행되는지 확인
    expect(() => fireEvent.click(backButton)).not.toThrow();
  });
});
