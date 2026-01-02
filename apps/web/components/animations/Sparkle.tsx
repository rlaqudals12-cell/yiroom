'use client';

import { ReactNode, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparkleProps {
  /** 자식 요소 (아이콘 등) */
  children: ReactNode;
  /** 스파클 색상 */
  color?: string;
  /** 스파클 개수 (기본: 6) */
  count?: number;
  /** 추가 className */
  className?: string;
  /** 활성화 여부 */
  active?: boolean;
}

interface SparkleParticle {
  id: number;
  size: number;
  top: string;
  left: string;
  delay: string;
  duration: string;
}

/**
 * 스파클 효과 컴포넌트
 * 분석 완료 시 결과 아이콘 주위에 반짝이는 효과
 *
 * @example
 * ```tsx
 * <Sparkle active={isComplete}>
 *   <span className="text-4xl">✨</span>
 * </Sparkle>
 * ```
 */
export function Sparkle({
  children,
  color = '#FFD700',
  count = 6,
  className,
  active = true,
}: SparkleProps) {
  // 랜덤 위치의 스파클 파티클 생성
  const particles = useMemo<SparkleParticle[]>(() => {
    if (!active) return [];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 8 + 4, // 4-12px
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1000}ms`,
      duration: `${Math.random() * 500 + 500}ms`, // 500-1000ms
    }));
  }, [count, active]);

  return (
    <div className={cn('relative inline-block', className)} data-testid="sparkle">
      {/* 스파클 파티클들 */}
      {active &&
        particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute animate-sparkle pointer-events-none"
            style={{
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
              backgroundColor: color,
              borderRadius: '50%',
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              boxShadow: `0 0 ${particle.size}px ${color}`,
            }}
          />
        ))}
      {/* 메인 컨텐츠 */}
      {children}
    </div>
  );
}

export default Sparkle;
