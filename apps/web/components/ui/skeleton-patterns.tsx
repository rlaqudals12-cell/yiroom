/**
 * 스켈레톤 패턴 컴포넌트
 * 재사용 가능한 로딩 상태 UI
 */

import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * 카드 스켈레톤
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-3', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

/**
 * 리스트 아이템 스켈레톤
 */
export function ListItemSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

/**
 * 리스트 스켈레톤 (여러 아이템)
 */
export function ListSkeleton({ count = 3, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 대시보드 통계 카드 스켈레톤
 */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * 대시보드 그리드 스켈레톤
 */
export function DashboardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* 메인 카드 */}
      <CardSkeleton className="h-32" />

      {/* 리스트 */}
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="h-5 w-24 mb-4" />
        <ListSkeleton count={3} />
      </div>
    </div>
  );
}

/**
 * 이미지 카드 스켈레톤
 */
export function ImageCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * 제품 그리드 스켈레톤
 */
export function ProductGridSkeleton({ count = 4, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ImageCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 차트 스켈레톤
 */
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

/**
 * 프로필 헤더 스켈레톤
 */
export function ProfileHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

/**
 * 폼 필드 스켈레톤
 */
export function FormFieldSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/**
 * 폼 스켈레톤
 */
export function FormSkeleton({ fields = 3, className }: SkeletonProps & { fields?: number }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <Skeleton className="h-10 w-full rounded-md mt-6" />
    </div>
  );
}
