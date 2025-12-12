/**
 * R-1 칼로리 트렌드 차트 컴포넌트
 * Task R-1.5: 트렌드 차트 (recharts)
 */

'use client';

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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { DailyNutrition, TrendDirection } from '@/types/report';

interface CalorieTrendChartProps {
  dailyData: DailyNutrition[];
  trend: TrendDirection;
  targetCalories?: number;
}

export function CalorieTrendChart({
  dailyData,
  trend,
  targetCalories = 2000,
}: CalorieTrendChartProps) {
  // 차트 데이터 변환
  const chartData = dailyData.map((d) => ({
    date: formatDate(d.date),
    fullDate: d.date,
    calories: d.calories,
    target: targetCalories,
    hasData: d.mealsLogged > 0,
  }));

  const TrendIcon = getTrendIcon(trend);
  const trendColor = getTrendColor(trend);

  return (
    <Card data-testid="calorie-trend-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            칼로리 트렌드
          </span>
          <span className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            {getTrendLabel(trend)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
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
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                      <div className="font-medium">{data.fullDate}</div>
                      {data.hasData ? (
                        <>
                          <div className="text-orange-500">
                            섭취: {data.calories.toLocaleString()}kcal
                          </div>
                          <div className="text-muted-foreground">
                            목표: {data.target.toLocaleString()}kcal
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">기록 없음</div>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={targetCalories}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{
                  value: '목표',
                  position: 'right',
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))',
                }}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!payload.hasData) {
                    return (
                      <circle
                        key={`dot-${payload.fullDate}`}
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
                      key={`dot-${payload.fullDate}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="hsl(var(--primary))"
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
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span>섭취 칼로리</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 border-t border-dashed border-muted-foreground" />
            <span>목표</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[date.getDay()];
  return `${month}/${day}(${dayName})`;
}

function getTrendIcon(trend: TrendDirection) {
  switch (trend) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    default:
      return Minus;
  }
}

function getTrendColor(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return 'text-amber-500';
    case 'down':
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
}

function getTrendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return '증가';
    case 'down':
      return '감소';
    default:
      return '유지';
  }
}
