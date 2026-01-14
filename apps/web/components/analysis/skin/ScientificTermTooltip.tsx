'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ScientificTermTooltipProps {
  /** 전문 용어 (영문 약어 포함) */
  term: string;
  /** 정의 (한국어 설명) */
  definition: string;
  /** 추가 className */
  className?: string;
}

/**
 * 전문 용어 툴팁 컴포넌트
 * - 호버 시 용어의 정의를 표시
 * - chip/badge 스타일로 표시되어 클릭 가능함을 암시
 */
export function ScientificTermTooltip({ term, definition, className }: ScientificTermTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
              'cursor-help border border-blue-200 dark:border-blue-800',
              'hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors',
              className
            )}
            data-testid="scientific-term-tooltip"
          >
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900"
        >
          <p className="text-sm leading-relaxed">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ScientificTermTooltip;
