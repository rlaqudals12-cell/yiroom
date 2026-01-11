'use client';

/**
 * 제품함 필터
 */

import { cn } from '@/lib/utils';
import type { ShelfStatus } from '@/lib/scan/product-shelf';

interface ShelfFiltersProps {
  selectedStatus: ShelfStatus | 'all';
  counts?: Record<ShelfStatus, number>;
  onChange: (status: ShelfStatus | 'all') => void;
  className?: string;
}

const FILTER_OPTIONS: Array<{ value: ShelfStatus | 'all'; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'owned', label: '보유 중' },
  { value: 'wishlist', label: '위시리스트' },
  { value: 'used_up', label: '다 씀' },
];

export function ShelfFilters({ selectedStatus, counts, onChange, className }: ShelfFiltersProps) {
  const getCount = (status: ShelfStatus | 'all'): number => {
    if (!counts) return 0;
    if (status === 'all') {
      return Object.values(counts).reduce((sum, count) => sum + count, 0);
    }
    return counts[status] || 0;
  };

  return (
    <div data-testid="shelf-filters" className={cn('flex gap-2 overflow-x-auto', className)}>
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            selectedStatus === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {option.label}
          {counts && (
            <span
              className={cn(
                'rounded-full px-1.5 text-xs',
                selectedStatus === option.value ? 'bg-primary-foreground/20' : 'bg-background'
              )}
            >
              {getCount(option.value)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
