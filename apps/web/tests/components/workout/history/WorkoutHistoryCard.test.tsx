import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutHistoryCard } from '@/components/workout/history';
import type { WorkoutLog } from '@/lib/api/workout';

describe('WorkoutHistoryCard', () => {
  const mockLog: WorkoutLog = {
    id: 'log-1',
    user_id: 'user-1',
    plan_id: 'plan-1',
    workout_date: '2025-11-28',
    completed_at: '2025-11-28T10:00:00Z',
    actual_duration: 45,
    actual_calories: 320,
    total_volume: 4500,
    exercise_logs: [
      {
        exercise_id: 'ex1',
        exercise_name: '벤치프레스',
        sets: [
          { reps: 12, weight: 40, completed: true },
          { reps: 10, weight: 45, completed: true },
        ],
      },
      {
        exercise_id: 'ex2',
        exercise_name: '덤벨 플라이',
        sets: [{ reps: 12, weight: 10, completed: true }],
      },
      {
        exercise_id: 'ex3',
        exercise_name: '푸쉬업',
        sets: [{ reps: 15, completed: true }],
      },
    ],
    created_at: '2025-11-28T10:00:00Z',
  };

  describe('렌더링', () => {
    it('운동 기록 카드가 올바르게 렌더링된다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      expect(screen.getByTestId('workout-history-card')).toBeInTheDocument();
    });

    it('날짜가 올바르게 표시된다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      // 11/28 (금)
      expect(screen.getByText(/11\/28/)).toBeInTheDocument();
    });

    it('완료된 운동 수가 표시된다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      expect(screen.getByText('3/3개 운동 완료')).toBeInTheDocument();
    });

    it('운동 시간이 표시된다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      expect(screen.getByText('45분')).toBeInTheDocument();
    });

    it('소모 칼로리가 표시된다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      expect(screen.getByText('320')).toBeInTheDocument();
    });

    it('볼륨이 표시된다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      expect(screen.getByText('4,500')).toBeInTheDocument();
    });

    it('운동 목록이 표시된다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      expect(screen.getByText(/벤치프레스, 덤벨 플라이, 푸쉬업/)).toBeInTheDocument();
    });
  });

  describe('메모 표시', () => {
    it('메모가 있으면 표시된다', () => {
      const logWithNotes: WorkoutLog = {
        ...mockLog,
        notes: '오늘 컨디션 좋았음',
      };

      render(<WorkoutHistoryCard log={logWithNotes} />);

      expect(screen.getByText(/오늘 컨디션 좋았음/)).toBeInTheDocument();
    });

    it('메모가 없으면 표시되지 않는다', () => {
      render(<WorkoutHistoryCard log={mockLog} />);

      expect(screen.queryByText(/"/)).not.toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('클릭하면 onClick이 호출된다', () => {
      const onClick = vi.fn();
      render(<WorkoutHistoryCard log={mockLog} onClick={onClick} />);

      fireEvent.click(screen.getByTestId('workout-history-card'));

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('시간 포맷팅', () => {
    it('1시간 이상일 때 시간 단위로 표시된다', () => {
      const longLog: WorkoutLog = {
        ...mockLog,
        actual_duration: 90,
      };

      render(<WorkoutHistoryCard log={longLog} />);

      expect(screen.getByText('1시간 30분')).toBeInTheDocument();
    });

    it('시간이 없으면 - 표시된다', () => {
      const noTimeLog: WorkoutLog = {
        ...mockLog,
        actual_duration: undefined,
      };

      render(<WorkoutHistoryCard log={noTimeLog} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('exercise_logs가 비어있어도 에러가 발생하지 않는다', () => {
      const emptyExerciseLog: WorkoutLog = {
        ...mockLog,
        exercise_logs: [],
      };

      render(<WorkoutHistoryCard log={emptyExerciseLog} />);

      expect(screen.getByTestId('workout-history-card')).toBeInTheDocument();
      expect(screen.getByText('0/0개 운동 완료')).toBeInTheDocument();
    });

    it('칼로리가 없으면 - 표시된다', () => {
      const noCaloriesLog: WorkoutLog = {
        ...mockLog,
        actual_calories: undefined,
      };

      render(<WorkoutHistoryCard log={noCaloriesLog} />);

      // 칼로리 부분에서 - 표시 확인
      const dashTexts = screen.getAllByText('-');
      expect(dashTexts.length).toBeGreaterThan(0);
    });

    it('볼륨이 없으면 - 표시된다', () => {
      const noVolumeLog: WorkoutLog = {
        ...mockLog,
        total_volume: 0,
      };

      render(<WorkoutHistoryCard log={noVolumeLog} />);

      // 볼륨이 0이면 falsy이므로 - 표시
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
