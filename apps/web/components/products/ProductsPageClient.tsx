'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { CategoryTabs } from './CategoryTabs';
import { ProductGrid } from './ProductGrid';
import { ProductSort } from './ProductSort';
import { ProductSearch } from './ProductSearch';
import type { ProductFilterState } from './ProductFilters';
import { ProductFiltersDynamic } from './dynamic';
import type { ProductCategory, AnyProduct, ProductSortBy, CosmeticProduct } from '@/types/product';
import { getProductsByCategory, searchProducts } from '@/lib/products';

// 시즌 라벨 변환
function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤',
  };
  return labels[season] || season;
}

// 피부 타입 라벨 변환
function getSkinTypeLabel(skinType: string): string {
  const labels: Record<string, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    sensitive: '민감성',
    normal: '보통',
  };
  return labels[skinType] || skinType;
}

/**
 * 제품 페이지 클라이언트 컴포넌트
 * - URL 파라미터로 상태 관리 (category, search, sortBy, skinType, season)
 * - 카테고리 탭, 필터, 검색, 정렬 통합
 * - 분석 결과 기반 필터링 지원
 */
export function ProductsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 읽기
  const initialCategory = (searchParams.get('category') as ProductCategory) || 'all';
  const initialSearch = searchParams.get('search') || '';
  const initialSortBy = (searchParams.get('sortBy') as ProductSortBy) || 'rating';
  // 분석 결과 기반 필터 파라미터
  const skinTypeParam = searchParams.get('skinType') || '';
  const seasonParam = searchParams.get('season') || '';

  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<ProductSortBy>(initialSortBy);
  const [filters, setFilters] = useState<ProductFilterState>({});
  const [rawProducts, setRawProducts] = useState<AnyProduct[]>([]); // 서버에서 가져온 원본 데이터
  const [isLoading, setIsLoading] = useState(true);

  // 분석 결과 기반 필터 소스 계산
  const filterSource = useMemo(() => {
    if (skinTypeParam) return `${getSkinTypeLabel(skinTypeParam)} 피부 분석 결과 기반`;
    if (seasonParam) return `${getSeasonLabel(seasonParam)} 퍼스널 컬러 분석 기반`;
    return null;
  }, [skinTypeParam, seasonParam]);

  // 필터가 적용 가능한 카테고리인지 확인 (화장품 관련)
  const isFilterableCategory = useMemo(
    () => ['all', 'skincare', 'makeup'].includes(category),
    [category]
  );

  // URL 파라미터 업데이트
  const updateURL = useCallback(
    (params: { category?: ProductCategory; search?: string; sortBy?: ProductSortBy }) => {
      const newParams = new URLSearchParams(searchParams.toString());

      if (params.category !== undefined) {
        if (params.category === 'all') {
          newParams.delete('category');
        } else {
          newParams.set('category', params.category);
        }
      }

      if (params.search !== undefined) {
        if (params.search === '') {
          newParams.delete('search');
        } else {
          newParams.set('search', params.search);
        }
      }

      if (params.sortBy !== undefined) {
        if (params.sortBy === 'rating') {
          newParams.delete('sortBy');
        } else {
          newParams.set('sortBy', params.sortBy);
        }
      }

      const queryString = newParams.toString();
      router.push(queryString ? `?${queryString}` : '/products', { scroll: false });
    },
    [router, searchParams]
  );

  // 제품 로드 (서버에서 가져오기만)
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let result: AnyProduct[];

      if (searchQuery.trim()) {
        // 검색어가 있으면 검색 API 사용
        result = await searchProducts(searchQuery, category, 100);
      } else {
        // 검색어가 없으면 카테고리별 조회
        result = await getProductsByCategory(category, {
          sortBy,
          limit: 100,
        });
      }

      setRawProducts(result);
    } catch (error) {
      console.error('제품 로드 실패:', error);
      setRawProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, searchQuery, sortBy]);

  // 필터가 적용된 제품 목록 (클라이언트 사이드 필터링)
  const products = useMemo(() => {
    // 분석 결과 파라미터 또는 UI 필터가 있는지 확인
    const hasUIFilters =
      (filters.priceRange?.length ?? 0) > 0 ||
      (filters.skinTypes?.length ?? 0) > 0 ||
      (filters.skinConcerns?.length ?? 0) > 0 ||
      (filters.personalColorSeasons?.length ?? 0) > 0;
    const hasAnalysisParams = !!skinTypeParam || !!seasonParam;

    if (!hasUIFilters && !hasAnalysisParams) return rawProducts;
    if (!isFilterableCategory && !hasAnalysisParams) return rawProducts;

    return rawProducts.filter((product) => {
      // 화장품만 필터링 (skinTypes, skinConcerns, personalColorSeasons 체크)
      const cosmetic = product as CosmeticProduct;

      // 분석 결과 기반 피부 타입 필터 (URL 파라미터)
      if (skinTypeParam && cosmetic.skinTypes) {
        const skinMatch = cosmetic.skinTypes.some((type) =>
          type.toLowerCase().includes(skinTypeParam.toLowerCase())
        );
        if (!skinMatch) return false;
      }

      // 분석 결과 기반 시즌 필터 (URL 파라미터)
      if (seasonParam && cosmetic.personalColorSeasons) {
        const seasonMatch = cosmetic.personalColorSeasons.some((season) =>
          season.toLowerCase().includes(seasonParam.toLowerCase())
        );
        if (!seasonMatch) return false;
      }

      // 가격대 필터
      if (filters.priceRange && filters.priceRange.length > 0) {
        const price = product.priceKrw || 0;
        const priceMatches = filters.priceRange.some((range) => {
          if (range === 'budget') return price < 20000;
          if (range === 'mid') return price >= 20000 && price < 50000;
          if (range === 'premium') return price >= 50000;
          return false;
        });
        if (!priceMatches) return false;
      }

      // 피부 타입 필터 (화장품만 - UI 필터)
      if (filters.skinTypes && filters.skinTypes.length > 0 && cosmetic.skinTypes) {
        const skinMatch = filters.skinTypes.some((type) => cosmetic.skinTypes?.includes(type));
        if (!skinMatch) return false;
      }

      // 피부 고민 필터 (화장품만)
      if (filters.skinConcerns && filters.skinConcerns.length > 0 && cosmetic.concerns) {
        const concernMatch = filters.skinConcerns.some((concern) =>
          cosmetic.concerns?.includes(concern)
        );
        if (!concernMatch) return false;
      }

      // 퍼스널 컬러 필터 (화장품만)
      if (
        filters.personalColorSeasons &&
        filters.personalColorSeasons.length > 0 &&
        cosmetic.personalColorSeasons
      ) {
        const pcMatch = filters.personalColorSeasons.some((season) =>
          cosmetic.personalColorSeasons?.includes(season)
        );
        if (!pcMatch) return false;
      }

      return true;
    });
  }, [rawProducts, filters, isFilterableCategory, skinTypeParam, seasonParam]);

  // 카테고리, 검색어, 정렬 변경 시 제품 로드
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 카테고리 변경 핸들러
  const handleCategoryChange = (newCategory: ProductCategory) => {
    setCategory(newCategory);
    updateURL({ category: newCategory });
  };

  // 검색어 변경 핸들러 (debounce는 SearchInput 컴포넌트에서 처리)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateURL({ search: query });
  };

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: ProductSortBy) => {
    setSortBy(newSortBy);
    updateURL({ sortBy: newSortBy });
  };

  // 필터 변경 핸들러
  const handleFiltersChange = (newFilters: ProductFilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* 분석 결과 기반 필터 배너 */}
      {filterSource && (
        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-xl">{skinTypeParam ? '🧴' : '💄'}</span>
          <div>
            <p className="font-medium text-foreground">맞춤 제품 추천</p>
            <p className="text-sm text-muted-foreground">{filterSource}</p>
          </div>
        </div>
      )}

      {/* 검색창 */}
      <ProductSearch value={searchQuery} onValueChange={handleSearchChange} className="max-w-md" />

      {/* 카테고리 탭 */}
      <CategoryTabs value={category} onValueChange={handleCategoryChange} />

      {/* 필터 (화장품 관련 카테고리만) - Dynamic Import */}
      {isFilterableCategory && (
        <ProductFiltersDynamic filters={filters} onFiltersChange={handleFiltersChange} />
      )}

      {/* 결과 카운트 + 정렬 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? '로딩 중...' : `${products.length}개 제품`}
        </p>
        <ProductSort value={sortBy} onValueChange={handleSortChange} />
      </div>

      {/* 제품 그리드 */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        emptyMessage={
          searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : '표시할 제품이 없습니다.'
        }
      />
    </div>
  );
}
