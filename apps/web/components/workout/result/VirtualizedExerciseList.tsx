'use client';

import { useState, useMemo, memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Exercise, ExerciseCategory } from '@/types/workout';
import { ExerciseCard } from '@/components/workout/common';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

interface VirtualizedExerciseListProps {
  exercises: Exercise[];
  onExerciseClick?: (exerciseId: string) => void;
  /** 가상화 사용 여부 (아이템 50개 이상일 때 권장) */
  enableVirtualization?: boolean;
  /** 무한 스크롤 사용 여부 */
  enableInfiniteScroll?: boolean;
  /** 한 번에 로드할 아이템 수 */
  pageSize?: number;
}

// 카테고리 필터 옵션
const CATEGORY_FILTERS: { id: ExerciseCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'upper', label: '상체' },
  { id: 'lower', label: '하체' },
  { id: 'core', label: '코어' },
  { id: 'cardio', label: '유산소' },
];

// 운동 카드 예상 높이 (가상화용)
const ESTIMATED_ITEM_HEIGHT = 280;
const GRID_GAP = 16;

/**
 * Task 6.5: 가상화 및 무한 스크롤 운동 리스트
 * - 무한 스크롤: IntersectionObserver로 점진적 로딩
 * - 가상화: @tanstack/react-virtual로 대량 아이템 최적화
 */
const VirtualizedExerciseList = memo(function VirtualizedExerciseList({
  exercises,
  onExerciseClick,
  enableVirtualization = false,
  enableInfiniteScroll = true,
  pageSize = 6,
}: VirtualizedExerciseListProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const parentRef = useRef<HTMLDivElement>(null);

  // 카테고리별 운동 수 계산
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: exercises.length };
    exercises.forEach((ex) => {
      counts[ex.category] = (counts[ex.category] || 0) + 1;
    });
    return counts;
  }, [exercises]);

  // 카테고리 필터링
  const filteredExercises = useMemo(() => {
    return selectedCategory === 'all'
      ? exercises
      : exercises.filter((ex) => ex.category === selectedCategory);
  }, [exercises, selectedCategory]);

  // 무한 스크롤 훅
  const {
    displayedItems,
    hasMore,
    isLoading,
    sentinelRef,
    reset,
  } = useInfiniteScroll(filteredExercises, {
    pageSize,
    initialLoadSize: pageSize,
  });

  // 카테고리 변경 시 리셋
  const handleCategoryChange = (category: ExerciseCategory | 'all') => {
    setSelectedCategory(category);
    reset();
  };

  // 가상화 설정 (2열 그리드)
  const rowCount = Math.ceil(displayedItems.length / 2);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT + GRID_GAP,
    overscan: 2,
  });

  // 표시할 운동 결정
  const itemsToRender = enableInfiniteScroll ? displayedItems : filteredExercises;

  return (
    <div className="space-y-4" data-testid="virtualized-exercise-list">
      {/* 카테고리 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleCategoryChange(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === filter.id
                ? 'bg-indigo-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            data-testid={`filter-${filter.id}`}
          >
            {filter.label} ({categoryCounts[filter.id] || 0})
          </button>
        ))}
      </div>

      {/* 운동 리스트 */}
      {itemsToRender.length > 0 ? (
        enableVirtualization && itemsToRender.length > 20 ? (
          // 가상화된 리스트 (아이템 많을 때)
          <div
            ref={parentRef}
            className="h-[600px] overflow-auto"
            data-testid="virtualized-container"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * 2;
                const items = itemsToRender.slice(startIndex, startIndex + 2);

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4"
                  >
                    {items.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onClick={onExerciseClick ? () => onExerciseClick(exercise.id) : undefined}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // 일반 그리드 (아이템 적을 때)
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {itemsToRender.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onClick={onExerciseClick ? () => onExerciseClick(exercise.id) : undefined}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>해당 카테고리의 운동이 없습니다.</p>
        </div>
      )}

      {/* 무한 스크롤 센티널 */}
      {enableInfiniteScroll && (
        <>
          <div
            ref={sentinelRef}
            className="h-1"
            data-testid="scroll-sentinel"
            aria-hidden="true"
          />

          {/* 로딩 인디케이터 */}
          {isLoading && (
            <div className="flex justify-center py-4" data-testid="loading-indicator">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          )}

          {/* 더 불러올 항목이 있는지 표시 */}
          {hasMore && !isLoading && (
            <div className="text-center text-sm text-muted-foreground py-2">
              스크롤하여 더 보기 ({filteredExercises.length - displayedItems.length}개 더)
            </div>
          )}

          {/* 모두 로드됨 표시 */}
          {!hasMore && displayedItems.length > pageSize && (
            <div className="text-center text-sm text-muted-foreground py-2">
              모든 운동을 불러왔습니다
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default VirtualizedExerciseList;
