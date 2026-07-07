/**
 * N-1 WorkoutInsightCard 컴포넌트 테스트
 * Task 3.8: W-1 운동 연동 알림
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WorkoutInsightCard from '@/components/nutrition/WorkoutInsightCard';
import type { WorkoutSummary } from '@/lib/nutrition/workoutInsight';

describe('WorkoutInsightCard', () => {
  // 테스트용 운동 요약 데이터
  const noWorkout: WorkoutSummary = {
    workoutCount: 0,
    totalDuration: 0,
    totalCaloriesBurned: 0,
    lastWorkoutTime: null,
  };

  const withWorkout: WorkoutSummary = {
    workoutCount: 2,
    totalDuration: 60,
    totalCaloriesBurned: 400,
    lastWorkoutTime: new Date(),
  };

  describe('렌더링', () => {
    it('기본 카드를 렌더링한다', () => {
      render(<WorkoutInsightCard workoutSummary={withWorkout} intakeCalories={1800} />);

      expect(screen.getByTestId('workout-insight-card')).toBeInTheDocument();
      // i18n: "칼로리 밸런스" 제목은 nutritionUI.workoutInsightCard4 키로 렌더 (테스트 목은 키 반환)
      expect(screen.getByText('workoutInsightCard4')).toBeInTheDocument();
    });

    it('로딩 중일 때 스켈레톤을 표시한다', () => {
      render(<WorkoutInsightCard workoutSummary={withWorkout} intakeCalories={1800} isLoading />);

      expect(screen.getByTestId('workout-insight-card-loading')).toBeInTheDocument();
    });

    it('W-1 연동 표시를 보여준다', () => {
      render(<WorkoutInsightCard workoutSummary={withWorkout} intakeCalories={1800} />);

      // i18n: "W-1 연동" 표시는 nutritionUI.workoutInsightCard5 키로 렌더
      expect(screen.getByText('workoutInsightCard5')).toBeInTheDocument();
    });
  });

  describe('운동 요약 섹션', () => {
    it('운동 기록이 없으면 빈 상태를 표시한다', () => {
      render(<WorkoutInsightCard workoutSummary={noWorkout} intakeCalories={1800} />);

      expect(screen.getByTestId('workout-summary-empty')).toBeInTheDocument();
      // i18n: "오늘 운동 기록 없음" 문구는 nutritionUI.workoutInsightCard3 키로 렌더
      expect(screen.getByText('workoutInsightCard3')).toBeInTheDocument();
    });

    it('운동 기록이 있으면 요약을 표시한다', () => {
      render(<WorkoutInsightCard workoutSummary={withWorkout} intakeCalories={1800} />);

      expect(screen.getByTestId('workout-summary-section')).toBeInTheDocument();
      expect(screen.getByText(/오늘 2회 운동 완료!/)).toBeInTheDocument();
      expect(screen.getByText(/60분/)).toBeInTheDocument();
      expect(screen.getByText(/400kcal 소모/)).toBeInTheDocument();
    });
  });

  describe('칼로리 밸런스 섹션', () => {
    it('섭취/소모/순 칼로리를 표시한다', () => {
      render(<WorkoutInsightCard workoutSummary={withWorkout} intakeCalories={1800} />);

      expect(screen.getByTestId('calorie-balance-section')).toBeInTheDocument();
      // i18n: 섭취/소모/순 칼로리 라벨은 nutritionUI.workoutInsightCard0~2 키로 렌더
      expect(screen.getByText('workoutInsightCard0')).toBeInTheDocument();
      expect(screen.getByText('workoutInsightCard1')).toBeInTheDocument();
      expect(screen.getByText('workoutInsightCard2')).toBeInTheDocument();
    });

    it('칼로리 값을 올바르게 표시한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={withWorkout}
          intakeCalories={1800}
          targetCalories={2000}
        />
      );

      // 섭취 1800
      expect(screen.getByText('1,800')).toBeInTheDocument();
      // 소모 400
      expect(screen.getByText('-400')).toBeInTheDocument();
      // 순 1400
      expect(screen.getByText('1,400')).toBeInTheDocument();
    });

    it('목표 칼로리를 표시한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={withWorkout}
          intakeCalories={1800}
          targetCalories={2000}
        />
      );

      expect(screen.getByText(/목표 2,000kcal/)).toBeInTheDocument();
    });

    it('진행률 바를 표시한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={withWorkout}
          intakeCalories={2000}
          targetCalories={2000}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });

  describe('칼로리 밸런스 상태별 스타일', () => {
    it('deficit 상태면 파란색 스타일을 적용한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={withWorkout}
          intakeCalories={1200}
          targetCalories={2000}
        />
      );

      const section = screen.getByTestId('calorie-balance-section');
      expect(section).toHaveClass('bg-blue-50');
    });

    it('balanced 상태면 초록색 스타일을 적용한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={withWorkout}
          intakeCalories={2200}
          targetCalories={2000}
        />
      );

      const section = screen.getByTestId('calorie-balance-section');
      expect(section).toHaveClass('bg-green-50');
    });

    it('surplus 상태면 빨간색 스타일을 적용한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      const section = screen.getByTestId('calorie-balance-section');
      expect(section).toHaveClass('bg-red-50');
    });
  });

  describe('운동 추천 버튼', () => {
    it('칼로리 초과 시 운동 추천 버튼을 표시한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByTestId('workout-recommend-button')).toBeInTheDocument();
    });

    it('운동 추천 버튼 클릭 시 핸들러를 호출한다', () => {
      const onNavigate = vi.fn();
      render(
        <WorkoutInsightCard
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
          onNavigateToWorkout={onNavigate}
        />
      );

      fireEvent.click(screen.getByTestId('workout-recommend-button'));

      expect(onNavigate).toHaveBeenCalled();
    });

    it('운동 추천 버튼에 예상 시간/칼로리를 표시한다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      // 추천 버튼 내에 예상 정보가 포함되어 있는지 확인
      const recommendButton = screen.getByTestId('workout-recommend-button');
      expect(recommendButton).toHaveTextContent(/분/);
      expect(recommendButton).toHaveTextContent(/kcal 소모 예상/);
    });

    it('balanced 상태면 운동 추천 버튼을 표시하지 않는다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={withWorkout}
          intakeCalories={2200}
          targetCalories={2000}
        />
      );

      expect(screen.queryByTestId('workout-recommend-button')).not.toBeInTheDocument();
    });
  });

  describe('기본값', () => {
    it('기본 목표 칼로리는 2000kcal다', () => {
      render(<WorkoutInsightCard workoutSummary={noWorkout} intakeCalories={2000} />);

      expect(screen.getByText(/목표 2,000kcal/)).toBeInTheDocument();
    });

    it('workoutSummary가 null이면 빈 상태로 처리한다', () => {
      render(<WorkoutInsightCard workoutSummary={null} intakeCalories={1800} />);

      expect(screen.getByTestId('workout-summary-empty')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('progressbar에 올바른 aria 속성이 있다', () => {
      render(
        <WorkoutInsightCard
          workoutSummary={withWorkout}
          intakeCalories={1600}
          targetCalories={2000}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-label');
    });
  });
});
