'use client';

/**
 * 화장대 중복 안내 (ADR-117 루틴 v2)
 * 같은 카테고리 제품을 여러 개 보유했을 때 엔진(findRedundantProducts)이 준
 * 메시지를 그대로 렌더. 항목이 없으면 미노출.
 */
import { Layers } from 'lucide-react';
import type { RedundantProduct } from './routine-v2-contract';

interface ShelfRedundancyNoticeProps {
  items: RedundantProduct[];
}

export function ShelfRedundancyNotice({ items }: ShelfRedundancyNoticeProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5" data-testid="shelf-redundancy">
      {items.map((r) => (
        <div
          key={r.category}
          data-testid="shelf-redundancy-item"
          className="flex items-start gap-2 rounded-lg bg-sky-50 p-3 dark:bg-sky-950/30"
        >
          <Layers
            className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400"
            aria-hidden="true"
          />
          <p className="text-xs text-sky-800 dark:text-sky-200">{r.message}</p>
        </div>
      ))}
    </div>
  );
}
