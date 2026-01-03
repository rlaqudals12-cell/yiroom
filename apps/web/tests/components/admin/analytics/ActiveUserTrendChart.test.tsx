import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveUserTrendChart } from '@/components/admin/analytics';
import type { DailyActiveUserTrend } from '@/lib/admin/user-activity-stats';

// Mock recharts - ResizeObserver is not available in test environment
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('ActiveUserTrendChart', () => {
  const mockData: DailyActiveUserTrend[] = [
    { date: '2025-12-20', activeUsers: 100 },
    { date: '2025-12-21', activeUsers: 120 },
    { date: '2025-12-22', activeUsers: 95 },
    { date: '2025-12-23', activeUsers: 150 },
    { date: '2025-12-24', activeUsers: 130 },
  ];

  it('로딩 상태를 표시한다', () => {
    render(<ActiveUserTrendChart data={null} isLoading={true} />);

    expect(screen.getByTestId('active-user-trend-loading')).toBeInTheDocument();
  });

  it('데이터가 없으면 빈 상태를 표시한다', () => {
    render(<ActiveUserTrendChart data={[]} isLoading={false} />);

    expect(screen.getByTestId('active-user-trend-empty')).toBeInTheDocument();
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument();
  });

  it('data가 null이면 빈 상태를 표시한다', () => {
    render(<ActiveUserTrendChart data={null} isLoading={false} />);

    expect(screen.getByTestId('active-user-trend-empty')).toBeInTheDocument();
  });

  it('차트를 렌더링한다', () => {
    render(<ActiveUserTrendChart data={mockData} isLoading={false} />);

    expect(screen.getByTestId('active-user-trend-chart')).toBeInTheDocument();
    expect(screen.getByText('일별 활성 사용자 추이')).toBeInTheDocument();
  });
});
