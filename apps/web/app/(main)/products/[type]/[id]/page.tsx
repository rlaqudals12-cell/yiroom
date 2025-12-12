import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ProductDetailTabs } from '@/components/products';
import { getProductById, pathToProductType } from '@/lib/products';
import type { ProductType } from '@/types/product';

interface ProductDetailPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

/**
 * 제품 타입별 라벨
 */
function getProductTypeLabel(type: ProductType): string {
  const labels: Record<ProductType, string> = {
    cosmetic: '화장품',
    supplement: '영양제',
    workout_equipment: '운동기구',
    health_food: '건강식품',
  };
  return labels[type];
}

/**
 * 가격 포맷
 */
function formatPrice(price: number | undefined): string {
  if (!price) return '가격 정보 없음';
  return `${price.toLocaleString('ko-KR')}원`;
}

/**
 * 평점 표시
 */
function RatingDisplay({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {reviewCount && (
        <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  );
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productType = pathToProductType(resolvedParams.type);

  if (!productType) {
    return {
      title: '제품을 찾을 수 없습니다 | 이룸',
    };
  }

  const product = await getProductById(productType, resolvedParams.id);

  if (!product) {
    return {
      title: '제품을 찾을 수 없습니다 | 이룸',
    };
  }

  return {
    title: `${product.name} | ${product.brand} | 이룸`,
    description: `${product.brand}의 ${product.name} - 이룸에서 추천하는 ${getProductTypeLabel(productType)}`,
  };
}

/**
 * 제품 상세 페이지
 */
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

  const imageUrl = product.imageUrl || '/images/placeholder-product.png';

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 뒤로가기 */}
      <Link
        href="/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        제품 목록으로
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 제품 이미지 */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <Badge className="absolute left-3 top-3">
            {getProductTypeLabel(productType)}
          </Badge>
        </div>

        {/* 제품 정보 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{product.brand}</p>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <RatingDisplay rating={product.rating} reviewCount={product.reviewCount} />
            <p className="text-2xl font-bold text-primary">{formatPrice(product.priceKrw)}</p>
          </div>

          {/* 탭 기반 상세 정보 */}
          <ProductDetailTabs product={product} productType={productType} />
        </div>
      </div>
    </div>
  );
}
