'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type AvoidLevel, getAvoidLevelPriority, isCriticalAvoid } from '@/types/preferences';
import {
  getAvoidLevelLabel,
  getAvoidLevelColors,
  type SupportedLocale,
} from '@/lib/preferences/labels';

interface AvoidLevelBadgeProps {
  /** 기피 수준 */
  level: AvoidLevel;
  /** 지역 설정 (기본: 'ko') */
  locale?: SupportedLocale;
  /** 추가 className */
  className?: string;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 아이콘 표시 여부 */
  showIcon?: boolean;
}

/**
 * 기피 수준 시각화 배지
 * - dislike: 회색 (안 좋아함)
 * - avoid: 노란색 (피하고 싶음)
 * - cannot: 주황색 (못 함)
 * - danger: 빨간색 (위험)
 */
export function AvoidLevelBadge({
  level,
  locale = 'ko',
  className,
  size = 'md',
  showIcon = true,
}: AvoidLevelBadgeProps) {
  const label = getAvoidLevelLabel(level, locale);
  const colors = getAvoidLevelColors(level);
  const priority = getAvoidLevelPriority(level);
  const isCritical = isCriticalAvoid(level);

  // 크기별 스타일
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
      data-testid={`avoid-level-badge-${level}`}
      role="status"
      aria-label={`기피 수준: ${label} (우선순위: ${priority})`}
    >
      {showIcon && (
        <span className="inline-block" aria-hidden="true" title={label}>
          {colors.icon}
        </span>
      )}
      <span className="font-medium">{label}</span>
      {isCritical && (
        <span
          className="inline-block ml-0.5 text-xs font-bold"
          aria-label="위험 수준"
          title="즉시 대응 필요"
        >
          ⚠️
        </span>
      )}
    </div>
  );
}

interface AvoidLevelBadgeGroupProps {
  /** 기피 수준 목록 */
  levels: AvoidLevel[];
  /** 지역 설정 (기본: 'ko') */
  locale?: SupportedLocale;
  /** 추가 className */
  className?: string;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 최대 표시 개수 (초과시 "+N" 표시) */
  maxShow?: number;
}

/**
 * 기피 수준 배지 그룹
 */
export function AvoidLevelBadgeGroup({
  levels,
  locale = 'ko',
  className,
  size = 'md',
  maxShow = 3,
}: AvoidLevelBadgeGroupProps) {
  const displayLevels = levels.slice(0, maxShow);
  const overflowCount = Math.max(0, levels.length - maxShow);

  if (levels.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      data-testid="avoid-level-badge-group"
      role="list"
    >
      {displayLevels.map((level) => (
        <div key={level} role="listitem">
          <AvoidLevelBadge level={level} locale={locale} size={size} />
        </div>
      ))}
      {overflowCount > 0 && (
        <Badge
          variant="outline"
          className={cn('text-xs px-2 py-1', size === 'lg' && 'text-sm px-3 py-1.5')}
        >
          +{overflowCount}
        </Badge>
      )}
    </div>
  );
}

export default AvoidLevelBadge;
