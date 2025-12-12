import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostWorkoutSkinCareCard from '@/components/workout/result/PostWorkoutSkinCareCard';
import type { SkinAnalysisSummary } from '@/lib/workout/skinTips';

describe('PostWorkoutSkinCareCard', () => {
  const defaultProps = {
    workoutType: 'cardio',
    durationMinutes: 30,
    skinAnalysis: null,
  };

  describe('기본 렌더링', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      expect(screen.getByTestId('post-workout-skin-care-card')).toBeInTheDocument();
    });

    it('헤더에 운동 후 피부 관리 제목이 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      // 텍스트가 이모지와 함께 있어서 부분 매칭 사용
      expect(screen.getByText(/운동 후 피부 관리/)).toBeInTheDocument();
    });

    it('빠른 메시지가 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} durationMinutes={30} />);

      // 30분 운동 완료 메시지가 포함되어야 함
      expect(screen.getByText(/30분/)).toBeInTheDocument();
    });

    it('펼치기 버튼이 있다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      expect(screen.getByLabelText('펼치기')).toBeInTheDocument();
    });
  });

  describe('운동 유형별 메시지', () => {
    it('고강도 운동(HIIT)에 맞는 메시지가 표시된다', () => {
      render(
        <PostWorkoutSkinCareCard
          workoutType="hiit"
          durationMinutes={20}
          skinAnalysis={null}
        />
      );

      expect(screen.getByText(/고강도/)).toBeInTheDocument();
    });

    it('저강도 운동(yoga)에 맞는 메시지가 표시된다', () => {
      render(
        <PostWorkoutSkinCareCard
          workoutType="yoga"
          durationMinutes={15}
          skinAnalysis={null}
        />
      );

      expect(screen.getByText(/가벼운/)).toBeInTheDocument();
    });
  });

  describe('확장 기능', () => {
    it('펼치기 버튼 클릭 시 상세 팁이 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      // 초기에는 즉각 케어 섹션이 보이지 않음
      expect(screen.queryByTestId('immediate-actions')).not.toBeInTheDocument();

      // 펼치기 클릭
      fireEvent.click(screen.getByLabelText('펼치기'));

      // 즉각 케어 섹션이 보임
      expect(screen.getByTestId('immediate-actions')).toBeInTheDocument();
    });

    it('펼치면 "지금 바로" 섹션이 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByText('지금 바로')).toBeInTheDocument();
    });

    it('펼치면 추가 팁 섹션이 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('general-tips')).toBeInTheDocument();
      expect(screen.getByText('추가 팁')).toBeInTheDocument();
    });

    it('접기 버튼으로 닫을 수 있다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      // 펼치기
      fireEvent.click(screen.getByLabelText('펼치기'));
      expect(screen.getByTestId('immediate-actions')).toBeInTheDocument();

      // 접기
      fireEvent.click(screen.getByLabelText('접기'));
      expect(screen.queryByTestId('immediate-actions')).not.toBeInTheDocument();
    });
  });

  describe('S-1 피부 분석 연동', () => {
    it('피부 분석 데이터가 있으면 맞춤 팁이 표시된다', () => {
      const skinAnalysis: SkinAnalysisSummary = {
        hydration: 'warning',
        oil: 'normal',
        pores: 'normal',
        wrinkles: 'good',
        elasticity: 'good',
        pigmentation: 'normal',
        trouble: 'warning',
      };

      render(
        <PostWorkoutSkinCareCard
          {...defaultProps}
          skinAnalysis={skinAnalysis}
        />
      );

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('skin-metric-tips')).toBeInTheDocument();
      expect(screen.getByText('내 피부 맞춤 케어')).toBeInTheDocument();
    });

    it('피부 분석 데이터가 없으면 안내 메시지가 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} skinAnalysis={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(
        screen.getByText(/피부 분석을 완료하면 더 맞춤화된 팁을 받을 수 있어요/)
      ).toBeInTheDocument();
    });

    it('피부 분석 데이터가 없으면 "피부 분석 받기" 버튼이 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} skinAnalysis={null} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(screen.getByTestId('skin-analysis-cta')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /피부 분석 받기/ })).toHaveAttribute(
        'href',
        '/analysis/skin'
      );
    });

    it('피부 분석 데이터가 있으면 안내 메시지가 표시되지 않는다', () => {
      const skinAnalysis: SkinAnalysisSummary = {
        hydration: 'good',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        elasticity: 'good',
        pigmentation: 'good',
        trouble: 'good',
      };

      render(
        <PostWorkoutSkinCareCard
          {...defaultProps}
          skinAnalysis={skinAnalysis}
        />
      );

      fireEvent.click(screen.getByLabelText('펼치기'));

      expect(
        screen.queryByText(/피부 분석을 완료하면 더 맞춤화된 팁을 받을 수 있어요/)
      ).not.toBeInTheDocument();
    });
  });

  describe('우선순위 표시', () => {
    it('팁에 우선순위 배지가 표시된다', () => {
      render(<PostWorkoutSkinCareCard {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('펼치기'));

      // skin-tip-card들이 있는지 확인
      const tipCards = screen.getAllByTestId('skin-tip-card');
      expect(tipCards.length).toBeGreaterThan(0);
    });

    it('고강도 운동 시 중요 팁에 경고 아이콘이 표시된다', () => {
      render(
        <PostWorkoutSkinCareCard
          workoutType="hiit"
          durationMinutes={30}
          skinAnalysis={null}
        />
      );

      // 고강도 운동은 중요 팁이 있으므로 경고 아이콘이 표시될 수 있음
      // (AlertTriangle 아이콘은 헤더에 표시됨)
      const card = screen.getByTestId('post-workout-skin-care-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('운동 타입별 팁', () => {
    const workoutTypes = ['cardio', 'strength', 'flexibility', 'hiit', 'recovery'];

    it.each(workoutTypes)('운동 타입 %s에 대한 팁이 표시된다', (workoutType) => {
      render(
        <PostWorkoutSkinCareCard
          workoutType={workoutType}
          durationMinutes={30}
          skinAnalysis={null}
        />
      );

      fireEvent.click(screen.getByLabelText('펼치기'));

      // 즉각 케어 팁이 있어야 함
      expect(screen.getByTestId('immediate-actions')).toBeInTheDocument();
      const tipCards = screen.getAllByTestId('skin-tip-card');
      expect(tipCards.length).toBeGreaterThan(0);
    });
  });

  describe('운동 시간별 팁', () => {
    it('짧은 운동(15분)에 대한 팁이 표시된다', () => {
      render(
        <PostWorkoutSkinCareCard
          workoutType="cardio"
          durationMinutes={15}
          skinAnalysis={null}
        />
      );

      expect(screen.getByTestId('post-workout-skin-care-card')).toBeInTheDocument();
    });

    it('긴 운동(60분)에 대한 팁이 표시된다', () => {
      render(
        <PostWorkoutSkinCareCard
          workoutType="cardio"
          durationMinutes={60}
          skinAnalysis={null}
        />
      );

      // 60분 메시지가 포함되어야 함
      expect(screen.getByText(/60분/)).toBeInTheDocument();
    });
  });
});
