'use client';

/**
 * 배지 카드 컴포넌트
 * - 개별 배지 표시
 * - 획득/미획득 상태 구분
 */

import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Badge } from '@/types/gamification';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/gamification/constants';

interface BadgeCardProps {
  badge: Badge;
  isEarned: boolean;
  earnedAt?: Date;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
  onShare?: () => void;
}

export function BadgeCard({
  badge,
  isEarned,
  earnedAt,
  size = 'md',
  showDetails = true,
  onClick,
  onShare,
}: BadgeCardProps) {
  const rarityColor = RARITY_COLORS[badge.rarity];

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div
      data-testid="badge-card"
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200',
        onClick && 'cursor-pointer hover:scale-105',
        isEarned ? 'bg-white' : 'bg-gray-50'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `배지: ${badge.name}${isEarned ? ' (획득)' : ' (미획득)'}` : undefined}
    >
      {/* 배지 아이콘 */}
      <div
        className={cn(
          sizeClasses[size],
          'flex items-center justify-center rounded-full border-2 transition-all',
          isEarned
            ? cn(rarityColor.bg, rarityColor.border, rarityColor.glow)
            : 'bg-gray-100 border-gray-200 grayscale opacity-50'
        )}
      >
        <span className={cn(iconSizes[size], isEarned ? '' : 'opacity-30')}>{badge.icon}</span>
      </div>

      {/* 배지 정보 */}
      {showDetails && (
        <div className="text-center space-y-1">
          <p
            className={cn(
              'font-medium text-sm line-clamp-1',
              isEarned ? 'text-gray-900' : 'text-gray-400'
            )}
          >
            {badge.name}
          </p>

          {/* 희귀도 태그 */}
          {isEarned && badge.rarity !== 'common' && (
            <span
              className={cn(
                'inline-block px-2 py-0.5 text-xs font-medium rounded-full',
                rarityColor.bg,
                rarityColor.text
              )}
            >
              {RARITY_NAMES[badge.rarity]}
            </span>
          )}

          {/* 획득일 */}
          {isEarned && earnedAt && (
            <p className="text-xs text-gray-500">
              {earnedAt.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}

          {/* 공유 버튼 */}
          {isEarned && onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={`${badge.name} 배지 공유하기`}
            >
              <Share2 className="w-3 h-3" />
              공유
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 미니 배지 (리스트용)
 */
export function BadgeMini({ badge, isEarned }: { badge: Badge; isEarned: boolean }) {
  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <div
      data-testid="badge-mini"
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-full border',
        isEarned
          ? cn(rarityColor.bg, rarityColor.border)
          : 'bg-gray-100 border-gray-200 grayscale opacity-50'
      )}
      aria-label={`${badge.name}${isEarned ? '' : ' (미획득)'}`}
    >
      <span className={cn('text-lg', isEarned ? '' : 'opacity-30')} aria-hidden="true">
        {badge.icon}
      </span>
    </div>
  );
}
