/**
 * Admin Analytics 차트 컴포넌트 Dynamic Import
 * recharts를 사용하는 무거운 컴포넌트를 지연 로딩
 *
 * 성능 최적화: ~40-50KB 번들 크기 감소 (recharts)
 */

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 차트 로딩 스켈레톤
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] animate-pulse bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

// ActiveUserTrendChart - recharts AreaChart 사용
export const ActiveUserTrendChartDynamic = dynamic(
  () => import('./ActiveUserTrendChart').then((mod) => ({ default: mod.ActiveUserTrendChart })),
  {
    ssr: false,
    loading: ChartSkeleton,
  }
);

// FeatureUsageTrendChart - recharts BarChart 사용
export const FeatureUsageTrendChartDynamic = dynamic(
  () => import('./FeatureUsageTrendChart').then((mod) => ({ default: mod.FeatureUsageTrendChart })),
  {
    ssr: false,
    loading: ChartSkeleton,
  }
);
