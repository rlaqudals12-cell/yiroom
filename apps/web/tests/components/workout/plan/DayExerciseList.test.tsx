import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Clock: (props: Record<string, unknown>) => <div data-testid="icon-Clock" {...props} />,
  Flame: (props: Record<string, unknown>) => <div data-testid="icon-Flame" {...props} />,
  Dumbbell: (props: Record<string, unknown>) => <div data-testid="icon-Dumbbell" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => (
    <div data-testid="icon-ChevronRight" {...props} />
  ),
  Coffee: (props: Record<string, unknown>) => <div data-testid="icon-Coffee" {...props} />,
}));

// calculateExerciseDetails mock
vi.mock('@/lib/workout/weeklyPlan', () => ({
  calculateExerciseDetails: vi.fn().mockReturnValue({
    sets: 3,
    reps: 12,
    restSeconds: 60,
    estimatedCalories: 45,
    estimatedMinutes: 6,
    weight: 20,
  }),
}));

import { DayExerciseList } from '@/components/workout/plan/DayExerciseList';
import type { DayPlan, Exercise, WorkoutType } from '@/types/workout';

function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-001',
    name: '스쿼트',
    category: 'lower',
    bodyParts: ['thigh', 'hip'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [],
    tips: [],
    caloriesPerMinute: 8,
    met: 5.0,
    suitableFor: {},
    ...overrides,
  };
}

function createMockDayPlan(overrides: Partial<DayPlan> = {}): DayPlan {
  return {
    day: 'mon',
    dayLabel: '월요일',
    isRestDay: false,
    focus: ['thigh', 'hip'],
    exercises: [
      createMockExercise({ id: 'ex-001', name: '스쿼트' }),
      createMockExercise({ id: 'ex-002', name: '런지', difficulty: 'beginner' }),
    ],
    estimatedMinutes: 40,
    estimatedCalories: 300,
    ...overrides,
  };
}

describe('DayExerciseList', () => {
  const defaultProps = {
    day: createMockDayPlan(),
    workoutType: 'toner' as WorkoutType,
    userWeight: 65,
  };

  describe('운동일 렌더링', () => {
    it('data-testid가 존재한다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByTestId('day-exercise-list')).toBeInTheDocument();
    });

    it('요일 라벨이 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByText('월요일 운동')).toBeInTheDocument();
    });

    it('포커스 부위가 한글로 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByText('허벅지, 엉덩이 집중')).toBeInTheDocument();
    });

    it('예상 시간이 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByText('40분')).toBeInTheDocument();
    });

    it('예상 칼로리가 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByText('300kcal')).toBeInTheDocument();
    });

    it('운동 목록이 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByText('스쿼트')).toBeInTheDocument();
      expect(screen.getByText('런지')).toBeInTheDocument();
    });

    it('운동 순번이 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('세트/횟수 정보가 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      const setTexts = screen.getAllByText('3세트');
      expect(setTexts.length).toBeGreaterThan(0);
      const repTexts = screen.getAllByText('12회');
      expect(repTexts.length).toBeGreaterThan(0);
    });

    it('무게 정보가 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      const weightTexts = screen.getAllByText('20kg');
      expect(weightTexts.length).toBeGreaterThan(0);
    });

    it('칼로리 정보가 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      const calorieTexts = screen.getAllByText('45kcal');
      expect(calorieTexts.length).toBeGreaterThan(0);
    });

    it('난이도가 한글로 표시된다', () => {
      render(<DayExerciseList {...defaultProps} />);
      expect(screen.getByText('중급')).toBeInTheDocument();
      expect(screen.getByText('초급')).toBeInTheDocument();
    });
  });

  describe('운동 클릭', () => {
    it('onExerciseClick이 있으면 운동 클릭 시 호출된다', () => {
      const onExerciseClick = vi.fn();
      render(<DayExerciseList {...defaultProps} onExerciseClick={onExerciseClick} />);

      fireEvent.click(screen.getByText('스쿼트'));
      expect(onExerciseClick).toHaveBeenCalledWith('ex-001');
    });
  });

  describe('휴식일', () => {
    it('휴식일이면 휴식 UI를 표시한다', () => {
      const restDay = createMockDayPlan({
        isRestDay: true,
        dayLabel: '수요일',
        exercises: [],
      });

      render(<DayExerciseList {...defaultProps} day={restDay} />);
      expect(screen.getByTestId('day-exercise-list-rest')).toBeInTheDocument();
      expect(screen.getByText(/수요일 - 휴식일/)).toBeInTheDocument();
    });

    it('휴식일에 안내 메시지가 표시된다', () => {
      const restDay = createMockDayPlan({ isRestDay: true });
      render(<DayExerciseList {...defaultProps} day={restDay} />);
      expect(screen.getByText(/충분한 휴식을 취하세요/)).toBeInTheDocument();
    });
  });

  describe('빈 운동 목록', () => {
    it('운동이 없으면 빈 상태를 표시한다', () => {
      const emptyDay = createMockDayPlan({ exercises: [] });
      render(<DayExerciseList {...defaultProps} day={emptyDay} />);
      expect(screen.getByText('이 날의 운동이 없습니다')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('focus가 없으면 전신으로 표시한다', () => {
      const day = createMockDayPlan({ focus: undefined });
      render(<DayExerciseList {...defaultProps} day={day} />);
      expect(screen.getByText('전신 집중')).toBeInTheDocument();
    });
  });
});
