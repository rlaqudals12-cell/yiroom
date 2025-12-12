/**
 * N-1 DailyCalorieSummary 컴포넌트 테스트
 * Task 2.7: 식단 기록 화면
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DailyCalorieSummary from '@/components/nutrition/DailyCalorieSummary';

describe('DailyCalorieSummary', () => {
  const defaultSummary = {
    totalCalories: 1200,
    totalProtein: 50,
    totalCarbs: 150,
    totalFat: 40,
  };

  describe('렌더링', () => {
    it('기본 제목을 렌더링한다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} />);

      expect(screen.getByText(/오늘의 식단/)).toBeInTheDocument();
    });

    it('사용자 정의 제목을 렌더링한다', () => {
      render(
        <DailyCalorieSummary summary={defaultSummary} title="어제의 식단" />
      );

      expect(screen.getByText(/어제의 식단/)).toBeInTheDocument();
    });

    it('섭취 칼로리를 표시한다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} />);

      expect(screen.getByTestId('consumed-calories')).toHaveTextContent('1,200');
    });

    it('목표 칼로리를 표시한다', () => {
      render(
        <DailyCalorieSummary
          summary={defaultSummary}
          goal={{ calories: 2000 }}
        />
      );

      expect(screen.getByText(/2,000 kcal/)).toBeInTheDocument();
    });

    it('칼로리 비율을 표시한다', () => {
      render(
        <DailyCalorieSummary
          summary={defaultSummary}
          goal={{ calories: 2000 }}
        />
      );

      // 1200/2000 = 60%
      expect(screen.getByTestId('calorie-percentage')).toHaveTextContent('60%');
    });

    it('남은 칼로리를 표시한다', () => {
      render(
        <DailyCalorieSummary
          summary={defaultSummary}
          goal={{ calories: 2000 }}
        />
      );

      // 2000 - 1200 = 800
      expect(screen.getByTestId('remaining-calories')).toHaveTextContent('800');
    });

    it('탄단지 요약을 표시한다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} />);

      const macrosSummary = screen.getByTestId('macros-summary');
      expect(macrosSummary).toHaveTextContent('탄');
      expect(macrosSummary).toHaveTextContent('단');
      expect(macrosSummary).toHaveTextContent('지');
      expect(macrosSummary).toHaveTextContent('150g'); // 탄수화물
      expect(macrosSummary).toHaveTextContent('50g'); // 단백질
      expect(macrosSummary).toHaveTextContent('40g'); // 지방
    });
  });

  describe('칼로리 초과', () => {
    it('칼로리 초과 시 초과량을 표시한다', () => {
      const overSummary = {
        totalCalories: 2500,
        totalProtein: 80,
        totalCarbs: 300,
        totalFat: 100,
      };

      render(
        <DailyCalorieSummary
          summary={overSummary}
          goal={{ calories: 2000 }}
        />
      );

      expect(screen.getByTestId('remaining-calories')).toHaveTextContent(
        '500 kcal 초과'
      );
    });

    it('100% 이상일 때 비율이 100% 이상으로 표시된다', () => {
      const overSummary = {
        totalCalories: 2500,
        totalProtein: 80,
        totalCarbs: 300,
        totalFat: 100,
      };

      render(
        <DailyCalorieSummary
          summary={overSummary}
          goal={{ calories: 2000 }}
        />
      );

      // 2500/2000 = 125%
      expect(screen.getByTestId('calorie-percentage')).toHaveTextContent('125%');
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤 UI를 표시한다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} isLoading />);

      expect(
        screen.getByTestId('daily-calorie-summary-loading')
      ).toBeInTheDocument();
    });

    it('로딩 중일 때 실제 데이터를 표시하지 않는다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} isLoading />);

      expect(
        screen.queryByTestId('daily-calorie-summary')
      ).not.toBeInTheDocument();
    });
  });

  describe('기본값', () => {
    it('목표 칼로리 기본값은 2000이다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} />);

      expect(screen.getByText(/2,000 kcal/)).toBeInTheDocument();
    });

    it('0 칼로리일 때도 정상 렌더링된다', () => {
      const zeroSummary = {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };

      render(<DailyCalorieSummary summary={zeroSummary} />);

      expect(screen.getByTestId('consumed-calories')).toHaveTextContent('0');
      expect(screen.getByTestId('calorie-percentage')).toHaveTextContent('0%');
    });
  });

  describe('testid', () => {
    it('정상 상태에서 올바른 testid가 렌더링된다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} />);

      expect(screen.getByTestId('daily-calorie-summary')).toBeInTheDocument();
    });
  });

  describe('접근성(a11y)', () => {
    it('원형 진행률에 progressbar role이 있다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('원형 진행률에 올바른 aria-valuenow가 설정된다', () => {
      render(
        <DailyCalorieSummary
          summary={defaultSummary}
          goal={{ calories: 2000 }}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      // 1200/2000 = 60%
      expect(progressbar).toHaveAttribute('aria-valuenow', '60');
    });

    it('원형 진행률에 aria-valuemin과 aria-valuemax가 설정된다', () => {
      render(<DailyCalorieSummary summary={defaultSummary} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('원형 진행률에 aria-label이 설정된다', () => {
      render(
        <DailyCalorieSummary
          summary={defaultSummary}
          goal={{ calories: 2000 }}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', '칼로리 섭취 진행률 60%');
    });
  });
});
