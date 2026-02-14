import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Clock: (props: Record<string, unknown>) => <div data-testid="icon-Clock" {...props} />,
  Flame: (props: Record<string, unknown>) => <div data-testid="icon-Flame" {...props} />,
}));

// ExerciseThumbnail mock
vi.mock('@/components/ui/optimized-image', () => ({
  ExerciseThumbnail: ({ alt, ...props }: Record<string, unknown>) => (
    <div data-testid="exercise-thumbnail" aria-label={alt as string} {...props} />
  ),
}));

import ExerciseCard from '@/components/workout/common/ExerciseCard';
import type { Exercise } from '@/types/workout';

// 테스트용 운동 데이터
function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-001',
    name: '바벨 스쿼트',
    nameEn: 'Barbell Squat',
    category: 'lower',
    bodyParts: ['thigh', 'hip'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: ['바를 어깨 뒤에 올린다'],
    tips: ['허리를 곧게 유지'],
    caloriesPerMinute: 8,
    met: 5.0,
    videoUrl: 'https://youtube.com/watch?v=test',
    thumbnailUrl: '/images/squat.jpg',
    suitableFor: {},
    ...overrides,
  };
}

describe('ExerciseCard', () => {
  describe('기본 variant (default)', () => {
    it('운동 이름을 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise()} />);
      expect(screen.getByText('바벨 스쿼트')).toBeInTheDocument();
    });

    it('영문 이름이 있으면 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise()} />);
      expect(screen.getByText('Barbell Squat')).toBeInTheDocument();
    });

    it('영문 이름이 없으면 표시하지 않는다', () => {
      render(<ExerciseCard exercise={createMockExercise({ nameEn: undefined })} />);
      expect(screen.queryByText('Barbell Squat')).not.toBeInTheDocument();
    });

    it('난이도를 한글로 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise({ difficulty: 'beginner' })} />);
      expect(screen.getByText('초급')).toBeInTheDocument();
    });

    it('중급 난이도를 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise({ difficulty: 'intermediate' })} />);
      expect(screen.getByText('중급')).toBeInTheDocument();
    });

    it('고급 난이도를 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise({ difficulty: 'advanced' })} />);
      expect(screen.getByText('고급')).toBeInTheDocument();
    });

    it('타겟 부위를 한글로 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise({ bodyParts: ['chest', 'shoulder'] })} />);
      expect(screen.getByText('가슴')).toBeInTheDocument();
      expect(screen.getByText('어깨')).toBeInTheDocument();
    });

    it('부위가 3개 이상이면 최대 3개까지만 표시한다', () => {
      render(
        <ExerciseCard
          exercise={createMockExercise({
            bodyParts: ['chest', 'back', 'shoulder', 'arm'],
          })}
        />
      );
      expect(screen.getByText('가슴')).toBeInTheDocument();
      expect(screen.getByText('등')).toBeInTheDocument();
      expect(screen.getByText('어깨')).toBeInTheDocument();
      expect(screen.queryByText('팔')).not.toBeInTheDocument();
    });

    it('칼로리 정보를 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise({ caloriesPerMinute: 8 })} />);
      expect(screen.getByText('8 kcal/min')).toBeInTheDocument();
    });

    it('MET 정보를 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise({ met: 5.0 })} />);
      expect(screen.getByText('MET 5')).toBeInTheDocument();
    });

    it('썸네일이 렌더링된다', () => {
      render(<ExerciseCard exercise={createMockExercise()} />);
      expect(screen.getAllByTestId('exercise-thumbnail').length).toBeGreaterThan(0);
    });

    it('onClick이 있으면 클릭 가능하다', () => {
      const handleClick = vi.fn();
      render(<ExerciseCard exercise={createMockExercise()} onClick={handleClick} />);

      const articles = screen.getAllByRole('article');
      fireEvent.click(articles[0]);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick이 없으면 cursor-pointer 클래스가 없다', () => {
      render(<ExerciseCard exercise={createMockExercise()} />);
      const articles = screen.getAllByRole('article');
      expect(articles[0].className).not.toContain('cursor-pointer');
    });
  });

  describe('compact variant', () => {
    it('compact 모드에서 운동 이름을 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise()} variant="compact" />);
      expect(screen.getByText('바벨 스쿼트')).toBeInTheDocument();
    });

    it('compact 모드에서 부위를 쉼표로 구분하여 표시한다', () => {
      render(
        <ExerciseCard
          exercise={createMockExercise({ bodyParts: ['thigh', 'hip'] })}
          variant="compact"
        />
      );
      expect(screen.getByText('허벅지, 엉덩이')).toBeInTheDocument();
    });

    it('compact 모드에서 난이도를 표시한다', () => {
      render(<ExerciseCard exercise={createMockExercise()} variant="compact" />);
      expect(screen.getByText('중급')).toBeInTheDocument();
    });

    it('compact 모드에서 클릭 이벤트가 동작한다', () => {
      const handleClick = vi.fn();
      render(
        <ExerciseCard exercise={createMockExercise()} variant="compact" onClick={handleClick} />
      );

      const articles = screen.getAllByRole('article');
      fireEvent.click(articles[0]);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('엣지 케이스', () => {
    it('알 수 없는 부위도 원본 텍스트로 표시한다', () => {
      render(
        <ExerciseCard
          exercise={createMockExercise({
            bodyParts: ['unknown_part' as Exercise['bodyParts'][number]],
          })}
        />
      );
      expect(screen.getByText('unknown_part')).toBeInTheDocument();
    });
  });
});
