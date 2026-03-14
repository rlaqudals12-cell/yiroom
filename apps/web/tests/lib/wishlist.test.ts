/**
 * 위시리스트 CRUD 테스트
 *
 * @module tests/lib/wishlist
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase thenable chain mock
// 모든 메서드가 자기 자신을 반환하며, then()으로 최종 결과를 제공
const { mockSupabaseClient, setResult } = vi.hoisted(() => {
  // 최종 resolve 값
  let resolveValue: Record<string, unknown> = { data: null, error: null };

  const client: Record<string, any> = {};

  const chainMethods = ['from', 'select', 'insert', 'delete', 'eq', 'order', 'maybeSingle'];

  for (const method of chainMethods) {
    client[method] = vi.fn(() => client);
  }

  // thenable 인터페이스 — await 시 resolveValue를 반환
  client.then = (onFulfill: (v: unknown) => unknown) => {
    return Promise.resolve(resolveValue).then(onFulfill);
  };

  const setResult = (value: Record<string, unknown>): void => {
    resolveValue = value;
  };

  const resetChains = (): void => {
    for (const method of chainMethods) {
      client[method] = vi.fn(() => client);
    }
  };

  return { mockSupabaseClient: client, setResult, resetChains };
});

vi.mock('@/lib/utils/logger', () => ({
  wishlistLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  checkWishlistStatus,
  getUserWishlist,
  checkWishlistStatusBulk,
  getWishlistCount,
} from '@/lib/wishlist';

// ============================================================================
// 테스트 데이터
// ============================================================================

const TEST_USER_ID = 'user_123';
const TEST_PRODUCT_TYPE = 'cosmetic' as const;
const TEST_PRODUCT_ID = 'product_456';

// ============================================================================
// 테스트
// ============================================================================

describe('wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 체인 재설정
    const chainMethods = ['from', 'select', 'insert', 'delete', 'eq', 'order', 'maybeSingle'];
    for (const method of chainMethods) {
      mockSupabaseClient[method] = vi.fn(() => mockSupabaseClient);
    }
    // 기본 결과
    setResult({ data: null, error: null });
  });

  // ========================================================================
  // addToWishlist
  // ========================================================================

  describe('addToWishlist', () => {
    it('위시리스트에 제품을 추가한다', async () => {
      setResult({ error: null });

      const result = await addToWishlist(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result).toEqual({ success: true });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_wishlists');
    });

    it('중복 추가(23505)는 성공으로 처리한다', async () => {
      setResult({ error: { code: '23505', message: 'duplicate key' } });

      const result = await addToWishlist(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result).toEqual({ success: true });
    });

    it('기타 에러는 실패를 반환한다', async () => {
      setResult({ error: { code: '42P01', message: 'table not found' } });

      const result = await addToWishlist(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('table not found');
    });
  });

  // ========================================================================
  // removeFromWishlist
  // ========================================================================

  describe('removeFromWishlist', () => {
    it('위시리스트에서 제품을 제거한다', async () => {
      setResult({ error: null });

      const result = await removeFromWishlist(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result).toEqual({ success: true });
    });

    it('제거 에러 시 실패를 반환한다', async () => {
      setResult({ error: { message: 'delete failed' } });

      const result = await removeFromWishlist(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('delete failed');
    });
  });

  // ========================================================================
  // checkWishlistStatus
  // ========================================================================

  describe('checkWishlistStatus', () => {
    it('위시리스트에 있는 제품은 true를 반환한다', async () => {
      setResult({ data: { id: 'item_1' }, error: null });

      const result = await checkWishlistStatus(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result).toBe(true);
    });

    it('위시리스트에 없는 제품은 false를 반환한다', async () => {
      setResult({ data: null, error: null });

      const result = await checkWishlistStatus(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result).toBe(false);
    });

    it('에러 시 false를 반환한다', async () => {
      setResult({ data: null, error: { message: 'error' } });

      const result = await checkWishlistStatus(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // toggleWishlist
  // ========================================================================

  describe('toggleWishlist', () => {
    it('위시리스트에 없으면 추가하고 isWishlisted=true를 반환한다', async () => {
      // checkWishlistStatus -> data: null -> 없음 -> addToWishlist
      setResult({ data: null, error: null });

      const result = await toggleWishlist(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result.isWishlisted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('위시리스트에 있으면 제거하고 isWishlisted=false를 반환한다', async () => {
      // checkWishlistStatus -> data: exists -> 있음 -> removeFromWishlist
      setResult({ data: { id: 'item_1' }, error: null });

      const result = await toggleWishlist(
        mockSupabaseClient as never,
        TEST_USER_ID,
        TEST_PRODUCT_TYPE,
        TEST_PRODUCT_ID
      );

      expect(result.isWishlisted).toBe(false);
      expect(result.success).toBe(true);
    });
  });

  // ========================================================================
  // getUserWishlist
  // ========================================================================

  describe('getUserWishlist', () => {
    it('사용자 위시리스트를 변환하여 반환한다', async () => {
      const mockRows = [
        {
          id: 'w1',
          clerk_user_id: TEST_USER_ID,
          product_type: 'cosmetic',
          product_id: 'p1',
          created_at: '2026-01-01',
        },
      ];
      setResult({ data: mockRows, error: null });

      const result = await getUserWishlist(mockSupabaseClient as never, TEST_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'w1',
        clerkUserId: TEST_USER_ID,
        productType: 'cosmetic',
        productId: 'p1',
        createdAt: '2026-01-01',
      });
    });

    it('productType 필터를 적용한다', async () => {
      setResult({ data: [], error: null });

      await getUserWishlist(mockSupabaseClient as never, TEST_USER_ID, 'cosmetic');

      // eq가 product_type 필터로도 호출됨
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('product_type', 'cosmetic');
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      setResult({ data: null, error: { message: 'error' } });

      const result = await getUserWishlist(mockSupabaseClient as never, TEST_USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // checkWishlistStatusBulk
  // ========================================================================

  describe('checkWishlistStatusBulk', () => {
    it('빈 제품 목록에 빈 Map을 반환한다', async () => {
      const result = await checkWishlistStatusBulk(mockSupabaseClient as never, TEST_USER_ID, []);

      expect(result.size).toBe(0);
    });

    it('여러 제품의 위시리스트 상태를 확인한다', async () => {
      setResult({
        data: [{ product_type: 'cosmetic', product_id: 'p1' }],
        error: null,
      });

      const products = [
        { productType: 'cosmetic' as const, productId: 'p1' },
        { productType: 'cosmetic' as const, productId: 'p2' },
      ];

      const result = await checkWishlistStatusBulk(
        mockSupabaseClient as never,
        TEST_USER_ID,
        products
      );

      expect(result.get('cosmetic:p1')).toBe(true);
      expect(result.get('cosmetic:p2')).toBe(false);
    });

    it('에러 시 빈 Map을 반환한다', async () => {
      setResult({ data: null, error: { message: 'error' } });

      const products = [{ productType: 'cosmetic' as const, productId: 'p1' }];

      const result = await checkWishlistStatusBulk(
        mockSupabaseClient as never,
        TEST_USER_ID,
        products
      );

      expect(result.size).toBe(0);
    });
  });

  // ========================================================================
  // getWishlistCount
  // ========================================================================

  describe('getWishlistCount', () => {
    it('위시리스트 개수를 반환한다', async () => {
      setResult({ count: 5, error: null });

      const result = await getWishlistCount(mockSupabaseClient as never, TEST_USER_ID);

      expect(result).toBe(5);
    });

    it('count가 null이면 0을 반환한다', async () => {
      setResult({ count: null, error: null });

      const result = await getWishlistCount(mockSupabaseClient as never, TEST_USER_ID);

      expect(result).toBe(0);
    });

    it('에러 시 0을 반환한다', async () => {
      setResult({ count: null, error: { message: 'error' } });

      const result = await getWishlistCount(mockSupabaseClient as never, TEST_USER_ID);

      expect(result).toBe(0);
    });
  });
});
