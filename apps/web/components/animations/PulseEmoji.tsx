'use client';

import { cn } from '@/lib/utils';

interface PulseEmojiProps {
  /** 표시할 이모지 */
  emoji: string;
  /** 펄스 효과 활성화 여부 */
  active?: boolean;
  /** 펄스 강도 (배수) */
  intensity?: 'light' | 'medium' | 'strong';
  /** 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 추가 className */
  className?: string;
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-7xl',
};

const intensityClasses = {
  light: 'animate-pulse-light',
  medium: 'animate-pulse',
  strong: 'animate-pulse-strong',
};

/**
 * 펄스 이모지 컴포넌트
 * 연속 기록, 스트릭 등에 사용
 *
 * @example
 * ```tsx
 * <PulseEmoji emoji="🔥" active={streak > 0} size="lg" />
 * ```
 */
export function PulseEmoji({
  emoji,
  active = true,
  intensity = 'medium',
  size = 'md',
  className,
}: PulseEmojiProps) {
  return (
    <span
      className={cn(
        sizeClasses[size],
        'inline-block select-none',
        active && intensityClasses[intensity],
        className
      )}
      data-testid="pulse-emoji"
      role="img"
      aria-label={emoji}
    >
      {emoji}
    </span>
  );
}

export default PulseEmoji;
