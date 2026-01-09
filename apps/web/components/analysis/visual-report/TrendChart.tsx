'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendDataPoint {
  date: Date;
  score: number;
  label?: string;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  metric: 'overall' | 'hydration' | 'oiliness' | 'pores' | 'vitality';
  height?: number;
  showGoal?: boolean;
  goalScore?: number;
  className?: string;
}

const METRIC_LABELS: Record<string, string> = {
  overall: '종합 점수',
  hydration: '수분도',
  oiliness: '유분도',
  pores: '모공',
  vitality: '활력도',
};

const METRIC_COLORS: Record<string, string> = {
  overall: 'hsl(var(--primary))',
  hydration: '#3b82f6', // blue
  oiliness: '#f59e0b', // amber
  pores: '#8b5cf6', // violet
  vitality: '#10b981', // emerald
};

/**
 * 트렌드 차트 컴포넌트
 * 월별/주별 점수 변화를 시각화
 * recharts 의존성 없이 custom SVG로 구현
 */
export function TrendChart({
  data,
  metric,
  height = 160,
  showGoal = false,
  goalScore = 80,
  className,
}: TrendChartProps) {
  // 최근 6개 데이터만 표시
  const recentData = useMemo(() => data.slice(-6), [data]);

  // 트렌드 계산
  const trend = useMemo(() => {
    if (recentData.length < 2) return 'same';
    const first = recentData[0].score;
    const last = recentData[recentData.length - 1].score;
    const diff = last - first;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'same';
  }, [recentData]);

  // 차트 계산
  const chartData = useMemo(() => {
    const padding = 20;
    const chartWidth = 280;
    const chartHeight = height - 40;

    if (recentData.length === 0) {
      return {
        points: '',
        minY: 0,
        maxY: 100,
        chartWidth,
        chartHeight,
        padding,
        range: 100,
      };
    }

    const minScore = Math.min(...recentData.map((d) => d.score), goalScore || 100);
    const maxScore = Math.max(...recentData.map((d) => d.score), goalScore || 0);
    const range = Math.max(maxScore - minScore, 20); // 최소 20점 범위

    const points = recentData
      .map((d, i) => {
        const x = padding + (i / Math.max(recentData.length - 1, 1)) * (chartWidth - padding * 2);
        const y =
          chartHeight - padding - ((d.score - minScore) / range) * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return {
      points,
      minY: minScore,
      maxY: maxScore,
      chartWidth,
      chartHeight,
      padding,
      range,
    };
  }, [recentData, height, goalScore]);

  // 날짜 포맷
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // 트렌드 아이콘
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
  const trendText = trend === 'up' ? '상승 중' : trend === 'down' ? '하락 중' : '유지 중';

  if (recentData.length === 0) {
    return (
      <div
        className={cn('p-4 rounded-xl border bg-card', className)}
        data-testid="trend-chart-empty"
      >
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">분석 기록이 없습니다</p>
          <p className="text-xs mt-1">분석을 진행하면 변화 추이를 확인할 수 있어요</p>
        </div>
      </div>
    );
  }

  const color = METRIC_COLORS[metric];

  return (
    <div className={cn('p-4 rounded-xl border bg-card', className)} data-testid="trend-chart">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{METRIC_LABELS[metric]} 변화</span>
          <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendText}</span>
          </div>
        </div>
        {showGoal && <span className="text-xs text-muted-foreground">목표: {goalScore}점</span>}
      </div>

      {/* 차트 */}
      <svg width="100%" height={height} viewBox={`0 0 280 ${height}`} className="overflow-visible">
        {/* 그리드 라인 */}
        <line
          x1={chartData.padding}
          y1={height - 30}
          x2={280 - chartData.padding}
          y2={height - 30}
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />

        {/* 목표선 */}
        {showGoal && chartData.range && (
          <line
            x1={chartData.padding}
            y1={height - 40 - ((goalScore - chartData.minY) / chartData.range) * (height - 60)}
            x2={280 - chartData.padding}
            y2={height - 40 - ((goalScore - chartData.minY) / chartData.range) * (height - 60)}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}

        {/* 라인 */}
        <polyline
          points={chartData.points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 데이터 포인트 */}
        {recentData.map((d, i) => {
          const x =
            chartData.padding +
            (i / Math.max(recentData.length - 1, 1)) * (280 - chartData.padding * 2);
          const y = height - 40 - ((d.score - chartData.minY) / chartData.range) * (height - 60);

          return (
            <g key={i}>
              {/* 점 */}
              <circle cx={x} cy={y} r="5" fill={color} />
              <circle cx={x} cy={y} r="3" fill="white" />

              {/* 점수 라벨 */}
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="text-[10px] font-medium fill-foreground"
              >
                {d.score}
              </text>

              {/* 날짜 라벨 */}
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-[9px] fill-muted-foreground"
              >
                {formatDate(d.date)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 범례 */}
      {recentData.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>
            시작: {recentData[0].score}점 → 현재: {recentData[recentData.length - 1].score}점
          </span>
          <span
            className={cn(
              'font-medium',
              trend === 'up' && 'text-emerald-500',
              trend === 'down' && 'text-red-500'
            )}
          >
            {trend === 'up' && '+'}
            {recentData[recentData.length - 1].score - recentData[0].score}점
          </span>
        </div>
      )}
    </div>
  );
}

export default TrendChart;
