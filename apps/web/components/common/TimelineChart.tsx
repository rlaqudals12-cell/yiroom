'use client';

import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// recharts 컴포넌트들을 동적 import (SSR 비활성화)
const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const ReferenceLine = dynamic(() => import('recharts').then((mod) => mod.ReferenceLine), {
  ssr: false,
});

// 분석 타입별 색상 테마
export type TimelineVariant = 'skin' | 'body' | 'hair' | 'default';

export interface TimelineDataPoint {
  /** 날짜 (ISO 형식 또는 포맷된 문자열) */
  date: string;
  /** 점수 값 */
  score: number;
  /** 추가 라벨 (툴팁에 표시) */
  label?: string;
  /** 데이터 존재 여부 */
  hasData?: boolean;
}

export interface TimelineChartProps {
  /** 차트 제목 */
  title?: string;
  /** 시계열 데이터 */
  data: TimelineDataPoint[];
  /** 분석 타입 (색상 테마) */
  variant?: TimelineVariant;
  /** 트렌드 방향 */
  trend?: 'improving' | 'declining' | 'stable';
  /** 차트 높이 (px) */
  height?: number;
  /** 목표 점수 (참조선으로 표시) */
  targetScore?: number;
  /** 점수 단위 */
  unit?: string;
  /** Y축 최소/최대 설정 */
  yDomain?: [number, number];
  /** 날짜 포맷 함수 */
  formatDate?: (dateStr: string) => string;
  /** 점수 포맷 함수 */
  formatScore?: (score: number) => string;
  /** 데이터 포인트 클릭 핸들러 */
  onDataPointClick?: (dataPoint: TimelineDataPoint, index: number) => void;
  /** 추가 className */
  className?: string;
  /** 카드 헤더 숨김 */
  hideHeader?: boolean;
}

// variant별 색상 테마
const variantStyles: Record<
  TimelineVariant,
  {
    strokeColor: string;
    fillColor: string;
    gradientId: string;
    gradient: string;
  }
> = {
  skin: {
    strokeColor: 'hsl(330, 80%, 60%)',
    fillColor: 'url(#skinGradient)',
    gradientId: 'skinGradient',
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
  },
  body: {
    strokeColor: 'hsl(210, 70%, 55%)',
    fillColor: 'url(#bodyGradient)',
    gradientId: 'bodyGradient',
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
  },
  hair: {
    strokeColor: 'hsl(270, 60%, 55%)',
    fillColor: 'url(#hairGradient)',
    gradientId: 'hairGradient',
    gradient: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
  },
  default: {
    strokeColor: 'hsl(var(--primary))',
    fillColor: 'url(#defaultGradient)',
    gradientId: 'defaultGradient',
    gradient: 'from-muted/50 to-muted/30',
  },
};

// 트렌드 색상
const trendColors = {
  improving: 'text-green-600 dark:text-green-400',
  declining: 'text-red-600 dark:text-red-400',
  stable: 'text-muted-foreground',
};

// 트렌드 라벨
const trendLabels = {
  improving: '개선 중',
  declining: '주의 필요',
  stable: '유지 중',
};

// 기본 날짜 포맷
function defaultFormatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

// 기본 점수 포맷
function defaultFormatScore(score: number): string {
  return score.toFixed(0);
}

/**
 * 타임라인 차트 컴포넌트
 * @description Before/After 비교를 위한 점수 변화 시각화
 *
 * 특징:
 * - Area 차트로 시각적 강조
 * - 분석 타입별 색상 테마
 * - 트렌드 표시 (개선/악화/유지)
 * - 목표선 지원
 * - 반응형 컨테이너
 */
export function TimelineChart({
  title,
  data,
  variant = 'default',
  trend = 'stable',
  height = 200,
  targetScore,
  unit = '점',
  yDomain,
  formatDate = defaultFormatDate,
  formatScore = defaultFormatScore,
  onDataPointClick,
  className,
  hideHeader = false,
}: TimelineChartProps) {
  const styles = variantStyles[variant];

  // 차트 데이터 변환
  const chartData = data.map((d, index) => ({
    date: formatDate(d.date),
    fullDate: d.date,
    score: d.score,
    label: d.label,
    hasData: d.hasData !== false,
    index,
  }));

  // Y축 도메인 계산
  const scores = data.filter((d) => d.hasData !== false).map((d) => d.score);
  const minScore = Math.min(...scores, targetScore || Infinity);
  const maxScore = Math.max(...scores, targetScore || -Infinity);
  const domain = yDomain || [Math.max(0, minScore - 10), Math.min(100, maxScore + 10)];

  const TrendIcon =
    trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;

  // 데이터가 없을 때
  if (data.length === 0) {
    return (
      <Card className={cn('overflow-hidden', className)} data-testid="timeline-chart">
        {!hideHeader && title && (
          <CardHeader className={cn('pb-2 bg-gradient-to-r', styles.gradient)}>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="pt-4">
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            아직 분석 기록이 없어요
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="timeline-chart">
      {!hideHeader && title && (
        <CardHeader className={cn('pb-2 bg-gradient-to-r', styles.gradient)}>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {title}
            </span>
            <span className={cn('flex items-center gap-1 text-sm', trendColors[trend])}>
              <TrendIcon className="h-4 w-4" aria-hidden="true" />
              {trendLabels[trend]}
            </span>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={cn(hideHeader ? 'pt-4' : 'pt-4')}>
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e) => {
                const event = e as {
                  activePayload?: Array<{
                    payload?: { fullDate: string; score: number; label?: string; index: number };
                  }>;
                };
                if (event && event.activePayload && onDataPointClick) {
                  const payload = event.activePayload[0]?.payload;
                  if (payload) {
                    onDataPointClick(
                      { date: payload.fullDate, score: payload.score, label: payload.label },
                      payload.index
                    );
                  }
                }
              }}
            >
              <defs>
                <linearGradient id={styles.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={styles.strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={styles.strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />

              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />

              <YAxis
                domain={domain}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                      <div className="font-medium">{d.fullDate}</div>
                      {d.hasData ? (
                        <div style={{ color: styles.strokeColor }}>
                          {d.label || '점수'}: {formatScore(d.score)}
                          {unit}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">기록 없음</div>
                      )}
                      {targetScore !== undefined && (
                        <div className="text-muted-foreground">
                          목표: {formatScore(targetScore)}
                          {unit}
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {/* 목표선 */}
              {targetScore !== undefined && (
                <ReferenceLine
                  y={targetScore}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{
                    value: '목표',
                    position: 'right',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
              )}

              {/* Area 차트 */}
              <Area
                type="monotone"
                dataKey="score"
                stroke={styles.strokeColor}
                strokeWidth={2}
                fill={styles.fillColor}
                dot={(props) => {
                  const { cx, cy, payload } = props as {
                    cx?: number;
                    cy?: number;
                    payload?: { hasData?: boolean; fullDate?: string };
                  };
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
                      r={5}
                      fill={styles.strokeColor}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
                    />
                  );
                }}
                activeDot={{
                  r: 7,
                  fill: styles.strokeColor,
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 요약 통계 */}
        {data.length >= 2 && (
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">첫 기록</p>
              <p className="font-medium">
                {formatScore(data[data.length - 1].score)}
                {unit}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">최근 기록</p>
              <p className="font-medium">
                {formatScore(data[0].score)}
                {unit}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">변화</p>
              <p
                className={cn(
                  'font-medium',
                  data[0].score - data[data.length - 1].score > 0
                    ? 'text-green-600'
                    : data[0].score - data[data.length - 1].score < 0
                      ? 'text-red-600'
                      : ''
                )}
              >
                {data[0].score - data[data.length - 1].score > 0 ? '+' : ''}
                {formatScore(data[0].score - data[data.length - 1].score)}
                {unit}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TimelineChart;
