'use client';

import { useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

// 축하 효과 유형
export type CelebrationType =
  | 'workout_complete' // 운동 완료: 콘페티 + 체크마크
  | 'goal_achieved' // 목표 달성: 불꽃 + 레벨업
  | 'streak' // 연속 기록: 🔥 펄스
  | 'analysis_complete' // 분석 완료: ✨ 스파클
  | 'badge_earned'; // 배지 획득: 메달 드롭

interface CelebrationEffectProps {
  /** 축하 효과 유형 */
  type: CelebrationType;
  /** 트리거 여부 */
  trigger: boolean;
  /** 메시지 (선택) */
  message?: string;
  /** 아이콘 (선택, 기본값은 type별로 다름) */
  icon?: string;
  /** 추가 className */
  className?: string;
  /** 완료 콜백 */
  onComplete?: () => void;
}

// 타입별 기본 설정
const TYPE_CONFIG: Record<
  CelebrationType,
  {
    icon: string;
    message: string;
    colors: string[];
    confettiCount: number;
    duration: number;
  }
> = {
  workout_complete: {
    icon: '',
    message: '운동 완료!',
    colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    confettiCount: 100,
    duration: 2000,
  },
  goal_achieved: {
    icon: '',
    message: '목표 달성!',
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
    confettiCount: 150,
    duration: 3000,
  },
  streak: {
    icon: '',
    message: '연속 기록!',
    colors: ['#EF4444', '#F97316', '#FB923C', '#FDBA74'],
    confettiCount: 50,
    duration: 1500,
  },
  analysis_complete: {
    icon: '',
    message: '분석 완료!',
    colors: ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD'],
    confettiCount: 80,
    duration: 2500,
  },
  badge_earned: {
    icon: '',
    message: '배지 획득!',
    colors: ['#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8'],
    confettiCount: 120,
    duration: 3000,
  },
};

/**
 * 통합 축하 효과 컴포넌트
 * 이벤트 유형에 맞는 애니메이션을 자동으로 적용
 *
 * @example
 * ```tsx
 * <CelebrationEffect
 *   type="workout_complete"
 *   trigger={isComplete}
 *   message="오늘의 운동을 완료했어요!"
 * />
 * ```
 */
export function CelebrationEffect({
  type,
  trigger,
  message,
  icon,
  className,
  onComplete,
}: CelebrationEffectProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'enter' | 'active' | 'exit'>(
    'idle'
  );

  const config = TYPE_CONFIG[type];
  const displayIcon = icon ?? config.icon;
  const displayMessage = message ?? config.message;

  // 콘페티 발사
  const fireConfetti = useCallback(async () => {
    const confetti = (await import('canvas-confetti')).default;

    const defaults = {
      colors: config.colors,
      disableForReducedMotion: true,
    };

    // 목표 달성: 불꽃 효과 (양쪽에서 발사)
    if (type === 'goal_achieved') {
      confetti({
        ...defaults,
        particleCount: config.confettiCount,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        ...defaults,
        particleCount: config.confettiCount,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
      return;
    }

    // 배지 획득: 위에서 아래로 떨어짐
    if (type === 'badge_earned') {
      confetti({
        ...defaults,
        particleCount: config.confettiCount,
        spread: 100,
        origin: { x: 0.5, y: 0 },
        gravity: 1.5,
      });
      return;
    }

    // 기본: 중앙에서 발사
    confetti({
      ...defaults,
      particleCount: config.confettiCount,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
    });

    // 추가 발사 (workout_complete, analysis_complete)
    if (type === 'workout_complete' || type === 'analysis_complete') {
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: Math.floor(config.confettiCount * 0.5),
          spread: 90,
          origin: { x: 0.3, y: 0.7 },
        });
      }, 150);
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: Math.floor(config.confettiCount * 0.5),
          spread: 90,
          origin: { x: 0.7, y: 0.7 },
        });
      }, 300);
    }
  }, [type, config]);

  useEffect(() => {
    if (trigger && animationPhase === 'idle') {
      setIsVisible(true);
      setAnimationPhase('enter');

      // 콘페티 발사 (streak 제외)
      if (type !== 'streak') {
        fireConfetti();
      }

      // 활성 상태로 전환
      setTimeout(() => setAnimationPhase('active'), 100);

      // 종료
      setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setIsVisible(false);
          setAnimationPhase('idle');
          onComplete?.();
        }, 300);
      }, config.duration);
    }
  }, [trigger, animationPhase, type, config.duration, fireConfetti, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center pointer-events-none',
        className
      )}
      data-testid="celebration-effect"
    >
      {/* 배경 오버레이 */}
      <div
        className={cn(
          'absolute inset-0 bg-black/20 transition-opacity duration-300',
          animationPhase === 'enter' && 'opacity-0',
          animationPhase === 'active' && 'opacity-100',
          animationPhase === 'exit' && 'opacity-0'
        )}
      />

      {/* 메인 컨텐츠 */}
      <div
        className={cn(
          'relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/95 backdrop-blur-sm shadow-2xl',
          'transition-all duration-300 ease-out',
          animationPhase === 'enter' && 'scale-50 opacity-0',
          animationPhase === 'active' && 'scale-100 opacity-100',
          animationPhase === 'exit' && 'scale-75 opacity-0'
        )}
      >
        {/* 아이콘 */}
        <span
          className={cn(
            'text-6xl',
            type === 'streak' && 'animate-pulse',
            type === 'badge_earned' && 'animate-bounce'
          )}
        >
          {displayIcon}
        </span>

        {/* 메시지 */}
        <p className="text-xl font-bold text-foreground text-center">{displayMessage}</p>
      </div>
    </div>
  );
}

export default CelebrationEffect;
