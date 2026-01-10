'use client';

import { memo } from 'react';
import { BarChart, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CorrelationChartProps, CorrelationInsight } from '@/types/skin-diary';

/**
 * 상관관계 차트 컴포넌트
 * - 요인별 상관계수 시각화
 * - 막대 그래프 형태
 */
const CorrelationChart = memo(function CorrelationChart({
  insights,
  className,
}: CorrelationChartProps) {
  if (insights.length === 0) {
    return (
      <Card className={className} data-testid="correlation-chart">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">상관관계 데이터가 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            7일 이상 기록하면 분석 결과를 확인할 수 있어요
          </p>
        </CardContent>
      </Card>
    );
  }

  // 상관계수 절대값 기준 정렬
  const sortedInsights = [...insights].sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
  );

  return (
    <Card className={className} data-testid="correlation-chart">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-violet-500" aria-hidden="true" />
          <CardTitle className="text-lg">피부와 생활 요인 상관관계</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          생활 요인이 피부 컨디션에 미치는 영향을 분석했어요
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {sortedInsights.map((insight) => (
          <CorrelationBar key={insight.factorKey} insight={insight} />
        ))}

        {/* 범례 */}
        <div className="flex justify-center gap-6 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">긍정적 영향</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">부정적 영향</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * 개별 상관관계 막대
 */
const CorrelationBar = memo(function CorrelationBar({ insight }: { insight: CorrelationInsight }) {
  const { factor, correlation, confidence, insight: insightText, isPositive } = insight;

  // 상관계수를 0-100% 스케일로 변환 (절대값 기준)
  const absCorrelation = Math.abs(correlation);
  const barWidth = absCorrelation * 100;

  // 색상 결정
  const barColor = isPositive ? 'bg-green-500' : 'bg-red-500';
  const bgColor = isPositive
    ? 'bg-green-100 dark:bg-green-950/30'
    : 'bg-red-100 dark:bg-red-950/30';

  return (
    <div className="space-y-2" data-testid={`correlation-bar-${insight.factorKey}`}>
      {/* 요인명 및 상관계수 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
          )}
          <span className="font-medium">{factor}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-mono',
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {correlation > 0 ? '+' : ''}
            {(correlation * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-muted-foreground">(신뢰도 {confidence}%)</span>
        </div>
      </div>

      {/* 막대 그래프 */}
      <div className={cn('h-2 rounded-full overflow-hidden', bgColor)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${barWidth}%` }}
          role="progressbar"
          aria-valuenow={Math.round(absCorrelation * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${factor} 상관계수 ${(correlation * 100).toFixed(0)}%`}
        />
      </div>

      {/* 인사이트 텍스트 */}
      <p className="text-sm text-muted-foreground">{insightText}</p>
    </div>
  );
});

export default CorrelationChart;
