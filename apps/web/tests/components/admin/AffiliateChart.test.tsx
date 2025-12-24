import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// recharts 모킹
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

import { AffiliateChart } from '@/components/admin/AffiliateChart';

describe('AffiliateChart', () => {
  describe('기본 렌더링', () => {
    it('컴포넌트 렌더링', () => {
      render(<AffiliateChart data={[]} />);
      expect(screen.getByTestId('affiliate-chart')).toBeInTheDocument();
    });

    it('커스텀 testId', () => {
      render(<AffiliateChart data={[]} data-testid="custom-chart" />);
      expect(screen.getByTestId('custom-chart')).toBeInTheDocument();
    });

    it('기본 제목 표시', () => {
      render(<AffiliateChart data={[]} />);
      expect(screen.getByText('클릭 추이')).toBeInTheDocument();
    });

    it('커스텀 제목 표시', () => {
      render(<AffiliateChart data={[]} title="월간 통계" />);
      expect(screen.getByText('월간 통계')).toBeInTheDocument();
    });
  });

  describe('빈 데이터', () => {
    it('데이터 없을 때 메시지 표시', () => {
      render(<AffiliateChart data={[]} />);
      expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
    });

    it('빈 배열일 때 차트 미표시', () => {
      render(<AffiliateChart data={[]} />);
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });
  });

  describe('데이터 있을 때', () => {
    const mockData = [
      { date: '2025-12-22', clicks: 10 },
      { date: '2025-12-23', clicks: 25 },
      { date: '2025-12-24', clicks: 15 },
    ];

    it('차트 렌더링', () => {
      render(<AffiliateChart data={mockData} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('ResponsiveContainer 렌더링', () => {
      render(<AffiliateChart data={mockData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('Area 컴포넌트 렌더링', () => {
      render(<AffiliateChart data={mockData} />);
      expect(screen.getByTestId('area')).toBeInTheDocument();
    });

    it('축 렌더링', () => {
      render(<AffiliateChart data={mockData} />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('그리드 렌더링', () => {
      render(<AffiliateChart data={mockData} />);
      expect(screen.getByTestId('grid')).toBeInTheDocument();
    });

    it('툴팁 렌더링', () => {
      render(<AffiliateChart data={mockData} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });
});
