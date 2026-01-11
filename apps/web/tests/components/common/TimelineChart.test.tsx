import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineChart, type TimelineDataPoint } from '@/components/common/TimelineChart';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
    TrendingUp: () => <span data-testid="icon-trending-up">Up</span>,
    TrendingDown: () => <span data-testid="icon-trending-down">Down</span>,
    Minus: () => <span data-testid="icon-minus">-</span>,
  };
});

// recharts 모킹 (동적 import이므로 컴포넌트를 모킹)
vi.mock('recharts', () => ({
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-points={data.length}>
      {children}
    </div>
  ),
  Area: () => <div data-testid="chart-area" />,
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
    const MockComponent = () => null;
    return MockComponent;
  },
}));

describe('TimelineChart', () => {
  const mockData: TimelineDataPoint[] = [
    { date: '2024-01-15', score: 80, label: '피부 점수', hasData: true },
    { date: '2024-01-10', score: 75, label: '피부 점수', hasData: true },
    { date: '2024-01-05', score: 70, label: '피부 점수', hasData: true },
    { date: '2024-01-01', score: 65, hasData: false },
  ];

  it('renders the card with test id', () => {
    render(<TimelineChart data={mockData} />);
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });

  it('displays the title when provided', () => {
    render(<TimelineChart title="점수 변화" data={mockData} />);
    expect(screen.getByText('점수 변화')).toBeInTheDocument();
  });

  it('displays calendar icon in header', () => {
    render(<TimelineChart title="점수 변화" data={mockData} />);
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument();
  });

  it('shows stable trend by default', () => {
    render(<TimelineChart title="점수 변화" data={mockData} />);
    expect(screen.getByText('유지 중')).toBeInTheDocument();
  });

  it('shows improving trend indicator', () => {
    render(<TimelineChart title="점수 변화" data={mockData} trend="improving" />);
    expect(screen.getByText('개선 중')).toBeInTheDocument();
    expect(screen.getByTestId('icon-trending-up')).toBeInTheDocument();
  });

  it('shows declining trend indicator', () => {
    render(<TimelineChart title="점수 변화" data={mockData} trend="declining" />);
    expect(screen.getByText('주의 필요')).toBeInTheDocument();
    expect(screen.getByTestId('icon-trending-down')).toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    render(<TimelineChart title="점수 변화" data={[]} />);
    expect(screen.getByText('아직 분석 기록이 없어요')).toBeInTheDocument();
  });

  it('displays summary statistics when more than 2 data points', () => {
    render(<TimelineChart data={mockData} />);
    expect(screen.getByText('첫 기록')).toBeInTheDocument();
    expect(screen.getByText('최근 기록')).toBeInTheDocument();
    expect(screen.getByText('변화')).toBeInTheDocument();
  });

  it('applies skin variant styles', () => {
    render(<TimelineChart title="피부 점수" data={mockData} variant="skin" />);
    const card = screen.getByTestId('timeline-chart');
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('pink');
  });

  it('applies body variant styles', () => {
    render(<TimelineChart title="체형 점수" data={mockData} variant="body" />);
    const card = screen.getByTestId('timeline-chart');
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('blue');
  });

  it('applies hair variant styles', () => {
    render(<TimelineChart title="헤어 점수" data={mockData} variant="hair" />);
    const card = screen.getByTestId('timeline-chart');
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('purple');
  });

  it('applies default variant styles', () => {
    render(<TimelineChart title="점수" data={mockData} variant="default" />);
    const card = screen.getByTestId('timeline-chart');
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('muted');
  });

  it('hides header when hideHeader is true', () => {
    render(<TimelineChart title="점수 변화" data={mockData} hideHeader />);
    // 제목이 표시되지 않아야 함
    expect(screen.queryByText('점수 변화')).not.toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<TimelineChart data={mockData} className="custom-class" />);
    const card = screen.getByTestId('timeline-chart');
    expect(card.className).toContain('custom-class');
  });

  it('accepts custom unit', () => {
    render(<TimelineChart data={mockData} unit="%" />);
    // 요약 통계에 단위가 적용됨
    const changeElements = screen.getAllByText(/점|%/);
    expect(changeElements.length).toBeGreaterThan(0);
  });

  it('handles single data point', () => {
    const singleData: TimelineDataPoint[] = [{ date: '2024-01-15', score: 80, hasData: true }];
    render(<TimelineChart data={singleData} />);
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
    // 요약 통계가 표시되지 않아야 함 (2개 미만)
    expect(screen.queryByText('첫 기록')).not.toBeInTheDocument();
  });

  it('calculates positive change correctly', () => {
    const positiveData: TimelineDataPoint[] = [
      { date: '2024-01-15', score: 80, hasData: true },
      { date: '2024-01-01', score: 60, hasData: true },
    ];
    render(<TimelineChart data={positiveData} />);
    // +20 변화가 녹색으로 표시되어야 함
    expect(screen.getByText('+20점')).toBeInTheDocument();
  });

  it('calculates negative change correctly', () => {
    const negativeData: TimelineDataPoint[] = [
      { date: '2024-01-15', score: 60, hasData: true },
      { date: '2024-01-01', score: 80, hasData: true },
    ];
    render(<TimelineChart data={negativeData} />);
    // -20 변화가 빨간색으로 표시되어야 함
    expect(screen.getByText('-20점')).toBeInTheDocument();
  });

  it('handles data with hasData false', () => {
    const mixedData: TimelineDataPoint[] = [
      { date: '2024-01-15', score: 80, hasData: true },
      { date: '2024-01-10', score: 0, hasData: false },
      { date: '2024-01-01', score: 60, hasData: true },
    ];
    render(<TimelineChart data={mixedData} />);
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });

  it('uses custom formatDate function', () => {
    const customFormat = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${date.getMonth() + 1}`;
    };
    render(<TimelineChart data={mockData} formatDate={customFormat} />);
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });

  it('uses custom formatScore function', () => {
    const customFormat = (score: number) => score.toFixed(1);
    render(<TimelineChart data={mockData} formatScore={customFormat} />);
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
  });
});
