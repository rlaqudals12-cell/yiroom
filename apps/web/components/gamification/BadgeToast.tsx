'use client';

import { Badge as BadgeType } from '@/types/gamification';
import { RARITY_COLORS } from '@/lib/gamification';
import { cn } from '@/lib/utils';

interface BadgeToastProps {
  badge: BadgeType;
}

/**
 * 배지 획득 알림용 Toast 컴포넌트
 * sonner의 custom toast로 사용
 */
export function BadgeToast({ badge }: BadgeToastProps) {
  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <div
      data-testid="badge-toast"
      className="flex items-center gap-3 p-1"
    >
      {/* 배지 아이콘 */}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
          'shadow-lg',
          rarityColor.bg,
          rarityColor.border,
          rarityColor.glow
        )}
      >
        {badge.icon}
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground">
          배지 획득!
        </span>
        <span className="font-semibold">{badge.name}</span>
        <span className="text-xs text-muted-foreground line-clamp-1">
          {badge.description}
        </span>
      </div>
    </div>
  );
}

export default BadgeToast;
