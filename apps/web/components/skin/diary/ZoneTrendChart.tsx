'use client';

import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  SkinDiaryEntry,
  SkinTrendAnalysis,
  TrendDirection,
} from '@/lib/analysis/skin-v2/skin-diary-zone';
import { analyzeSkinTrend } from '@/lib/analysis/skin-v2/skin-diary-zone';

// 트렌드 방향별 스타일
const TREND_CONFIG: Record<
  TrendDirection,
  { icon: typeof TrendingUp; color: string; label: string }
> = {
  improving: { icon: TrendingUp, color: 'text-green-600 dark:text-green-400', label: '개선' },
  stable: { icon: Minus, color: 'text-gray-500 dark:text-gray-400', label: '안정' },
  worsening: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400', label: '악화' },
};

export interface ZoneTrendChartProps {
  entries: SkinDiaryEntry[];
  /** 분석 기간 (일수) */
  periodDays?: 7 | 14 | 30;
  className?: string;
}

// 점수 바 컴포넌트
function ScoreBar({ score, change }: { score: number; change: number }): React.ReactElement {
  function getBarColor(s: number): string {
    if (s >= 70) return 'bg-green-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }
  const barColor = getBarColor(score);

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{score}</span>
      {change !== 0 && (
        <span
          className={`text-[10px] ${change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {change > 0 ? '+' : ''}
          {change}
        </span>
      )}
    </div>
  );
}

/**
 * 존별 트렌드 차트
 * - 12존 점수 변화 시각화
 * - 개선/악화 존 하이라이트
 */
const ZoneTrendChart = memo(function ZoneTrendChart({
  entries,
  periodDays = 14,
  className,
}: ZoneTrendChartProps) {
  const analysis: SkinTrendAnalysis | null = useMemo(() => {
    if (entries.length < 2) return null;
    return analyzeSkinTrend(entries, periodDays);
  }, [entries, periodDays]);

  if (!analysis || analysis.entryCount < 2) {
    return (
      <Card className={className} data-testid="zone-trend-chart">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">존별 변화 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            2회 이상 기록하면 존별 변화 추이를 확인할 수 있어요.
          </p>
        </CardContent>
      </Card>
    );
  }

  const vitalityConfig = TREND_CONFIG[analysis.vitalityTrend];
  const VitalityIcon = vitalityConfig.icon;

  // 우선순위 정렬: 악화 → 안정 → 개선
  const sortedTrends = [...analysis.zoneTrends].sort((a, b) => {
    const order: Record<TrendDirection, number> = { worsening: 0, stable: 1, improving: 2 };
    return order[a.direction] - order[b.direction];
  });

  return (
    <Card className={className} data-testid="zone-trend-chart">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">존별 변화 추이</CardTitle>
          <span className="text-xs text-muted-foreground">최근 {periodDays}일</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전체 바이탈리티 요약 */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <VitalityIcon className={`h-4 w-4 ${vitalityConfig.color}`} />
          <span className="text-sm font-medium">전체 바이탈리티</span>
          <span className={`text-sm font-bold ${vitalityConfig.color}`}>
            {vitalityConfig.label}
          </span>
          {analysis.vitalityChange !== 0 && (
            <span className="text-xs text-muted-foreground">
              ({analysis.vitalityChange > 0 ? '+' : ''}
              {analysis.vitalityChange.toFixed(1)})
            </span>
          )}
        </div>

        {/* 존별 트렌드 리스트 */}
        <div className="space-y-2">
          {sortedTrends.map((trend) => {
            const config = TREND_CONFIG[trend.direction];
            const Icon = config.icon;
            return (
              <div
                key={trend.zoneId}
                className="flex items-center gap-2"
                data-testid={`zone-trend-${trend.zoneId}`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
                <span className="text-xs w-16 shrink-0 truncate">{trend.label}</span>
                <ScoreBar score={trend.currentScore} change={trend.change} />
              </div>
            );
          })}
        </div>

        {/* 요약 통계 */}
        <div className="flex gap-3 pt-2 border-t text-xs text-muted-foreground">
          <span>기록 {analysis.entryCount}회</span>
          {analysis.improvedZones.length > 0 && (
            <span className="text-green-600 dark:text-green-400">
              개선 {analysis.improvedZones.length}존
            </span>
          )}
          {analysis.worsenedZones.length > 0 && (
            <span className="text-red-600 dark:text-red-400">
              악화 {analysis.worsenedZones.length}존
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default ZoneTrendChart;
