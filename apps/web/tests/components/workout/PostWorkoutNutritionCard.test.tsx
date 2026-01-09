import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostWorkoutNutritionCard from '@/components/workout/result/PostWorkoutNutritionCard';

describe('PostWorkoutNutritionCard', () => {
  const defaultProps = {
    workoutType: 'builder' as const,
    durationMinutes: 30,
  };

  describe('기본 렌더링', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      expect(screen.getByTestId('post-workout-nutrition-card')).toBeInTheDocument();
    });

    it('헤더에 운동 후 영양 가이드 제목이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      expect(screen.getByText(/운동 후 영양 가이드/)).toBeInTheDocument();
    });

    it('소모 칼로리가 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} caloriesBurned={250} />);

      expect(screen.getByText(/250kcal/)).toBeInTheDocument();
    });

    it('펼치기 버튼이 있다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      expect(screen.getByLabelText('펼치기')).toBeInTheDocument();
    });
  });

  describe('운동 타입별 메시지', () => {
    it('builder 운동에 단백질 메시지가 표시된다', () => {
      render(<PostWorkoutNutritionCard workoutType="builder" durationMinutes={30} />);

      expect(screen.getByText(/단백질/)).toBeInTheDocument();
    });

    it('burner 운동에 탄수화물 메시지가 표시된다', () => {
      render(<PostWorkoutNutritionCard workoutType="burner" durationMinutes={30} />);

      expect(screen.getByText(/탄수화물/)).toBeInTheDocument();
    });
  });

  describe('확장 기능', () => {
    it('펼치기 버튼 클릭 시 상세 팁이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      // 초기에는 타이밍 정보가 보이지 않음
      expect(screen.queryByTestId('timing-info')).not.toBeInTheDocument();

      // 펼치기 클릭
      fireEvent.click(screen.getByLabelText('펼치기'));

      // 타이밍 정보가 보임
      expect(screen.getByTestId('timing-info')).toBeInTheDocument();
    });

    it('펼치면 섭취 타이밍이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByText('섭취 타이밍')).toBeInTheDocument();
      expect(screen.getByText(/30분 이내/)).toBeInTheDocument();
    });

    it('펼치면 단백질 권장량이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} bodyWeightKg={60} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('protein-recommendation')).toBeInTheDocument();
      expect(screen.getByText('단백질 권장량')).toBeInTheDocument();
    });

    it('펼치면 단백질 팁 섹션이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('protein-tips')).toBeInTheDocument();
      expect(screen.getByText('단백질 보충')).toBeInTheDocument();
    });

    it('펼치면 식사 추천 섹션이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('meal-tips')).toBeInTheDocument();
      expect(screen.getByText('식사 추천')).toBeInTheDocument();
    });

    it('펼치면 수분 보충 팁이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('hydration-tip')).toBeInTheDocument();
      expect(screen.getByText('수분 보충')).toBeInTheDocument();
    });

    it('접기 버튼으로 닫을 수 있다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      // 펼치기
      fireEvent.click(screen.getByLabelText('펼치기'));
      expect(screen.getByTestId('timing-info')).toBeInTheDocument();

      // 접기
      fireEvent.click(screen.getByLabelText('접기'));
      expect(screen.queryByTestId('timing-info')).not.toBeInTheDocument();
    });
  });

  describe('N-1 연동 CTA', () => {
    it('식단 분석 받기 버튼이 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('nutrition-analysis-cta')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /식단 분석 받기/ })).toHaveAttribute(
        'href',
        '/nutrition'
      );
    });

    it('N-1 출시 예정 안내 문구가 표시된다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByText(/N-1 영양 모듈 출시 예정/)).toBeInTheDocument();
    });
  });

  describe('운동 타입별 팁', () => {
    const workoutTypes = ['toner', 'builder', 'burner', 'mover', 'flexer'] as const;

    it.each(workoutTypes)('운동 타입 %s에 대한 팁이 표시된다', (workoutType) => {
      render(<PostWorkoutNutritionCard workoutType={workoutType} durationMinutes={30} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      // 영양 팁 카드가 있어야 함
      const tipCards = screen.getAllByTestId('nutrition-tip-card');
      expect(tipCards.length).toBeGreaterThan(0);
    });
  });

  describe('칼로리 계산', () => {
    it('caloriesBurned prop이 제공되면 해당 값을 사용한다', () => {
      render(<PostWorkoutNutritionCard {...defaultProps} caloriesBurned={500} />);

      expect(screen.getByText(/500kcal/)).toBeInTheDocument();
    });

    it('caloriesBurned가 없으면 자동 계산된다', () => {
      render(
        <PostWorkoutNutritionCard workoutType="builder" durationMinutes={30} bodyWeightKg={60} />
      );

      // builder 30분 60kg = 8 * 30 = 240kcal
      expect(screen.getByText(/240kcal/)).toBeInTheDocument();
    });
  });
});
