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
  const earnedStatus = isEarned ? ' (획득)' : ' (미획득)';
  const badgeAriaLabel = onClick ? `배지: ${badge.name}${earnedStatus}` : undefined;

  // 키보드 접근성 핸들러 — onClick 있을 때만 활성화
  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

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

  // 아이콘 영역 스타일 — isEarned 분기 추출 (cognitive complexity 절감)
  const iconAreaClass = isEarned
    ? cn(rarityColor.bg, rarityColor.border, rarityColor.glow)
    : 'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 grayscale opacity-50';

  return (
    <div
      data-testid="badge-card"
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200',
        onClick && 'cursor-pointer hover:scale-105',
        isEarned ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800/50'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={badgeAriaLabel}
    >
      {/* 배지 아이콘 */}
      <div
        className={cn(
          sizeClasses[size],
          'flex items-center justify-center rounded-full border-2 transition-all',
          iconAreaClass
        )}
      >
        <span className={cn(iconSizes[size], isEarned ? '' : 'opacity-30')}>{badge.icon}</span>
      </div>

      {/* 배지 정보 */}
      {showDetails && (
        <BadgeDetails
          badge={badge}
          isEarned={isEarned}
          earnedAt={earnedAt}
          rarityColor={rarityColor}
          onShare={onShare}
        />
      )}
    </div>
  );
}

// 배지 상세 정보 (획득 상태, 희귀도, 공유) — 분기 로직 분리
function BadgeDetails({
  badge,
  isEarned,
  earnedAt,
  rarityColor,
  onShare,
}: {
  badge: Badge;
  isEarned: boolean;
  earnedAt?: Date;
  rarityColor: (typeof RARITY_COLORS)[keyof typeof RARITY_COLORS];
  onShare?: () => void;
}) {
  return (
    <div className="text-center space-y-1">
      <p
        className={cn(
          'font-medium text-sm line-clamp-1',
          isEarned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
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
        <p className="text-xs text-gray-500 dark:text-gray-400">
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
          : 'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 grayscale opacity-50'
      )}
      aria-label={`${badge.name}${isEarned ? '' : ' (미획득)'}`}
    >
      <span className={cn('text-lg', isEarned ? '' : 'opacity-30')} aria-hidden="true">
        {badge.icon}
      </span>
    </div>
  );
}
