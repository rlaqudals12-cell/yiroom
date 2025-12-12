'use client';

import { STREAK_BADGES } from '@/lib/workout/streak';

interface StreakBadgeProps {
  badgeId: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

/**
 * Streak 배지 컴포넌트
 * - 마일스톤 배지 표시
 */
export function StreakBadge({
  badgeId,
  size = 'md',
  showName = true,
}: StreakBadgeProps) {
  // 배지 ID에서 일수 추출 (예: '7day' -> 7)
  const milestone = parseInt(badgeId.replace('day', ''), 10);
  const badge = STREAK_BADGES[milestone];

  if (!badge) return null;

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div
      className="flex flex-col items-center gap-1"
      data-testid="streak-badge"
    >
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full bg-gradient-to-br from-module-workout to-module-workout-dark
          flex items-center justify-center shadow-lg
        `}
        aria-label={badge.name}
      >
        <span>{badge.emoji}</span>
      </div>
      {showName && (
        <span className="text-xs font-medium text-gray-600">{badge.name}</span>
      )}
    </div>
  );
}

interface StreakBadgeListProps {
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Streak 배지 목록 컴포넌트
 */
export function StreakBadgeList({ badges, size = 'sm' }: StreakBadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      data-testid="streak-badge-list"
    >
      {badges.map((badgeId) => (
        <StreakBadge key={badgeId} badgeId={badgeId} size={size} showName={false} />
      ))}
    </div>
  );
}
