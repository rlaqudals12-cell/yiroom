import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardTabs } from '@/components/leaderboard/LeaderboardTabs';
import type { LeaderboardPeriod, LeaderboardCategory } from '@/types/leaderboard';

describe('LeaderboardTabs', () => {
  const defaultProps = {
    period: 'weekly' as LeaderboardPeriod,
    category: 'xp' as LeaderboardCategory,
    onPeriodChange: vi.fn(),
    onCategoryChange: vi.fn(),
  };

  it('컴포넌트 렌더링', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByTestId('leaderboard-tabs')).toBeInTheDocument();
  });

  it('기간 탭 렌더링', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByTestId('leaderboard-period-tabs')).toBeInTheDocument();
  });

  it('카테고리 탭 렌더링', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByTestId('leaderboard-category-tabs')).toBeInTheDocument();
  });

  it('주간 기간 탭 표시', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByText('주간')).toBeInTheDocument();
  });

  it('월간 기간 탭 표시', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByText('월간')).toBeInTheDocument();
  });

  it('전체 기간 탭 표시', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByText('전체')).toBeInTheDocument();
  });

  it('경험치 카테고리 탭 표시', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByText('경험치')).toBeInTheDocument();
  });

  it('레벨 카테고리 탭 표시', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByText('레벨')).toBeInTheDocument();
  });

  it('운동 카테고리 탭 표시', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByText('운동')).toBeInTheDocument();
  });

  it('영양 카테고리 탭 표시', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    expect(screen.getByText('영양')).toBeInTheDocument();
  });

  it('기간 탭들이 올바른 value 속성을 가짐', () => {
    const { container } = render(<LeaderboardTabs {...defaultProps} />);

    // TabsTrigger가 올바른 data-state를 가지는지 확인
    const periodTabs = container.querySelectorAll('[data-testid="leaderboard-period-tabs"] button');
    expect(periodTabs.length).toBe(3);

    // weekly가 현재 선택된 상태 (active)
    const activeTab = screen.getByText('주간').closest('button');
    expect(activeTab).toHaveAttribute('data-state', 'active');
  });

  it('카테고리 탭들이 올바른 value 속성을 가짐', () => {
    const { container } = render(<LeaderboardTabs {...defaultProps} />);

    // TabsTrigger 개수 확인
    const categoryTabs = container.querySelectorAll('[data-testid="leaderboard-category-tabs"] button');
    expect(categoryTabs.length).toBe(4);

    // xp가 현재 선택된 상태 (active)
    const activeTab = screen.getByText('경험치').closest('button');
    expect(activeTab).toHaveAttribute('data-state', 'active');
  });

  it('제한된 기간만 표시', () => {
    render(
      <LeaderboardTabs
        {...defaultProps}
        availablePeriods={['weekly', 'monthly']}
      />
    );

    expect(screen.getByText('주간')).toBeInTheDocument();
    expect(screen.getByText('월간')).toBeInTheDocument();
    expect(screen.queryByText('전체')).not.toBeInTheDocument();
  });

  it('제한된 카테고리만 표시', () => {
    render(
      <LeaderboardTabs
        {...defaultProps}
        availableCategories={['workout', 'nutrition']}
      />
    );

    expect(screen.getByText('운동')).toBeInTheDocument();
    expect(screen.getByText('영양')).toBeInTheDocument();
    expect(screen.queryByText('경험치')).not.toBeInTheDocument();
    expect(screen.queryByText('레벨')).not.toBeInTheDocument();
  });
});
