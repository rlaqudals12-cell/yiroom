import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseSessionCard } from '@/components/workout/session';
import type { ExerciseSessionRecord } from '@/types/workout';

// 테스트용 레코드 생성
const createMockRecord = (overrides?: Partial<ExerciseSessionRecord>): ExerciseSessionRecord => ({
  exerciseId: 'ex-001',
  exerciseName: '스쿼트',
  category: 'lower',
  sets: [
    { setNumber: 1, targetReps: 12, status: 'pending' },
    { setNumber: 2, targetReps: 12, status: 'pending' },
    { setNumber: 3, targetReps: 12, status: 'pending' },
  ],
  restSeconds: 60,
  isCompleted: false,
  ...overrides,
});

describe('ExerciseSessionCard', () => {
  const defaultProps = {
    record: createMockRecord(),
    exerciseIndex: 0,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    onStartExercise: vi.fn(),
    onCompleteSet: vi.fn(),
    onSkipSet: vi.fn(),
    onSkipExercise: vi.fn(),
    onViewDetail: vi.fn(),
  };

  describe('렌더링', () => {
    it('운동 세션 카드가 올바르게 렌더링된다', () => {
      render(<ExerciseSessionCard {...defaultProps} />);

      expect(screen.getByTestId('exercise-session-card-0')).toBeInTheDocument();
      expect(screen.getByText('스쿼트')).toBeInTheDocument();
    });

    it('카테고리가 한글로 표시된다', () => {
      render(<ExerciseSessionCard {...defaultProps} />);

      expect(screen.getByText('하체')).toBeInTheDocument();
    });

    it('세트 진행률이 표시된다', () => {
      render(<ExerciseSessionCard {...defaultProps} />);

      expect(screen.getByText('0/3 세트')).toBeInTheDocument();
    });
  });

  describe('현재 운동 상태', () => {
    it('현재 운동일 때 SetTracker가 표시된다', () => {
      const record = createMockRecord({
        startedAt: new Date().toISOString(),
        sets: [
          { setNumber: 1, targetReps: 12, status: 'in_progress' },
          { setNumber: 2, targetReps: 12, status: 'pending' },
          { setNumber: 3, targetReps: 12, status: 'pending' },
        ],
      });

      render(
        <ExerciseSessionCard
          {...defaultProps}
          record={record}
          exerciseIndex={0}
          currentExerciseIndex={0}
        />
      );

      expect(screen.getByTestId('set-tracker')).toBeInTheDocument();
    });

    it('자세 가이드 버튼이 표시된다', () => {
      const record = createMockRecord({
        startedAt: new Date().toISOString(),
        sets: [
          { setNumber: 1, targetReps: 12, status: 'in_progress' },
          { setNumber: 2, targetReps: 12, status: 'pending' },
          { setNumber: 3, targetReps: 12, status: 'pending' },
        ],
      });

      render(
        <ExerciseSessionCard
          {...defaultProps}
          record={record}
          exerciseIndex={0}
          currentExerciseIndex={0}
        />
      );

      expect(screen.getByText('자세 가이드')).toBeInTheDocument();
    });

    it('운동 건너뛰기 버튼이 표시된다', () => {
      const record = createMockRecord({
        startedAt: new Date().toISOString(),
        sets: [
          { setNumber: 1, targetReps: 12, status: 'in_progress' },
          { setNumber: 2, targetReps: 12, status: 'pending' },
          { setNumber: 3, targetReps: 12, status: 'pending' },
        ],
      });

      render(
        <ExerciseSessionCard
          {...defaultProps}
          record={record}
          exerciseIndex={0}
          currentExerciseIndex={0}
        />
      );

      expect(screen.getByText('운동 건너뛰기')).toBeInTheDocument();
    });
  });

  describe('대기 중인 운동', () => {
    it('대기 중인 운동은 시작 버튼이 표시된다', () => {
      render(
        <ExerciseSessionCard
          {...defaultProps}
          exerciseIndex={1}
          currentExerciseIndex={0}
        />
      );

      // 카드를 클릭하여 확장
      fireEvent.click(screen.getByText('스쿼트'));

      expect(screen.getByText('운동 시작')).toBeInTheDocument();
    });

    it('운동 시작 버튼을 클릭하면 onStartExercise가 호출된다', async () => {
      const onStartExercise = vi.fn();
      const user = userEvent.setup();

      render(
        <ExerciseSessionCard
          {...defaultProps}
          onStartExercise={onStartExercise}
          exerciseIndex={1}
          currentExerciseIndex={0}
        />
      );

      // 카드를 클릭하여 확장
      fireEvent.click(screen.getByText('스쿼트'));

      await user.click(screen.getByText('운동 시작'));

      expect(onStartExercise).toHaveBeenCalled();
    });
  });

  describe('완료된 운동', () => {
    it('완료된 운동은 완료 표시가 된다', () => {
      const record = createMockRecord({
        isCompleted: true,
        sets: [
          { setNumber: 1, targetReps: 12, actualReps: 12, status: 'completed' },
          { setNumber: 2, targetReps: 12, actualReps: 12, status: 'completed' },
          { setNumber: 3, targetReps: 12, actualReps: 12, status: 'completed' },
        ],
      });

      render(<ExerciseSessionCard {...defaultProps} record={record} />);

      expect(screen.getByText('완료')).toBeInTheDocument();
    });

    it('완료된 운동은 요약 통계가 표시된다', () => {
      const record = createMockRecord({
        isCompleted: true,
        sets: [
          { setNumber: 1, targetReps: 12, actualReps: 12, status: 'completed' },
          { setNumber: 2, targetReps: 12, actualReps: 10, status: 'completed' },
          { setNumber: 3, targetReps: 12, actualReps: 8, status: 'completed' },
        ],
      });

      // 완료된 운동 (currentExerciseIndex=1이면 기본적으로 축소됨)
      render(
        <ExerciseSessionCard
          {...defaultProps}
          record={record}
          exerciseIndex={0}
          currentExerciseIndex={1}
        />
      );

      // 카드 클릭하여 확장
      fireEvent.click(screen.getByText('스쿼트'));

      expect(screen.getByText('완료 세트')).toBeInTheDocument();
      expect(screen.getByText('총 횟수')).toBeInTheDocument();
      expect(screen.getByText('휴식 시간')).toBeInTheDocument();
    });
  });

  describe('확장/축소', () => {
    it('카드 클릭 시 확장/축소된다', () => {
      render(<ExerciseSessionCard {...defaultProps} />);

      // 기본적으로 현재 운동은 확장됨
      expect(screen.getByTestId('set-tracker')).toBeInTheDocument();

      // 헤더 클릭으로 축소
      fireEvent.click(screen.getByText('스쿼트'));

      // SetTracker가 사라짐
      expect(screen.queryByTestId('set-tracker')).not.toBeInTheDocument();
    });
  });

  describe('액션 버튼', () => {
    it('자세 가이드 버튼 클릭 시 onViewDetail이 호출된다', async () => {
      const onViewDetail = vi.fn();
      const user = userEvent.setup();
      const record = createMockRecord({
        startedAt: new Date().toISOString(),
        sets: [
          { setNumber: 1, targetReps: 12, status: 'in_progress' },
          { setNumber: 2, targetReps: 12, status: 'pending' },
          { setNumber: 3, targetReps: 12, status: 'pending' },
        ],
      });

      render(
        <ExerciseSessionCard
          {...defaultProps}
          record={record}
          onViewDetail={onViewDetail}
        />
      );

      await user.click(screen.getByText('자세 가이드'));

      expect(onViewDetail).toHaveBeenCalled();
    });

    it('운동 건너뛰기 버튼 클릭 시 onSkipExercise가 호출된다', async () => {
      const onSkipExercise = vi.fn();
      const user = userEvent.setup();
      const record = createMockRecord({
        startedAt: new Date().toISOString(),
        sets: [
          { setNumber: 1, targetReps: 12, status: 'in_progress' },
          { setNumber: 2, targetReps: 12, status: 'pending' },
          { setNumber: 3, targetReps: 12, status: 'pending' },
        ],
      });

      render(
        <ExerciseSessionCard
          {...defaultProps}
          record={record}
          onSkipExercise={onSkipExercise}
        />
      );

      await user.click(screen.getByText('운동 건너뛰기'));

      expect(onSkipExercise).toHaveBeenCalled();
    });
  });
});
