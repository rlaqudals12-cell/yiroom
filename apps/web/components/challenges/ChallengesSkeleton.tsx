'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 챌린지 목록 스켈레톤
 */
export function ChallengesListSkeleton() {
  return (
    <div className="space-y-4" data-testid="challenges-skeleton">
      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      {/* 챌린지 카드 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * 챌린지 상세 스켈레톤
 */
export function ChallengeDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="challenge-detail-skeleton">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-7 w-40" />
      </div>

      {/* 메인 카드 */}
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* 참가자 */}
      <div className="bg-card rounded-xl border p-4">
        <Skeleton className="h-5 w-20 mb-4" />
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full border-2 border-background" />
          ))}
        </div>
      </div>

      {/* 버튼 */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

export default ChallengesListSkeleton;
