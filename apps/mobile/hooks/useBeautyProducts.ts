/**
 * 뷰티 제품(화장품) 조회 훅 — 모바일
 *
 * 왜 재작성했나:
 * - 이전 구현은 웹 전용(@clerk/nextjs · @/lib/supabase/clerk-client · web useUserMatching)이라
 *   Expo(Metro) 번들에서 동작하지 않는 사문(死文) 코드였다.
 * - affiliate_products(prod 0행)를 직쿼리하던 표면을 실데이터가 있는 cosmetic_products
 *   (prod 2,821행)로 재배선하기 위해, cosmetic 레포지토리 + 대분류→세분류 매핑을 감싸는
 *   얇은 모바일 훅으로 교체한다. (매칭률 계산은 화면에서 사용자 분석 결과로 수행)
 *
 * @module hooks/useBeautyProducts
 */
import { useCallback, useEffect, useState } from 'react';

import { fineCategoriesFor } from '@/lib/products';
import {
  getCosmeticProducts,
  getCosmeticProductsByCategories,
} from '@/lib/products/repositories/cosmetic';
import type { CosmeticProduct } from '@/types/product';

interface UseBeautyProductsOptions {
  /** 대분류 필터 키(all/skincare/makeup/suncare/bodycare/haircare). 없거나 'all'이면 전체. */
  category?: string;
  /** 최대 개수 (기본 30) */
  limit?: number;
}

interface UseBeautyProductsResult {
  products: CosmeticProduct[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * cosmetic_products를 대분류 필터에 맞춰 조회한다.
 * 대분류는 category-map으로 세분류 배열에 매핑해 `.in()` 서버 필터로 조회한다.
 */
export function useBeautyProducts(options: UseBeautyProductsOptions = {}): UseBeautyProductsResult {
  const { category = 'all', limit = 30 } = options;

  const [products, setProducts] = useState<CosmeticProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 대분류 → 세분류 배열. 매핑에 없으면(예: 'all') 전체 조회.
      const fine = fineCategoriesFor(category);
      const data = fine
        ? await getCosmeticProductsByCategories(fine, limit)
        : await getCosmeticProducts(undefined, limit);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('제품 조회 실패'));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}
