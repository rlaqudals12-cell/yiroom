'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInUpProps {
  /** 자식 요소 */
  children: ReactNode;
  /** 애니메이션 딜레이 (100ms 단위, 0-12) */
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** 추가 className */
  className?: string;
  /** 애니메이션 지속 시간 (기본: 0.5s) */
  duration?: 'fast' | 'normal' | 'slow';
}

const delayClasses: Record<number, string> = {
  0: '',
  1: 'animation-delay-100',
  2: 'animation-delay-200',
  3: 'animation-delay-300',
  4: 'animation-delay-400',
  5: 'animation-delay-500',
  6: 'animation-delay-600',
  7: 'animation-delay-700',
  8: 'animation-delay-800',
  9: 'animation-delay-900',
  10: 'animation-delay-1000',
  11: 'animation-delay-1100',
  12: 'animation-delay-1200',
};

const durationClasses: Record<string, string> = {
  fast: '[animation-duration:0.3s]',
  normal: '[animation-duration:0.5s]',
  slow: '[animation-duration:0.7s]',
};

/**
 * 아래에서 위로 페이드인 애니메이션
 * 결과 화면의 카드들을 순차적으로 등장시킬 때 사용
 *
 * @example
 * ```tsx
 * <FadeInUp delay={0}>첫 번째 카드</FadeInUp>
 * <FadeInUp delay={1}>두 번째 카드</FadeInUp>
 * <FadeInUp delay={2}>세 번째 카드</FadeInUp>
 * ```
 */
export function FadeInUp({
  children,
  delay = 0,
  className,
  duration = 'normal',
}: FadeInUpProps) {
  return (
    <div
      className={cn(
        'opacity-0 animate-fade-in-up',
        delayClasses[delay],
        durationClasses[duration],
        className
      )}
      data-testid="fade-in-up"
    >
      {children}
    </div>
  );
}

export default FadeInUp;
