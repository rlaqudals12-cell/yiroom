/**
 * 어필리에이트 제품 조회 훅
 * @description React Native용 제품 조회 훅 (Clerk 통합 Supabase)
 */

import { useCallback, useEffect, useState } from 'react';

import { useClerkSupabaseClient } from '../supabase';
import {
  getAffiliateProducts,
  getAffiliateProductById,
  getRecommendedProductsBySkin,
  getRecommendedProductsByColor,
  getRecommendedProductsByBodyType,
  searchAffiliateProducts,
  getPopularAffiliateProducts,
  getProductsByCategory,
} from './products';
import type {
  AffiliateProduct,
  AffiliateProductFilter,
  AffiliateProductSortBy,
} from './types';

interface UseAffiliateProductsOptions {
  filter?: AffiliateProductFilter;
  sortBy?: AffiliateProductSortBy;
  limit?: number;
  enabled?: boolean;
}

interface UseAffiliateProductsResult {
  products: AffiliateProduct[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * 제품 목록 조회 훅
 */
export function useAffiliateProducts(
  options: UseAffiliateProductsOptions = {}
): UseAffiliateProductsResult {
  const { filter, sortBy = 'rating', limit = 20, enabled = true } = options;

  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(
    async (reset = false) => {
      if (!enabled) return;

      try {
        setIsLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const data = await getAffiliateProducts(
          supabase,
          filter,
          sortBy,
          limit,
          currentOffset
        );

        if (reset) {
          setProducts(data);
          setOffset(limit);
        } else {
          setProducts((prev) => [...prev, ...data]);
          setOffset((prev) => prev + limit);
        }

        setHasMore(data.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('제품 조회 실패'));
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, filter, sortBy, limit, offset, enabled]
  );

  const refetch = useCallback(async () => {
    await fetchProducts(true);
  }, [fetchProducts]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchProducts(false);
    }
  }, [fetchProducts, isLoading, hasMore]);

  useEffect(() => {
    if (enabled) {
      fetchProducts(true);
    }
  }, [enabled, filter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  return { products, isLoading, error, refetch, loadMore, hasMore };
}

/**
 * 단일 제품 조회 훅
 */
export function useAffiliateProduct(productId: string | undefined) {
  const supabase = useClerkSupabaseClient();
  const [product, setProduct] = useState<AffiliateProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getAffiliateProductById(supabase, productId);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('제품 조회 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, isLoading, error, refetch: fetchProduct };
}

/**
 * 피부 분석 기반 추천 제품 훅
 */
export function useRecommendedProductsBySkin(
  skinType: string | undefined,
  concerns?: string[],
  limit = 10
) {
  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!skinType) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getRecommendedProductsBySkin(
        supabase,
        skinType,
        concerns,
        limit
      );
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('추천 제품 조회 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, skinType, concerns, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}

/**
 * 퍼스널 컬러 기반 추천 제품 훅
 */
export function useRecommendedProductsByColor(
  personalColor: string | undefined,
  category?: string,
  limit = 10
) {
  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!personalColor) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getRecommendedProductsByColor(
        supabase,
        personalColor,
        category,
        limit
      );
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('추천 제품 조회 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, personalColor, category, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}

/**
 * 체형 기반 추천 제품 훅
 */
export function useRecommendedProductsByBodyType(
  bodyType: string | undefined,
  category?: string,
  limit = 10
) {
  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!bodyType) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getRecommendedProductsByBodyType(
        supabase,
        bodyType,
        category,
        limit
      );
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('추천 제품 조회 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, bodyType, category, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}

/**
 * 제품 검색 훅
 */
export function useProductSearch(keyword: string, limit = 20) {
  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async () => {
    if (!keyword.trim()) {
      setProducts([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await searchAffiliateProducts(supabase, keyword, limit);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('제품 검색 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, keyword, limit]);

  useEffect(() => {
    const timer = setTimeout(search, 300); // 디바운스
    return () => clearTimeout(timer);
  }, [search]);

  return { products, isLoading, error };
}

/**
 * 인기 제품 훅
 */
export function usePopularProducts(category?: string, limit = 10) {
  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getPopularAffiliateProducts(supabase, category, limit);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('인기 제품 조회 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, category, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}

/**
 * 카테고리별 제품 훅 (Mock Fallback 포함)
 */
export function useProductsByCategory(category: string, limit = 20) {
  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getProductsByCategory(supabase, category, limit);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('제품 조회 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, category, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}
