'use client';

import { memo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Award,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { MonthlyReportCardProps } from '@/types/skin-diary';
import { CONDITION_EMOJIS, CONDITION_COLORS } from '@/types/skin-diary';

/**
 * 월간 리포트 카드 컴포넌트
 * - 월간 요약 정보 표시
 * - 평균 컨디션, 트렌드, 루틴 완료율
 */
const MonthlyReportCard = memo(function MonthlyReportCard({
  report,
  onViewDetails,
  className,
}: MonthlyReportCardProps) {
  const { month, avgCondition, trendDirection, routineCompletionRate, topFactors, totalEntries } =
    report;

  // 월 파싱 (2026-01 -> 2026년 1월)
  const [year, monthNum] = month.split('-');
  const monthLabel = `${year}년 ${parseInt(monthNum)}월`;

  // 트렌드 아이콘/색상
  const TrendIcon =
    trendDirection === 'improving'
      ? TrendingUp
      : trendDirection === 'declining'
        ? TrendingDown
        : Minus;
  const trendColor =
    trendDirection === 'improving'
      ? 'text-green-500'
      : trendDirection === 'declining'
        ? 'text-red-500'
        : 'text-muted-foreground';
  const trendLabel =
    trendDirection === 'improving'
      ? '개선 중'
      : trendDirection === 'declining'
        ? '주의 필요'
        : '안정적';

  // 평균 컨디션에 가장 가까운 점수
  const nearestScore = Math.round(avgCondition) as 1 | 2 | 3 | 4 | 5;
  const conditionEmoji = CONDITION_EMOJIS[nearestScore];
  const conditionColor = CONDITION_COLORS[nearestScore];

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="monthly-report-card">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-500" aria-hidden="true" />
            <CardTitle className="text-lg">{monthLabel} 리포트</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{totalEntries}일 기록</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* 평균 컨디션 & 트렌드 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">평균 컨디션</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl" style={{ textShadow: `0 0 8px ${conditionColor}` }}>
                {conditionEmoji}
              </span>
              <span className="text-2xl font-bold">{avgCondition.toFixed(1)}</span>
              <span className="text-muted-foreground">/5</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <p className="text-sm text-muted-foreground">트렌드</p>
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">{trendLabel}</span>
            </div>
          </div>
        </div>

        {/* 루틴 완료율 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">루틴 완료율</h4>

          <div className="space-y-3">
            {/* 아침 루틴 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  <span>아침 루틴</span>
                </div>
                <span className="font-medium">{routineCompletionRate.morning}%</span>
              </div>
              <Progress
                value={routineCompletionRate.morning}
                className="h-2"
                aria-label={`아침 루틴 완료율 ${routineCompletionRate.morning}%`}
              />
            </div>

            {/* 저녁 루틴 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                  <span>저녁 루틴</span>
                </div>
                <span className="font-medium">{routineCompletionRate.evening}%</span>
              </div>
              <Progress
                value={routineCompletionRate.evening}
                className="h-2"
                aria-label={`저녁 루틴 완료율 ${routineCompletionRate.evening}%`}
              />
            </div>
          </div>
        </div>

        {/* 주요 인사이트 */}
        {topFactors.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-500" aria-hidden="true" />
              주요 인사이트
            </h4>

            <div className="space-y-2">
              {topFactors.slice(0, 2).map((factor) => (
                <div
                  key={factor.factorKey}
                  className={cn(
                    'p-3 rounded-lg text-sm',
                    factor.isPositive
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200'
                  )}
                >
                  <p className="font-medium">{factor.factor}</p>
                  <p className="text-xs opacity-80 mt-0.5">{factor.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상세 보기 버튼 */}
        {onViewDetails && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewDetails}
            aria-label="월간 리포트 상세 보기"
          >
            <span>상세 리포트 보기</span>
            <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

export default MonthlyReportCard;
