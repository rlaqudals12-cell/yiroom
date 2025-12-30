'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 운동 메인 페이지 스켈레톤
 */
export function WorkoutPageSkeleton() {
  return (
    <div
      className="container max-w-lg mx-auto px-4 py-6 space-y-6"
      data-testid="workout-page-skeleton"
    >
      {/* 헤더 */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* 운동 타입 카드 */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </div>

      {/* 오늘의 운동 카드 */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-20 bg-white/20 mb-2" />
            <Skeleton className="h-6 w-28 bg-white/20 mb-1" />
            <Skeleton className="h-4 w-40 bg-white/20" />
          </div>
          <Skeleton className="h-10 w-20 bg-white/30 rounded-md" />
        </div>
      </div>

      {/* 스트릭 카드 */}
      <div className="bg-card rounded-xl border p-4">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default WorkoutPageSkeleton;
