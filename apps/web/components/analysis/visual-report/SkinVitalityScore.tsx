'use client';

import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FadeInUp } from '@/components/animations';

// SkinVitalityScore Props
export interface SkinVitalityScoreProps {
  score: number; // 0-100
  factors: {
    positive: string[]; // ["탄력 우수", "수분 적정"]
    negative: string[]; // ["유분 과다", "모공 확대"]
  };
  showDetails?: boolean;
  animate?: boolean;
  className?: string;
}

// 점수에 따른 레벨 및 색상
function getVitalityLevel(score: number) {
  if (score >= 80) {
    return {
      level: 'excellent',
      label: '매우 활력 있음',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
      progressColor: 'bg-emerald-500',
    };
  }
  if (score >= 60) {
    return {
      level: 'good',
      label: '양호함',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/40',
      progressColor: 'bg-blue-500',
    };
  }
  if (score >= 40) {
    return {
      level: 'moderate',
      label: '관리 필요',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
      progressColor: 'bg-yellow-500',
    };
  }
  return {
    level: 'low',
    label: '집중 케어 권장',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/40',
    progressColor: 'bg-orange-500',
  };
}

/**
 * 피부 활력도 컴포넌트
 * "피부 나이" 대신 "피부 활력도"로 표현하여 정확도 한계를 고려한 UX 제공
 *
 * @example
 * ```tsx
 * <SkinVitalityScore
 *   score={78}
 *   factors={{
 *     positive: ['탄력 우수', '수분 충분'],
 *     negative: ['유분 과다'],
 *   }}
 *   showDetails
 * />
 * ```
 */
export function SkinVitalityScore({
  score,
  factors,
  showDetails = true,
  animate = true,
  className,
}: SkinVitalityScoreProps) {
  const vitality = getVitalityLevel(score);
  const clampedScore = Math.max(0, Math.min(100, score));

  const cardContent = (
    <Card
      className={cn(
        'border overflow-hidden',
        'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30',
        'border-purple-200 dark:border-purple-800',
        className
      )}
      data-testid="skin-vitality-score"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-purple-500" />
          피부 활력도
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 점수 표시 */}
        <div className="text-center">
          <div className="inline-flex items-baseline gap-1">
            <span className={cn('text-4xl font-bold', vitality.color)}>{clampedScore}</span>
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <p className={cn('text-sm font-medium mt-1', vitality.color)}>{vitality.label}</p>
        </div>

        {/* 프로그레스 바 */}
        <div className="relative">
          <Progress value={clampedScore} className="h-3 bg-gray-200 dark:bg-gray-700" />
          <div
            className={cn(
              'absolute top-0 left-0 h-3 rounded-full transition-all duration-500',
              vitality.progressColor
            )}
            style={{ width: `${clampedScore}%` }}
          />
        </div>

        {/* 요인 상세 */}
        {showDetails && (factors.positive.length > 0 || factors.negative.length > 0) && (
          <div className="space-y-3 pt-2">
            {/* 강점 */}
            {factors.positive.length > 0 && (
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">강점: </span>
                  <span className="text-muted-foreground">{factors.positive.join(', ')}</span>
                </div>
              </div>
            )}

            {/* 개선점 */}
            {factors.negative.length > 0 && (
              <div className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-amber-700 dark:text-amber-300">개선점: </span>
                  <span className="text-muted-foreground">{factors.negative.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 애니메이션 여부에 따라 FadeInUp 래핑
  if (animate) {
    return <FadeInUp delay={0}>{cardContent}</FadeInUp>;
  }

  return cardContent;
}

export default SkinVitalityScore;
