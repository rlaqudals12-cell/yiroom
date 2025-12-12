'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScaleInProps {
  /** 자식 요소 */
  children: ReactNode;
  /** 애니메이션 딜레이 (100ms 단위, 0-8) */
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** 추가 className */
  className?: string;
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
};

/**
 * 스케일 인 애니메이션
 * 메인 결과 카드나 중요 요소 강조에 사용
 *
 * @example
 * ```tsx
 * <ScaleIn>
 *   <WorkoutTypeCard type="builder" />
 * </ScaleIn>
 * ```
 */
export function ScaleIn({
  children,
  delay = 0,
  className,
}: ScaleInProps) {
  return (
    <div
      className={cn(
        'opacity-0 animate-scale-in',
        delayClasses[delay],
        className
      )}
      data-testid="scale-in"
    >
      {children}
    </div>
  );
}

export default ScaleIn;
