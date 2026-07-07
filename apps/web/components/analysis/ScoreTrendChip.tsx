'use client';

/**
 * "직전 분석 대비" 추이 칩 — 결과 페이지 종합 점수 옆에 표시
 *
 * 첫 분석(직전 없음)이면 렌더하지 않는다 (useScoreTrend가 null).
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ScoreTrend } from '@/hooks/useScoreTrend';

interface ScoreTrendChipProps {
  trend: ScoreTrend | null;
}

export function ScoreTrendChip({ trend }: ScoreTrendChipProps) {
  if (!trend) return null;

  const prevDate = new Date(trend.prevDate).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });

  const style =
    trend.trend === 'up'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : trend.trend === 'down'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'bg-muted text-muted-foreground';

  return (
    <span
      data-testid="score-trend-chip"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${style}`}
      title={`직전 분석(${prevDate}) ${trend.prevScore}점 대비`}
    >
      {trend.trend === 'up' ? (
        <TrendingUp className="w-3 h-3" />
      ) : trend.trend === 'down' ? (
        <TrendingDown className="w-3 h-3" />
      ) : (
        <Minus className="w-3 h-3" />
      )}
      {trend.trend === 'flat'
        ? `지난 분석과 동일`
        : `지난 분석 대비 ${trend.delta > 0 ? '+' : ''}${trend.delta}점`}
    </span>
  );
}
