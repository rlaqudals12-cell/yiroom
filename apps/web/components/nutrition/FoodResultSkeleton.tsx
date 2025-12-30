'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 음식 분석 결과 페이지 스켈레톤
 */
export function FoodResultSkeleton() {
  return (
    <div className="space-y-6" data-testid="food-result-skeleton">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-7 w-40" />
      </div>

      {/* 이미지 영역 */}
      <Skeleton className="aspect-video w-full rounded-2xl" />

      {/* 총 영양소 요약 */}
      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
          <div className="h-8 w-px bg-purple-200" />
          <div className="flex-1 text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
          <div className="h-8 w-px bg-purple-200" />
          <div className="flex-1 text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
          <div className="h-8 w-px bg-purple-200" />
          <div className="flex-1 text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
        </div>
      </div>

      {/* AI 인사이트 */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>

      {/* 음식별 결과 카드 */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3 pt-4">
        <Skeleton className="flex-1 h-12 rounded-lg" />
        <Skeleton className="flex-1 h-12 rounded-lg" />
      </div>
    </div>
  );
}

export default FoodResultSkeleton;
