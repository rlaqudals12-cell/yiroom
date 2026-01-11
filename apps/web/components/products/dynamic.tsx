/**
 * Products Dynamic Import
 * 초기 로드 불필요한 무거운 컴포넌트 지연 로딩
 *
 * 성능 최적화: ~50KB 번들 크기 감소 (Filter Sheet, recharts)
 */

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 차트 로딩 스켈레톤
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 가격 통계 스켈레톤 */}
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        {/* 차트 스켈레톤 */}
        <div className="h-48 animate-pulse bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

// ProductFilters - Sheet 컴포넌트 (필터 버튼 클릭 시에만 필요)
export const ProductFiltersDynamic = dynamic(
  () => import('./ProductFilters').then((mod) => ({ default: mod.ProductFilters })),
  {
    ssr: false,
    loading: () => null,
  }
);

// ProductDetailTabs - 제품 상세 페이지 하단 탭 (스크롤 아래)
export const ProductDetailTabsDynamic = dynamic(
  () => import('./detail/ProductDetailTabs').then((mod) => ({ default: mod.ProductDetailTabs })),
  {
    ssr: false,
    loading: () => null,
  }
);

// PriceHistoryChart - recharts LineChart 사용 (지연 로딩 필수)
export const PriceHistoryChartDynamic = dynamic(
  () => import('./detail/PriceHistoryChart').then((mod) => ({ default: mod.PriceHistoryChart })),
  {
    ssr: false,
    loading: ChartSkeleton,
  }
);
