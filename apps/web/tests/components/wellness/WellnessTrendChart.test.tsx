import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WellnessTrendChart } from '@/components/wellness/WellnessTrendChart';
import type { WellnessScore } from '@/types/wellness';

// recharts 모킹 (테스트 환경에서 SVG 렌더링 문제 방지)
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
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const createMockScore = (date: string, total: number): WellnessScore => ({
  id: `score-${date}`,
  clerkUserId: 'user-123',
  date,
  totalScore: total,
  workoutScore: Math.floor(total * 0.25),
  nutritionScore: Math.floor(total * 0.25),
  skinScore: Math.floor(total * 0.25),
  bodyScore: Math.floor(total * 0.25),
  scoreBreakdown: {
    workout: { streak: 5, frequency: 5, goal: 3 },
    nutrition: { calorie: 5, balance: 5, water: 3 },
    skin: { analysis: 5, routine: 5, matching: 3 },
    body: { analysis: 5, progress: 5, workout: 3 },
  },
  insights: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockHistory: WellnessScore[] = [
  createMockScore('2024-01-01', 60),
  createMockScore('2024-01-02', 65),
  createMockScore('2024-01-03', 70),
  createMockScore('2024-01-04', 68),
  createMockScore('2024-01-05', 75),
  createMockScore('2024-01-06', 80),
  createMockScore('2024-01-07', 78),
];

describe('WellnessTrendChart', () => {
  describe('렌더링', () => {
    it('기본 렌더링', () => {
      render(<WellnessTrendChart history={mockHistory} />);
      expect(screen.getByTestId('wellness-trend-chart')).toBeInTheDocument();
    });

    it('제목 표시', () => {
      render(<WellnessTrendChart history={mockHistory} />);
      expect(screen.getByText('웰니스 트렌드')).toBeInTheDocument();
    });

    it('차트 컨테이너 렌더링', () => {
      render(<WellnessTrendChart history={mockHistory} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('히스토리가 비어있으면 빈 상태 표시', () => {
      render(<WellnessTrendChart history={[]} />);
      expect(screen.getByTestId('wellness-trend-chart-empty')).toBeInTheDocument();
      expect(screen.getByText(/데이터가 없습니다/)).toBeInTheDocument();
    });

    it('히스토리가 1개면 차트 표시 (데이터 있음)', () => {
      render(<WellnessTrendChart history={[mockHistory[0]]} />);
      expect(screen.getByTestId('wellness-trend-chart')).toBeInTheDocument();
    });
  });

  describe('기간 선택', () => {
    it('주간 기간 표시 (기본값)', () => {
      const { container } = render(<WellnessTrendChart history={mockHistory} period="weekly" />);
      expect(container.textContent).toContain('주간');
    });

    it('월간 기간 표시', () => {
      const { container } = render(<WellnessTrendChart history={mockHistory} period="monthly" />);
      expect(container.textContent).toContain('월간');
    });
  });

  describe('트렌드 표시', () => {
    it('상승 트렌드 표시', () => {
      const upwardHistory = [
        createMockScore('2024-01-01', 50),
        createMockScore('2024-01-02', 80),
      ];
      render(<WellnessTrendChart history={upwardHistory} />);
      expect(screen.getByText(/상승/)).toBeInTheDocument();
    });

    it('하락 트렌드 표시', () => {
      const downwardHistory = [
        createMockScore('2024-01-01', 80),
        createMockScore('2024-01-02', 50),
      ];
      render(<WellnessTrendChart history={downwardHistory} />);
      expect(screen.getByText(/하락/)).toBeInTheDocument();
    });

    it('유지 트렌드 표시', () => {
      const stableHistory = [
        createMockScore('2024-01-01', 70),
        createMockScore('2024-01-02', 72),
      ];
      render(<WellnessTrendChart history={stableHistory} />);
      expect(screen.getByText(/유지/)).toBeInTheDocument();
    });
  });

  describe('범례', () => {
    it('showLegend=true면 범례 표시', () => {
      render(<WellnessTrendChart history={mockHistory} showLegend />);
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('showLegend=false면 범례 숨김', () => {
      render(<WellnessTrendChart history={mockHistory} showLegend={false} />);
      expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
    });
  });
});
