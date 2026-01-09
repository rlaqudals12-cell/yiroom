'use client';

/**
 * Wellness 모듈 Dynamic Import
 * 초기 로드 불필요한 무거운 컴포넌트 지연 로딩
 *
 * 성능 최적화: recharts 번들 분리 (~40-50KB 감소)
 */

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// 차트 로딩 스켈레톤
function ChartSkeleton() {
  return (
    <Card data-testid="wellness-trend-chart-loading">
      <CardHeader className="pb-2">
        <div className="h-5 w-32 animate-pulse bg-muted rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] animate-pulse bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

// 트렌드 차트 (recharts 사용으로 지연 로딩 필수)
export const WellnessTrendChartDynamic = dynamic(
  () => import('./WellnessTrendChart').then((mod) => ({ default: mod.WellnessTrendChart })),
  {
    ssr: false,
    loading: ChartSkeleton,
  }
);

// 인사이트 (스크롤 아래에 위치)
export const WellnessInsightDynamic = dynamic(
  () => import('./WellnessInsight').then((mod) => ({ default: mod.WellnessInsight })),
  {
    ssr: false,
    loading: () => null,
  }
);

// 영역별 상세 점수 (선택적 표시)
export const WellnessBreakdownDynamic = dynamic(
  () => import('./WellnessBreakdown').then((mod) => ({ default: mod.WellnessBreakdown })),
  {
    ssr: false,
    loading: () => null,
  }
);
