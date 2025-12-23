'use client';

/**
 * 배지 획득 알림 컴포넌트
 * - Toast 형태로 배지 획득 표시
 * - 자동 닫힘 지원
 */

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Badge, BadgeAwardResult } from '@/types/gamification';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/gamification/constants';

interface BadgeNotificationProps {
  result: BadgeAwardResult | null;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

export function BadgeNotification({
  result,
  isVisible,
  onClose,
  autoCloseDelay = 5000,
}: BadgeNotificationProps) {
  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay, onClose]);

  if (!result || !result.success || !isVisible) return null;

  const { badge, xpAwarded, levelUpResult } = result;
  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <div
      data-testid="badge-notification"
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm',
        'animate-slide-up',
      )}
    >
      <div
        className={cn(
          'flex items-start gap-4 p-4 rounded-2xl shadow-lg border-2 bg-white',
          rarityColor.border,
          rarityColor.glow,
        )}
      >
        {/* 배지 아이콘 */}
        <div
          className={cn(
            'w-14 h-14 flex items-center justify-center rounded-full text-2xl shrink-0',
            rarityColor.bg,
          )}
        >
          {badge.icon}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">배지 획득!</p>
          <p className="font-bold text-gray-900 truncate">{badge.name}</p>

          {/* 희귀도 & XP */}
          <div className="flex items-center gap-2 mt-1">
            {badge.rarity !== 'common' && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  rarityColor.bg,
                  rarityColor.text,
                )}
              >
                {RARITY_NAMES[badge.rarity]}
              </span>
            )}
            {xpAwarded > 0 && (
              <span className="text-xs text-green-600 font-medium">
                +{xpAwarded} XP
              </span>
            )}
          </div>

          {/* 레벨업 표시 */}
          {levelUpResult && levelUpResult.newLevel > levelUpResult.previousLevel && (
            <p className="text-xs text-blue-600 font-medium mt-1">
              레벨 {levelUpResult.newLevel} 달성!
            </p>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="알림 닫기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * 다중 배지 획득 알림 (스택)
 */
interface MultiBadgeNotificationProps {
  results: BadgeAwardResult[];
  onDismiss: (index: number) => void;
}

export function MultiBadgeNotification({
  results,
  onDismiss,
}: MultiBadgeNotificationProps) {
  const successResults = results.filter((r) => r.success);

  if (successResults.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {successResults.map((result, index) => (
        <SingleBadgeToast
          key={result.badge.id}
          badge={result.badge}
          xpAwarded={result.xpAwarded}
          onClose={() => onDismiss(index)}
        />
      ))}
    </div>
  );
}

/**
 * 단일 배지 Toast (간단한 버전)
 */
function SingleBadgeToast({
  badge,
  xpAwarded,
  onClose,
}: {
  badge: Badge;
  xpAwarded: number;
  onClose: () => void;
}) {
  const rarityColor = RARITY_COLORS[badge.rarity];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl shadow-lg border bg-white animate-slide-up',
        rarityColor.border,
      )}
    >
      <div
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-full text-lg',
          rarityColor.bg,
        )}
      >
        {badge.icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{badge.name}</p>
        {xpAwarded > 0 && (
          <p className="text-xs text-green-600">+{xpAwarded} XP</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}
