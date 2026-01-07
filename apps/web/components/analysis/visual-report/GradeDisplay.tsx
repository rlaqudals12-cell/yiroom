'use client';

import { Gem, Crown, Medal, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CountUp } from '@/components/animations';
import { FadeInUp } from '@/components/animations';
import { getGradeForAnalysis, SIZE_STYLES } from './constants';
import type { GradeDisplayProps } from './types';

// 아이콘 매핑
const GRADE_ICON_COMPONENTS = {
  Gem,
  Crown,
  Medal,
  Shield,
} as const;

/**
 * 등급 표시 컴포넌트
 * 점수에 따른 등급(다이아몬드/골드/실버/브론즈)을 시각적으로 표현
 *
 * @example
 * ```tsx
 * <GradeDisplay score={85} label="전체 점수" showProgress animate />
 * ```
 */
export function GradeDisplay({
  score,
  label,
  analysisType,
  showProgress = true,
  showScore = true,
  size = 'md',
  animate = true,
  className,
}: GradeDisplayProps) {
  // 분석 타입별 맞춤 메시지 (퍼스널 컬러는 신뢰도 기반 메시지)
  const gradeConfig = getGradeForAnalysis(score, analysisType);
  const sizeStyle = SIZE_STYLES[size];
  const IconComponent = GRADE_ICON_COMPONENTS[gradeConfig.icon];

  return (
    <FadeInUp delay={0} className={cn('w-full', className)}>
      <div
        className={cn(
          'rounded-xl border',
          gradeConfig.bgColor,
          gradeConfig.borderColor,
          sizeStyle.padding
        )}
        data-testid="grade-display"
      >
        {/* 등급 정보 영역 */}
        <div className={cn('flex items-center justify-between', sizeStyle.gap)}>
          {/* 좌측: 아이콘 + 등급 라벨 */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center rounded-full',
                'bg-white/50 dark:bg-white/10',
                size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12'
              )}
            >
              <IconComponent
                className={cn(sizeStyle.iconSize, gradeConfig.color)}
                aria-hidden="true"
              />
            </div>
            <div>
              <span className={cn('font-bold', gradeConfig.color, sizeStyle.fontSize)}>
                {gradeConfig.label}
              </span>
              {label && <p className="text-xs text-muted-foreground mt-0.5">{label}</p>}
            </div>
          </div>

          {/* 우측: 점수 */}
          {showScore && (
            <div className="text-right">
              <div className={cn('font-bold', gradeConfig.color, sizeStyle.scoreSize)}>
                {animate ? (
                  <CountUp end={Math.round(score)} suffix="점" duration={1200} />
                ) : (
                  <span>{Math.round(score)}점</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{gradeConfig.message}</p>
            </div>
          )}
        </div>

        {/* Progress 바 */}
        {showProgress && (
          <div className="mt-3">
            <Progress
              value={animate ? score : 0}
              className="h-2 bg-white/30 dark:bg-white/10"
              indicatorClassName={cn(gradeConfig.progressColor, 'transition-all duration-1000')}
            />
            {/* 등급 경계 표시 */}
            <div className="flex justify-between mt-1 text-xs text-muted-foreground/60">
              <span>0</span>
              <span>50</span>
              <span>70</span>
              <span>85</span>
              <span>100</span>
            </div>
          </div>
        )}

        {/* 설명 (옵션) */}
        {size !== 'sm' && (
          <p className={cn('mt-2 text-muted-foreground', size === 'lg' ? 'text-sm' : 'text-xs')}>
            {gradeConfig.description}
          </p>
        )}
      </div>
    </FadeInUp>
  );
}

export default GradeDisplay;
