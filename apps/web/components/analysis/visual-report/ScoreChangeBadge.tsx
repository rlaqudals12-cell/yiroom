'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// 타입 정의
// ============================================

export interface ScoreChangeBadgeProps {
  /** 점수 변화량 (양수: 상승, 음수: 하락, 0: 유지) */
  delta: number;
  /** 배지 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 이전 점수 표시 여부 */
  showPreviousScore?: boolean;
  /** 이전 점수 */
  previousScore?: number;
  /** 애니메이션 활성화 */
  animate?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// 크기별 스타일
const SIZE_STYLES = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-0.5',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-2 py-1 text-sm gap-1',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-1.5',
    icon: 'w-5 h-5',
  },
} as const;

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 점수 변화 배지 컴포넌트
 *
 * 이전 분석 대비 점수 변화를 시각적으로 표시합니다.
 * - 상승: 초록색 + ↑ 아이콘
 * - 하락: 빨간색 + ↓ 아이콘
 * - 유지: 회색 + → 아이콘
 *
 * @example
 * ```tsx
 * <ScoreChangeBadge delta={5} />  // ↑5점
 * <ScoreChangeBadge delta={-3} /> // ↓3점
 * <ScoreChangeBadge delta={0} />  // →0점
 * ```
 */
export function ScoreChangeBadge({
  delta,
  size = 'md',
  showPreviousScore = false,
  previousScore,
  animate = true,
  className,
}: ScoreChangeBadgeProps) {
  const sizeStyle = SIZE_STYLES[size];

  // 변화 방향 결정
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';

  // 방향별 스타일
  const directionStyles = {
    up: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: TrendingUp,
      prefix: '+',
    },
    down: {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-600 dark:text-red-400',
      icon: TrendingDown,
      prefix: '',
    },
    neutral: {
      bg: 'bg-gray-100 dark:bg-gray-800/40',
      text: 'text-gray-600 dark:text-gray-400',
      icon: Minus,
      prefix: '',
    },
  };

  const style = directionStyles[direction];
  const IconComponent = style.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeStyle.badge,
        style.bg,
        style.text,
        animate && 'animate-in fade-in-0 zoom-in-95 duration-300',
        className
      )}
      data-testid="score-change-badge"
      aria-label={`점수 변화: ${delta > 0 ? '+' : ''}${delta}점`}
    >
      <IconComponent className={sizeStyle.icon} aria-hidden="true" />
      <span>
        {style.prefix}
        {Math.abs(delta)}점
      </span>
      {showPreviousScore && previousScore !== undefined && (
        <span className="opacity-70 ml-1">(이전: {previousScore}점)</span>
      )}
    </div>
  );
}

// ============================================
// 유틸리티 컴포넌트
// ============================================

export interface MetricDeltaProps {
  /** 변화량 */
  delta: number;
  /** 크기 */
  size?: 'xs' | 'sm';
  /** 추가 클래스 */
  className?: string;
}

/**
 * 지표 옆에 표시되는 작은 변화량 표시
 *
 * @example
 * ```tsx
 * <div>수분도: 85점 <MetricDelta delta={3} /></div>
 * ```
 */
export function MetricDelta({ delta, size = 'xs', className }: MetricDeltaProps) {
  if (delta === 0) return null;

  const isPositive = delta > 0;
  const sizeClass = size === 'xs' ? 'text-[10px]' : 'text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center',
        sizeClass,
        isPositive ? 'text-emerald-500' : 'text-red-500',
        className
      )}
      aria-label={`변화: ${isPositive ? '+' : ''}${delta}`}
    >
      {isPositive ? '↑' : '↓'}
      {Math.abs(delta)}
    </span>
  );
}

export default ScoreChangeBadge;
