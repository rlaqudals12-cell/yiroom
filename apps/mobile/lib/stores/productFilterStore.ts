/**
 * 제품 필터/검색 스토어
 * @description 검색어, 정렬, 필터 상태 관리 (비영속)
 */

import { create } from 'zustand';

export type ProductCategory = 'all' | 'cosmetic' | 'supplement' | 'equipment' | 'healthfood';
export type SortOption = 'matchScore' | 'rating' | 'price_asc' | 'price_desc' | 'newest';

interface PriceRange {
  min: number | null;
  max: number | null;
}

interface ProductFilterState {
  // 검색
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 카테고리
  selectedCategory: ProductCategory;
  setCategory: (category: ProductCategory) => void;

  // 정렬
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;

  // 가격 필터
  priceRange: PriceRange;
  setPriceRange: (min: number | null, max: number | null) => void;

  // 평점 필터
  minRating: number;
  setMinRating: (rating: number) => void;

  // 피부타입 필터 (화장품)
  skinTypeFilter: string[];
  setSkinTypeFilter: (types: string[]) => void;

  // 피부고민 필터 (화장품)
  concernFilter: string[];
  setConcernFilter: (concerns: string[]) => void;

  // 전체 초기화
  clearFilters: () => void;

  // 필터 적용 여부
  hasActiveFilters: () => boolean;
}

const initialState = {
  searchQuery: '',
  selectedCategory: 'all' as ProductCategory,
  sortBy: 'matchScore' as SortOption,
  priceRange: { min: null, max: null } as PriceRange,
  minRating: 0,
  skinTypeFilter: [] as string[],
  concernFilter: [] as string[],
};

export const useProductFilterStore = create<ProductFilterState>((set, get) => ({
  ...initialState,

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setCategory: (selectedCategory) => set({ selectedCategory }),

  setSortBy: (sortBy) => set({ sortBy }),

  setPriceRange: (min, max) => set({ priceRange: { min, max } }),

  setMinRating: (minRating) => set({ minRating }),

  setSkinTypeFilter: (skinTypeFilter) => set({ skinTypeFilter }),

  setConcernFilter: (concernFilter) => set({ concernFilter }),

  clearFilters: () => set(initialState),

  hasActiveFilters: () => {
    const state = get();
    return (
      state.searchQuery !== '' ||
      state.selectedCategory !== 'all' ||
      state.sortBy !== 'matchScore' ||
      state.priceRange.min !== null ||
      state.priceRange.max !== null ||
      state.minRating > 0 ||
      state.skinTypeFilter.length > 0 ||
      state.concernFilter.length > 0
    );
  },
}));

/**
 * 정렬 옵션 라벨
 */
export const SORT_OPTIONS: Record<SortOption, string> = {
  matchScore: '매칭률순',
  rating: '평점순',
  price_asc: '가격 낮은순',
  price_desc: '가격 높은순',
  newest: '최신순',
};

/**
 * 카테고리 라벨
 */
export const CATEGORY_OPTIONS: Record<ProductCategory, string> = {
  all: '전체',
  cosmetic: '화장품',
  supplement: '영양제',
  equipment: '운동기구',
  healthfood: '건강식품',
};
