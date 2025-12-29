import { Suspense } from 'react';
import type { Metadata } from 'next';

import { ProductsPageClient } from '@/components/products/ProductsPageClient';
import { ProductGridSkeleton } from '@/components/products/ProductCardSkeleton';
import { RecentlyViewed } from '@/components/products/RecentlyViewed';

export const metadata: Metadata = {
  title: '제품 | 이룸',
  description: '이룸이 추천하는 스킨케어, 메이크업, 영양제, 운동기구, 건강식품을 만나보세요.',
};

/**
 * 제품 목록 페이지
 * - /products
 * - 카테고리별 제품 탐색
 * - 필터링, 검색, 정렬 지원
 */
export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">제품</h1>
        <p className="mt-1 text-muted-foreground">
          이룸이 추천하는 제품을 만나보세요
        </p>
      </div>

      {/* 최근 본 제품 */}
      <RecentlyViewed className="mb-6" />

      {/* 메인 컨텐츠 */}
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <ProductsPageClient />
      </Suspense>
    </div>
  );
}
