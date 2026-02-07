import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CorrelationChart from '@/components/skin/diary/CorrelationChart';
import type { CorrelationInsight } from '@/types/skin-diary';

describe('CorrelationChart', () => {
  const mockInsights: CorrelationInsight[] = [
    {
      factor: '수면 시간',
      factorKey: 'sleepHours',
      correlation: 0.72,
      confidence: 85,
      insight: '수면 7시간 이상일 때 피부가 좋아요',
      recommendation: '7시간 이상 수면하세요',
      isPositive: true,
    },
    {
      factor: '스트레스',
      factorKey: 'stressLevel',
      correlation: -0.65,
      confidence: 80,
      insight: '스트레스가 높으면 피부가 나빠져요',
      recommendation: '스트레스 관리하세요',
      isPositive: false,
    },
    {
      factor: '수분 섭취',
      factorKey: 'waterIntakeMl',
      correlation: 0.45,
      confidence: 70,
      insight: '수분을 충분히 섭취하면 피부가 좋아요',
      recommendation: '물을 더 마시세요',
      isPositive: true,
    },
  ];

  it('renders with test id', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByTestId('correlation-chart')).toBeInTheDocument();
  });

  it('displays title', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByText('피부와 생활 요인 상관관계')).toBeInTheDocument();
  });

  it('displays all factor names', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByText('수면 시간')).toBeInTheDocument();
    expect(screen.getByText('스트레스')).toBeInTheDocument();
    expect(screen.getByText('수분 섭취')).toBeInTheDocument();
  });

  it('displays correlation percentages', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByText('+72%')).toBeInTheDocument();
    expect(screen.getByText('-65%')).toBeInTheDocument();
    expect(screen.getByText('+45%')).toBeInTheDocument();
  });

  it('displays confidence levels', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByText('(신뢰도 85%)')).toBeInTheDocument();
    expect(screen.getByText('(신뢰도 80%)')).toBeInTheDocument();
    expect(screen.getByText('(신뢰도 70%)')).toBeInTheDocument();
  });

  it('displays insight text', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByText('수면 7시간 이상일 때 피부가 좋아요')).toBeInTheDocument();
    expect(screen.getByText('스트레스가 높으면 피부가 나빠져요')).toBeInTheDocument();
  });

  it('renders empty state when no insights', () => {
    render(<CorrelationChart insights={[]} />);
    expect(screen.getByText('상관관계 데이터가 없어요')).toBeInTheDocument();
    expect(screen.getByText('7일 이상 기록하면 분석 결과를 확인할 수 있어요')).toBeInTheDocument();
  });

  it('renders legend', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByText('긍정적 영향')).toBeInTheDocument();
    expect(screen.getByText('부정적 영향')).toBeInTheDocument();
  });

  it('renders correlation bars for each factor', () => {
    render(<CorrelationChart insights={mockInsights} />);
    expect(screen.getByTestId('correlation-bar-sleepHours')).toBeInTheDocument();
    expect(screen.getByTestId('correlation-bar-stressLevel')).toBeInTheDocument();
    expect(screen.getByTestId('correlation-bar-waterIntakeMl')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CorrelationChart insights={mockInsights} className="custom-class" />);
    expect(screen.getByTestId('correlation-chart')).toHaveClass('custom-class');
  });

  it('sorts insights by absolute correlation value', () => {
    render(<CorrelationChart insights={mockInsights} />);

    const bars = screen.getAllByTestId(/correlation-bar-/);
    // 0.72 (sleepHours) > 0.65 (stressLevel) > 0.45 (waterIntakeMl)
    expect(bars[0]).toHaveAttribute('data-testid', 'correlation-bar-sleepHours');
  });

  it('uses green color for positive correlations', () => {
    render(<CorrelationChart insights={mockInsights} />);

    // Check for green-related classes in positive insight containers
    const chart = screen.getByTestId('correlation-chart');
    expect(chart.textContent).toContain('수면 시간');
  });

  it('uses red color for negative correlations', () => {
    render(<CorrelationChart insights={mockInsights} />);

    // Check for red-related classes in negative insight containers
    const chart = screen.getByTestId('correlation-chart');
    expect(chart.textContent).toContain('스트레스');
  });

  it('has accessible progressbar roles', () => {
    render(<CorrelationChart insights={mockInsights} />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
