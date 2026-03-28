'use client';

/**
 * S-3: 공유 모드 토글 ("내 사진 포함" / "일러스트로 공유")
 *
 * @description 기본값 = 일러스트 (프라이버시 우선, ADR-097 D3)
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §4.1
 */

import { cn } from '@/lib/utils';

export type ShareMode = 'photo' | 'illustration';

export interface ShareModeToggleProps {
  mode: ShareMode;
  onModeChange: (mode: ShareMode) => void;
  disabled?: boolean;
  className?: string;
}

const OPTIONS: { value: ShareMode; label: string }[] = [
  { value: 'illustration', label: '일러스트로 공유' },
  { value: 'photo', label: '내 사진 포함' },
];

/**
 * 공유 모드 토글 — 익명/실명 공유 전환
 */
export function ShareModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className,
}: ShareModeToggleProps): React.ReactElement {
  return (
    <div
      data-testid="share-mode-toggle"
      role="radiogroup"
      aria-label="공유 이미지 모드 선택"
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={mode === value}
          onClick={() => onModeChange(value)}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            mode === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
