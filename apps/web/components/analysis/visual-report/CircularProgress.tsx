'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getGradeFromScore } from './constants';

// ============================================
// 타입 정의
// ============================================

export interface CircularProgressProps {
  /** 현재 점수 (0-100) */
  score: number;
  /** 컴포넌트 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 애니메이션 활성화 */
  animate?: boolean;
  /** 애니메이션 지속 시간 (ms) */
  duration?: number;
  /** 점수 표시 여부 */
  showScore?: boolean;
  /** 등급 아이콘 표시 여부 */
  showGradeIcon?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// 크기별 설정
const SIZE_CONFIG = {
  sm: {
    size: 80,
    strokeWidth: 6,
    fontSize: 'text-lg',
    iconSize: 'w-4 h-4',
  },
  md: {
    size: 120,
    strokeWidth: 8,
    fontSize: 'text-2xl',
    iconSize: 'w-5 h-5',
  },
  lg: {
    size: 160,
    strokeWidth: 10,
    fontSize: 'text-3xl',
    iconSize: 'w-6 h-6',
  },
} as const;

// 등급별 그라데이션 색상
const GRADE_GRADIENTS: Record<string, { start: string; end: string }> = {
  diamond: { start: '#06b6d4', end: '#3b82f6' }, // cyan-500 → blue-500
  gold: { start: '#f59e0b', end: '#f97316' }, // amber-500 → orange-500
  silver: { start: '#6b7280', end: '#64748b' }, // gray-500 → slate-500
  bronze: { start: '#f97316', end: '#ef4444' }, // orange-500 → red-500
};

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 원형 Progress 컴포넌트
 *
 * 점수를 원형 게이지로 시각화하며, 등급별 그라데이션 색상과
 * 0→점수 애니메이션을 지원합니다.
 *
 * @example
 * ```tsx
 * <CircularProgress score={85} size="lg" animate />
 * ```
 */
export function CircularProgress({
  score,
  size = 'md',
  animate = true,
  duration = 1200,
  showScore = true,
  showGradeIcon = false,
  className,
}: CircularProgressProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [strokeDashoffset, setStrokeDashoffset] = useState(
    animate ? 283 : 283 - (score / 100) * 283
  );
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const config = SIZE_CONFIG[size];
  const gradeConfig = getGradeFromScore(score);
  const gradient = GRADE_GRADIENTS[gradeConfig.grade];

  // SVG 원형 게이지 계산
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.size / 2;

  // 애니메이션 처리
  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      setStrokeDashoffset(circumference - (score / 100) * circumference);
      return;
    }

    // 이전 애니메이션 취소
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animateProgress = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic 이징
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(eased * score);
      const currentOffset = circumference - ((eased * score) / 100) * circumference;

      setDisplayScore(currentScore);
      setStrokeDashoffset(currentOffset);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateProgress);
      }
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, animate, duration, circumference]);

  // 고유 ID 생성 (그라데이션용)
  const gradientId = `circular-progress-gradient-${size}-${gradeConfig.grade}`;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      data-testid="circular-progress"
    >
      <svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        className="transform -rotate-90"
      >
        {/* 그라데이션 정의 */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </linearGradient>
        </defs>

        {/* 배경 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-muted/30"
        />

        {/* Progress 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] ease-out"
          style={{ transitionDuration: animate ? '0ms' : '300ms' }}
        />
      </svg>

      {/* 중앙 콘텐츠 */}
      {showScore && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', gradeConfig.color, config.fontSize)}>
            {displayScore}
            <span className="text-base font-normal">점</span>
          </span>
          {showGradeIcon && (
            <span className={cn('text-xs mt-0.5', gradeConfig.color)}>{gradeConfig.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default CircularProgress;
