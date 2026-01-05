'use client';

/**
 * 레벨 뱃지 컴포넌트
 * 미니멀 원형 + 색상 그라데이션 디자인
 * @see docs/SPEC-LEVEL-SYSTEM.md
 */

import { cn } from '@/lib/utils';
import { LEVEL_COLORS, LEVEL_ICONS, LEVEL_NAMES, type Level } from '@/lib/levels';

interface LevelBadgeProps {
  level: Level;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

const sizeStyles = {
  xs: {
    badge: 'w-4 h-4 text-[10px]',
    label: 'text-[10px]',
    gap: 'gap-0.5',
  },
  sm: {
    badge: 'w-5 h-5 text-xs',
    label: 'text-xs',
    gap: 'gap-1',
  },
  md: {
    badge: 'w-6 h-6 text-sm',
    label: 'text-sm',
    gap: 'gap-1.5',
  },
  lg: {
    badge: 'w-8 h-8 text-base',
    label: 'text-base',
    gap: 'gap-2',
  },
};

export function LevelBadge({
  level,
  size = 'md',
  showLabel = false,
  showIcon = true,
  className,
}: LevelBadgeProps) {
  const color = LEVEL_COLORS[level];
  const icon = LEVEL_ICONS[level];
  const name = LEVEL_NAMES[level];
  const styles = sizeStyles[size];

  return (
    <div
      className={cn('inline-flex items-center', styles.gap, className)}
      data-testid="level-badge"
    >
      {showIcon && (
        <div
          className={cn('flex items-center justify-center rounded-full font-medium', styles.badge)}
          style={{ color: color.hex }}
          title={name}
        >
          {icon}
        </div>
      )}
      {showLabel && (
        <span className={cn('font-medium', styles.label)} style={{ color: color.hex }}>
          {name}
        </span>
      )}
    </div>
  );
}

/**
 * 레벨 뱃지 (배경 있는 버전)
 */
interface LevelBadgeFilledProps extends LevelBadgeProps {
  variant?: 'filled' | 'outline';
}

export function LevelBadgeFilled({
  level,
  size = 'md',
  showLabel = true,
  variant = 'filled',
  className,
}: LevelBadgeFilledProps) {
  const color = LEVEL_COLORS[level];
  const icon = LEVEL_ICONS[level];
  const name = LEVEL_NAMES[level];
  const styles = sizeStyles[size];

  const isFilled = variant === 'filled';

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full',
        styles.gap,
        isFilled ? 'text-white' : 'border',
        className
      )}
      style={{
        backgroundColor: isFilled ? color.hex : 'transparent',
        borderColor: !isFilled ? color.hex : undefined,
        color: !isFilled ? color.hex : undefined,
      }}
      data-testid="level-badge-filled"
    >
      <span className={styles.label}>{icon}</span>
      {showLabel && <span className={cn('font-medium', styles.label)}>{name}</span>}
    </div>
  );
}

export default LevelBadge;
