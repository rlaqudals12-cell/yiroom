/**
 * TrendChart.tsx 테스트
 * @description 트렌드 차트 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendChart, type TrendChartProps } from '@/components/analysis/visual-report/TrendChart';

// ============================================
// Mock 데이터
// ============================================

const mockData: TrendChartProps['data'] = [
  { date: new Date('2026-01-01'), score: 70 },
  { date: new Date('2026-01-08'), score: 72 },
  { date: new Date('2026-01-15'), score: 75 },
  { date: new Date('2026-01-22'), score: 78 },
  { date: new Date('2026-01-29'), score: 80 },
  { date: new Date('2026-02-05'), score: 82 },
];

const mockDownTrendData: TrendChartProps['data'] = [
  { date: new Date('2026-01-01'), score: 85 },
  { date: new Date('2026-01-08'), score: 82 },
  { date: new Date('2026-01-15'), score: 78 },
  { date: new Date('2026-01-22'), score: 75 },
];

const mockSameTrendData: TrendChartProps['data'] = [
  { date: new Date('2026-01-01'), score: 75 },
  { date: new Date('2026-01-08'), score: 76 },
  { date: new Date('2026-01-15'), score: 74 },
];

// ============================================
// 기본 렌더링 테스트
// ============================================

describe('TrendChart', () => {
  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정되어야 함', () => {
      render(<TrendChart data={mockData} metric="overall" />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('메트릭 라벨이 표시되어야 함', () => {
      render(<TrendChart data={mockData} metric="hydration" />);
      expect(screen.getByText(/수분도 변화/)).toBeInTheDocument();
    });

    it('SVG 차트가 렌더링되어야 함', () => {
      const { container } = render(<TrendChart data={mockData} metric="overall" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('데이터 포인트가 렌더링되어야 함', () => {
      const { container } = render(<TrendChart data={mockData} metric="overall" />);
      const circles = container.querySelectorAll('circle');
      // 각 포인트당 2개의 circle (외곽 + 내부)
      expect(circles.length).toBe(mockData.length * 2);
    });
  });

  // ============================================
  // 빈 데이터 테스트
  // ============================================

  describe('빈 데이터', () => {
    it('데이터가 없으면 빈 상태 메시지가 표시되어야 함', () => {
      render(<TrendChart data={[]} metric="overall" />);
      expect(screen.getByTestId('trend-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('분석 기록이 없습니다')).toBeInTheDocument();
    });
  });

  // ============================================
  // 트렌드 표시 테스트
  // ============================================

  describe('트렌드 표시', () => {
    it('상승 트렌드가 올바르게 표시되어야 함', () => {
      render(<TrendChart data={mockData} metric="overall" />);
      expect(screen.getByText('상승 중')).toBeInTheDocument();
    });

    it('하락 트렌드가 올바르게 표시되어야 함', () => {
      render(<TrendChart data={mockDownTrendData} metric="overall" />);
      expect(screen.getByText('하락 중')).toBeInTheDocument();
    });

    it('유지 트렌드가 올바르게 표시되어야 함', () => {
      render(<TrendChart data={mockSameTrendData} metric="overall" />);
      expect(screen.getByText('유지 중')).toBeInTheDocument();
    });
  });

  // ============================================
  // 메트릭별 라벨 테스트
  // ============================================

  describe('메트릭별 라벨', () => {
    const metrics: TrendChartProps['metric'][] = [
      'overall',
      'hydration',
      'oiliness',
      'pores',
      'vitality',
    ];
    const expectedLabels = ['종합 점수', '수분도', '유분도', '모공', '활력도'];

    metrics.forEach((metric, index) => {
      it(`${metric} 메트릭 라벨이 올바르게 표시되어야 함`, () => {
        render(<TrendChart data={mockData} metric={metric} />);
        expect(screen.getByText(new RegExp(expectedLabels[index]))).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // 목표선 테스트
  // ============================================

  describe('목표선', () => {
    it('showGoal=true일 때 목표 점수가 표시되어야 함', () => {
      render(<TrendChart data={mockData} metric="overall" showGoal goalScore={85} />);
      expect(screen.getByText('목표: 85점')).toBeInTheDocument();
    });

    it('showGoal=false(기본값)일 때 목표가 표시되지 않아야 함', () => {
      render(<TrendChart data={mockData} metric="overall" />);
      expect(screen.queryByText(/목표:/)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 범례 테스트
  // ============================================

  describe('범례', () => {
    it('시작/현재 점수가 표시되어야 함', () => {
      render(<TrendChart data={mockData} metric="overall" />);
      expect(screen.getByText(/시작:.*점/)).toBeInTheDocument();
      expect(screen.getByText(/현재:.*점/)).toBeInTheDocument();
    });

    it('점수 차이가 표시되어야 함', () => {
      render(<TrendChart data={mockData} metric="overall" />);
      // 70 → 82, +12점
      expect(screen.getByText(/\+12점/)).toBeInTheDocument();
    });

    it('데이터가 1개일 때 범례가 표시되지 않아야 함', () => {
      const singleData = [{ date: new Date(), score: 75 }];
      render(<TrendChart data={singleData} metric="overall" />);
      expect(screen.queryByText(/시작:/)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Props 테스트
  // ============================================

  describe('Props', () => {
    it('className이 적용되어야 함', () => {
      render(<TrendChart data={mockData} metric="overall" className="custom-class" />);
      const chart = screen.getByTestId('trend-chart');
      expect(chart).toHaveClass('custom-class');
    });

    it('height가 적용되어야 함', () => {
      const { container } = render(<TrendChart data={mockData} metric="overall" height={200} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('height', '200');
    });
  });

  // ============================================
  // 날짜 포맷 테스트
  // ============================================

  describe('날짜 포맷', () => {
    it('날짜가 M/D 형식으로 표시되어야 함', () => {
      const { container } = render(<TrendChart data={mockData} metric="overall" />);
      // 1/1, 1/8 등의 날짜 형식
      const textElements = container.querySelectorAll('text');
      const dateTexts = Array.from(textElements).filter((t) =>
        /\d+\/\d+/.test(t.textContent || '')
      );
      expect(dateTexts.length).toBeGreaterThan(0);
    });
  });
});
