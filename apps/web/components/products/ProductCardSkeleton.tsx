import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
  className?: string;
}

/**
 * 제품 카드 스켈레톤
 * - 로딩 상태 표시용
 */
export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      {/* 이미지 영역 */}
      <Skeleton className="aspect-square w-full" />

      {/* 정보 영역 */}
      <CardContent className="p-3">
        {/* 브랜드 */}
        <Skeleton className="h-3 w-16" />

        {/* 제품명 */}
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />

        {/* 평점 */}
        <Skeleton className="mt-2 h-3 w-20" />

        {/* 가격 */}
        <Skeleton className="mt-2 h-4 w-24" />
      </CardContent>
    </Card>
  );
}

/**
 * 제품 카드 그리드 스켈레톤
 * @param count 스켈레톤 개수
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
