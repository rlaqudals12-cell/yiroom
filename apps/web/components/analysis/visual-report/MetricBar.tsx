'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { FadeInUp } from '@/components/animations';
import { Gem, Crown, Medal, Shield } from 'lucide-react';
import { getGradeFromScore } from './constants';
import type { AnalysisGrade } from './constants';
import type { MetricBarProps } from './types';

// 색맹 모드: 등급별 아이콘으로 이중 인코딩 (색상 + 형태)
const GRADE_ICON_MAP: Record<AnalysisGrade, typeof Gem> = {
  diamond: Gem,
  gold: Crown,
  silver: Medal,
  bronze: Shield,
};

/**
 * 개별 메트릭 바 컴포넌트
 * 피부/체형 분석의 개별 항목 점수를 시각화
 * 색맹 모드: 등급 아이콘으로 이중 인코딩
 *
 * @example
 * ```tsx
 * <MetricBar name="수분" value={75} showGrade delay={0} />
 * <MetricBar name="탄력" value={60} showGrade delay={1} />
 * ```
 */
export function MetricBar({ name, value, showGrade = true, delay = 0, className }: MetricBarProps) {
  const gradeConfig = getGradeFromScore(value);
  const GradeIcon = GRADE_ICON_MAP[gradeConfig.grade];
  // delay 값을 FadeInUp이 허용하는 범위로 제한 (0-12)
  const safeDelay = Math.min(Math.max(delay, 0), 12) as
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12;

  return (
    <FadeInUp delay={safeDelay} className={cn('w-full', className)}>
      <div className="py-2" data-testid="metric-bar">
        {/* 라벨 + 등급 배지 + 점수 */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{name}</span>
            {showGrade && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
                  gradeConfig.bgColor,
                  gradeConfig.color
                )}
              >
                <GradeIcon className="w-3 h-3" aria-hidden="true" />
                {gradeConfig.label}
              </span>
            )}
          </div>
          <span className={cn('text-sm font-bold', gradeConfig.color)}>{Math.round(value)}점</span>
        </div>

        {/* Progress 바 */}
        <Progress
          value={value}
          className="h-2 bg-muted"
          indicatorClassName={cn(gradeConfig.progressColor, 'transition-all duration-700')}
        />
      </div>
    </FadeInUp>
  );
}

export default MetricBar;
