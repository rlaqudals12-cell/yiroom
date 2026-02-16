import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ExerciseCard mock
vi.mock('@/components/workout/common', () => ({
  ExerciseCard: ({
    exercise,
    onClick,
  }: {
    exercise: { name: string; id: string };
    onClick?: () => void;
  }) => (
    <div data-testid={`exercise-card-${exercise.id}`} onClick={onClick}>
      {exercise.name}
    </div>
  ),
}));

import RecommendedExerciseList from '@/components/workout/result/RecommendedExerciseList';
import type { Exercise } from '@/types/workout';

function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-001',
    name: '스쿼트',
    category: 'lower',
    bodyParts: ['thigh'],
    equipment: [],
    difficulty: 'intermediate',
    instructions: [],
    tips: [],
    caloriesPerMinute: 5,
    met: 5.0,
    suitableFor: {},
    ...overrides,
  };
}

function createMockExercises(): Exercise[] {
  return [
    createMockExercise({ id: 'ex-1', name: '스쿼트', category: 'lower' }),
    createMockExercise({ id: 'ex-2', name: '벤치프레스', category: 'upper' }),
    createMockExercise({ id: 'ex-3', name: '크런치', category: 'core' }),
    createMockExercise({ id: 'ex-4', name: '런닝', category: 'cardio' }),
    createMockExercise({ id: 'ex-5', name: '런지', category: 'lower' }),
    createMockExercise({ id: 'ex-6', name: '풀업', category: 'upper' }),
    createMockExercise({ id: 'ex-7', name: '플랭크', category: 'core' }),
    createMockExercise({ id: 'ex-8', name: '버피', category: 'cardio' }),
  ];
}

describe('RecommendedExerciseList', () => {
  describe('카테고리 필터', () => {
    it('전체 필터가 기본 선택된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      // 전체 필터 버튼이 활성화 스타일을 가짐
      const allButton = screen.getByText(/전체/);
      expect(allButton.className).toContain('bg-indigo-500');
    });

    it('모든 카테고리 필터 탭이 표시된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      expect(screen.getByText(/전체/)).toBeInTheDocument();
      expect(screen.getByText(/상체/)).toBeInTheDocument();
      expect(screen.getByText(/하체/)).toBeInTheDocument();
      expect(screen.getByText(/코어/)).toBeInTheDocument();
      expect(screen.getByText(/유산소/)).toBeInTheDocument();
    });

    it('카테고리별 개수가 표시된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      expect(screen.getByText(/전체 \(8\)/)).toBeInTheDocument();
      expect(screen.getByText(/상체 \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/하체 \(2\)/)).toBeInTheDocument();
    });

    it('카테고리 클릭 시 해당 운동만 표시된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      fireEvent.click(screen.getByText(/상체/));

      expect(screen.getByText('벤치프레스')).toBeInTheDocument();
      expect(screen.getByText('풀업')).toBeInTheDocument();
      expect(screen.queryByText('스쿼트')).not.toBeInTheDocument();
    });

    it('카테고리가 0개인 필터를 클릭하면 빈 상태 메시지가 표시된다', () => {
      const exercises = [createMockExercise({ id: 'ex-1', category: 'lower' })];
      render(<RecommendedExerciseList exercises={exercises} />);
      fireEvent.click(screen.getByText(/상체/));
      expect(screen.getByText('해당 카테고리의 운동이 없어요.')).toBeInTheDocument();
    });
  });

  describe('더보기/접기', () => {
    it('6개 이하 운동이면 더보기 버튼이 없다', () => {
      const exercises = createMockExercises().slice(0, 5);
      render(<RecommendedExerciseList exercises={exercises} />);
      expect(screen.queryByText(/더보기/)).not.toBeInTheDocument();
    });

    it('7개 이상 운동이면 더보기 버튼이 표시된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      expect(screen.getByText(/더보기/)).toBeInTheDocument();
    });

    it('더보기 클릭 시 모든 운동이 표시된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      fireEvent.click(screen.getByText(/더보기/));

      // 8개 모두 표시
      expect(screen.getByText('스쿼트')).toBeInTheDocument();
      expect(screen.getByText('버피')).toBeInTheDocument();
    });

    it('더보기 후 접기 버튼이 표시된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      fireEvent.click(screen.getByText(/더보기/));
      expect(screen.getByText('접기')).toBeInTheDocument();
    });

    it('접기 클릭 시 6개만 표시된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      fireEvent.click(screen.getByText(/더보기/));
      fireEvent.click(screen.getByText('접기'));
      expect(screen.queryByText(/더보기/)).toBeInTheDocument();
    });

    it('카테고리 변경 시 접기 상태로 리셋된다', () => {
      render(<RecommendedExerciseList exercises={createMockExercises()} />);
      fireEvent.click(screen.getByText(/더보기/));
      fireEvent.click(screen.getByText(/하체/));
      // 카테고리 변경 후 showAll이 false로 리셋
      expect(screen.queryByText('접기')).not.toBeInTheDocument();
    });
  });

  describe('운동 클릭', () => {
    it('onExerciseClick이 있으면 운동 클릭 시 호출된다', () => {
      const onExerciseClick = vi.fn();
      render(
        <RecommendedExerciseList
          exercises={createMockExercises()}
          onExerciseClick={onExerciseClick}
        />
      );
      fireEvent.click(screen.getByTestId('exercise-card-ex-1'));
      expect(onExerciseClick).toHaveBeenCalledWith('ex-1');
    });
  });

  describe('빈 상태', () => {
    it('운동이 없으면 빈 상태 메시지가 표시된다', () => {
      render(<RecommendedExerciseList exercises={[]} />);
      expect(screen.getByText('해당 카테고리의 운동이 없어요.')).toBeInTheDocument();
    });
  });
});
