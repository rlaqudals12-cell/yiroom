/**
 * R-2 주간 비교 차트 컴포넌트
 * 월간 리포트에서 주차별 비교 표시
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WeeklySummary } from '@/types/report';

interface WeeklyComparisonChartProps {
  weeklyData: WeeklySummary[];
  highlights: {
    bestWeek: number | null;
    worstWeek: number | null;
    bestWeekScore: number;
    worstWeekScore: number;
  };
}

export function WeeklyComparisonChart({
  weeklyData,
  highlights,
}: WeeklyComparisonChartProps) {
  // 차트 데이터 변환
  const chartData = weeklyData.map((week, index) => ({
    weekNum: `${index + 1}주차`,
    avgCalories: week.avgCalories,
    avgProtein: Math.round(week.avgProtein),
    workoutCount: week.workoutCount,
    foodQuality: week.foodQualityScore,
    isBest: index + 1 === highlights.bestWeek,
    isWorst: index + 1 === highlights.worstWeek,
  }));

  return (
    <Card data-testid="weekly-comparison-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            주간 비교
          </span>
          {highlights.bestWeek && (
            <span className="text-xs text-green-600 dark:text-green-400">
              {highlights.bestWeek}주차 최고 점수
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="weekNum"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="calories"
                orientation="left"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 10 }}
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
                      <div className="font-medium mb-1">
                        {data.weekNum}
                        {data.isBest && (
                          <span className="ml-2 text-green-500">Best</span>
                        )}
                        {data.isWorst && (
                          <span className="ml-2 text-orange-500">Need Focus</span>
                        )}
                      </div>
                      <div className="text-orange-500">
                        평균 칼로리: {data.avgCalories.toLocaleString()}kcal
                      </div>
                      <div className="text-blue-500">
                        평균 단백질: {data.avgProtein}g
                      </div>
                      <div className="text-green-500">
                        운동 횟수: {data.workoutCount}회
                      </div>
                      <div className="text-muted-foreground">
                        음식 품질 점수: {data.foodQuality}점
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    avgCalories: '평균 칼로리',
                    workoutCount: '운동 횟수',
                  };
                  return labels[value] || value;
                }}
              />
              <Bar
                yAxisId="calories"
                dataKey="avgCalories"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="avgCalories"
              />
              <Bar
                yAxisId="count"
                dataKey="workoutCount"
                fill="hsl(142.1 76.2% 36.3%)"
                radius={[4, 4, 0, 0]}
                name="workoutCount"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 주간 요약 */}
        <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
          {weeklyData.map((week, index) => (
            <div
              key={week.weekStart}
              className={`p-2 rounded-lg ${
                index + 1 === highlights.bestWeek
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : index + 1 === highlights.worstWeek
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : 'bg-muted/50'
              }`}
            >
              <div className="font-medium">{index + 1}주</div>
              <div className="text-muted-foreground">{week.mealCount}끼</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
