/**
 * 제품 필터 스토어 테스트
 */

import {
  useProductFilterStore,
  SORT_OPTIONS,
  CATEGORY_OPTIONS,
} from '@/lib/stores';

describe('useProductFilterStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useProductFilterStore.getState().clearFilters();
  });

  describe('검색어', () => {
    it('setSearchQuery로 검색어 설정', () => {
      const { setSearchQuery } = useProductFilterStore.getState();

      setSearchQuery('히알루론산');

      expect(useProductFilterStore.getState().searchQuery).toBe('히알루론산');
    });

    it('빈 문자열로 검색어 초기화', () => {
      const { setSearchQuery } = useProductFilterStore.getState();

      setSearchQuery('테스트');
      setSearchQuery('');

      expect(useProductFilterStore.getState().searchQuery).toBe('');
    });
  });

  describe('카테고리', () => {
    it('setCategory로 카테고리 설정', () => {
      const { setCategory } = useProductFilterStore.getState();

      setCategory('cosmetic');

      expect(useProductFilterStore.getState().selectedCategory).toBe('cosmetic');
    });

    it('기본 카테고리는 all', () => {
      expect(useProductFilterStore.getState().selectedCategory).toBe('all');
    });
  });

  describe('정렬', () => {
    it('setSortBy로 정렬 옵션 설정', () => {
      const { setSortBy } = useProductFilterStore.getState();

      setSortBy('rating');

      expect(useProductFilterStore.getState().sortBy).toBe('rating');
    });

    it('기본 정렬은 matchScore', () => {
      expect(useProductFilterStore.getState().sortBy).toBe('matchScore');
    });
  });

  describe('가격 필터', () => {
    it('setPriceRange로 가격 범위 설정', () => {
      const { setPriceRange } = useProductFilterStore.getState();

      setPriceRange(10000, 50000);

      const state = useProductFilterStore.getState();
      expect(state.priceRange.min).toBe(10000);
      expect(state.priceRange.max).toBe(50000);
    });

    it('null로 가격 필터 해제', () => {
      const { setPriceRange } = useProductFilterStore.getState();

      setPriceRange(10000, 50000);
      setPriceRange(null, null);

      const state = useProductFilterStore.getState();
      expect(state.priceRange.min).toBeNull();
      expect(state.priceRange.max).toBeNull();
    });
  });

  describe('평점 필터', () => {
    it('setMinRating으로 최소 평점 설정', () => {
      const { setMinRating } = useProductFilterStore.getState();

      setMinRating(4);

      expect(useProductFilterStore.getState().minRating).toBe(4);
    });
  });

  describe('피부타입 필터', () => {
    it('setSkinTypeFilter로 피부타입 필터 설정', () => {
      const { setSkinTypeFilter } = useProductFilterStore.getState();

      setSkinTypeFilter(['dry', 'sensitive']);

      expect(useProductFilterStore.getState().skinTypeFilter).toEqual(['dry', 'sensitive']);
    });
  });

  describe('피부고민 필터', () => {
    it('setConcernFilter로 피부고민 필터 설정', () => {
      const { setConcernFilter } = useProductFilterStore.getState();

      setConcernFilter(['acne', 'wrinkle']);

      expect(useProductFilterStore.getState().concernFilter).toEqual(['acne', 'wrinkle']);
    });
  });

  describe('clearFilters', () => {
    it('모든 필터를 초기화해야 함', () => {
      const {
        setSearchQuery,
        setCategory,
        setSortBy,
        setPriceRange,
        setMinRating,
        setSkinTypeFilter,
        setConcernFilter,
        clearFilters,
      } = useProductFilterStore.getState();

      // 필터 설정
      setSearchQuery('테스트');
      setCategory('cosmetic');
      setSortBy('rating');
      setPriceRange(10000, 50000);
      setMinRating(4);
      setSkinTypeFilter(['dry']);
      setConcernFilter(['acne']);

      // 초기화
      clearFilters();

      const state = useProductFilterStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.selectedCategory).toBe('all');
      expect(state.sortBy).toBe('matchScore');
      expect(state.priceRange).toEqual({ min: null, max: null });
      expect(state.minRating).toBe(0);
      expect(state.skinTypeFilter).toEqual([]);
      expect(state.concernFilter).toEqual([]);
    });
  });

  describe('hasActiveFilters', () => {
    it('필터가 없을 때 false 반환', () => {
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(false);
    });

    it('검색어가 있을 때 true 반환', () => {
      useProductFilterStore.getState().setSearchQuery('테스트');
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(true);
    });

    it('카테고리가 all이 아닐 때 true 반환', () => {
      useProductFilterStore.getState().setCategory('cosmetic');
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(true);
    });

    it('정렬이 matchScore가 아닐 때 true 반환', () => {
      useProductFilterStore.getState().setSortBy('rating');
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(true);
    });

    it('가격 필터가 설정되어 있을 때 true 반환', () => {
      useProductFilterStore.getState().setPriceRange(10000, null);
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(true);
    });

    it('최소 평점이 0보다 클 때 true 반환', () => {
      useProductFilterStore.getState().setMinRating(3);
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(true);
    });

    it('피부타입 필터가 있을 때 true 반환', () => {
      useProductFilterStore.getState().setSkinTypeFilter(['dry']);
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(true);
    });

    it('피부고민 필터가 있을 때 true 반환', () => {
      useProductFilterStore.getState().setConcernFilter(['acne']);
      expect(useProductFilterStore.getState().hasActiveFilters()).toBe(true);
    });
  });

  describe('상수', () => {
    it('SORT_OPTIONS에 모든 정렬 옵션이 있어야 함', () => {
      expect(SORT_OPTIONS).toEqual({
        matchScore: '매칭률순',
        rating: '평점순',
        price_asc: '가격 낮은순',
        price_desc: '가격 높은순',
        newest: '최신순',
      });
    });

    it('CATEGORY_OPTIONS에 모든 카테고리가 있어야 함', () => {
      expect(CATEGORY_OPTIONS).toEqual({
        all: '전체',
        cosmetic: '화장품',
        supplement: '영양제',
        equipment: '운동기구',
        healthfood: '건강식품',
      });
    });
  });
});
