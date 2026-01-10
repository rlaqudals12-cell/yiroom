'use client';

import { memo } from 'react';
import Image from 'next/image';
import { ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/mock/skincare-routine';
import type { ProductRecommendationProps } from '@/types/skincare-routine';

/**
 * 제품 추천 컴포넌트 (어필리에이트 연동)
 * - 카테고리별 제품 추천
 * - 가격, 평점 표시
 * - 외부 링크 연동
 */
const ProductRecommendation = memo(function ProductRecommendation({
  products,
  category,
  onProductClick,
  className,
}: ProductRecommendationProps) {
  const categoryInfo = getCategoryInfo(category);

  if (products.length === 0) {
    return (
      <div
        className={cn('text-center py-6 text-muted-foreground text-sm', className)}
        data-testid="product-recommendation-empty"
      >
        <p>추천 제품을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="product-recommendation">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{categoryInfo.emoji}</span>
        <h4 className="font-medium text-sm">{categoryInfo.name} 추천</h4>
      </div>

      {/* 제품 리스트 */}
      <div className="space-y-2">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onProductClick?.(product)}
            className="w-full flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all text-left"
            data-testid="product-recommendation-card"
          >
            {/* 이미지 */}
            {product.thumbnailUrl ? (
              <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={product.thumbnailUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{categoryInfo.emoji}</span>
              </div>
            )}

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-2">{product.name}</p>
              {product.brand && (
                <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
              )}

              {/* 평점 */}
              {product.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                  {product.reviewCount && (
                    <span className="text-xs text-muted-foreground">
                      ({product.reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}

              {/* 가격 */}
              <div className="flex items-center gap-2 mt-1.5">
                {product.priceKrw && (
                  <span className="text-sm font-bold text-primary">
                    {product.priceKrw.toLocaleString()}원
                  </span>
                )}
                {product.priceOriginalKrw && product.priceOriginalKrw > (product.priceKrw || 0) && (
                  <span className="text-xs text-muted-foreground line-through">
                    {product.priceOriginalKrw.toLocaleString()}원
                  </span>
                )}
              </div>
            </div>

            {/* 외부 링크 아이콘 */}
            <ExternalLink
              className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
});

export default ProductRecommendation;
