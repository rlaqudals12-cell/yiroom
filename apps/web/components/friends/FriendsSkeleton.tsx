'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 친구 검색 결과 스켈레톤
 */
export function FriendSearchSkeleton() {
  return (
    <div className="space-y-3" data-testid="friend-search-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * 친구 요청 목록 스켈레톤
 */
export function FriendRequestsSkeleton() {
  return (
    <div className="space-y-3" data-testid="friend-requests-skeleton">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-xl border">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default FriendSearchSkeleton;
