'use client';

/**
 * 레벨업 축하 모달
 * - 레벨업 시 표시
 * - 티어 변경 시 특별 효과
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LevelUpResult, LevelTier } from '@/types/gamification';
import { TIER_COLORS, TIER_GRADIENT, TIER_NAMES } from '@/lib/gamification/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LevelUpModalProps {
  result: LevelUpResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LevelUpModal({ result, isOpen, onClose }: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && result) {
      setShowConfetti(true);
      // 3초 후 confetti 종료
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, result]);

  if (!result) return null;

  const tierGradient = TIER_GRADIENT[result.newTier];
  const tierColor = TIER_COLORS[result.newTier];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="level-up-modal"
        className={cn(
          'max-w-sm text-center',
          result.tierChanged && 'border-2',
          result.tierChanged && tierColor.border,
        )}
      >
        <DialogHeader className="space-y-4">
          {/* Confetti 효과 (간단한 CSS 애니메이션) */}
          {showConfetti && <ConfettiEffect />}

          {/* 레벨 뱃지 */}
          <div className="flex justify-center">
            <div
              className={cn(
                'w-24 h-24 flex items-center justify-center rounded-full font-bold text-4xl text-white bg-gradient-to-br shadow-xl animate-bounce',
                tierGradient,
              )}
            >
              {result.newLevel}
            </div>
          </div>

          <DialogTitle className="text-2xl">레벨 업!</DialogTitle>

          <DialogDescription className="space-y-2">
            <p className="text-lg text-gray-700">
              레벨 <span className="font-bold">{result.previousLevel}</span>
              {' → '}
              <span className={cn('font-bold', tierColor.text)}>{result.newLevel}</span>
            </p>

            {/* 티어 변경 시 */}
            {result.tierChanged && (
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <p className="text-amber-800 font-medium">
                  새로운 티어 달성!
                </p>
                <p className={cn('text-xl font-bold mt-1', tierColor.text)}>
                  {TIER_NAMES[result.newTier]}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              +{result.xpGained} XP 획득
            </p>
          </DialogDescription>
        </DialogHeader>

        <Button onClick={onClose} className="mt-4 w-full">
          확인
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 간단한 Confetti 효과 (CSS 기반)
 */
function ConfettiEffect() {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const confettiCount = 30;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random();

        return (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-confetti"
            style={{
              backgroundColor: color,
              left: `${left}%`,
              top: '-10px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * 티어 변경 알림 (간단한 버전)
 */
export function TierChangeNotice({
  previousTier,
  newTier,
}: {
  previousTier: LevelTier;
  newTier: LevelTier;
}) {
  const newTierColor = TIER_COLORS[newTier];

  return (
    <div
      className={cn(
        'p-4 rounded-xl text-center space-y-2',
        newTierColor.bg,
        'border',
        newTierColor.border,
      )}
    >
      <p className="text-sm text-gray-600">티어 변경</p>
      <div className="flex items-center justify-center gap-3">
        <span className="text-gray-400">{TIER_NAMES[previousTier]}</span>
        <span className="text-gray-400">→</span>
        <span className={cn('font-bold text-lg', newTierColor.text)}>
          {TIER_NAMES[newTier]}
        </span>
      </div>
    </div>
  );
}
