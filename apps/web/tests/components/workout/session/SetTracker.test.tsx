import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetTracker } from '@/components/workout/session';
import type { SetRecord } from '@/types/workout';

// 테스트용 세트 데이터 생성
const createMockSets = (count: number = 3): SetRecord[] =>
  Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    targetReps: 12,
    status: 'pending' as const,
  }));

describe('SetTracker', () => {
  describe('렌더링', () => {
    it('세트 트래커가 올바르게 렌더링된다', () => {
      render(
        <SetTracker
          sets={createMockSets()}
          currentSetIndex={0}
          onCompleteSet={vi.fn()}
          onSkipSet={vi.fn()}
        />
      );

      expect(screen.getByTestId('set-tracker')).toBeInTheDocument();
    });

    it('모든 세트가 표시된다', () => {
      render(
        <SetTracker
          sets={createMockSets(3)}
          currentSetIndex={0}
          onCompleteSet={vi.fn()}
          onSkipSet={vi.fn()}
        />
      );

      expect(screen.getByText('세트 1')).toBeInTheDocument();
      expect(screen.getByText('세트 2')).toBeInTheDocument();
      expect(screen.getByText('세트 3')).toBeInTheDocument();
    });

    it('목표 횟수가 표시된다', () => {
      render(
        <SetTracker
          sets={createMockSets()}
          currentSetIndex={0}
          onCompleteSet={vi.fn()}
          onSkipSet={vi.fn()}
        />
      );

      // 12회가 3번 표시됨
      const repsTexts = screen.getAllByText('12회');
      expect(repsTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('세트 상태', () => {
    it('완료된 세트가 표시된다', () => {
      const sets: SetRecord[] = [
        { setNumber: 1, targetReps: 12, actualReps: 12, status: 'completed' },
        { setNumber: 2, targetReps: 12, actualReps: 12, status: 'completed' },
        { setNumber: 3, targetReps: 12, actualReps: 12, status: 'completed' },
      ];

      render(
        <SetTracker
          sets={sets}
          currentSetIndex={3} // 모든 세트 완료
          onCompleteSet={vi.fn()}
          onSkipSet={vi.fn()}
        />
      );

      // 완료된 세트들이 표시됨 (버튼 제외)
      const completedTexts = screen.getAllByText('12회 완료');
      expect(completedTexts.length).toBe(3);
    });

    it('건너뛴 세트가 표시된다', () => {
      const sets: SetRecord[] = [
        { setNumber: 1, targetReps: 12, status: 'skipped' },
        { setNumber: 2, targetReps: 12, status: 'pending' },
      ];

      render(
        <SetTracker
          sets={sets}
          currentSetIndex={1}
          onCompleteSet={vi.fn()}
          onSkipSet={vi.fn()}
        />
      );

      expect(screen.getByText('건너뜀')).toBeInTheDocument();
    });
  });

  describe('액션 버튼', () => {
    it('완료 버튼을 클릭하면 onCompleteSet이 호출된다', async () => {
      const onCompleteSet = vi.fn();
      const user = userEvent.setup();

      render(
        <SetTracker
          sets={createMockSets()}
          currentSetIndex={0}
          onCompleteSet={onCompleteSet}
          onSkipSet={vi.fn()}
        />
      );

      await user.click(screen.getByText('12회 완료'));

      expect(onCompleteSet).toHaveBeenCalled();
    });

    it('건너뛰기 버튼을 클릭하면 onSkipSet이 호출된다', async () => {
      const onSkipSet = vi.fn();
      const user = userEvent.setup();

      render(
        <SetTracker
          sets={createMockSets()}
          currentSetIndex={0}
          onCompleteSet={vi.fn()}
          onSkipSet={onSkipSet}
        />
      );

      await user.click(screen.getByText('건너뛰기'));

      expect(onSkipSet).toHaveBeenCalled();
    });

    it('모든 세트가 완료되면 액션 버튼이 표시되지 않는다', () => {
      const sets: SetRecord[] = [
        { setNumber: 1, targetReps: 12, actualReps: 12, status: 'completed' },
        { setNumber: 2, targetReps: 12, actualReps: 12, status: 'completed' },
        { setNumber: 3, targetReps: 12, actualReps: 12, status: 'completed' },
      ];

      render(
        <SetTracker
          sets={sets}
          currentSetIndex={3} // 범위 밖
          onCompleteSet={vi.fn()}
          onSkipSet={vi.fn()}
        />
      );

      // 완료 버튼이 없음 (결과 텍스트만 있음)
      expect(screen.queryByRole('button', { name: /완료/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '건너뛰기' })).not.toBeInTheDocument();
    });
  });

  describe('진행률 바', () => {
    it('진행률 바가 세트 수에 맞게 표시된다', () => {
      render(
        <SetTracker
          sets={createMockSets(4)}
          currentSetIndex={0}
          onCompleteSet={vi.fn()}
          onSkipSet={vi.fn()}
        />
      );

      // 4개의 진행률 세그먼트
      const container = screen.getByTestId('set-tracker');
      const progressBars = container.querySelector('.flex.items-center.gap-2');
      expect(progressBars?.children.length).toBe(4);
    });
  });
});
