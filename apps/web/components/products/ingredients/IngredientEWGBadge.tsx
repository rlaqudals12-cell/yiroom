'use client';

import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { getEWGLevel, getEWGLevelColors, getEWGLevelLabel } from '@/types/ingredient';

interface IngredientEWGBadgeProps {
  /** EWG 점수 (1-10) */
  score?: number | null;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 라벨 표시 여부 */
  showLabel?: boolean;
  /** 아이콘 표시 여부 */
  showIcon?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * EWG 등급 배지 컴포넌트
 * - 1-2: 안전 (녹색)
 * - 3-6: 보통 (노랑)
 * - 7-10: 주의 (빨강)
 * - 미확인: 회색
 */
export function IngredientEWGBadge({
  score,
  size = 'md',
  showLabel = true,
  showIcon = true,
  className,
}: IngredientEWGBadgeProps) {
  const level = getEWGLevel(score);
  const colors = getEWGLevelColors(level);
  const label = getEWGLevelLabel(level);

  // 크기별 스타일
  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // 등급별 아이콘
  const LevelIcon = {
    low: CheckCircle,
    moderate: Shield,
    high: AlertTriangle,
    unknown: HelpCircle,
  }[level];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        colors.bg,
        colors.text,
        colors.border,
        'border',
        sizeStyles[size],
        className
      )}
      title={`EWG 등급: ${score ?? '미확인'} (${label})`}
      data-testid="ewg-badge"
    >
      {showIcon && <LevelIcon className={iconSizes[size]} aria-hidden="true" />}
      {score !== undefined && score !== null && <span className="font-bold">{score}</span>}
      {showLabel && <span>{label}</span>}
    </span>
  );
}

/**
 * EWG 등급 바 (시각적 표시)
 */
interface EWGScoreBarProps {
  score?: number | null;
  className?: string;
}

export function EWGScoreBar({ score, className }: EWGScoreBarProps) {
  const level = getEWGLevel(score);
  const percentage = score ? (score / 10) * 100 : 0;

  return (
    <div className={cn('w-full', className)} data-testid="ewg-score-bar">
      {/* 레이블 */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">EWG 등급</span>
        <IngredientEWGBadge score={score} size="sm" showLabel={false} />
      </div>

      {/* 바 */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            level === 'low' && 'bg-green-500',
            level === 'moderate' && 'bg-yellow-500',
            level === 'high' && 'bg-red-500',
            level === 'unknown' && 'bg-gray-400'
          )}
          style={{ width: score ? `${percentage}%` : '0%' }}
        />
      </div>

      {/* 눈금 */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>1 안전</span>
        <span>5</span>
        <span>10 위험</span>
      </div>
    </div>
  );
}

export default IngredientEWGBadge;
