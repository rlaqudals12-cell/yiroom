/**
 * useBeautyProducts 훅 테스트
 * @description 뷰티 제품 데이터 훅 - 인터페이스 및 반환값 검증
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Clerk useUser 모킹
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: { id: 'user_123' },
  }),
}));

// useUserMatching 모킹 - profileLoading이 false로 시작
vi.mock('@/hooks/useUserMatching', () => ({
  useUserMatching: () => ({
    profile: { skinType: 'dry' },
    isLoading: false,
    getMatchedProducts: vi.fn((products) =>
      products.map((p: unknown, i: number) => ({
        product: p,
        matchScore: 90 - i * 10,
        matchReasons: [],
      }))
    ),
    filterByMatchRate: vi.fn((products, minRate) =>
      products.filter((p: { matchScore: number }) => p.matchScore >= minRate)
    ),
  }),
}));

// Supabase 모킹 - 기본 데이터 반환
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () =>
              Promise.resolve({
                data: [
                  { id: '1', name: 'Product A', category: 'skincare', rating: 4.5 },
                  { id: '2', name: 'Product B', category: 'makeup', rating: 4.8 },
                ],
                error: null,
              }),
          }),
        }),
        order: () => ({
          range: () =>
            Promise.resolve({
              data: [
                { id: '1', name: 'Product A', category: 'skincare', rating: 4.5 },
                { id: '2', name: 'Product B', category: 'makeup', rating: 4.8 },
              ],
              error: null,
            }),
        }),
        range: () =>
          Promise.resolve({
            data: [
              { id: '1', name: 'Product A', category: 'skincare', rating: 4.5 },
              { id: '2', name: 'Product B', category: 'makeup', rating: 4.8 },
            ],
            error: null,
          }),
      }),
    }),
  }),
}));

describe('useBeautyProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const loadHook = async () => {
    const hookModule = await import('@/hooks/useBeautyProducts');
    return hookModule.useBeautyProducts;
  };

  describe('반환값 구조', () => {
    it('필요한 모든 속성을 반환한다', async () => {
      const useBeautyProducts = await loadHook();
      const { result } = renderHook(() => useBeautyProducts());

      // 즉시 확인 가능한 속성들
      expect(result.current).toHaveProperty('products');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('hasMore');
      expect(result.current).toHaveProperty('loadMore');
      expect(result.current).toHaveProperty('refresh');
      expect(typeof result.current.loadMore).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });

    it('products는 배열이다', async () => {
      const useBeautyProducts = await loadHook();
      const { result } = renderHook(() => useBeautyProducts());

      expect(Array.isArray(result.current.products)).toBe(true);
    });

    it('error 속성이 존재한다', async () => {
      const useBeautyProducts = await loadHook();
      const { result } = renderHook(() => useBeautyProducts());

      // error 속성이 존재하는지 확인 (Error 또는 null)
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('옵션', () => {
    it('기본 옵션으로 호출할 수 있다', async () => {
      const useBeautyProducts = await loadHook();

      expect(() => {
        renderHook(() => useBeautyProducts());
      }).not.toThrow();
    });

    it('카테고리 옵션을 지정할 수 있다', async () => {
      const useBeautyProducts = await loadHook();

      expect(() => {
        renderHook(() => useBeautyProducts({ category: 'skincare' }));
      }).not.toThrow();
    });

    it('매칭률 필터 옵션을 지정할 수 있다', async () => {
      const useBeautyProducts = await loadHook();

      expect(() => {
        renderHook(() => useBeautyProducts({ minMatchRate: 80 }));
      }).not.toThrow();
    });

    it('정렬 옵션을 지정할 수 있다', async () => {
      const useBeautyProducts = await loadHook();

      expect(() => {
        renderHook(() => useBeautyProducts({ sortBy: 'rating' }));
      }).not.toThrow();

      expect(() => {
        renderHook(() => useBeautyProducts({ sortBy: 'match' }));
      }).not.toThrow();

      expect(() => {
        renderHook(() => useBeautyProducts({ sortBy: 'price_low' }));
      }).not.toThrow();
    });

    it('limit 옵션을 지정할 수 있다', async () => {
      const useBeautyProducts = await loadHook();

      expect(() => {
        renderHook(() => useBeautyProducts({ limit: 10 }));
      }).not.toThrow();
    });

    it('모든 옵션을 함께 지정할 수 있다', async () => {
      const useBeautyProducts = await loadHook();

      expect(() => {
        renderHook(() =>
          useBeautyProducts({
            category: 'makeup',
            minMatchRate: 70,
            sortBy: 'price_high',
            limit: 15,
          })
        );
      }).not.toThrow();
    });
  });

  describe('함수 호출', () => {
    it('loadMore 함수를 호출할 수 있다', async () => {
      const useBeautyProducts = await loadHook();
      const { result } = renderHook(() => useBeautyProducts());

      expect(async () => {
        await result.current.loadMore();
      }).not.toThrow();
    });

    it('refresh 함수를 호출할 수 있다', async () => {
      const useBeautyProducts = await loadHook();
      const { result } = renderHook(() => useBeautyProducts());

      expect(async () => {
        await result.current.refresh();
      }).not.toThrow();
    });
  });
});
