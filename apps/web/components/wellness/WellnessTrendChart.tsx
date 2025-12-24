'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WellnessScore } from '@/types/wellness';

type TrendDirection = 'up' | 'down' | 'stable';

interface WellnessTrendChartProps {
  history: WellnessScore[];
  period?: 'weekly' | 'monthly';
  showLegend?: boolean;
}

// 영역별 색상
const AREA_COLORS = {
  workout: { stroke: '#f97316', fill: '#f97316' },    // orange-500
  nutrition: { stroke: '#22c55e', fill: '#22c55e' },  // green-500
  skin: { stroke: '#a855f7', fill: '#a855f7' },       // purple-500
  body: { stroke: '#3b82f6', fill: '#3b82f6' },       // blue-500
};

export function WellnessTrendChart({
  history,
  period = 'weekly',
  showLegend = true,
}: WellnessTrendChartProps) {
  // 데이터가 없는 경우
  if (!history || history.length === 0) {
    return (
      <Card data-testid="wellness-trend-chart-empty">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            웰니스 트렌드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다. 활동을 기록해보세요!
          </div>
        </CardContent>
      </Card>
    );
  }

  // 차트 데이터 변환 (날짜 오름차순 정렬)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sortedHistory.map((score) => ({
    date: formatDate(score.date),
    fullDate: score.date,
    workout: score.workoutScore,
    nutrition: score.nutritionScore,
    skin: score.skinScore,
    body: score.bodyScore,
    total: score.totalScore,
  }));

  // 트렌드 계산
  const trend = calculateTrend(sortedHistory);
  const TrendIcon = getTrendIcon(trend);
  const trendColor = getTrendColor(trend);

  return (
    <Card data-testid="wellness-trend-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            웰니스 트렌드
            <span className="text-xs text-muted-foreground font-normal">
              ({period === 'weekly' ? '주간' : '월간'})
            </span>
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
            <AreaChart
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
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                      <div className="font-medium mb-2">{data.fullDate}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-orange-500">운동</span>
                          <span>{data.workout}/25</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-green-500">영양</span>
                          <span>{data.nutrition}/25</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-purple-500">피부</span>
                          <span>{data.skin}/25</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-blue-500">체형</span>
                          <span>{data.body}/25</span>
                        </div>
                        <div className="border-t pt-1 mt-1 flex justify-between gap-4 font-medium">
                          <span>총점</span>
                          <span>{data.total}/100</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              {/* 스택 Area 차트 */}
              <Area
                type="monotone"
                dataKey="body"
                stackId="1"
                stroke={AREA_COLORS.body.stroke}
                fill={AREA_COLORS.body.fill}
                fillOpacity={0.6}
                name="체형"
              />
              <Area
                type="monotone"
                dataKey="skin"
                stackId="1"
                stroke={AREA_COLORS.skin.stroke}
                fill={AREA_COLORS.skin.fill}
                fillOpacity={0.6}
                name="피부"
              />
              <Area
                type="monotone"
                dataKey="nutrition"
                stackId="1"
                stroke={AREA_COLORS.nutrition.stroke}
                fill={AREA_COLORS.nutrition.fill}
                fillOpacity={0.6}
                name="영양"
              />
              <Area
                type="monotone"
                dataKey="workout"
                stackId="1"
                stroke={AREA_COLORS.workout.stroke}
                fill={AREA_COLORS.workout.fill}
                fillOpacity={0.6}
                name="운동"
              />
              {showLegend && (
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={8}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function calculateTrend(history: WellnessScore[]): TrendDirection {
  if (history.length < 2) return 'stable';

  const recentHalf = history.slice(Math.floor(history.length / 2));
  const olderHalf = history.slice(0, Math.floor(history.length / 2));

  const recentAvg =
    recentHalf.reduce((sum, s) => sum + s.totalScore, 0) / recentHalf.length;
  const olderAvg =
    olderHalf.reduce((sum, s) => sum + s.totalScore, 0) / olderHalf.length;

  const diff = recentAvg - olderAvg;

  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
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
      return 'text-green-500';
    case 'down':
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}

function getTrendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return '상승';
    case 'down':
      return '하락';
    default:
      return '유지';
  }
}
