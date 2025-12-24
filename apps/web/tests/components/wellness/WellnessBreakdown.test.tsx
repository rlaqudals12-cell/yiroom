import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WellnessBreakdown } from '@/components/wellness/WellnessBreakdown';
import type { ScoreBreakdown } from '@/types/wellness';

const mockBreakdown: ScoreBreakdown = {
  workout: { streak: 8, frequency: 7, goal: 4 },
  nutrition: { calorie: 9, balance: 6, water: 5 },
  skin: { analysis: 10, routine: 8, matching: 3 },
  body: { analysis: 7, progress: 5, workout: 4 },
};

const emptyBreakdown: ScoreBreakdown = {
  workout: { streak: 0, frequency: 0, goal: 0 },
  nutrition: { calorie: 0, balance: 0, water: 0 },
  skin: { analysis: 0, routine: 0, matching: 0 },
  body: { analysis: 0, progress: 0, workout: 0 },
};

describe('WellnessBreakdown', () => {
  describe('렌더링', () => {
    it('기본 렌더링', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} />);
      expect(screen.getByTestId('wellness-breakdown')).toBeInTheDocument();
    });

    it('4개 영역 카드 표시', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} />);
      expect(screen.getByText('운동')).toBeInTheDocument();
      expect(screen.getByText('영양')).toBeInTheDocument();
      expect(screen.getByText('피부')).toBeInTheDocument();
      expect(screen.getByText('체형')).toBeInTheDocument();
    });

    it('각 영역별 총점 표시 (25점 만점)', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} />);
      // 운동: 8+7+4 = 19, 영양: 9+6+5 = 20, 피부: 10+8+3 = 21, 체형: 7+5+4 = 16
      expect(screen.getByText('19/25')).toBeInTheDocument();
      expect(screen.getByText('20/25')).toBeInTheDocument();
      expect(screen.getByText('21/25')).toBeInTheDocument();
      expect(screen.getByText('16/25')).toBeInTheDocument();
    });
  });

  describe('상세 항목', () => {
    it('showDetails=true면 세부 항목 표시', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} showDetails />);
      // 운동 세부 항목
      expect(screen.getByText('스트릭 유지')).toBeInTheDocument();
      expect(screen.getByText('운동 빈도')).toBeInTheDocument();
      expect(screen.getByText('목표 달성률')).toBeInTheDocument();
    });

    it('showDetails=false면 세부 항목 숨김', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} showDetails={false} />);
      expect(screen.queryByText('스트릭 유지')).not.toBeInTheDocument();
      expect(screen.queryByText('칼로리 목표')).not.toBeInTheDocument();
    });

    it('영양 세부 항목 표시', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} showDetails />);
      expect(screen.getByText('칼로리 목표')).toBeInTheDocument();
      expect(screen.getByText('영양소 균형')).toBeInTheDocument();
      expect(screen.getByText('수분 섭취')).toBeInTheDocument();
    });

    it('피부 세부 항목 표시', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} showDetails />);
      // 분석 완료는 피부 + 체형에서 각각 표시됨
      expect(screen.getAllByText('분석 완료').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('루틴 준수')).toBeInTheDocument();
      expect(screen.getByText('제품 매칭도')).toBeInTheDocument();
    });

    it('체형 세부 항목 표시', () => {
      render(<WellnessBreakdown breakdown={mockBreakdown} showDetails />);
      expect(screen.getAllByText('분석 완료')).toHaveLength(2); // 피부 + 체형
      expect(screen.getByText('목표 진행률')).toBeInTheDocument();
      expect(screen.getByText('운동 연동')).toBeInTheDocument();
    });
  });

  describe('점수 계산', () => {
    it('빈 점수도 정상 렌더링', () => {
      render(<WellnessBreakdown breakdown={emptyBreakdown} />);
      expect(screen.getAllByText('0/25')).toHaveLength(4);
    });

    it('만점 표시 (각 영역 25점)', () => {
      const perfectBreakdown: ScoreBreakdown = {
        workout: { streak: 10, frequency: 10, goal: 5 },
        nutrition: { calorie: 10, balance: 10, water: 5 },
        skin: { analysis: 10, routine: 10, matching: 5 },
        body: { analysis: 10, progress: 10, workout: 5 },
      };
      render(<WellnessBreakdown breakdown={perfectBreakdown} />);
      expect(screen.getAllByText('25/25')).toHaveLength(4);
    });

    it('세부 항목별 최대값 표시', () => {
      const { container } = render(<WellnessBreakdown breakdown={mockBreakdown} showDetails />);
      // 스트릭 8/10, 목표 달성률 4/5 등 값들이 존재하는지 확인
      expect(container.textContent).toContain('8/10');
      expect(container.textContent).toContain('4/5');
    });
  });

  describe('접근성', () => {
    it('영역별 색상 클래스 적용', () => {
      const { container } = render(<WellnessBreakdown breakdown={mockBreakdown} />);
      // 운동 - orange
      expect(container.querySelector('.text-orange-500')).toBeInTheDocument();
      // 영양 - green
      expect(container.querySelector('.text-green-500')).toBeInTheDocument();
      // 피부 - purple
      expect(container.querySelector('.text-purple-500')).toBeInTheDocument();
      // 체형 - blue
      expect(container.querySelector('.text-blue-500')).toBeInTheDocument();
    });
  });
});
