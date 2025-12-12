import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakProgress } from '@/components/workout/streak';

describe('StreakProgress', () => {
  describe('렌더링', () => {
    it('올바르게 렌더링된다', () => {
      render(<StreakProgress currentStreak={3} />);

      expect(screen.getByTestId('streak-progress')).toBeInTheDocument();
    });

    it('현재 streak 진행도가 표시된다', () => {
      render(<StreakProgress currentStreak={3} targetDays={7} />);

      expect(screen.getByText('3/7일')).toBeInTheDocument();
    });

    it('완료된 날에 체크 아이콘이 표시된다', () => {
      render(<StreakProgress currentStreak={3} targetDays={7} />);

      // 3개의 완료 셀 (정확히 "완료"로 끝나는 것만)
      const completedCells = screen.getAllByLabelText(/일차 완료$/);
      expect(completedCells.length).toBe(3);
    });

    it('미완료 날이 표시된다', () => {
      render(<StreakProgress currentStreak={3} targetDays={7} />);

      // 4개의 미완료 셀
      const remainingCells = screen.getAllByLabelText(/일차 미완료$/);
      expect(remainingCells.length).toBe(4);
    });
  });

  describe('목표 달성', () => {
    it('목표 달성 시 메시지가 표시된다', () => {
      render(<StreakProgress currentStreak={7} targetDays={7} />);

      expect(screen.getByText(/목표 달성/)).toBeInTheDocument();
    });

    it('7일 초과해도 정상 표시된다', () => {
      render(<StreakProgress currentStreak={10} targetDays={7} />);

      // 모든 셀이 완료로 표시
      const completedCells = screen.getAllByLabelText(/완료/);
      expect(completedCells.length).toBe(7);
    });
  });

  describe('라벨 옵션', () => {
    it('showLabels=false면 라벨이 숨겨진다', () => {
      render(<StreakProgress currentStreak={3} showLabels={false} />);

      expect(screen.queryByText(/3\/7일/)).not.toBeInTheDocument();
    });
  });

  describe('다양한 targetDays', () => {
    it('3일 목표가 올바르게 표시된다', () => {
      render(<StreakProgress currentStreak={2} targetDays={3} />);

      expect(screen.getByText('2/3일')).toBeInTheDocument();
      // 2개의 완료 셀
      const completedCells = screen.getAllByLabelText(/일차 완료$/);
      expect(completedCells.length).toBe(2);
      // 1개의 미완료 셀
      const remainingCells = screen.getAllByLabelText(/일차 미완료$/);
      expect(remainingCells.length).toBe(1);
    });

    it('14일 목표가 올바르게 표시된다', () => {
      render(<StreakProgress currentStreak={5} targetDays={14} />);

      expect(screen.getByText('5/14일')).toBeInTheDocument();
    });
  });
});
