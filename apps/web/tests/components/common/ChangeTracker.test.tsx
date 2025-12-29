import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChangeTracker, type TimeSeriesDataPoint } from '@/components/common/ChangeTracker';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Activity: () => <span data-testid="icon-activity">Activity</span>,
    TrendingUp: () => <span data-testid="icon-trending-up">Up</span>,
    TrendingDown: () => <span data-testid="icon-trending-down">Down</span>,
    Minus: () => <span data-testid="icon-minus">-</span>,
  };
});

// recharts 모킹 (동적 import이므로 컴포넌트를 모킹)
vi.mock('recharts', () => ({
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-points={data.length}>
      {children}
    </div>
  ),
  Line: () => <div data-testid="chart-line" />,
  XAxis: () => <div data-testid="chart-xaxis" />,
  YAxis: () => <div data-testid="chart-yaxis" />,
  CartesianGrid: () => <div data-testid="chart-grid" />,
  Tooltip: () => <div data-testid="chart-tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: ({ label }: { label?: { value?: string } }) => (
    <div data-testid="reference-line" data-label={label?.value || ''} />
  ),
}));

// next/dynamic 모킹
vi.mock('next/dynamic', () => ({
  default: () => {
    // 동기적으로 빈 컴포넌트 반환
    const MockComponent = () => null;
    return MockComponent;
  },
}));

describe('ChangeTracker', () => {
  const mockData: TimeSeriesDataPoint[] = [
    { date: '2024-01-01', value: 1500, label: '칼로리', hasData: true },
    { date: '2024-01-02', value: 1800, label: '칼로리', hasData: true },
    { date: '2024-01-03', value: 1600, label: '칼로리', hasData: true },
    { date: '2024-01-04', value: 0, hasData: false },
    { date: '2024-01-05', value: 1700, label: '칼로리', hasData: true },
  ];

  it('renders the card with test id', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
      />
    );

    expect(screen.getByTestId('change-tracker')).toBeInTheDocument();
  });

  it('displays the title', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
      />
    );

    // 제목이 헤더와 레전드 두 곳에 표시됨
    const titles = screen.getAllByText('일일 칼로리');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('shows stable trend by default', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
      />
    );

    expect(screen.getByText('유지')).toBeInTheDocument();
  });

  it('shows up trend indicator', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
        trend="up"
      />
    );

    expect(screen.getByText('상승')).toBeInTheDocument();
    expect(screen.getByTestId('icon-trending-up')).toBeInTheDocument();
  });

  it('shows down trend indicator', () => {
    render(
      <ChangeTracker
        title="체중 변화"
        data={mockData}
        trend="down"
      />
    );

    expect(screen.getByText('하락')).toBeInTheDocument();
    expect(screen.getByTestId('icon-trending-down')).toBeInTheDocument();
  });

  it('displays activity icon', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
      />
    );

    expect(screen.getByTestId('icon-activity')).toBeInTheDocument();
  });

  it('displays title in legend', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
      />
    );

    // 레전드에 제목 표시
    const legends = screen.getAllByText('일일 칼로리');
    expect(legends.length).toBeGreaterThan(0);
  });

  it('displays target label in legend when target provided', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
        targetValue={2000}
        targetLabel="목표"
      />
    );

    expect(screen.getByText('목표')).toBeInTheDocument();
  });

  it('applies beauty variant styles', () => {
    render(
      <ChangeTracker
        title="피부 점수"
        data={mockData}
        variant="beauty"
      />
    );

    const card = screen.getByTestId('change-tracker');
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('pink');
  });

  it('applies style variant styles', () => {
    render(
      <ChangeTracker
        title="스타일 점수"
        data={mockData}
        variant="style"
      />
    );

    const card = screen.getByTestId('change-tracker');
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('indigo');
  });

  it('applies default variant styles', () => {
    render(
      <ChangeTracker
        title="일반 차트"
        data={mockData}
        variant="default"
      />
    );

    const card = screen.getByTestId('change-tracker');
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('muted');
  });

  it('accepts custom className', () => {
    render(
      <ChangeTracker
        title="일일 칼로리"
        data={mockData}
        className="custom-class"
      />
    );

    const card = screen.getByTestId('change-tracker');
    expect(card.className).toContain('custom-class');
  });

  it('handles empty data array', () => {
    render(
      <ChangeTracker
        title="빈 데이터"
        data={[]}
      />
    );

    expect(screen.getByTestId('change-tracker')).toBeInTheDocument();
    // 제목이 헤더와 레전드 두 곳에 표시됨
    const titles = screen.getAllByText('빈 데이터');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });
});
