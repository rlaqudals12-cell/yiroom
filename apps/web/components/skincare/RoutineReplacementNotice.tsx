'use client';

/**
 * 다 쓴 뒤 교체 제안 — 적합도 낮은 보유 제품 안내 (G4 폐루프 v1 일부)
 *
 * 창업자 지시: "안 맞는 보유 제품은 일단 쓰되, 다 쓰면 이런 제품으로 바꿔보라고."
 * 문구·판단은 suggestRoutineReplacements(lib/skincare)가 조립 — 여기서는 렌더만.
 * 강요 금지("다 쓴 뒤" 프레이밍 고정), 처방/치료 금지.
 */

import Link from 'next/link';
import { RefreshCw, ChevronRight } from 'lucide-react';
import type { RoutineReplacement } from '@/lib/skincare';

interface RoutineReplacementNoticeProps {
  replacements: RoutineReplacement[];
}

export function RoutineReplacementNotice({ replacements }: RoutineReplacementNoticeProps) {
  if (replacements.length === 0) return null;

  return (
    <section
      className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"
      data-testid="routine-replacement-notice"
      aria-label="다 쓴 뒤 교체 제안"
    >
      <div className="mb-2 flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          다 쓴 뒤 바꿔보면 좋을 제품
        </h2>
      </div>
      <div className="space-y-2.5">
        {replacements.map((r) => (
          <div key={r.shelfItemId} data-testid="routine-replacement-item" className="text-sm">
            <p className="text-foreground">{r.message}</p>
            {r.alternative && (
              <Link
                href={`/beauty/${r.alternative.id}`}
                className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
                data-testid="routine-replacement-alt"
              >
                {r.alternative.brand
                  ? `${r.alternative.brand} ${r.alternative.name}`
                  : r.alternative.name}{' '}
                보기
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
