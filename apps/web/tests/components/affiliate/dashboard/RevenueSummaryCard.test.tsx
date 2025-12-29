/**
 * RevenueSummaryCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueSummaryCard } from '@/components/affiliate/dashboard/RevenueSummaryCard';
import type { DashboardSummary } from '@/lib/affiliate/stats';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const MockIcon = ({ className }: { className?: string }) => (
    <span data-testid="mock-icon" className={className} />
  );
  return {
    ...actual,
    MousePointer: MockIcon,
    ShoppingCart: MockIcon,
    Wallet: MockIcon,
    Percent: MockIcon,
    TrendingUp: MockIcon,
    TrendingDown: MockIcon,
  };
});

const mockSummary: DashboardSummary = {
  period: { start: '2025-01-01', end: '2025-01-07' },
  totalClicks: 1500,
  totalConversions: 45,
  totalSalesKrw: 2250000,
  totalCommissionKrw: 67500,
  conversionRate: 3.0,
  comparedToPrevious: {
    clicksChange: 15.5,
    commissionsChange: -5.2,
  },
};

describe('RevenueSummaryCard', () => {
  it('로딩 상태를 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} isLoading={true} />);

    expect(screen.getByTestId('revenue-summary-loading')).toBeInTheDocument();
  });

  it('4개의 메트릭 카드를 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} />);

    expect(screen.getByTestId('revenue-summary-card')).toBeInTheDocument();
    expect(screen.getByText('총 클릭')).toBeInTheDocument();
    expect(screen.getByText('전환')).toBeInTheDocument();
    expect(screen.getByText('전환율')).toBeInTheDocument();
    expect(screen.getByText('총 수익')).toBeInTheDocument();
  });

  it('총 클릭 수를 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} />);

    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('전환 수를 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} />);

    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('전환율을 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} />);

    expect(screen.getByText('3.00%')).toBeInTheDocument();
  });

  it('총 수익을 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} />);

    expect(screen.getByText('₩67,500')).toBeInTheDocument();
  });

  it('이전 기간 대비 증가를 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} />);

    expect(screen.getByText('+15.5%')).toBeInTheDocument();
  });

  it('이전 기간 대비 감소를 표시한다', () => {
    render(<RevenueSummaryCard summary={mockSummary} />);

    expect(screen.getByText('-5.2%')).toBeInTheDocument();
  });
});
