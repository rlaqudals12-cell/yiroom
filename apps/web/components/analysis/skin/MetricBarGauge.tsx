'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, TrendingUp, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SKIN_METRIC_LABELS, type SkinMetricId } from '@/types/skin-detailed';

/**
 * 지표 상태 정보
 */
interface MetricStatus {
  score: number;
  status: 'good' | 'normal' | 'warning';
  name: string;
}

/**
 * 동년배 백분위 계산 (모의 데이터)
 * 실제로는 DB에서 동일 연령대 평균과 비교
 */
function calculatePercentile(score: number, metricId: SkinMetricId): number {
  // 각 지표별 기준 분포 (정규분포 가정)
  const basePercentiles: Record<SkinMetricId, { mean: number; std: number }> = {
    hydration: { mean: 55, std: 15 },
    oil: { mean: 50, std: 18 },
    pores: { mean: 52, std: 14 },
    wrinkles: { mean: 58, std: 16 },
    pigmentation: { mean: 54, std: 15 },
    elasticity: { mean: 56, std: 14 },
    trouble: { mean: 53, std: 15 },
    sensitivity: { mean: 52, std: 16 },
  };

  const stats = basePercentiles[metricId] || { mean: 50, std: 15 }; // fallback
  const { mean, std } = stats;

  // Z-score 계산 및 백분위 변환
  const zScore = (score - mean) / std;
  // 정규분포 CDF 근사
  const percentile = Math.round(
    100 *
      (0.5 * (1 + Math.sign(zScore) * Math.sqrt(1 - Math.exp((-2 * zScore * zScore) / Math.PI))))
  );

  return Math.max(1, Math.min(99, percentile));
}

/**
 * 점수에 따른 바 색상
 */
function getBarColorClass(score: number): string {
  if (score >= 71) return 'bg-green-500 dark:bg-green-400';
  if (score >= 41) return 'bg-yellow-500 dark:bg-yellow-400';
  return 'bg-red-500 dark:bg-red-400';
}

/**
 * 점수에 따른 텍스트 색상
 */
function getTextColorClass(score: number): string {
  if (score >= 71) return 'text-green-600 dark:text-green-400';
  if (score >= 41) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * 백분위에 따른 라벨
 */
function getPercentileLabel(percentile: number): string {
  if (percentile >= 80) return '상위';
  if (percentile >= 50) return '상위';
  return '하위';
}

/**
 * 나이를 10년 단위 연령대로 변환
 * 예: 25 → 20, 33 → 30, 19 → 10
 */
function getAgeGroup(age: number): number {
  return Math.floor(age / 10) * 10;
}

export interface MetricBarGaugeProps {
  /** 지표 ID */
  metricId: SkinMetricId;
  /** 점수 (0-100) */
  score: number;
  /** 클릭 콜백 */
  onClick?: () => void;
  /** 선택 상태 */
  isSelected?: boolean;
  /** 사용자 나이 (동년배 비교용) */
  userAge?: number;
  /** 추가 className */
  className?: string;
}

/**
 * 개별 지표 바 게이지
 */
export function MetricBarGauge({
  metricId,
  score,
  onClick,
  isSelected,
  userAge = 25,
  className,
}: MetricBarGaugeProps) {
  const label = SKIN_METRIC_LABELS[metricId];
  const percentile = useMemo(() => calculatePercentile(score, metricId), [score, metricId]);

  // 백분위 표시 (상위 N% 또는 하위 N%)
  const percentileDisplay = percentile >= 50 ? `상위 ${100 - percentile}%` : `하위 ${percentile}%`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border transition-all text-left',
        'hover:bg-muted/50 hover:border-primary/30',
        isSelected && 'border-primary bg-primary/5',
        className
      )}
      data-testid={`metric-gauge-${metricId}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn('text-lg font-bold', getTextColorClass(score))}>{score}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* 바 게이지 */}
      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColorClass(score))}
          style={{ width: `${score}%` }}
        />
        {/* 기준선 마커 */}
        <div className="absolute top-0 h-full w-0.5 bg-foreground/20" style={{ left: '40%' }} />
        <div className="absolute top-0 h-full w-0.5 bg-foreground/20" style={{ left: '70%' }} />
      </div>

      {/* 동년배 비교 */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>{getAgeGroup(userAge)}대 중</span>
        <span
          className={cn(
            'font-medium',
            percentile >= 50
              ? 'text-green-600 dark:text-green-400'
              : 'text-orange-600 dark:text-orange-400'
          )}
        >
          {percentileDisplay}
        </span>
      </div>
    </button>
  );
}

export interface MetricBarGaugeListProps {
  /** 지표 데이터 목록 */
  metrics: Record<SkinMetricId, MetricStatus>;
  /** 지표 클릭 콜백 */
  onMetricClick?: (metricId: SkinMetricId) => void;
  /** 현재 선택된 지표 */
  selectedMetric?: SkinMetricId | null;
  /** 사용자 나이 */
  userAge?: number;
  /** 추가 className */
  className?: string;
}

/**
 * 지표 바 게이지 리스트
 * - 7개 지표를 수평 바 게이지로 표시
 * - 동년배 대비 백분위 표시
 * - 전체 순위 요약
 */
export function MetricBarGaugeList({
  metrics,
  onMetricClick,
  selectedMetric,
  userAge = 25,
  className,
}: MetricBarGaugeListProps) {
  // 전체 평균 점수 및 백분위
  const overallStats = useMemo(() => {
    const scores = Object.values(metrics).map((m) => m.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // 전체 평균 백분위 계산
    const percentiles = (Object.keys(metrics) as SkinMetricId[]).map((id) =>
      calculatePercentile(metrics[id].score, id)
    );
    const avgPercentile = Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length);

    return { avgScore, avgPercentile };
  }, [metrics]);

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="metric-bar-gauge-list">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">피부 지표 분석</CardTitle>

          {/* 전체 순위 배지 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    'flex items-center gap-1',
                    overallStats.avgPercentile >= 50
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-orange-500 text-orange-600 dark:text-orange-400'
                  )}
                >
                  <TrendingUp className="h-3 w-3" />
                  {getAgeGroup(userAge)}대 중 {overallStats.avgPercentile >= 50 ? '상위' : '하위'}{' '}
                  {overallStats.avgPercentile >= 50
                    ? 100 - overallStats.avgPercentile
                    : overallStats.avgPercentile}
                  %
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>전체 피부 상태가 {getAgeGroup(userAge)}대 사용자 중</p>
                <p>
                  {overallStats.avgPercentile >= 50 ? '상위' : '하위'}{' '}
                  {overallStats.avgPercentile >= 50
                    ? 100 - overallStats.avgPercentile
                    : overallStats.avgPercentile}
                  %에 해당합니다.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {(Object.keys(metrics) as SkinMetricId[]).map((metricId) => (
          <MetricBarGauge
            key={metricId}
            metricId={metricId}
            score={metrics[metricId].score}
            onClick={() => onMetricClick?.(metricId)}
            isSelected={selectedMetric === metricId}
            userAge={userAge}
          />
        ))}

        {/* 범례 */}
        <div className="pt-3 mt-3 border-t">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>좋음 (71+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>보통 (41-70)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>주의 (0-40)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricBarGaugeList;
