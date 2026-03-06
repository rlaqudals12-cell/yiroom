'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import ConcernCard from './ConcernCard';
import type { ConcernGridProps } from '@/types/analysis-concern';

/** V2 Strengths-First 정렬: 점수 높은 순 */
function sortByStrengthsFirst<T extends { score: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}

/** 2열 반응형 그리드 — V5 Information Chunking */
export default function ConcernGrid({
  items,
  onCardExpand,
  className,
}: ConcernGridProps): React.JSX.Element | null {
  // V2: 점수 높은 순 정렬
  const sortedItems = useMemo(() => sortByStrengthsFirst(items), [items]);

  if (sortedItems.length === 0) return null;

  return (
    <div data-testid="concern-grid" className={cn('grid grid-cols-2 gap-3', className)}>
      {sortedItems.map((item) => (
        <ConcernCard
          key={item.id}
          {...item}
          onExpand={onCardExpand ? () => onCardExpand(item.id) : undefined}
        />
      ))}
    </div>
  );
}

// 테스트용 export
export { sortByStrengthsFirst };
