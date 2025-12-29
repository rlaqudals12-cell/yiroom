'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 새 UX 페이지용 스켈레톤 컴포넌트
 * - HomeSkeleton: 홈 페이지
 * - BeautyPageSkeleton: 뷰티 탭
 * - StylePageSkeleton: 스타일 탭
 * - CategoryPageSkeleton: 카테고리 페이지
 * - RecordPageSkeleton: 기록 탭
 */

interface SkeletonBaseProps {
  className?: string;
}

// =====================================================
// HomeSkeleton - 홈 페이지 스켈레톤
// =====================================================

export function HomeSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn('min-h-screen bg-background pb-20', className)}
      role="status"
      aria-label="홈 페이지 로딩 중"
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-16 h-6" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* 시간 기반 인사 */}
        <Skeleton className="h-8 w-48" />

        {/* 이번 주 미션 */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full mb-3" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* 오늘의 추천 */}
        <div>
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>

        {/* 오늘 기록 요약 */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>

        {/* 이번 주 랭킹 */}
        <Skeleton className="h-24 rounded-2xl" />
      </main>

      {/* 하단 네비 placeholder */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t h-16" />
    </div>
  );
}

// =====================================================
// BeautyPageSkeleton - 뷰티 탭 스켈레톤
// =====================================================

export function BeautyPageSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn('min-h-screen bg-background pb-20', className)}
      role="status"
      aria-label="뷰티 페이지 로딩 중"
    >
      {/* 피부 프로필 */}
      <section className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="w-16 h-5" />
            <Skeleton className="w-20 h-4" />
          </div>
          <Skeleton className="w-8 h-4" />
        </div>
        <div className="flex gap-2 mt-2">
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
      </section>

      {/* 매칭 필터 토글 */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-10 h-6 rounded-full" />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2">
          <Skeleton className="w-12 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-12 h-8 rounded-full" />
        </div>
      </div>

      <main className="px-4 py-4 space-y-6">
        {/* 맞춤 제품 추천 */}
        <section>
          <Skeleton className="h-6 w-36 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* 파운데이션 추천 */}
        <section>
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="flex gap-3">
            <Skeleton className="w-24 h-28 rounded-xl shrink-0" />
            <Skeleton className="w-24 h-28 rounded-xl shrink-0" />
            <Skeleton className="w-24 h-28 rounded-xl shrink-0" />
          </div>
        </section>

        {/* 영양제 추천 */}
        <Skeleton className="h-32 rounded-2xl" />

        {/* 주의 성분 알림 */}
        <Skeleton className="h-28 rounded-2xl" />
      </main>
    </div>
  );
}

// =====================================================
// StylePageSkeleton - 스타일 탭 스켈레톤
// =====================================================

export function StylePageSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn('min-h-screen bg-background pb-20', className)}
      role="status"
      aria-label="스타일 페이지 로딩 중"
    >
      {/* 체형 프로필 */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="w-14 h-5" />
            <Skeleton className="w-20 h-4" />
          </div>
          <Skeleton className="w-8 h-4" />
        </div>
        <div className="flex gap-2 mt-2">
          <Skeleton className="w-14 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
      </section>

      {/* 컬러 팔레트 */}
      <section className="px-4 py-3 border-b">
        <Skeleton className="w-24 h-4 mb-2" />
        <div className="flex gap-2">
          <div className="flex flex-col items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-10 h-3 mt-1" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-10 h-3 mt-1" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-10 h-3 mt-1" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-10 h-3 mt-1" />
          </div>
        </div>
      </section>

      {/* 체형 맞춤 필터 */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="w-36 h-5" />
          <Skeleton className="w-10 h-6 rounded-full" />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2">
          <Skeleton className="w-12 h-8 rounded-full" />
          <Skeleton className="w-12 h-8 rounded-full" />
          <Skeleton className="w-12 h-8 rounded-full" />
          <Skeleton className="w-16 h-8 rounded-full" />
          <Skeleton className="w-12 h-8 rounded-full" />
        </div>
      </div>

      <main className="px-4 py-4 space-y-6">
        {/* 오늘의 코디 추천 */}
        <section>
          <Skeleton className="h-6 w-36 mb-3" />
          <Skeleton className="w-full h-96 rounded-2xl" />
        </section>

        {/* 맞춤 아이템 추천 */}
        <section>
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* 비슷한 체형 리뷰 */}
        <Skeleton className="h-36 rounded-2xl" />

        {/* 오늘 뭐 입지? */}
        <Skeleton className="h-32 rounded-2xl" />
      </main>
    </div>
  );
}

// =====================================================
// CategoryPageSkeleton - 카테고리 페이지 스켈레톤
// =====================================================

interface CategoryPageSkeletonProps extends SkeletonBaseProps {
  /** 제품 개수 */
  productCount?: number;
}

export function CategoryPageSkeleton({
  className,
  productCount = 8,
}: CategoryPageSkeletonProps) {
  return (
    <div
      className={cn('min-h-screen bg-background pb-20', className)}
      role="status"
      aria-label="카테고리 페이지 로딩 중"
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>
          <Skeleton className="w-5 h-5" />
        </div>

        {/* 필터/정렬 바 */}
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <Skeleton className="w-24 h-8 rounded-full" />
          <Skeleton className="w-20 h-5" />
        </div>
      </header>

      <main className="px-4 py-4">
        <Skeleton className="h-4 w-16 mb-4" />

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: productCount }).map((_, i) => (
            <ProductCardSkeleton key={i} variant="large" />
          ))}
        </div>
      </main>
    </div>
  );
}

// =====================================================
// RecordPageSkeleton - 기록 탭 스켈레톤
// =====================================================

export function RecordPageSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn('min-h-screen bg-background pb-20', className)}
      role="status"
      aria-label="기록 페이지 로딩 중"
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* 날짜 선택 */}
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-8 h-8" />
        </div>

        {/* 칼로리 요약 */}
        <div className="bg-card rounded-2xl border p-4">
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* 영양소 섭취 */}
        <div className="bg-card rounded-2xl border p-4">
          <Skeleton className="h-5 w-28 mb-3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Skeleton className="h-3 w-12 mx-auto mb-2" />
              <Skeleton className="h-2 w-full rounded-full mb-1" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-3 w-12 mx-auto mb-2" />
              <Skeleton className="h-2 w-full rounded-full mb-1" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-3 w-12 mx-auto mb-2" />
              <Skeleton className="h-2 w-full rounded-full mb-1" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          </div>
        </div>

        {/* 물 섭취 */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-8 h-10 rounded-lg" />
            ))}
          </div>
        </div>

        {/* 운동 기록 */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

// =====================================================
// ProductCardSkeleton - 제품 카드 스켈레톤
// =====================================================

interface ProductCardSkeletonProps extends SkeletonBaseProps {
  /** 크기 변형 */
  variant?: 'small' | 'large';
}

function ProductCardSkeleton({
  className,
  variant = 'small',
}: ProductCardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border p-3',
        className
      )}
    >
      {/* 매칭률 */}
      <Skeleton className="h-3 w-10 mb-2" />

      {/* 이미지 */}
      <Skeleton className="w-full aspect-square rounded-lg mb-2" />

      {/* 브랜드 */}
      <Skeleton className="h-3 w-12" />

      {/* 제품명 */}
      <Skeleton className="h-4 w-full mt-1" />
      {variant === 'large' && <Skeleton className="h-4 w-3/4 mt-1" />}

      {/* 평점 */}
      <div className="flex items-center gap-1 mt-2">
        <Skeleton className="w-3 h-3" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-3 w-12" />
      </div>

      {/* 가격 */}
      <Skeleton className="h-4 w-16 mt-2" />
    </div>
  );
}

// =====================================================
// SearchPageSkeleton - 검색 페이지 스켈레톤
// =====================================================

export function SearchPageSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn('min-h-screen bg-background pb-20', className)}
      role="status"
      aria-label="검색 페이지 로딩 중"
    >
      {/* 헤더 + 검색바 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="w-16 h-8" />
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* 최근 검색 */}
        <div>
          <Skeleton className="h-5 w-20 mb-3" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>

        {/* 인기 검색어 */}
        <div>
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-6 h-6" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* 추천 카테고리 */}
        <div>
          <Skeleton className="h-5 w-28 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

// =====================================================
// 통합 Export
// =====================================================

export { ProductCardSkeleton };

const PageSkeletons = {
  Home: HomeSkeleton,
  Beauty: BeautyPageSkeleton,
  Style: StylePageSkeleton,
  Category: CategoryPageSkeleton,
  Record: RecordPageSkeleton,
  Search: SearchPageSkeleton,
  ProductCard: ProductCardSkeleton,
};

export default PageSkeletons;
