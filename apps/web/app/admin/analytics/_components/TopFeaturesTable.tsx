'use client';

/**
 * 인기 기능 테이블 컴포넌트
 * @description TOP 10 인기 기능 목록
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TopFeature } from '@/types/analytics';

interface TopFeaturesTableProps {
  features: TopFeature[] | null;
  isLoading?: boolean;
}

export function TopFeaturesTable({ features, isLoading }: TopFeaturesTableProps) {
  if (isLoading) {
    return (
      <Card data-testid="top-features-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!features || features.length === 0) {
    return (
      <Card data-testid="top-features-empty">
        <CardHeader>
          <CardTitle className="text-base">인기 기능 TOP 10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 최대 사용 횟수 (프로그레스 바용)
  const maxUsage = Math.max(...features.map((f) => f.usageCount));

  return (
    <Card data-testid="top-features-table">
      <CardHeader>
        <CardTitle className="text-base">인기 기능 TOP 10</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.slice(0, 10).map((feature, index) => (
            <div key={feature.featureId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5">{index + 1}.</span>
                  <span>{feature.featureName}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{feature.usageCount.toLocaleString()}회</span>
                  <span className="text-xs">{feature.uniqueUsers.toLocaleString()}명</span>
                </div>
              </div>
              {/* 프로그레스 바 */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-7">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(feature.usageCount / maxUsage) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
