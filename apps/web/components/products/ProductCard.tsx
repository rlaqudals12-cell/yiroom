'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AnyProduct } from '@/types/product';
import { getProductType, productTypeToPath } from '@/lib/products';

interface ProductCardProps {
  product: AnyProduct;
  matchScore?: number;
  className?: string;
}

/**
 * 제품 카드 컴포넌트
 * - 제품 이미지, 브랜드, 이름, 가격, 평점 표시
 * - 매칭도 배지 (선택)
 * - 클릭 시 상세 페이지로 이동
 */
export function ProductCard({ product, matchScore, className }: ProductCardProps) {
  const productType = getProductType(product);
  const typePath = productTypeToPath(productType);
  const href = `/products/${typePath}/${product.id}`;

  // 가격 포맷
  const price = 'priceKrw' in product ? product.priceKrw : undefined;
  const formattedPrice = price
    ? `₩${price.toLocaleString('ko-KR')}`
    : '가격 미정';

  // 평점/리뷰
  const rating = 'rating' in product ? product.rating : undefined;
  const reviewCount = 'reviewCount' in product ? product.reviewCount : undefined;

  // 이미지 URL (없으면 플레이스홀더 사용)
  const rawImageUrl = 'imageUrl' in product ? product.imageUrl : undefined;
  // 제품 카테고리에 따른 플레이스홀더 색상
  const placeholderColor = 'skinTypes' in product ? 'f8e8ee' :
                           'benefits' in product ? 'e8f8ee' :
                           'targetMuscles' in product ? 'e8eef8' : 'f0f0f0';
  const placeholderUrl = `https://placehold.co/400x400/${placeholderColor}/888?text=${encodeURIComponent(product.brand.slice(0, 3))}`;
  const imageUrl = rawImageUrl || placeholderUrl;

  return (
    <Link href={href} className={cn('block', className)}>
      <Card
        className="group h-full overflow-hidden transition-shadow hover:shadow-md"
        data-testid="product-card"
      >
        {/* 이미지 영역 */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />

          {/* 매칭도 배지 */}
          {matchScore !== undefined && matchScore > 0 && (
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 bg-primary text-primary-foreground"
            >
              {matchScore}% 매칭
            </Badge>
          )}
        </div>

        {/* 정보 영역 */}
        <CardContent className="p-3">
          {/* 브랜드 */}
          <p className="text-xs text-muted-foreground truncate">
            {product.brand}
          </p>

          {/* 제품명 */}
          <h3 className="mt-1 text-sm font-medium line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* 평점 */}
          {rating !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
              {reviewCount !== undefined && reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({reviewCount.toLocaleString('ko-KR')})
                </span>
              )}
            </div>
          )}

          {/* 가격 */}
          <p className="mt-2 text-sm font-semibold">{formattedPrice}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
