'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompareButton } from '@/components/products/CompareButton';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { cn } from '@/lib/utils';
import type { AnyProduct } from '@/types/product';
import { getProductType, productDetailPath } from '@/lib/products';

interface ProductCardProps {
  product: AnyProduct;
  matchScore?: number;
  /** 매칭 이유 라벨 (예: "여름 쿨톤", "건성 피부") — 상위 1~2개만 칩으로 표시 */
  matchReasons?: string[];
  className?: string;
  priority?: boolean;
}

/**
 * 제품 카드 컴포넌트
 * - 제품 이미지, 브랜드, 이름, 가격, 평점 표시
 * - 매칭도 배지 (선택)
 * - 클릭 시 상세 페이지로 이동
 */
export function ProductCard({
  product,
  matchScore,
  matchReasons,
  className,
  priority = false,
}: ProductCardProps) {
  // 매칭 이유는 최대 2개까지만 (카드 공간 제약 + 인지 부담)
  const shownReasons = matchReasons?.slice(0, 2) ?? [];
  const productType = getProductType(product);
  // One Canon: 화장품은 /beauty/[id], 그 외는 /products/[type]/[id]
  const href = productDetailPath(productType, product.id);

  // 가격 포맷
  const price = 'priceKrw' in product ? product.priceKrw : undefined;
  const formattedPrice = price ? `₩${price.toLocaleString('ko-KR')}` : '가격 미정';

  // 평점/리뷰
  const rating = 'rating' in product ? product.rating : undefined;
  const reviewCount = 'reviewCount' in product ? product.reviewCount : undefined;

  // 이미지 URL (없으면 플레이스홀더 사용)
  const rawImageUrl = 'imageUrl' in product ? product.imageUrl : undefined;
  // 제품 카테고리에 따른 플레이스홀더 색상
  const placeholderColor = (() => {
    if ('skinTypes' in product) return 'f8e8ee';
    if ('benefits' in product) return 'e8f8ee';
    if ('targetMuscles' in product) return 'e8eef8';
    return 'f0f0f0';
  })();
  const placeholderUrl = `https://placehold.co/400x400/${placeholderColor}/888?text=${encodeURIComponent(product.brand.slice(0, 3))}`;
  const imageUrl = rawImageUrl || placeholderUrl;

  // 평점 접근성 라벨
  const reviewSuffix =
    reviewCount !== undefined && reviewCount > 0
      ? `, 리뷰 ${reviewCount.toLocaleString('ko-KR')}개`
      : '';
  const ratingAriaLabel =
    rating !== undefined ? `평점 ${rating.toFixed(1)}점${reviewSuffix}` : undefined;

  // 비교 버튼용 데이터
  const compareItem = {
    productId: product.id,
    productType,
    name: product.name,
    brand: product.brand,
    imageUrl: rawImageUrl,
    priceKrw: price,
  };

  return (
    <Link href={href} className={cn('block', className)}>
      <Card
        className="group flex h-full flex-col overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
        data-testid="product-card"
        role="article"
        aria-label={`${product.name} 상세`}
      >
        {/* 이미지 영역 — 로드 실패 시 브랜드 이니셜 타일 폴백 (placehold.co 관례의 로컬 버전) */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ImageWithFallback
            src={imageUrl}
            alt={product.name}
            fallback={
              <span className="text-2xl font-semibold text-muted-foreground/60">
                {product.brand.slice(0, 3)}
              </span>
            }
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            priority={priority}
          />

          {/* 호버 시 오버레이 효과 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* 비교 버튼 */}
          <div
            className="absolute left-2 top-2 z-10 opacity-0 transition-all duration-300 transform -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
            onClick={(e) => e.preventDefault()}
          >
            <CompareButton
              product={compareItem}
              variant="icon"
              size="sm"
              className="bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* 정보 영역 — flex 컬럼으로 채워, 평점·가격 행을 카드 하단 기준(mt-auto) 정렬한다.
            제품명 줄수·칩 개수가 카드마다 달라도 3장의 가격 행이 같은 높이에 오게 하려는 목적. */}
        <CardContent className="flex flex-1 flex-col p-3 transition-colors duration-300 group-hover:bg-muted/30">
          {/* 적합도 — 이미지 위 오버레이가 아니라 정보 영역 상단 독립 행.
              좁은 그리드(4열)에서도 제품명·이미지를 가리지 않는다 (배지 비겹침). */}
          {matchScore !== undefined && matchScore > 0 && (
            <div className="mb-1.5" data-testid="product-match-badge">
              <Badge
                variant="secondary"
                className="bg-primary text-primary-foreground px-2 py-0.5 text-[11px] font-semibold transition-transform duration-300 group-hover:scale-105"
              >
                적합도 {matchScore}점
              </Badge>
            </div>
          )}

          {/* 브랜드 */}
          <p className="text-xs text-muted-foreground truncate">{product.brand}</p>

          {/* 제품명 */}
          <h3 className="mt-1 text-sm font-medium line-clamp-2 min-h-[2.5rem] transition-colors duration-300 group-hover:text-primary">
            {product.name}
          </h3>

          {/* 매칭 이유 칩 — "왜 이 제품인지" 인과 연결 (92% 숫자만 보이던 문제 해소) */}
          {shownReasons.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1" data-testid="product-match-reasons">
              {shownReasons.map((reason) => (
                <span
                  key={reason}
                  className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* 평점·가격 — 카드 하단 기준 정렬(mt-auto). 위 칩/제품명 줄 수가 달라도
              3장의 가격 행(과 바로 위 평점 행)이 같은 높이에 오도록 하단에 붙인다. */}
          <div className="mt-auto pt-2">
            {/* 평점 */}
            {rating !== undefined && (
              <div className="flex items-center gap-1" aria-label={ratingAriaLabel}>
                <Star
                  className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{rating.toFixed(1)}</span>
                {reviewCount !== undefined && reviewCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({reviewCount.toLocaleString('ko-KR')})
                  </span>
                )}
              </div>
            )}

            {/* 가격 */}
            <p
              className="mt-1 text-sm font-semibold transition-colors duration-300 group-hover:text-primary"
              aria-label={`가격 ${formattedPrice}`}
            >
              {formattedPrice}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
