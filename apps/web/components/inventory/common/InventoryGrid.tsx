'use client';

/**
 * 인벤토리 그리드 컴포넌트
 * - 반응형 그리드 레이아웃
 * - 무한 스크롤 지원
 * - 빈 상태 처리
 * - 로딩 스켈레톤
 */

import { useCallback, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ItemCard } from './ItemCard';
import type { InventoryItem } from '@/types/inventory';

interface InventoryGridProps {
  items: InventoryItem[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemSelect?: (item: InventoryItem) => void;
  onFavoriteToggle?: (item: InventoryItem) => void;
  onItemEdit?: (item: InventoryItem) => void;
  onItemDelete?: (item: InventoryItem) => void;
  onAddNew?: () => void;
  selectedIds?: string[];
  selectable?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  columns?: 2 | 3 | 4;
}

export function InventoryGrid({
  items,
  loading = false,
  hasMore = false,
  onLoadMore,
  onItemSelect,
  onFavoriteToggle,
  onItemEdit,
  onItemDelete,
  onAddNew,
  selectedIds = [],
  selectable = false,
  emptyMessage = '아이템이 없습니다',
  emptyAction,
  columns = 2,
}: InventoryGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 무한 스크롤 설정
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // 그리드 컬럼 클래스
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  // 빈 상태
  if (!loading && items.length === 0) {
    return (
      <div
        data-testid="inventory-grid-empty"
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {emptyAction && (
          <Button onClick={emptyAction.onClick} variant="outline">
            {emptyAction.label}
          </Button>
        )}
        {onAddNew && !emptyAction && (
          <Button onClick={onAddNew}>아이템 추가하기</Button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="inventory-grid">
      <div className={cn('grid gap-3', gridCols[columns])}>
        {/* 아이템 카드들 */}
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onSelect={onItemSelect}
            onFavoriteToggle={onFavoriteToggle}
            onEdit={onItemEdit}
            onDelete={onItemDelete}
            selected={selectedIds.includes(item.id)}
            selectable={selectable}
          />
        ))}

        {/* 추가 버튼 (첫 번째 위치) */}
        {onAddNew && !loading && (
          <button
            type="button"
            onClick={onAddNew}
            className={cn(
              'flex flex-col items-center justify-center',
              'aspect-square rounded-xl border-2 border-dashed',
              'text-muted-foreground hover:text-foreground',
              'hover:border-primary hover:bg-muted/50 transition-colors'
            )}
          >
            <Plus className="w-8 h-8 mb-1" />
            <span className="text-xs">추가</span>
          </button>
        )}

        {/* 로딩 스켈레톤 */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="rounded-xl overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-2.5 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasMore && <div ref={loadMoreRef} className="h-4" />}

      {/* 더 불러오는 중 표시 */}
      {loading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
