/**
 * N-1 CalorieSurplusAlert 컴포넌트 테스트
 * P3-5.1: 칼로리 초과 운동 유도
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalorieSurplusAlert from '@/components/nutrition/CalorieSurplusAlert';
import type { WorkoutSummary } from '@/lib/nutrition/workoutInsight';

describe('CalorieSurplusAlert', () => {
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

  describe('렌더링 조건', () => {
    it('칼로리 초과 시 알림을 표시한다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByTestId('calorie-surplus-alert')).toBeInTheDocument();
    });

    it('칼로리 균형 시 알림을 표시하지 않는다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2000}
          targetCalories={2000}
        />
      );

      expect(screen.queryByTestId('calorie-surplus-alert')).not.toBeInTheDocument();
    });

    it('칼로리 부족 시 알림을 표시하지 않는다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={1500}
          targetCalories={2000}
        />
      );

      expect(screen.queryByTestId('calorie-surplus-alert')).not.toBeInTheDocument();
    });

    it('로딩 중일 때 알림을 표시하지 않는다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
          isLoading
        />
      );

      expect(screen.queryByTestId('calorie-surplus-alert')).not.toBeInTheDocument();
    });

    it('운동으로 칼로리를 상쇄하면 알림을 표시하지 않는다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={withWorkout}
          intakeCalories={2200}
          targetCalories={2000}
        />
      );

      // 2200 - 400(운동 소모) = 1800 순 칼로리 (목표 내)
      expect(screen.queryByTestId('calorie-surplus-alert')).not.toBeInTheDocument();
    });
  });

  describe('알림 레벨', () => {
    it('200~400kcal 초과 시 warning 스타일을 적용한다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2300}
          targetCalories={2000}
        />
      );

      const alert = screen.getByTestId('calorie-surplus-alert');
      expect(alert).toHaveClass('bg-amber-50');
      expect(screen.getByText('칼로리 초과')).toBeInTheDocument();
    });

    it('400kcal 이상 초과 시 danger 스타일을 적용한다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2600}
          targetCalories={2000}
        />
      );

      const alert = screen.getByTestId('calorie-surplus-alert');
      expect(alert).toHaveClass('bg-red-50');
      expect(screen.getByText('칼로리 초과 주의!')).toBeInTheDocument();
    });
  });

  describe('알림 내용', () => {
    it('초과량을 표시한다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByText('500kcal')).toBeInTheDocument();
    });

    it('추천 운동 시간을 표시한다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      // 운동 추천 정보가 표시되어야 함
      expect(screen.getByText(/분 운동으로 균형 맞추기/)).toBeInTheDocument();
    });

    it('예상 소모 칼로리를 표시한다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByText(/kcal 소모 예상/)).toBeInTheDocument();
    });
  });

  describe('닫기 기능', () => {
    it('닫기 버튼을 클릭하면 알림이 사라진다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByTestId('calorie-surplus-alert')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('calorie-surplus-alert-dismiss'));

      expect(screen.queryByTestId('calorie-surplus-alert')).not.toBeInTheDocument();
    });
  });

  describe('CTA 버튼', () => {
    it('운동하러 가기 버튼이 표시된다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByTestId('calorie-surplus-alert-cta')).toBeInTheDocument();
      expect(screen.getByText('운동하러 가기')).toBeInTheDocument();
    });

    it('버튼 클릭 시 핸들러를 호출한다', () => {
      const onNavigate = vi.fn();
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
          onNavigateToWorkout={onNavigate}
        />
      );

      fireEvent.click(screen.getByTestId('calorie-surplus-alert-cta'));

      expect(onNavigate).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('role="alert" 속성이 있다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('닫기 버튼에 aria-label이 있다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2500}
          targetCalories={2000}
        />
      );

      expect(screen.getByLabelText('알림 닫기')).toBeInTheDocument();
    });
  });

  describe('기본값', () => {
    it('기본 목표 칼로리는 2000kcal다', () => {
      render(
        <CalorieSurplusAlert
          workoutSummary={noWorkout}
          intakeCalories={2300}
        />
      );

      // 2300 - 2000 = 300kcal 초과
      expect(screen.getByText('300kcal')).toBeInTheDocument();
    });
  });
});
