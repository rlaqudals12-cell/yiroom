'use client';

import { useState, useMemo, memo } from 'react';
import { Exercise, ExerciseCategory } from '@/types/workout';
import { ExerciseCard } from '@/components/workout/common';

interface RecommendedExerciseListProps {
  exercises: Exercise[];
  onExerciseClick?: (exerciseId: string) => void;
}

// 카테고리 필터 옵션
const CATEGORY_FILTERS: { id: ExerciseCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'upper', label: '상체' },
  { id: 'lower', label: '하체' },
  { id: 'core', label: '코어' },
  { id: 'cardio', label: '유산소' },
];

/**
 * 추천 운동 리스트 (메모이제이션 적용)
 * 카테고리별 필터링 결과를 useMemo로 최적화
 */
const RecommendedExerciseList = memo(function RecommendedExerciseList({
  exercises,
  onExerciseClick,
}: RecommendedExerciseListProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [showAll, setShowAll] = useState(false);

  // 카테고리별 운동 수 계산 (메모이제이션)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: exercises.length };
    exercises.forEach((ex) => {
      counts[ex.category] = (counts[ex.category] || 0) + 1;
    });
    return counts;
  }, [exercises]);

  // 카테고리 필터링 (메모이제이션)
  const filteredExercises = useMemo(() => {
    return selectedCategory === 'all'
      ? exercises
      : exercises.filter((ex) => ex.category === selectedCategory);
  }, [exercises, selectedCategory]);

  // 표시할 운동 수 (처음 6개 또는 전체)
  const displayedExercises = useMemo(() => {
    return showAll ? filteredExercises : filteredExercises.slice(0, 6);
  }, [filteredExercises, showAll]);

  const hasMore = filteredExercises.length > 6 && !showAll;

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => {
              setSelectedCategory(filter.id);
              setShowAll(false);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === filter.id
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label} ({categoryCounts[filter.id] || 0})
          </button>
        ))}
      </div>

      {/* 운동 카드 그리드 */}
      {displayedExercises.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayedExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={onExerciseClick ? () => onExerciseClick(exercise.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>해당 카테고리의 운동이 없습니다.</p>
        </div>
      )}

      {/* 더보기 버튼 */}
      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          더보기 ({filteredExercises.length - 6}개 더)
        </button>
      )}

      {/* 접기 버튼 */}
      {showAll && filteredExercises.length > 6 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          접기
        </button>
      )}
    </div>
  );
});

export default RecommendedExerciseList;
