'use client';

/**
 * 레벨 프로그레스 컴포넌트
 * - 현재 레벨 및 XP 진행률 표시
 * - 티어 배지 표시
 */

import { cn } from '@/lib/utils';
import type { LevelInfo } from '@/types/gamification';
import { TIER_COLORS, TIER_GRADIENT, TIER_NAMES } from '@/lib/gamification/constants';

interface LevelProgressProps {
  levelInfo: LevelInfo;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelProgress({
  levelInfo,
  showDetails = true,
  size = 'md',
}: LevelProgressProps) {
  const tierColor = TIER_COLORS[levelInfo.tier];
  const tierGradient = TIER_GRADIENT[levelInfo.tier];

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      level: 'w-8 h-8 text-sm',
      bar: 'h-1.5',
      text: 'text-xs',
    },
    md: {
      container: 'gap-3',
      level: 'w-10 h-10 text-base',
      bar: 'h-2',
      text: 'text-sm',
    },
    lg: {
      container: 'gap-4',
      level: 'w-12 h-12 text-lg',
      bar: 'h-3',
      text: 'text-base',
    },
  };

  const sizeClass = sizeClasses[size];

  return (
    <div data-testid="level-progress" className={cn('flex items-center', sizeClass.container)}>
      {/* 레벨 뱃지 */}
      <div
        className={cn(
          sizeClass.level,
          'flex items-center justify-center rounded-full font-bold text-white bg-gradient-to-br',
          tierGradient,
        )}
      >
        {levelInfo.level}
      </div>

      {/* 프로그레스 영역 */}
      <div className="flex-1 space-y-1">
        {/* 상단 정보 */}
        {showDetails && (
          <div className="flex items-center justify-between">
            <span className={cn(sizeClass.text, tierColor.text, 'font-medium')}>
              {levelInfo.tierName}
            </span>
            <span className={cn(sizeClass.text, 'text-gray-500')}>
              {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP
            </span>
          </div>
        )}

        {/* 프로그레스 바 */}
        <div className={cn(sizeClass.bar, 'bg-gray-100 rounded-full overflow-hidden')}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 bg-gradient-to-r',
              tierGradient,
            )}
            style={{ width: `${levelInfo.xpProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 레벨 카드 (상세 표시용)
 */
interface LevelCardProps {
  levelInfo: LevelInfo;
  className?: string;
}

export function LevelCard({ levelInfo, className }: LevelCardProps) {
  const tierColor = TIER_COLORS[levelInfo.tier];
  const tierGradient = TIER_GRADIENT[levelInfo.tier];

  return (
    <div
      data-testid="level-card"
      className={cn(
        'p-4 rounded-2xl bg-white border shadow-sm space-y-4',
        tierColor.border,
        className,
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        {/* 레벨 배지 */}
        <div
          className={cn(
            'w-16 h-16 flex items-center justify-center rounded-full font-bold text-2xl text-white bg-gradient-to-br shadow-lg',
            tierGradient,
          )}
        >
          {levelInfo.level}
        </div>

        {/* 티어 정보 */}
        <div>
          <p className="text-sm text-gray-500">현재 레벨</p>
          <p className={cn('text-xl font-bold', tierColor.text)}>
            {levelInfo.tierName}
          </p>
        </div>
      </div>

      {/* 프로그레스 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">다음 레벨까지</span>
          <span className="font-medium">
            {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP
          </span>
        </div>

        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 bg-gradient-to-r',
              tierGradient,
            )}
            style={{ width: `${levelInfo.xpProgress}%` }}
          />
        </div>

        <p className="text-xs text-gray-500 text-center">
          총 {levelInfo.totalXp.toLocaleString()} XP 획득
        </p>
      </div>
    </div>
  );
}

/**
 * 티어 배지 (아이콘만)
 */
export function TierBadge({
  tier,
  level,
  size = 'md',
}: {
  tier: LevelInfo['tier'];
  level: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const tierGradient = TIER_GRADIENT[tier];

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        'flex items-center justify-center rounded-full font-bold text-white bg-gradient-to-br',
        tierGradient,
      )}
      title={`레벨 ${level} - ${TIER_NAMES[tier]}`}
    >
      {level}
    </div>
  );
}
