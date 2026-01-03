import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveUserStatsCard } from '@/components/admin/analytics';
import type { ActiveUserStats } from '@/lib/admin/user-activity-stats';

describe('ActiveUserStatsCard', () => {
  const mockStats: ActiveUserStats = {
    dau: 150,
    wau: 850,
    mau: 2500,
    dauChange: 10.5,
    wauChange: -5.2,
    mauChange: 15.0,
  };

  it('로딩 상태를 표시한다', () => {
    render(<ActiveUserStatsCard stats={null} isLoading={true} />);

    expect(screen.getByTestId('active-user-stats-loading')).toBeInTheDocument();
  });

  it('stats가 null이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ActiveUserStatsCard stats={null} isLoading={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('DAU/WAU/MAU 값을 표시한다', () => {
    render(<ActiveUserStatsCard stats={mockStats} isLoading={false} />);

    expect(screen.getByTestId('active-user-stats-card')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument();
    expect(screen.getByText('2,500')).toBeInTheDocument();
  });

  it('라벨을 올바르게 표시한다', () => {
    render(<ActiveUserStatsCard stats={mockStats} isLoading={false} />);

    expect(screen.getByText('오늘 (DAU)')).toBeInTheDocument();
    expect(screen.getByText('주간 (WAU)')).toBeInTheDocument();
    expect(screen.getByText('월간 (MAU)')).toBeInTheDocument();
  });

  it('양수 변화율을 표시한다', () => {
    render(<ActiveUserStatsCard stats={mockStats} isLoading={false} />);

    // DAU change: +10.5%
    expect(screen.getByText('+10.5%')).toBeInTheDocument();
  });

  it('음수 변화율을 표시한다', () => {
    render(<ActiveUserStatsCard stats={mockStats} isLoading={false} />);

    // WAU change: -5.2%
    expect(screen.getByText('-5.2%')).toBeInTheDocument();
  });
});
