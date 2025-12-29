/**
 * 일별 수익 트렌드 차트
 * @description 일별 클릭/전환/수익 라인 차트
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyRevenueTrend } from '@/lib/affiliate/stats';

interface DailyRevenueChartProps {
  trend: DailyRevenueTrend[];
  isLoading?: boolean;
}

export function DailyRevenueChart({ trend, isLoading }: DailyRevenueChartProps) {
  if (isLoading) {
    return (
      <Card data-testid="daily-revenue-loading">
        <CardHeader>
          <CardTitle>일별 수익 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // 차트 영역 크기
  const width = 100;
  const height = 40;
  const padding = 2;

  // 데이터 정규화
  const maxCommission = Math.max(...trend.map((d) => d.commissionKrw), 1);
  const maxClicks = Math.max(...trend.map((d) => d.clicks), 1);

  // SVG 경로 생성
  const createPath = (data: number[], max: number): string => {
    if (data.length === 0) return '';

    const points = data.map((value, index) => {
      const x = padding + ((width - 2 * padding) * index) / (data.length - 1 || 1);
      const y = height - padding - ((height - 2 * padding) * value) / max;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const commissionPath = createPath(
    trend.map((d) => d.commissionKrw),
    maxCommission
  );

  const clicksPath = createPath(
    trend.map((d) => d.clicks),
    maxClicks
  );

  // 최근 7일 레이블
  const recentDays = trend.slice(-7);
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 총계
  const totalCommission = trend.reduce((sum, d) => sum + d.commissionKrw, 0);
  const totalClicks = trend.reduce((sum, d) => sum + d.clicks, 0);
  const avgCommission = trend.length > 0 ? totalCommission / trend.length : 0;

  return (
    <Card data-testid="daily-revenue-chart">
      <CardHeader>
        <CardTitle>일별 수익 트렌드</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 간단한 SVG 차트 */}
        <div className="relative h-48 mb-4">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* 그리드 라인 */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1={padding}
                y1={padding + ((height - 2 * padding) * i) / 3}
                x2={width - padding}
                y2={padding + ((height - 2 * padding) * i) / 3}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={0.2}
              />
            ))}

            {/* 클릭 라인 (연한 파란색) */}
            <path
              d={clicksPath}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 수익 라인 (주황색) */}
            <path
              d={commissionPath}
              fill="none"
              stroke="#f97316"
              strokeWidth={0.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 수익 영역 (그라디언트) */}
            <defs>
              <linearGradient id="commissionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${commissionPath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
              fill="url(#commissionGradient)"
            />
          </svg>

          {/* 범례 */}
          <div className="absolute top-2 right-2 flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-orange-500" />
              <span>수익</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-400" />
              <span>클릭</span>
            </div>
          </div>
        </div>

        {/* 날짜 레이블 */}
        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          {recentDays.map((day, idx) => (
            <span key={day.date} className={idx === 0 || idx === recentDays.length - 1 ? '' : 'hidden md:block'}>
              {formatDate(day.date)}
            </span>
          ))}
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">기간 총 수익</div>
            <div className="font-bold">₩{totalCommission.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">일 평균 수익</div>
            <div className="font-bold">₩{Math.round(avgCommission).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">총 클릭</div>
            <div className="font-bold">{totalClicks.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
