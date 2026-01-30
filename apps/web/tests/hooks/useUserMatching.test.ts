/**
 * useUserMatching 훅 테스트
 * @description 사용자 프로필 기반 제품 매칭 훅
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { CosmeticProduct } from '@/types/product';

// Clerk useUser 모킹
const mockUseUser = vi.fn();
vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

// Supabase 클라이언트 모킹
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));

// matching 함수 모킹
vi.mock('@/lib/products/matching', () => ({
  calculateMatchScore: vi.fn((product) => ({
    score: 75,
    reasons: [{ type: 'skinType', label: '건성 피부', matched: true }],
  })),
  addMatchInfoToProducts: vi.fn((products) =>
    products.map((p: unknown) => ({
      product: p,
      matchScore: 75,
      matchReasons: [{ type: 'skinType', label: '건성 피부', matched: true }],
    }))
  ),
}));

describe('useUserMatching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.order.mockReturnThis();
    mockSupabaseClient.limit.mockReturnThis();
  });

  const loadHook = async () => {
    const hookModule = await import('@/hooks/useUserMatching');
    return hookModule.useUserMatching;
  };

  describe('초기 상태', () => {
    it('유저가 없으면 로딩 완료 후 기본값 유지', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: null,
      });

      const useUserMatching = await loadHook();
      const { result } = renderHook(() => useUserMatching());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.hasAnalysis).toBe(false);
    });
  });

  describe('프로필 로드', () => {
    it('사용자 분석 데이터를 로드한다', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: { id: 'user_123' },
      });

      // Supabase 응답 모킹
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: { skin_type: 'dry', concerns: ['acne', 'aging'] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { season: '봄 웜톤' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { body_type: '웨이브' },
          error: null,
        });

      const useUserMatching = await loadHook();
      const { result } = renderHook(() => useUserMatching());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.skinType).toBe('dry');
      expect(result.current.skinConcerns).toEqual(['acne', 'aging']);
      expect(result.current.personalColor).toBe('봄 웜톤');
      expect(result.current.bodyType).toBe('웨이브');
      expect(result.current.hasAnalysis).toBe(true);
    });

    it('부분 분석 데이터만 있어도 hasAnalysis가 true', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: { id: 'user_123' },
      });

      // 피부 타입만 있고 나머지는 없는 경우
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: { skin_type: 'oily', concerns: [] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        });

      const useUserMatching = await loadHook();
      const { result } = renderHook(() => useUserMatching());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.skinType).toBe('oily');
      expect(result.current.personalColor).toBe(null);
      expect(result.current.hasAnalysis).toBe(true);
    });
  });

  describe('매칭 함수', () => {
    it('프로필 없으면 기본 점수 50 반환', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: null,
      });

      const useUserMatching = await loadHook();
      const { result } = renderHook(() => useUserMatching());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const score = result.current.calculateProductMatch({
        id: '1',
        name: 'Test',
        brand: 'Test Brand',
        category: 'serum',
      } as CosmeticProduct);
      expect(score).toBe(50);
    });

    it('getMatchedProducts는 프로필 없으면 기본 점수로 반환', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: null,
      });

      const useUserMatching = await loadHook();
      const { result } = renderHook(() => useUserMatching());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const products = [{
        id: '1',
        name: 'Product A',
        brand: 'Test Brand',
        category: 'serum',
      } as CosmeticProduct];
      const matched = result.current.getMatchedProducts(products);

      expect(matched).toHaveLength(1);
      expect(matched[0].matchScore).toBe(50);
      expect(matched[0].matchReasons).toEqual([]);
    });

    it('filterByMatchRate는 최소 매칭률 이상만 반환', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: null,
      });

      const useUserMatching = await loadHook();
      const { result } = renderHook(() => useUserMatching());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const products = [
        { product: { id: '1', name: 'A', brand: 'B', category: 'serum' } as CosmeticProduct, matchScore: 90, matchReasons: [] },
        { product: { id: '2', name: 'B', brand: 'B', category: 'serum' } as CosmeticProduct, matchScore: 70, matchReasons: [] },
        { product: { id: '3', name: 'C', brand: 'B', category: 'serum' } as CosmeticProduct, matchScore: 50, matchReasons: [] },
      ];

      const filtered = result.current.filterByMatchRate(products, 75);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].matchScore).toBe(90);
    });
  });

  describe('에러 처리', () => {
    it('Supabase 에러 시에도 앱이 크래시하지 않는다', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: { id: 'user_123' },
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'));

      const useUserMatching = await loadHook();

      expect(() => {
        renderHook(() => useUserMatching());
      }).not.toThrow();

      consoleError.mockRestore();
    });
  });
});

describe('useStyleMatching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.order.mockReturnThis();
    mockSupabaseClient.limit.mockReturnThis();
  });

  const loadHook = async () => {
    const hookModule = await import('@/hooks/useUserMatching');
    return hookModule.useStyleMatching;
  };

  it('체형에 따른 추천 스타일을 반환한다', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'user_123' },
    });

    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: { skin_type: 'dry', concerns: [] },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { season: '봄 웜톤' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { body_type: '웨이브' },
        error: null,
      });

    const useStyleMatching = await loadHook();
    const { result } = renderHook(() => useStyleMatching());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.bodyType).toBe('웨이브');
    expect(result.current.recommendedStyles).toContain('하이웨스트');
    expect(result.current.recommendedStyles).toContain('A라인');
  });

  it('퍼스널컬러에 따른 추천 컬러를 반환한다', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'user_123' },
    });

    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: { skin_type: 'dry', concerns: [] },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { season: '봄 웜톤' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { body_type: '웨이브' },
        error: null,
      });

    const useStyleMatching = await loadHook();
    const { result } = renderHook(() => useStyleMatching());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.personalColor).toBe('봄 웜톤');
    expect(result.current.recommendedColors).toHaveLength(4);
    expect(result.current.recommendedColors[0]).toHaveProperty('name');
    expect(result.current.recommendedColors[0]).toHaveProperty('hex');
  });

  it('체형 데이터 없으면 빈 스타일 배열 반환', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'user_123' },
    });

    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

    const useStyleMatching = await loadHook();
    const { result } = renderHook(() => useStyleMatching());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendedStyles).toEqual([]);
    expect(result.current.recommendedColors).toEqual([]);
  });
});
