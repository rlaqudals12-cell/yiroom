import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Clock: (props: Record<string, unknown>) => <div data-testid="icon-Clock" {...props} />,
  Flame: (props: Record<string, unknown>) => <div data-testid="icon-Flame" {...props} />,
  Calendar: (props: Record<string, unknown>) => <div data-testid="icon-Calendar" {...props} />,
  TrendingUp: (props: Record<string, unknown>) => <div data-testid="icon-TrendingUp" {...props} />,
}));

import { vi } from 'vitest';
import { PlanSummaryCard } from '@/components/workout/plan/PlanSummaryCard';

const defaultProps = {
  workoutDays: 5,
  restDays: 2,
  totalMinutes: 250,
  totalCalories: 1500,
  avgMinutesPerDay: 50,
  avgCaloriesPerDay: 300,
  bodyPartDistribution: {
    upper: 0.3,
    lower: 0.35,
    core: 0.2,
    cardio: 0.15,
  },
};

describe('PlanSummaryCard', () => {
  it('data-testid가 존재한다', () => {
    render(<PlanSummaryCard {...defaultProps} />);
    expect(screen.getByTestId('plan-summary-card')).toBeInTheDocument();
  });

  it('주간 플랜 요약 타이틀이 표시된다', () => {
    render(<PlanSummaryCard {...defaultProps} />);
    expect(screen.getByText('주간 플랜 요약')).toBeInTheDocument();
  });

  describe('주요 지표', () => {
    it('운동일 수를 표시한다', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('운동일')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('/7일')).toBeInTheDocument();
    });

    it('휴식일 수를 표시한다', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('휴식일')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('주간 총 시간을 표시한다', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('주간 총 시간')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('하루 평균 50분')).toBeInTheDocument();
    });

    it('예상 소모 칼로리를 표시한다', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('예상 소모')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('하루 평균 300kcal')).toBeInTheDocument();
    });
  });

  describe('부위별 운동 비율', () => {
    it('부위 라벨이 한글로 표시된다', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('부위별 운동 비율')).toBeInTheDocument();
      expect(screen.getByText('상체')).toBeInTheDocument();
      expect(screen.getByText('하체')).toBeInTheDocument();
      expect(screen.getByText('코어')).toBeInTheDocument();
      expect(screen.getByText('유산소')).toBeInTheDocument();
    });

    it('퍼센티지를 표시한다', () => {
      render(<PlanSummaryCard {...defaultProps} />);
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
    });

    it('0% 비율의 카테고리는 표시하지 않는다', () => {
      render(
        <PlanSummaryCard
          {...defaultProps}
          bodyPartDistribution={{ upper: 0.5, lower: 0.5, core: 0, cardio: 0 }}
        />
      );
      expect(screen.getByText('상체')).toBeInTheDocument();
      expect(screen.getByText('하체')).toBeInTheDocument();
      expect(screen.queryByText('코어')).not.toBeInTheDocument();
      expect(screen.queryByText('유산소')).not.toBeInTheDocument();
    });

    it('비율이 높은 순으로 정렬된다', () => {
      const { container } = render(<PlanSummaryCard {...defaultProps} />);
      const labels = container.querySelectorAll('.w-12');
      const texts = Array.from(labels).map((el) => el.textContent);
      // 하체(35%) > 상체(30%) > 코어(20%) > 유산소(15%)
      expect(texts).toEqual(['하체', '상체', '코어', '유산소']);
    });
  });

  describe('엣지 케이스', () => {
    it('알 수 없는 카테고리는 원본 키를 표시한다', () => {
      render(<PlanSummaryCard {...defaultProps} bodyPartDistribution={{ unknown_cat: 1.0 }} />);
      expect(screen.getByText('unknown_cat')).toBeInTheDocument();
    });
  });
});
