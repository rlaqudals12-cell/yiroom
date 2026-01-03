'use client';

/**
 * 옷 그리드 컴포넌트
 * - 반응형 그리드 레이아웃
 * - 무한 스크롤 지원
 * - 빈 상태 처리
 */

import { useEffect, useRef, useCallback } from 'react';
import { Plus, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClothingCard } from './ClothingCard';
import type { ClothingItem } from '@/types/inventory';

interface ClothingGridProps {
  items: ClothingItem[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemSelect?: (item: ClothingItem) => void;
  onFavoriteToggle?: (item: ClothingItem) => void;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (item: ClothingItem) => void;
  onAddNew?: () => void;
  selectedIds?: string[];
  selectable?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ClothingGrid({
  items,
  loading = false,
  hasMore = false,
  onLoadMore,
  onItemSelect,
  onFavoriteToggle,
  onEdit,
  onDelete,
  onAddNew,
  selectedIds = [],
  selectable = false,
  emptyMessage = '등록된 옷이 없어요',
  emptyAction,
  className,
}: ClothingGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 무한 스크롤 감지
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleIntersection]);

  // 빈 상태
  if (!loading && items.length === 0) {
    return (
      <div
        data-testid="clothing-grid-empty"
        className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Shirt className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {emptyAction && (
          <Button onClick={emptyAction.onClick}>
            <Plus className="w-4 h-4 mr-2" />
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="clothing-grid" className={cn('space-y-4', className)}>
      {/* 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* 추가 버튼 (선택적) */}
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">추가</span>
          </button>
        )}

        {/* 아이템 카드 */}
        {items.map((item) => (
          <ClothingCard
            key={item.id}
            item={item}
            selected={selectedIds.includes(item.id)}
            selectable={selectable}
            onSelect={onItemSelect}
            onFavoriteToggle={onFavoriteToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* 로딩 스켈레톤 */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="rounded-xl overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-2.5 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasMore && <div ref={loadMoreRef} className="h-4" />}
    </div>
  );
}
