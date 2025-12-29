import { Skeleton } from '@/components/ui/skeleton';

/**
 * 제품 상세 페이지 로딩 스켈레톤
 */
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background" data-testid="product-detail-skeleton">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* 이미지 */}
      <div className="max-w-md mx-auto">
        <Skeleton className="aspect-square w-full" />
      </div>

      {/* 제품 정보 */}
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-lg">
        {/* 기본 정보 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        {/* 정보 카드 */}
        <div className="rounded-xl border p-4 space-y-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default ProductDetailSkeleton;
