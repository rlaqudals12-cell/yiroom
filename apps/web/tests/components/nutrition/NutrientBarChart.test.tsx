/**
 * N-1 NutrientBarChart 컴포넌트 테스트
 * Task 3.4: 영양소 바 차트
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NutrientBarChart, {
  NutrientBar,
  type NutrientData,
} from '@/components/nutrition/NutrientBarChart';

describe('NutrientBarChart', () => {
  const defaultData: NutrientData[] = [
    { name: '탄수화물', current: 150, target: 250, unit: 'g', color: 'amber' },
    { name: '단백질', current: 50, target: 60, unit: 'g', color: 'blue' },
    { name: '지방', current: 40, target: 65, unit: 'g', color: 'rose' },
  ];

  describe('렌더링', () => {
    it('기본 컨테이너를 렌더링한다', () => {
      render(<NutrientBarChart data={defaultData} />);

      expect(screen.getByTestId('nutrient-bar-chart')).toBeInTheDocument();
    });

    it('커스텀 testId를 사용할 수 있다', () => {
      render(<NutrientBarChart data={defaultData} testId="custom-chart" />);

      expect(screen.getByTestId('custom-chart')).toBeInTheDocument();
    });

    it('모든 영양소 이름을 표시한다', () => {
      render(<NutrientBarChart data={defaultData} />);

      expect(screen.getByText('탄수화물')).toBeInTheDocument();
      expect(screen.getByText('단백질')).toBeInTheDocument();
      expect(screen.getByText('지방')).toBeInTheDocument();
    });

    it('각 영양소의 섭취량과 목표량을 표시한다', () => {
      render(<NutrientBarChart data={defaultData} />);

      // 탄수화물: 150 / 250g
      expect(screen.getByText(/150/)).toBeInTheDocument();
      expect(screen.getByText(/250g/)).toBeInTheDocument();
      // 단백질: 50 / 60g (getAllByText 사용 - 여러 곳에 나타날 수 있음)
      expect(screen.getAllByText(/50/).length).toBeGreaterThan(0);
      expect(screen.getByText(/60g/)).toBeInTheDocument();
    });

    it('제목을 표시할 수 있다', () => {
      render(<NutrientBarChart data={defaultData} title="영양소 섭취" />);

      expect(screen.getByText('영양소 섭취')).toBeInTheDocument();
    });
  });

  describe('접근성(a11y)', () => {
    it('각 바에 progressbar role이 있다', () => {
      render(<NutrientBarChart data={defaultData} />);

      const progressbars = screen.getAllByRole('progressbar');
      expect(progressbars).toHaveLength(3);
    });

    it('각 바에 올바른 aria-valuenow가 설정된다', () => {
      render(<NutrientBarChart data={defaultData} />);

      const progressbars = screen.getAllByRole('progressbar');
      // 탄수화물: 150/250 = 60%
      expect(progressbars[0]).toHaveAttribute('aria-valuenow', '60');
      // 단백질: 50/60 ≈ 83%
      expect(progressbars[1]).toHaveAttribute('aria-valuenow', '83');
      // 지방: 40/65 ≈ 62%
      expect(progressbars[2]).toHaveAttribute('aria-valuenow', '62');
    });

    it('각 바에 aria-valuemin과 aria-valuemax가 설정된다', () => {
      render(<NutrientBarChart data={defaultData} />);

      const progressbars = screen.getAllByRole('progressbar');
      progressbars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('각 바에 aria-label이 설정된다', () => {
      render(<NutrientBarChart data={defaultData} />);

      const progressbars = screen.getAllByRole('progressbar');
      expect(progressbars[0]).toHaveAttribute(
        'aria-label',
        '탄수화물 섭취 진행률 60%'
      );
    });
  });

  describe('퍼센트 계산', () => {
    it('정확한 퍼센트를 계산한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 75, target: 100, unit: 'g', color: 'blue' },
      ];
      render(<NutrientBarChart data={data} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });

    it('100% 초과 시에도 정확한 퍼센트를 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 150, target: 100, unit: 'g', color: 'blue' },
      ];
      render(<NutrientBarChart data={data} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '150');
    });

    it('0일 때 0%를 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 0, target: 100, unit: 'g', color: 'blue' },
      ];
      render(<NutrientBarChart data={data} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('목표가 0일 때 0%를 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 50, target: 0, unit: 'g', color: 'blue' },
      ];
      render(<NutrientBarChart data={data} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤 UI를 표시한다', () => {
      render(<NutrientBarChart data={defaultData} isLoading />);

      expect(
        screen.getByTestId('nutrient-bar-chart-loading')
      ).toBeInTheDocument();
    });

    it('로딩 중일 때 progressbar를 표시하지 않는다', () => {
      render(<NutrientBarChart data={defaultData} isLoading />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('색상 표시', () => {
    it('80% 미만일 때 정상 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 50, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(<NutrientBarChart data={data} />);

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-blue-500');
    });

    it('정확히 100%일 때 초과 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 100, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(<NutrientBarChart data={data} />);

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('100% 초과일 때 초과 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 120, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(<NutrientBarChart data={data} />);

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('각 색상 타입이 올바르게 적용된다', () => {
      const colorTests: Array<{ color: NutrientData['color']; expected: string }> = [
        { color: 'amber', expected: 'bg-amber-500' },
        { color: 'blue', expected: 'bg-blue-500' },
        { color: 'rose', expected: 'bg-rose-500' },
        { color: 'green', expected: 'bg-green-500' },
        { color: 'purple', expected: 'bg-purple-500' },
        { color: 'cyan', expected: 'bg-cyan-500' },
      ];

      colorTests.forEach(({ color, expected }) => {
        const data: NutrientData[] = [
          { name: '테스트', current: 50, target: 100, unit: 'g', color },
        ];
        const { container } = render(<NutrientBarChart data={data} />);
        const progressBar = container.querySelector('[data-progress-fill]');
        expect(progressBar).toHaveClass(expected);
      });
    });
  });

  describe('주의 구간 (showWarningThreshold)', () => {
    it('showWarningThreshold가 false일 때 80-100% 구간에서 정상 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 85, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(
        <NutrientBarChart data={data} showWarningThreshold={false} />
      );

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-blue-500');
    });

    it('showWarningThreshold가 true일 때 80-100% 구간에서 주의 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 85, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(
        <NutrientBarChart data={data} showWarningThreshold={true} />
      );

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-amber-500');
    });

    it('showWarningThreshold가 true일 때 정확히 80%에서 주의 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 80, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(
        <NutrientBarChart data={data} showWarningThreshold={true} />
      );

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-amber-500');
    });

    it('showWarningThreshold가 true여도 100% 이상에서는 초과 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 100, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(
        <NutrientBarChart data={data} showWarningThreshold={true} />
      );

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('showWarningThreshold가 true일 때 80% 미만에서는 정상 색상을 표시한다', () => {
      const data: NutrientData[] = [
        { name: '테스트', current: 79, target: 100, unit: 'g', color: 'blue' },
      ];
      const { container } = render(
        <NutrientBarChart data={data} showWarningThreshold={true} />
      );

      const progressBar = container.querySelector('[data-progress-fill]');
      expect(progressBar).toHaveClass('bg-blue-500');
    });
  });

  describe('빈 데이터', () => {
    it('빈 데이터일 때 빈 상태 메시지를 표시한다', () => {
      render(<NutrientBarChart data={[]} />);

      expect(screen.getByText(/영양소 데이터가 없습니다/)).toBeInTheDocument();
    });
  });
});

describe('NutrientBar', () => {
  const defaultProps = {
    name: '탄수화물',
    current: 150,
    target: 250,
    unit: 'g',
    color: 'amber' as const,
  };

  it('영양소 이름을 표시한다', () => {
    render(<NutrientBar {...defaultProps} />);

    expect(screen.getByText('탄수화물')).toBeInTheDocument();
  });

  it('현재 섭취량과 목표량을 표시한다', () => {
    render(<NutrientBar {...defaultProps} />);

    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/250g/)).toBeInTheDocument();
  });

  it('퍼센트를 표시한다', () => {
    render(<NutrientBar {...defaultProps} />);

    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('소수점 값을 올바르게 포맷한다', () => {
    render(<NutrientBar {...defaultProps} current={45.5} target={100} />);

    expect(screen.getByText(/45.5/)).toBeInTheDocument();
  });
});
