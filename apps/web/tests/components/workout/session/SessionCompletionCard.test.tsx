import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionCompletionCard } from '@/components/workout/session';

describe('SessionCompletionCard', () => {
  const defaultProps = {
    totalExercises: 5,
    completedExercises: 5,
    totalSets: 15,
    completedSets: 15,
    totalTime: 1800, // 30분
    caloriesBurned: 300,
    totalVolume: 5400,
    onGoHome: vi.fn(),
  };

  describe('렌더링', () => {
    it('완료 카드가 올바르게 렌더링된다', () => {
      render(<SessionCompletionCard {...defaultProps} />);

      expect(screen.getByTestId('session-completion-card')).toBeInTheDocument();
      expect(screen.getByText('운동 완료!')).toBeInTheDocument();
    });

    it('운동 시간이 올바르게 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} totalTime={1800} />);

      expect(screen.getByText('30분 0초')).toBeInTheDocument();
    });

    it('소모 칼로리가 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} caloriesBurned={350} />);

      expect(screen.getByText('350')).toBeInTheDocument();
      expect(screen.getByText('kcal 소모')).toBeInTheDocument();
    });

    it('완료 세트가 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} totalSets={15} completedSets={12} />);

      expect(screen.getByText('12/15')).toBeInTheDocument();
      expect(screen.getByText('세트 완료')).toBeInTheDocument();
    });

    it('볼륨이 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} totalVolume={5400} />);

      expect(screen.getByText('5,400')).toBeInTheDocument();
      expect(screen.getByText('kg 볼륨')).toBeInTheDocument();
    });
  });

  describe('축하 메시지', () => {
    it('100% 완료 시 "완벽한 운동이었어요!" 메시지가 표시된다', () => {
      render(
        <SessionCompletionCard
          {...defaultProps}
          totalExercises={5}
          completedExercises={5}
          totalSets={15}
          completedSets={15}
        />
      );

      expect(screen.getByText('완벽한 운동이었어요!')).toBeInTheDocument();
    });

    it('80% 이상 완료 시 "거의 다 해냈어요!" 메시지가 표시된다', () => {
      render(
        <SessionCompletionCard
          {...defaultProps}
          totalSets={15}
          completedSets={12} // 80%
        />
      );

      expect(screen.getByText('거의 다 해냈어요!')).toBeInTheDocument();
    });

    it('50% 이상 완료 시 "절반 이상 완료했어요!" 메시지가 표시된다', () => {
      render(
        <SessionCompletionCard
          {...defaultProps}
          totalSets={20}
          completedSets={10} // 50%
        />
      );

      expect(screen.getByText('절반 이상 완료했어요!')).toBeInTheDocument();
    });

    it('50% 미만 완료 시 "오늘도 운동했어요!" 메시지가 표시된다', () => {
      render(
        <SessionCompletionCard
          {...defaultProps}
          totalSets={20}
          completedSets={5} // 25%
        />
      );

      expect(screen.getByText('오늘도 운동했어요!')).toBeInTheDocument();
    });
  });

  describe('Streak 표시', () => {
    it('연속 기록이 있으면 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} currentStreak={7} />);

      expect(screen.getByText('7일 연속 운동 중!')).toBeInTheDocument();
    });

    it('연속 기록이 0이면 표시되지 않는다', () => {
      render(<SessionCompletionCard {...defaultProps} currentStreak={0} />);

      expect(screen.queryByText(/연속 운동 중/)).not.toBeInTheDocument();
    });
  });

  describe('신기록 표시', () => {
    it('신기록이면 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} isNewRecord={true} />);

      expect(screen.getByText('새로운 기록 달성!')).toBeInTheDocument();
    });

    it('신기록이 아니면 표시되지 않는다', () => {
      render(<SessionCompletionCard {...defaultProps} isNewRecord={false} />);

      expect(screen.queryByText('새로운 기록 달성!')).not.toBeInTheDocument();
    });
  });

  describe('달성률', () => {
    it('달성률이 계산되어 표시된다', () => {
      render(
        <SessionCompletionCard
          {...defaultProps}
          totalSets={10}
          completedSets={7} // 70%
        />
      );

      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('달성률')).toBeInTheDocument();
    });
  });

  describe('S-1 피부 관리 팁 연동', () => {
    it('피부 관리 팁 섹션이 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} />);

      expect(screen.getByTestId('skin-care-tip')).toBeInTheDocument();
    });

    it('피부 관리 메시지가 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} />);

      expect(screen.getByText(/땀을 많이 흘렸으니 세안 후 수분 보충 추천/)).toBeInTheDocument();
    });

    it('피부 분석 받기 링크가 있다', () => {
      render(<SessionCompletionCard {...defaultProps} />);

      expect(screen.getByRole('link', { name: /피부 분석 받기/ })).toHaveAttribute(
        'href',
        '/analysis/skin'
      );
    });
  });

  describe('N-1 영양 추천 연동 (P3-5.2)', () => {
    it('영양 추천 섹션이 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} />);

      expect(screen.getByTestId('nutrition-recommendation')).toBeInTheDocument();
    });

    it('단백질 권장량이 표시된다', () => {
      render(<SessionCompletionCard {...defaultProps} workoutType="builder" bodyWeightKg={60} />);

      // builder 타입, 60kg 기준: 15-24g
      expect(screen.getByText(/단백질 권장: \d+-\d+g/)).toBeInTheDocument();
    });

    it('식단 분석 받기 링크가 있다', () => {
      render(<SessionCompletionCard {...defaultProps} />);

      expect(screen.getByRole('link', { name: /식단 분석 받기/ })).toHaveAttribute(
        'href',
        '/nutrition'
      );
    });

    it('운동 타입에 따라 다른 메시지가 표시된다 - builder', () => {
      render(<SessionCompletionCard {...defaultProps} workoutType="builder" totalTime={1800} caloriesBurned={300} />);

      expect(screen.getByText(/단백질을 섭취하면 근육 성장에 효과적/)).toBeInTheDocument();
    });

    it('운동 타입에 따라 다른 메시지가 표시된다 - burner', () => {
      render(<SessionCompletionCard {...defaultProps} workoutType="burner" totalTime={2400} caloriesBurned={400} />);

      expect(screen.getByText(/탄수화물과 단백질을 함께 섭취/)).toBeInTheDocument();
    });
  });

  describe('버튼 동작', () => {
    it('홈으로 돌아가기 버튼을 클릭하면 onGoHome이 호출된다', async () => {
      const onGoHome = vi.fn();
      const user = userEvent.setup();

      render(<SessionCompletionCard {...defaultProps} onGoHome={onGoHome} />);

      await user.click(screen.getByText('홈으로 돌아가기'));

      expect(onGoHome).toHaveBeenCalled();
    });

    it('공유 버튼이 있으면 표시된다', () => {
      const onShare = vi.fn();

      render(<SessionCompletionCard {...defaultProps} onShare={onShare} />);

      expect(screen.getByText('기록 공유하기')).toBeInTheDocument();
    });

    it('공유 버튼을 클릭하면 onShare가 호출된다', async () => {
      const onShare = vi.fn();
      const user = userEvent.setup();

      render(<SessionCompletionCard {...defaultProps} onShare={onShare} />);

      await user.click(screen.getByText('기록 공유하기'));

      expect(onShare).toHaveBeenCalled();
    });
  });
});
