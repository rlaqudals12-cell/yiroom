'use client';

/**
 * 기능별 일별 사용량 추이 차트
 * @description recharts를 사용한 스택 바 차트
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DailyFeatureUsageTrend } from '@/lib/admin/user-activity-stats';

interface FeatureUsageTrendChartProps {
  data: DailyFeatureUsageTrend[] | null;
  isLoading?: boolean;
}

const COLORS = {
  personalColor: '#ec4899', // pink
  skin: '#a855f7', // purple
  body: '#3b82f6', // blue
  workout: '#22c55e', // green
  meal: '#f97316', // orange
};

const LABELS = {
  personalColor: '퍼스널 컬러',
  skin: '피부 분석',
  body: '체형 분석',
  workout: '운동 기록',
  meal: '식사 기록',
};

export function FeatureUsageTrendChart({ data, isLoading }: FeatureUsageTrendChartProps) {
  // 날짜 포맷 (MM/DD)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (isLoading) {
    return (
      <Card data-testid="feature-usage-trend-loading">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card data-testid="feature-usage-trend-empty">
        <CardHeader>
          <CardTitle className="text-base">기능별 일별 사용량 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="feature-usage-trend-chart">
      <CardHeader>
        <CardTitle className="text-base">기능별 일별 사용량 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              }}
              formatter={(value, name) => [
                `${value ?? 0}회`,
                LABELS[name as keyof typeof LABELS] || name,
              ]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
            />
            <Legend
              formatter={(value) => LABELS[value as keyof typeof LABELS] || value}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="personalColor" stackId="a" fill={COLORS.personalColor} />
            <Bar dataKey="skin" stackId="a" fill={COLORS.skin} />
            <Bar dataKey="body" stackId="a" fill={COLORS.body} />
            <Bar dataKey="workout" stackId="a" fill={COLORS.workout} />
            <Bar dataKey="meal" stackId="a" fill={COLORS.meal} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
