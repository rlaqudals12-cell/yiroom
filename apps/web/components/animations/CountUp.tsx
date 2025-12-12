'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CountUpProps {
  /** 최종 숫자 */
  end: number;
  /** 시작 숫자 (기본: 0) */
  start?: number;
  /** 애니메이션 지속 시간 (ms, 기본: 1000) */
  duration?: number;
  /** 소수점 자릿수 */
  decimals?: number;
  /** 접두사 (예: "₩") */
  prefix?: string;
  /** 접미사 (예: "kcal") */
  suffix?: string;
  /** 천 단위 구분자 */
  separator?: string;
  /** 추가 className */
  className?: string;
  /** 애니메이션 트리거 (기본: true) */
  trigger?: boolean;
}

/**
 * 숫자 카운트업 애니메이션
 * 칼로리, 영양소 수치 등 숫자 표시에 사용
 *
 * @example
 * ```tsx
 * <CountUp end={2100} suffix="kcal" />
 * <CountUp end={150} prefix="₩" separator="," />
 * ```
 */
export function CountUp({
  end,
  start = 0,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = '',
  className,
  trigger = true,
}: CountUpProps) {
  const [value, setValue] = useState(start);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) {
      setValue(start);
      return;
    }

    // prefers-reduced-motion 체크
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTimeRef.current) / duration,
        1
      );

      // easeOutQuart 이징 함수
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = start + (end - start) * easeProgress;

      setValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, start, end, duration]);

  // 숫자 포맷팅
  const formattedValue = (() => {
    const fixed = value.toFixed(decimals);
    if (separator) {
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return parts.join('.');
    }
    return fixed;
  })();

  return (
    <span
      className={cn('tabular-nums', className)}
      data-testid="count-up"
      aria-live="polite"
    >
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

export default CountUp;
