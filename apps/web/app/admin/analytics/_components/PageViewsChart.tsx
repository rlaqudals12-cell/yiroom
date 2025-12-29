'use client';

/**
 * 페이지뷰 트렌드 차트 컴포넌트
 * @description 일별 페이지뷰 라인 차트 (SVG)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyData {
  date: string;
  pageViews: number;
  uniqueUsers: number;
  sessions: number;
}

interface PageViewsChartProps {
  data: DailyData[] | null;
  isLoading?: boolean;
}

export function PageViewsChart({ data, isLoading }: PageViewsChartProps) {
  if (isLoading) {
    return (
      <Card data-testid="pageviews-chart-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card data-testid="pageviews-chart-empty">
        <CardHeader>
          <CardTitle className="text-base">페이지뷰 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 차트 계산
  const maxValue = Math.max(...data.map((d) => d.pageViews));
  const minValue = Math.min(...data.map((d) => d.pageViews));
  const range = maxValue - minValue || 1;

  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // 포인트 좌표 계산
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * innerWidth,
    y: padding.top + innerHeight - ((d.pageViews - minValue) / range) * innerHeight,
    value: d.pageViews,
    date: d.date,
  }));

  // 라인 path 생성
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // 영역 path 생성
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

  return (
    <Card data-testid="pageviews-chart">
      <CardHeader>
        <CardTitle className="text-base">페이지뷰 트렌드</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
          {/* 그리드 라인 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={padding.top + innerHeight * (1 - ratio)}
                x2={chartWidth - padding.right}
                y2={padding.top + innerHeight * (1 - ratio)}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={padding.left - 8}
                y={padding.top + innerHeight * (1 - ratio)}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-xs fill-muted-foreground"
              >
                {Math.round(minValue + range * ratio).toLocaleString()}
              </text>
            </g>
          ))}

          {/* 영역 */}
          <path d={areaPath} fill="url(#gradient)" opacity={0.3} />

          {/* 라인 */}
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} />

          {/* 포인트 */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill="#3b82f6" />
          ))}

          {/* X축 라벨 */}
          {data.length <= 7 &&
            data.map((d, i) => (
              <text
                key={i}
                x={points[i].x}
                y={chartHeight - 8}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {d.date.slice(5)}
              </text>
            ))}

          {/* 그라데이션 정의 */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </CardContent>
    </Card>
  );
}
