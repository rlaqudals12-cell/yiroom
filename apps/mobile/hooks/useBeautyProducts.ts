'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUserMatching } from './useUserMatching';
import type { CosmeticProduct, ProductWithMatch } from '@/types/product';

/**
 * 뷰티 제품 데이터 훅
 * - 카테고리별 제품 목록
 * - 매칭률 기반 정렬/필터
 * - 페이지네이션
 */

interface UseBeautyProductsOptions {
  category?: string;
  minMatchRate?: number;
  sortBy?: 'match' | 'rating' | 'review' | 'price_low' | 'price_high';
  limit?: number;
}

interface UseBeautyProductsResult {
  products: ProductWithMatch<CosmeticProduct>[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBeautyProducts(
  options: UseBeautyProductsOptions = {}
): UseBeautyProductsResult {
  const {
    category,
    minMatchRate = 0,
    sortBy = 'match',
    limit = 20,
  } = options;

  const supabase = useClerkSupabaseClient();
  const { getMatchedProducts, filterByMatchRate, isLoading: profileLoading } = useUserMatching();

  const [products, setProducts] = useState<ProductWithMatch<CosmeticProduct>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // 제품 목록 조회
  const fetchProducts = useCallback(
    async (append = false) => {
      if (profileLoading) return;

      try {
        setIsLoading(true);

        let query = supabase
          .from('cosmetic_products')
          .select('*')
          .range(append ? offset : 0, (append ? offset : 0) + limit - 1);

        // 카테고리 필터
        if (category) {
          query = query.eq('category', category);
        }

        // DB 정렬 (매칭률 제외)
        switch (sortBy) {
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'review':
            query = query.order('review_count', { ascending: false });
            break;
          case 'price_low':
            query = query.order('price_krw', { ascending: true });
            break;
          case 'price_high':
            query = query.order('price_krw', { ascending: false });
            break;
          default:
            query = query.order('rating', { ascending: false });
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        // 매칭 점수 계산
        let matchedProducts = getMatchedProducts(data || []);

        // 매칭률 필터
        if (minMatchRate > 0) {
          matchedProducts = filterByMatchRate(matchedProducts, minMatchRate);
        }

        // 매칭률순 정렬
        if (sortBy === 'match') {
          matchedProducts.sort((a, b) => b.matchScore - a.matchScore);
        }

        if (append) {
          setProducts((prev) => [...prev, ...matchedProducts]);
          setOffset(offset + limit);
        } else {
          setProducts(matchedProducts);
          setOffset(limit);
        }

        setHasMore((data?.length || 0) >= limit);
      } catch (err) {
        console.error('[useBeautyProducts] Error:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, category, sortBy, limit, offset, profileLoading, getMatchedProducts, filterByMatchRate, minMatchRate]
  );

  // 초기 로드
  useEffect(() => {
    fetchProducts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy, minMatchRate, profileLoading]);

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchProducts(true);
  }, [fetchProducts, hasMore, isLoading]);

  // 새로고침
  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchProducts(false);
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
