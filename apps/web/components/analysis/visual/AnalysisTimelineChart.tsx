'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { selectByKey } from '@/lib/utils/conditional-helpers';

export interface TimelineDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnalysisTimelineChartProps {
  /** 타임라인 데이터 (오래된→최신 순) */
  data: TimelineDataPoint[];
  /** 차트 색상 (기본: #6366f1) */
  color?: string;
  /** 단위 (예: '점') */
  unit?: string;
  /** 모듈 이름 (예: '피부 점수') */
  label?: string;
  className?: string;
}

// 날짜를 간략하게 포맷
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 변화 속도 계산 (주당 변화량)
function calculateVelocity(data: TimelineDataPoint[]): {
  weeklyChange: number;
  trend: 'improving' | 'declining' | 'stable';
  message: string;
} {
  if (data.length < 2) {
    return {
      weeklyChange: 0,
      trend: 'stable',
      message: '데이터가 더 쌓이면 변화 추이를 보여드릴게요',
    };
  }

  const first = data[0];
  const last = data[data.length - 1];
  const totalChange = last.value - first.value;

  const firstDate = new Date(first.date);
  const lastDate = new Date(last.date);
  const diffWeeks = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const weeklyChange = totalChange / diffWeeks;

  let trend: 'improving' | 'declining' | 'stable';
  let message: string;

  if (weeklyChange > 0.3) {
    trend = 'improving';
    message = `주당 +${weeklyChange.toFixed(1)}점 개선 중이에요`;
  } else if (weeklyChange < -0.3) {
    trend = 'declining';
    message = `주당 ${weeklyChange.toFixed(1)}점 변화. 케어에 신경써보세요`;
  } else {
    trend = 'stable';
    message = '안정적인 상태를 유지하고 있어요';
  }

  return { weeklyChange, trend, message };
}

/**
 * 분석 점수 타임라인 차트
 * - Recharts 기반 라인 차트
 * - 평균선, 변화 속도 인사이트 포함
 */
export default function AnalysisTimelineChart({
  data,
  color = '#6366f1',
  unit = '점',
  label = '점수',
  className,
}: AnalysisTimelineChartProps): React.JSX.Element | null {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, shortDate: formatShortDate(d.date) })),
    [data]
  );

  const velocity = useMemo(() => calculateVelocity(data), [data]);

  const average = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
  }, [data]);

  if (data.length < 2) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {data.length === 0
              ? '아직 기록이 없어요'
              : '2회 이상 분석하면 변화 추이를 볼 수 있어요'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = selectByKey(
    velocity.trend,
    { improving: TrendingUp, declining: TrendingDown },
    Minus
  )!;

  const trendColor = selectByKey(
    velocity.trend,
    { improving: 'text-green-600', declining: 'text-red-600' },
    'text-muted-foreground'
  )!;

  const trendLabel = selectByKey(
    velocity.trend,
    { improving: '개선 중', declining: '주의' },
    '유지 중'
  )!;

  return (
    <Card className={className} data-testid="analysis-timeline-chart">
      <CardContent className="p-4 space-y-3">
        {/* 헤더: 라벨 + 변화 속도 */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{label} 변화 추이</h3>
          <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
            <TrendIcon className="h-4 w-4" aria-hidden="true" />
            <span>{trendLabel}</span>
          </div>
        </div>

        {/* 차트 */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 11 }}
                stroke="var(--color-muted-foreground, #6b7280)"
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 11 }}
                stroke="var(--color-muted-foreground, #6b7280)"
              />
              <Tooltip
                formatter={(value: number | undefined) => [`${value ?? 0}${unit}`, label]}
                labelFormatter={(l) => `${l}`}
                contentStyle={{
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: '1px solid var(--color-border, #e5e7eb)',
                }}
              />
              <ReferenceLine
                y={average}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                label={{ value: `평균 ${average}`, position: 'right', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 속도 인사이트 */}
        <p className="text-xs text-muted-foreground text-center">{velocity.message}</p>
      </CardContent>
    </Card>
  );
}
