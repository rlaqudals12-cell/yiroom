'use client';

/**
 * P1-3: StrengthHighlightToggle — 강점/전체 보기 토글
 *
 * @description ADR-097 D4: 기본값은 "강점 중심" (긍정적 인상),
 * 토글로 "전체 보기" (강점+약점) 전환.
 * 공유 모드에서는 항상 "강점 중심" 고정 (토글 비활성).
 * @see docs/adr/ADR-097-visual-overlay-anonymous-share.md D4
 */

import { cn } from '@/lib/utils';
import type { OverlayMode } from './internal/overlay-tokens';

// =============================================================================
// 타입
// =============================================================================

export interface StrengthHighlightToggleProps {
  /** 현재 모드 */
  mode: OverlayMode;
  /** 모드 변경 콜백 */
  onModeChange: (mode: OverlayMode) => void;
  /** 비활성화 (공유 모드에서 사용) */
  disabled?: boolean;
  /** 추가 className */
  className?: string;
}

// =============================================================================
// 컴포넌트
// =============================================================================

/** 강점 중심 / 전체 보기 토글 */
export function StrengthHighlightToggle({
  mode,
  onModeChange,
  disabled = false,
  className,
}: StrengthHighlightToggleProps) {
  return (
    <div
      data-testid="strength-highlight-toggle"
      className={cn('inline-flex rounded-lg bg-muted p-0.5', className)}
      role="radiogroup"
      aria-label="오버레이 표시 모드"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'strength'}
        disabled={disabled}
        onClick={() => onModeChange('strength')}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'strength'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        강점 중심
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'full'}
        disabled={disabled}
        onClick={() => onModeChange('full')}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'full'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        전체 보기
      </button>
    </div>
  );
}
