'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BadgeDropProps {
  /** 트리거 여부 */
  trigger: boolean;
  /** 배지 이모지 또는 컴포넌트 */
  badge: React.ReactNode;
  /** 배지 이름 */
  name: string;
  /** 추가 설명 */
  description?: string;
  /** 완료 콜백 */
  onComplete?: () => void;
  /** 추가 className */
  className?: string;
}

/**
 * 배지 획득 드롭 애니메이션
 * 위에서 아래로 배지가 떨어지며 콘페티 발사
 *
 * @example
 * ```tsx
 * <BadgeDrop
 *   trigger={earnedBadge}
 *   badge="🏅"
 *   name="첫 운동 완료"
 *   description="첫 번째 운동을 완료했어요!"
 * />
 * ```
 */
export function BadgeDrop({
  trigger,
  badge,
  name,
  description,
  onComplete,
  className,
}: BadgeDropProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'drop' | 'bounce' | 'show' | 'exit'>('idle');

  // 콘페티 발사
  const fireConfetti = useCallback(async () => {
    const confetti = (await import('canvas-confetti')).default;

    // 메달 색상 콘페티
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'];

    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors,
      disableForReducedMotion: true,
    });
  }, []);

  useEffect(() => {
    if (trigger && phase === 'idle') {
      setIsVisible(true);
      setPhase('drop');

      // 바운스
      setTimeout(() => {
        setPhase('bounce');
        fireConfetti();
      }, 400);

      // 표시
      setTimeout(() => setPhase('show'), 600);

      // 종료
      setTimeout(() => {
        setPhase('exit');
        setTimeout(() => {
          setIsVisible(false);
          setPhase('idle');
          onComplete?.();
        }, 300);
      }, 3000);
    }
  }, [trigger, phase, fireConfetti, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}
      data-testid="badge-drop"
    >
      {/* 배경 오버레이 */}
      <div
        className={cn(
          'absolute inset-0 bg-black/30 transition-opacity duration-300',
          phase === 'exit' ? 'opacity-0' : 'opacity-100'
        )}
        onClick={() => {
          setPhase('exit');
          setTimeout(() => {
            setIsVisible(false);
            setPhase('idle');
            onComplete?.();
          }, 300);
        }}
      />

      {/* 배지 컨테이너 */}
      <div
        className={cn(
          'relative flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-b from-amber-50 to-background shadow-2xl',
          'transition-all duration-300',
          phase === 'drop' && '-translate-y-[100vh] opacity-100',
          phase === 'bounce' && 'translate-y-2 opacity-100',
          phase === 'show' && 'translate-y-0 opacity-100',
          phase === 'exit' && 'scale-90 opacity-0'
        )}
        style={{
          transitionTimingFunction:
            phase === 'bounce' ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out',
        }}
      >
        {/* 배지 */}
        <div className="text-7xl animate-bounce-slow">{badge}</div>

        {/* 배지 이름 */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground">{name}</h3>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>

        {/* 축하 메시지 */}
        <div className="flex items-center gap-1 text-amber-600 font-medium">
          <span>🎉</span>
          <span>축하해요!</span>
          <span>🎉</span>
        </div>
      </div>
    </div>
  );
}

export default BadgeDrop;
