/**
 * Task 6.5: VirtualizedExerciseList 컴포넌트 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualizedExerciseList } from '@/components/workout/result';
import type { Exercise } from '@/types/workout';

// IntersectionObserver 모킹
const mockIntersectionObserver = vi.fn();

beforeEach(() => {
  mockIntersectionObserver.mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));
  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// 테스트용 운동 데이터 생성
const createMockExercises = (count: number): Exercise[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `exercise-${i + 1}`,
    name: `운동 ${i + 1}`,
    nameEn: `Exercise ${i + 1}`,
    category: (['upper', 'lower', 'core', 'cardio'] as const)[i % 4],
    bodyParts: ['chest'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: ['설명'],
    tips: ['팁'],
    caloriesPerMinute: 5,
    met: 3.5,
    suitableFor: {},
  }));

describe('VirtualizedExerciseList', () => {
  describe('렌더링', () => {
    it('운동 리스트 렌더링', () => {
      const exercises = createMockExercises(10);
      render(<VirtualizedExerciseList exercises={exercises} />);

      expect(screen.getByTestId('virtualized-exercise-list')).toBeInTheDocument();
    });

    it('카테고리 필터 탭 렌더링', () => {
      const exercises = createMockExercises(10);
      render(<VirtualizedExerciseList exercises={exercises} />);

      expect(screen.getByTestId('filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-upper')).toBeInTheDocument();
      expect(screen.getByTestId('filter-lower')).toBeInTheDocument();
      expect(screen.getByTestId('filter-core')).toBeInTheDocument();
      expect(screen.getByTestId('filter-cardio')).toBeInTheDocument();
    });

    it('무한 스크롤 센티널 렌더링', () => {
      const exercises = createMockExercises(10);
      render(<VirtualizedExerciseList exercises={exercises} enableInfiniteScroll={true} />);

      expect(screen.getByTestId('scroll-sentinel')).toBeInTheDocument();
    });
  });

  describe('무한 스크롤', () => {
    it('초기에 pageSize만큼만 표시', () => {
      const exercises = createMockExercises(20);
      render(
        <VirtualizedExerciseList
          exercises={exercises}
          enableInfiniteScroll={true}
          pageSize={6}
        />
      );

      // 처음 6개만 렌더링됨
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(6);
    });

    it('"더 보기" 메시지 표시', () => {
      const exercises = createMockExercises(20);
      render(
        <VirtualizedExerciseList
          exercises={exercises}
          enableInfiniteScroll={true}
          pageSize={6}
        />
      );

      expect(screen.getByText(/스크롤하여 더 보기/)).toBeInTheDocument();
      expect(screen.getByText(/14개 더/)).toBeInTheDocument();
    });
  });

  describe('카테고리 필터', () => {
    it('카테고리 클릭 시 필터링', async () => {
      const exercises = createMockExercises(12); // 각 카테고리 3개씩
      render(
        <VirtualizedExerciseList
          exercises={exercises}
          enableInfiniteScroll={true}
          pageSize={6}
        />
      );

      // 전체 탭 - 6개 표시 (무한 스크롤)
      expect(screen.getAllByRole('article')).toHaveLength(6);

      // 상체 탭 클릭 (3개만 있음)
      fireEvent.click(screen.getByTestId('filter-upper'));

      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards.length).toBe(3);
      });
    });

    it('카테고리별 개수 표시', () => {
      const exercises = createMockExercises(12);
      render(<VirtualizedExerciseList exercises={exercises} />);

      expect(screen.getByText('전체 (12)')).toBeInTheDocument();
      expect(screen.getByText('상체 (3)')).toBeInTheDocument();
      expect(screen.getByText('하체 (3)')).toBeInTheDocument();
      expect(screen.getByText('코어 (3)')).toBeInTheDocument();
      expect(screen.getByText('유산소 (3)')).toBeInTheDocument();
    });
  });

  describe('클릭 이벤트', () => {
    it('운동 카드 클릭 시 콜백 호출', () => {
      const exercises = createMockExercises(3);
      const handleClick = vi.fn();

      render(
        <VirtualizedExerciseList
          exercises={exercises}
          onExerciseClick={handleClick}
        />
      );

      const cards = screen.getAllByRole('article');
      fireEvent.click(cards[0]);

      expect(handleClick).toHaveBeenCalledWith('exercise-1');
    });
  });

  describe('빈 상태', () => {
    it('운동이 없으면 빈 메시지 표시', () => {
      render(<VirtualizedExerciseList exercises={[]} />);

      expect(screen.getByText('해당 카테고리의 운동이 없습니다.')).toBeInTheDocument();
    });

    it('필터링 후 결과 없으면 빈 메시지 표시', async () => {
      const exercises = createMockExercises(4);
      // 모든 운동이 upper 카테고리인 경우
      const upperExercises = exercises.map((e) => ({ ...e, category: 'upper' as const }));

      render(<VirtualizedExerciseList exercises={upperExercises} />);

      // 하체 필터 클릭
      fireEvent.click(screen.getByTestId('filter-lower'));

      await waitFor(() => {
        expect(screen.getByText('해당 카테고리의 운동이 없습니다.')).toBeInTheDocument();
      });
    });
  });

  describe('무한 스크롤 비활성화', () => {
    it('enableInfiniteScroll=false면 전체 표시', () => {
      const exercises = createMockExercises(20);
      render(
        <VirtualizedExerciseList
          exercises={exercises}
          enableInfiniteScroll={false}
        />
      );

      // 모든 운동 표시
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(20);

      // 센티널 없음
      expect(screen.queryByTestId('scroll-sentinel')).not.toBeInTheDocument();
    });
  });
});
