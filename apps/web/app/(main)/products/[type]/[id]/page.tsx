import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WishlistButton } from '@/components/products/WishlistButton';
import { PurchaseButton } from '@/components/products/PurchaseButton';
import { ReviewSection } from '@/components/products/reviews';
import { getProductById, pathToProductType } from '@/lib/products';
import type { ProductType, CosmeticProduct, SupplementProduct } from '@/types/product';
import type { ReviewProductType } from '@/types/review';

interface ProductDetailPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

function getProductTypeLabel(type: ProductType): string {
  const labels: Record<ProductType, string> = {
    cosmetic: '화장품',
    supplement: '영양제',
    workout_equipment: '운동기구',
    health_food: '건강식품',
  };
  return labels[type];
}

// ProductType → ReviewProductType 변환
function toReviewProductType(type: ProductType): ReviewProductType {
  const mapping: Record<ProductType, ReviewProductType> = {
    cosmetic: 'cosmetic',
    supplement: 'supplement',
    workout_equipment: 'equipment',
    health_food: 'healthfood',
  };
  return mapping[type];
}

function formatPrice(price: number | undefined): string {
  if (!price) return '가격 정보 없음';
  return `${price.toLocaleString('ko-KR')}원`;
}

// 피부타입 한글 변환
function getSkinTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    sensitive: '민감성',
    normal: '중성',
  };
  return labels[type] || type;
}

// 피부고민 한글 변환
function getConcernLabel(concern: string): string {
  const labels: Record<string, string> = {
    acne: '여드름',
    aging: '주름/탄력',
    whitening: '미백',
    hydration: '보습',
    pore: '모공',
    redness: '홍조',
    darkCircle: '다크서클',
    wrinkle: '주름',
  };
  return labels[concern] || concern;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productType = pathToProductType(resolvedParams.type);

  if (!productType) {
    return { title: '제품을 찾을 수 없습니다 | 이룸' };
  }

  const product = await getProductById(productType, resolvedParams.id);

  if (!product) {
    return { title: '제품을 찾을 수 없습니다 | 이룸' };
  }

  return {
    title: `${product.name} | ${product.brand}`,
    description: `${product.brand} ${product.name} - 이룸 추천 ${getProductTypeLabel(productType)}`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const productType = pathToProductType(resolvedParams.type);

  if (!productType) {
    notFound();
  }

  const product = await getProductById(productType, resolvedParams.id);

  if (!product) {
    notFound();
  }

  const cosmetic = productType === 'cosmetic' ? (product as CosmeticProduct) : null;
  const supplement = productType === 'supplement' ? (product as SupplementProduct) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>목록</span>
          </Link>
          <WishlistButton
            productType={productType}
            productId={product.id}
            size="md"
            variant="icon"
          />
        </div>
      </div>

      {/* 제품 이미지 */}
      <div className="relative aspect-square bg-muted max-w-md mx-auto">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-24 w-24 text-muted-foreground/30" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 bg-primary/90">
          {getProductTypeLabel(productType)}
        </Badge>
      </div>

      {/* 제품 정보 */}
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-lg">
        {/* 기본 정보 */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{product.brand}</p>
          <h1 className="text-xl font-bold">{product.name}</h1>

          {/* 평점 */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
              </div>
              {product.reviewCount && (
                <span className="text-sm text-muted-foreground">
                  리뷰 {product.reviewCount.toLocaleString()}개
                </span>
              )}
            </div>
          )}

          {/* 가격 */}
          <p className="text-2xl font-bold text-primary">{formatPrice(product.priceKrw)}</p>
        </div>

        {/* 화장품: 피부타입 & 고민 */}
        {cosmetic && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {cosmetic.skinTypes && cosmetic.skinTypes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">추천 피부 타입</p>
                  <div className="flex flex-wrap gap-2">
                    {cosmetic.skinTypes.map((type) => (
                      <Badge key={type} variant="secondary">
                        {getSkinTypeLabel(type)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {cosmetic.concerns && cosmetic.concerns.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">이런 고민에 추천</p>
                  <div className="flex flex-wrap gap-2">
                    {cosmetic.concerns.map((concern) => (
                      <Badge key={concern} variant="outline">
                        {getConcernLabel(concern)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {cosmetic.keyIngredients && cosmetic.keyIngredients.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">주요 성분</p>
                  <p className="text-sm text-muted-foreground">
                    {cosmetic.keyIngredients.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 영양제: 효능 & 성분 */}
        {supplement && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {supplement.benefits && supplement.benefits.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">주요 효능</p>
                  <div className="flex flex-wrap gap-2">
                    {supplement.benefits.map((benefit) => (
                      <Badge key={benefit} variant="secondary">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {supplement.targetConcerns && supplement.targetConcerns.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">이런 분께 추천</p>
                  <div className="flex flex-wrap gap-2">
                    {supplement.targetConcerns.map((concern) => (
                      <Badge key={concern} variant="outline">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {supplement.mainIngredients && supplement.mainIngredients.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">주요 성분</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {supplement.mainIngredients.slice(0, 5).map((ing) => (
                      <div key={ing.name} className="flex justify-between">
                        <span>{ing.name}</span>
                        <span>{ing.amount}{ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 구매 버튼 */}
        <div className="space-y-3 pt-4">
          <PurchaseButton
            productType={productType}
            productId={product.id}
            purchaseUrl={product.purchaseUrl}
            affiliateUrl={(product as { affiliateUrl?: string }).affiliateUrl}
            className="w-full"
          />

          <WishlistButton
            productType={productType}
            productId={product.id}
            size="lg"
            variant="button"
            className="w-full"
          />
        </div>

        {/* 리뷰 섹션 */}
        <ReviewSection
          productType={toReviewProductType(productType)}
          productId={product.id}
        />
      </div>
    </div>
  );
}
