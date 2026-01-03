import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureUsageTrendChart } from '@/components/admin/analytics';
import type { DailyFeatureUsageTrend } from '@/lib/admin/user-activity-stats';

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

describe('FeatureUsageTrendChart', () => {
  const mockData: DailyFeatureUsageTrend[] = [
    { date: '2025-12-20', personalColor: 10, skin: 8, body: 5, workout: 50, meal: 80 },
    { date: '2025-12-21', personalColor: 12, skin: 9, body: 6, workout: 55, meal: 85 },
    { date: '2025-12-22', personalColor: 8, skin: 7, body: 4, workout: 45, meal: 75 },
  ];

  it('로딩 상태를 표시한다', () => {
    render(<FeatureUsageTrendChart data={null} isLoading={true} />);

    expect(screen.getByTestId('feature-usage-trend-loading')).toBeInTheDocument();
  });

  it('데이터가 없으면 빈 상태를 표시한다', () => {
    render(<FeatureUsageTrendChart data={[]} isLoading={false} />);

    expect(screen.getByTestId('feature-usage-trend-empty')).toBeInTheDocument();
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument();
  });

  it('data가 null이면 빈 상태를 표시한다', () => {
    render(<FeatureUsageTrendChart data={null} isLoading={false} />);

    expect(screen.getByTestId('feature-usage-trend-empty')).toBeInTheDocument();
  });

  it('차트를 렌더링한다', () => {
    render(<FeatureUsageTrendChart data={mockData} isLoading={false} />);

    expect(screen.getByTestId('feature-usage-trend-chart')).toBeInTheDocument();
    expect(screen.getByText('기능별 일별 사용량 추이')).toBeInTheDocument();
  });
});
