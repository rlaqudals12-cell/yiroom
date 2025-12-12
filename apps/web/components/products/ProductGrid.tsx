'use client';

import { PackageX } from 'lucide-react';

import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './ProductCardSkeleton';
import type { AnyProduct, ProductWithMatch } from '@/types/product';

interface ProductGridProps {
  products: AnyProduct[];
  matchScores?: Map<string, number>;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * 제품 그리드 컴포넌트
 * - 2열(모바일) / 3열(태블릿) / 4열(데스크탑) 반응형
 * - 로딩 스켈레톤 지원
 * - 빈 상태 UI 지원
 */
export function ProductGrid({
  products,
  matchScores,
  isLoading,
  emptyMessage = '표시할 제품이 없습니다.',
}: ProductGridProps) {
  if (isLoading) {
    return <ProductGridSkeleton count={8} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageX className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      data-testid="product-grid"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          matchScore={matchScores?.get(product.id)}
        />
      ))}
    </div>
  );
}

/**
 * ProductWithMatch 배열을 일반 Product와 matchScores로 분리
 */
export function extractMatchScores<T extends { id: string }>(
  productsWithMatch: ProductWithMatch<T>[]
): { products: T[]; matchScores: Map<string, number> } {
  const products: T[] = [];
  const matchScores = new Map<string, number>();

  for (const item of productsWithMatch) {
    products.push(item.product);
    matchScores.set(item.product.id, item.matchScore);
  }

  return { products, matchScores };
}
