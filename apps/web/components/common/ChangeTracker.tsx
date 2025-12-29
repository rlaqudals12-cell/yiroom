'use client';

import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// recharts를 동적 import (SSR 비활성화)
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceLine),
  { ssr: false }
);

// 도메인 variant 타입
export type ChangeTrackerVariant = 'beauty' | 'style' | 'default';

// 트렌드 방향 타입
export type TrendDirection = 'up' | 'down' | 'stable';

// 시계열 데이터 포인트
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
  hasData?: boolean;
}

export interface ChangeTrackerProps {
  /** 차트 제목 */
  title: string;
  /** 시계열 데이터 */
  data: TimeSeriesDataPoint[];
  /** Y축 라벨 */
  yAxisLabel?: string;
  /** 목표 값 (점선으로 표시) */
  targetValue?: number;
  /** 목표 라벨 */
  targetLabel?: string;
  /** 도메인 variant */
  variant?: ChangeTrackerVariant;
  /** 트렌드 방향 */
  trend?: TrendDirection;
  /** 차트 높이 (px) */
  height?: number;
  /** 값 단위 (예: 'kcal', '%', '점') */
  unit?: string;
  /** 날짜 포맷 함수 */
  formatDate?: (dateStr: string) => string;
  /** 값 포맷 함수 */
  formatValue?: (value: number) => string;
  /** 추가 className */
  className?: string;
}

// variant별 색상 테마
const variantStyles: Record<ChangeTrackerVariant, {
  lineColor: string;
  dotFill: string;
  gradient: string;
}> = {
  beauty: {
    lineColor: 'hsl(330, 80%, 60%)', // 핑크
    dotFill: 'hsl(330, 80%, 60%)',
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
  },
  style: {
    lineColor: 'hsl(230, 70%, 55%)', // 인디고
    dotFill: 'hsl(230, 70%, 55%)',
    gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30',
  },
  default: {
    lineColor: 'hsl(var(--primary))',
    dotFill: 'hsl(var(--primary))',
    gradient: 'from-muted/50 to-muted/30',
  },
};

// 트렌드 색상
const trendColors: Record<TrendDirection, string> = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  stable: 'text-muted-foreground',
};

// 트렌드 라벨
const trendLabels: Record<TrendDirection, string> = {
  up: '상승',
  down: '하락',
  stable: '유지',
};

// 기본 날짜 포맷
function defaultFormatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[date.getDay()];
  return `${month}/${day}(${dayName})`;
}

// 기본 값 포맷
function defaultFormatValue(value: number): string {
  return value.toLocaleString();
}

/**
 * 변화 추적 차트 공통 컴포넌트
 * - 시계열 데이터 시각화
 * - 목표선 표시
 * - 트렌드 방향 표시
 * - Beauty/Style 도메인별 색상 테마
 */
export function ChangeTracker({
  title,
  data,
  yAxisLabel,
  targetValue,
  targetLabel = '목표',
  variant = 'default',
  trend = 'stable',
  height = 200,
  unit = '',
  formatDate = defaultFormatDate,
  formatValue = defaultFormatValue,
  className,
}: ChangeTrackerProps) {
  const styles = variantStyles[variant];

  // 차트 데이터 변환
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    fullDate: d.date,
    value: d.value,
    label: d.label,
    hasData: d.hasData !== false,
    target: targetValue,
  }));

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="change-tracker">
      <CardHeader className={cn('pb-2 bg-gradient-to-r', styles.gradient)}>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4" aria-hidden="true" />
            {title}
          </span>
          <span className={cn('flex items-center gap-1 text-sm', trendColors[trend])}>
            <TrendIcon className="h-4 w-4" aria-hidden="true" />
            {trendLabels[trend]}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
                label={
                  yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 10,
                        fill: 'hsl(var(--muted-foreground))',
                      }
                    : undefined
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                      <div className="font-medium">{d.fullDate}</div>
                      {d.hasData ? (
                        <>
                          <div style={{ color: styles.lineColor }}>
                            {d.label || '값'}: {formatValue(d.value)}{unit}
                          </div>
                          {targetValue !== undefined && (
                            <div className="text-muted-foreground">
                              {targetLabel}: {formatValue(targetValue)}{unit}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-muted-foreground">기록 없음</div>
                      )}
                    </div>
                  );
                }}
              />

              {/* 목표선 */}
              {targetValue !== undefined && (
                <ReferenceLine
                  y={targetValue}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{
                    value: targetLabel,
                    position: 'right',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
              )}

              {/* 데이터 라인 */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={styles.lineColor}
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: { hasData?: boolean; fullDate?: string } };
                  if (cx === undefined || cy === undefined) return null;
                  if (!payload?.hasData) {
                    return (
                      <circle
                        key={`dot-${payload?.fullDate || 'empty'}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="hsl(var(--muted))"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    );
                  }
                  return (
                    <circle
                      key={`dot-${payload?.fullDate || 'data'}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={styles.dotFill}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  );
                }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 레전드 */}
        <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: styles.lineColor }}
            />
            <span>{title}</span>
          </div>
          {targetValue !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 border-t border-dashed border-muted-foreground" />
              <span>{targetLabel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ChangeTracker;
