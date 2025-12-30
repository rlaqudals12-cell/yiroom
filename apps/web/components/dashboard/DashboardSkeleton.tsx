'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 대시보드 페이지 스켈레톤
 */
export function DashboardSkeleton() {
  return (
    <main
      className="min-h-[calc(100vh-80px)] px-4 py-8"
      data-testid="dashboard-skeleton"
    >
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Zone 1: Hero Section */}
        <section className="space-y-4">
          {/* 사용자 프로필 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* 오늘의 포커스 */}
          <div className="bg-card rounded-xl border p-4">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-10 w-10 mx-auto mb-2 rounded-full" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* 게이미피케이션 */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full rounded-full mb-2" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          </div>

          {/* 챌린지 */}
          <div className="bg-card rounded-xl border p-4">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Zone 2: Activity Hub */}
        <section>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-3 w-6 mx-auto mb-2" />
                  <Skeleton className="h-10 w-10 mx-auto rounded-lg" />
                </div>
              ))}
          </div>
        </section>

        {/* Zone 3: Closet */}
        <section>
          <Skeleton className="h-6 w-28 mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </section>

        {/* Zone 4: Analysis */}
        <section>
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border p-4">
                <Skeleton className="h-10 w-10 rounded-full mb-3" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default DashboardSkeleton;
