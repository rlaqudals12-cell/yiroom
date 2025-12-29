'use client';

import { useEffect } from 'react';
import { useRecentlyViewedStore } from '@/lib/stores/recentlyViewedStore';
import { productFunnel, durationTrackers } from '@/lib/analytics';
import type { ProductType } from '@/types/product';

interface ProductViewTrackerProps {
  productId: string;
  productType: ProductType;
  name: string;
  brand: string;
  imageUrl?: string;
  priceKrw?: number;
}

/**
 * 제품 상세 페이지 조회 트래킹
 * - 최근 본 제품에 추가
 * - 제품 퍼널 트래킹
 * - 체류 시간 측정
 */
export function ProductViewTracker({
  productId,
  productType,
  name,
  brand,
  imageUrl,
  priceKrw,
}: ProductViewTrackerProps) {
  const { addItem } = useRecentlyViewedStore();

  useEffect(() => {
    // 최근 본 제품에 추가
    addItem({
      productId,
      productType,
      name,
      brand,
      imageUrl,
      priceKrw,
    });

    // 퍼널 트래킹: 제품 상세 조회
    productFunnel.viewDetail(productId);

    // 체류 시간 측정 시작
    durationTrackers.productDetail.start();

    return () => {
      durationTrackers.productDetail.stop();
    };
  }, [productId, productType, name, brand, imageUrl, priceKrw, addItem]);

  // 렌더링 없음 (트래킹 전용)
  return null;
}

export default ProductViewTracker;
