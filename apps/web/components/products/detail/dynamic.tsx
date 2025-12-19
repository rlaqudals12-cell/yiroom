/**
 * Product Detail Dynamic Import
 * recharts를 사용하는 무거운 차트 컴포넌트 지연 로딩
 *
 * 성능 최적화: ~100KB 번들 크기 감소 (recharts LineChart)
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 차트 로딩 스켈레톤
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">가격 히스토리</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[280px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

// PriceHistoryChart - recharts LineChart 사용
export const PriceHistoryChartDynamic = dynamic(
  () => import('./PriceHistoryChart').then(mod => ({ default: mod.PriceHistoryChart })),
  {
    ssr: false,
    loading: ChartSkeleton,
  }
);
