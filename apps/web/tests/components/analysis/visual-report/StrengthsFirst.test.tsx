/**
 * StrengthsFirst.tsx 테스트
 * @description 강점 우선 표시 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrengthsFirst } from '@/components/analysis/visual-report/StrengthsFirst';

// 애니메이션 모킹
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// MetricBar 모킹
vi.mock('@/components/analysis/visual-report/MetricBar', () => ({
  MetricBar: ({ name, value }: { name: string; value: number }) => (
    <div data-testid="metric-bar">
      {name}: {value}
    </div>
  ),
}));

// ============================================
// Mock 데이터
// ============================================

const mockMetrics = [
  { id: 'hydration', name: '수분', value: 85 },
  { id: 'elasticity', name: '탄력', value: 80 },
  { id: 'oiliness', name: '유분', value: 75 },
  { id: 'pores', name: '모공', value: 60 },
  { id: 'wrinkles', name: '주름', value: 55 },
];

const mockMeasurements = [
  { name: '어깨', value: 80, description: '균형잡힌 어깨' },
  { name: '허리', value: 75, description: '슬림한 허리' },
  { name: '엉덩이', value: 70, description: '적당한 힙' },
  { name: '다리', value: 55, description: '개선 가능' },
];

const mockBestColors = [
  { name: '코랄 핑크', hex: '#FF6B6B' },
  { name: '살몬', hex: '#FA8072' },
  { name: '피치', hex: '#FFCBA4' },
];

// ============================================
// 기본 렌더링 테스트
// ============================================

describe('StrengthsFirst', () => {
  describe('기본 렌더링', () => {
    it('강점 섹션이 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={mockMetrics} />);
      expect(screen.getByText('나의 강점')).toBeInTheDocument();
    });

    it('성장 가능성 섹션이 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={mockMetrics} />);
      expect(screen.getByText('성장 가능성')).toBeInTheDocument();
    });
  });

  // ============================================
  // 피부 분석 테스트
  // ============================================

  describe('피부 분석 (metrics)', () => {
    it('상위 3개 메트릭이 강점으로 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={mockMetrics} />);
      // 가장 높은 3개: 수분(85), 탄력(80), 유분(75)
      const metricBars = screen.getAllByTestId('metric-bar');
      expect(metricBars.length).toBeGreaterThanOrEqual(3);
    });

    it('하위 2개 메트릭이 성장 가능성으로 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={mockMetrics} />);
      // 가장 낮은 2개: 주름(55), 모공(60)
      expect(screen.getByText(/주름/)).toBeInTheDocument();
      expect(screen.getByText(/모공/)).toBeInTheDocument();
    });

    it('maxStrengths로 강점 개수를 제한할 수 있어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={mockMetrics} maxStrengths={2} />);
      // 상위 2개 메트릭만 강점으로 표시됨 (수분, 탄력)
      expect(screen.getByText(/수분/)).toBeInTheDocument();
      expect(screen.getByText(/탄력/)).toBeInTheDocument();
    });

    it('maxGrowthAreas로 성장 영역 개수를 제한할 수 있어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={mockMetrics} maxGrowthAreas={1} />);
      // 성장 영역이 1개로 제한됨
      const growthSection = screen.getByText('성장 가능성').closest('div');
      expect(growthSection).toBeInTheDocument();
    });
  });

  // ============================================
  // 체형 분석 테스트
  // ============================================

  describe('체형 분석 (measurements)', () => {
    it('measurements 기반으로 강점이 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="body" measurements={mockMeasurements} />);
      expect(screen.getByText(/어깨/)).toBeInTheDocument();
    });

    it('텍스트 기반 strengths가 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="body" strengths={['균형 잡힌 어깨', '좋은 비율']} />);
      expect(screen.getByText('균형 잡힌 어깨')).toBeInTheDocument();
      expect(screen.getByText('좋은 비율')).toBeInTheDocument();
    });
  });

  // ============================================
  // 퍼스널 컬러 테스트
  // ============================================

  describe('퍼스널 컬러 (bestColors)', () => {
    it('베스트 컬러가 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="personal-color" bestColors={mockBestColors} />);
      expect(screen.getByText('나의 베스트 컬러')).toBeInTheDocument();
    });

    it('컬러 이름이 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="personal-color" bestColors={mockBestColors} />);
      expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
      expect(screen.getByText('살몬')).toBeInTheDocument();
    });

    it('컬러 원이 올바른 배경색을 가져야 함', () => {
      render(<StrengthsFirst analysisType="personal-color" bestColors={mockBestColors} />);
      const colorCircle = screen.getByLabelText('코랄 핑크');
      expect(colorCircle).toHaveStyle({ backgroundColor: '#FF6B6B' });
    });

    it('최대 6개 컬러만 표시되어야 함', () => {
      const manyColors = Array.from({ length: 10 }, (_, i) => ({
        name: `Color ${i}`,
        hex: `#${i.toString().padStart(6, '0')}`,
      }));
      render(<StrengthsFirst analysisType="personal-color" bestColors={manyColors} />);
      // 6개까지만 표시
      expect(screen.queryByText('Color 6')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 빈 데이터 테스트
  // ============================================

  describe('빈 데이터', () => {
    it('메트릭이 없을 때 빈 메시지가 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={[]} />);
      expect(screen.getByText('분석 중입니다...')).toBeInTheDocument();
    });

    it('성장 영역 섹션에 개선 메시지가 표시되어야 함', () => {
      render(<StrengthsFirst analysisType="skin" metrics={mockMetrics} />);
      // 성장 가능성 섹션에 개선 안내 메시지
      expect(screen.getByText(/을\(를\) 개선하면 더 좋아질 수 있어요/)).toBeInTheDocument();
    });
  });

  // ============================================
  // Props 테스트
  // ============================================

  describe('Props', () => {
    it('className이 적용되어야 함', () => {
      const { container } = render(
        <StrengthsFirst analysisType="skin" metrics={mockMetrics} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
