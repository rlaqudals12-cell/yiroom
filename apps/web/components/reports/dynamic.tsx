/**
 * R-1/R-2 리포트 차트 컴포넌트 Dynamic Import
 * recharts를 사용하는 무거운 컴포넌트를 지연 로딩
 *
 * 성능 최적화: ~200KB 번들 크기 감소 (recharts)
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// 차트 로딩 스켈레톤
function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center h-[280px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

// CalorieTrendChart - recharts LineChart 사용
export const CalorieTrendChartDynamic = dynamic(
  () => import('./CalorieTrendChart').then(mod => ({ default: mod.CalorieTrendChart })),
  {
    ssr: false,
    loading: ChartSkeleton,
  }
);

// WeeklyComparisonChart - recharts BarChart 사용
export const WeeklyComparisonChartDynamic = dynamic(
  () => import('./WeeklyComparisonChart').then(mod => ({ default: mod.WeeklyComparisonChart })),
  {
    ssr: false,
    loading: ChartSkeleton,
  }
);
