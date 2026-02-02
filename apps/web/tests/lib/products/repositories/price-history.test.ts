/**
 * 가격 히스토리 Repository 테스트
 * @description price-history.ts의 가격 기록 및 조회 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recordPriceHistory,
  getPriceHistory,
  getLowestPrice,
  getPriceDropProducts,
} from '@/lib/products/repositories/price-history';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockPriceHistoryRow = {
  id: 'history-001',
  product_type: 'cosmetic',
  product_id: 'cosmetic-001',
  price_krw: 25000,
  source: 'coupang',
  recorded_at: '2026-01-15T00:00:00Z',
};

const mockPriceHistoryRow2 = {
  id: 'history-002',
  product_type: 'cosmetic',
  product_id: 'cosmetic-001',
  price_krw: 28000,
  source: 'coupang',
  recorded_at: '2026-01-14T00:00:00Z',
};

// =============================================================================
// Supabase 클라이언트 Mock
// =============================================================================

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

vi.mock('@/lib/utils/logger', () => ({
  productLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// =============================================================================
// 테스트
// =============================================================================

describe('Price History Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // recordPriceHistory
  // ---------------------------------------------------------------------------

  describe('recordPriceHistory', () => {
    it('가격 히스토리를 기록해야 함', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      const mockServiceClientInstance = {
        from: vi.fn().mockReturnValue(mockChain),
      };

      vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClientInstance as any);

      const result = await recordPriceHistory('cosmetic', 'cosmetic-001', 25000, 'coupang');

      expect(result).toBe(true);
      expect(mockServiceClientInstance.from).toHaveBeenCalledWith('product_price_history');
      expect(mockChain.insert).toHaveBeenCalledWith({
        product_type: 'cosmetic',
        product_id: 'cosmetic-001',
        price_krw: 25000,
        source: 'coupang',
      });
    });

    it('source가 없으면 null로 기록해야 함', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      const mockServiceClientInstance = {
        from: vi.fn().mockReturnValue(mockChain),
      };

      vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClientInstance as any);

      await recordPriceHistory('supplement', 'supplement-001', 35000);

      expect(mockChain.insert).toHaveBeenCalledWith({
        product_type: 'supplement',
        product_id: 'supplement-001',
        price_krw: 35000,
        source: null,
      });
    });

    it('에러 시 false를 반환해야 함', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      };

      const mockServiceClientInstance = {
        from: vi.fn().mockReturnValue(mockChain),
      };

      vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClientInstance as any);

      const result = await recordPriceHistory('cosmetic', 'cosmetic-001', 25000);

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getPriceHistory
  // ---------------------------------------------------------------------------

  describe('getPriceHistory', () => {
    it('제품의 가격 히스토리를 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockPriceHistoryRow, mockPriceHistoryRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceHistory('cosmetic', 'cosmetic-001');

      expect(result).toHaveLength(2);
      expect(result[0].productType).toBe('cosmetic');
      expect(result[0].productId).toBe('cosmetic-001');
      expect(result[0].priceKrw).toBe(25000);
      expect(result[0].source).toBe('coupang');
    });

    it('product_type과 product_id로 필터해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getPriceHistory('supplement', 'supplement-001');

      expect(mockChain.eq).toHaveBeenCalledWith('product_type', 'supplement');
      expect(mockChain.eq).toHaveBeenCalledWith('product_id', 'supplement-001');
    });

    it('기록일 기준 내림차순 정렬해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getPriceHistory('cosmetic', 'cosmetic-001');

      expect(mockChain.order).toHaveBeenCalledWith('recorded_at', { ascending: false });
    });

    it('limit 파라미터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getPriceHistory('cosmetic', 'cosmetic-001', 50);

      expect(mockChain.limit).toHaveBeenCalledWith(50);
    });

    it('기본 limit (30)을 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getPriceHistory('cosmetic', 'cosmetic-001');

      expect(mockChain.limit).toHaveBeenCalledWith(30);
    });

    it('source가 null이면 undefined로 변환해야 함', async () => {
      const rowWithNullSource = {
        ...mockPriceHistoryRow,
        source: null,
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [rowWithNullSource],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceHistory('cosmetic', 'cosmetic-001');

      expect(result[0].source).toBeUndefined();
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceHistory('cosmetic', 'cosmetic-001');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getLowestPrice
  // ---------------------------------------------------------------------------

  describe('getLowestPrice', () => {
    it('특정 기간 내 최저가를 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { price_krw: 22000 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getLowestPrice('cosmetic', 'cosmetic-001', 30);

      expect(result).toBe(22000);
    });

    it('product_type과 product_id로 필터해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { price_krw: 22000 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getLowestPrice('supplement', 'supplement-001');

      expect(mockChain.eq).toHaveBeenCalledWith('product_type', 'supplement');
      expect(mockChain.eq).toHaveBeenCalledWith('product_id', 'supplement-001');
    });

    it('기간 필터 (gte recorded_at)를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { price_krw: 22000 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getLowestPrice('cosmetic', 'cosmetic-001', 7);

      expect(mockChain.gte).toHaveBeenCalledWith('recorded_at', expect.any(String));
    });

    it('가격 오름차순 정렬 후 1개만 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { price_krw: 22000 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getLowestPrice('cosmetic', 'cosmetic-001');

      expect(mockChain.order).toHaveBeenCalledWith('price_krw', { ascending: true });
      expect(mockChain.limit).toHaveBeenCalledWith(1);
    });

    it('데이터가 없으면 null을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No data' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getLowestPrice('cosmetic', 'cosmetic-001');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getPriceDropProducts
  // ---------------------------------------------------------------------------

  describe('getPriceDropProducts', () => {
    it('가격이 하락한 제품 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            // 제품 1: 28000 → 25000 (10.7% 하락)
            { product_id: 'cosmetic-001', price_krw: 25000, recorded_at: '2026-01-15' },
            { product_id: 'cosmetic-001', price_krw: 28000, recorded_at: '2026-01-14' },
            // 제품 2: 가격 변동 없음
            { product_id: 'cosmetic-002', price_krw: 30000, recorded_at: '2026-01-15' },
            { product_id: 'cosmetic-002', price_krw: 30000, recorded_at: '2026-01-14' },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceDropProducts('cosmetic', 10);

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('cosmetic-001');
      expect(result[0].previousPrice).toBe(28000);
      expect(result[0].currentPrice).toBe(25000);
      expect(result[0].dropPercent).toBeCloseTo(10.7, 1);
    });

    it('하락률 기준을 충족하지 않는 제품은 제외해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            // 5% 하락 (기준 10% 미달)
            { product_id: 'cosmetic-001', price_krw: 28500, recorded_at: '2026-01-15' },
            { product_id: 'cosmetic-001', price_krw: 30000, recorded_at: '2026-01-14' },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceDropProducts('cosmetic', 10);

      expect(result).toHaveLength(0);
    });

    it('하락률 기준 내림차순 정렬해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            // 제품 1: 10% 하락
            { product_id: 'cosmetic-001', price_krw: 27000, recorded_at: '2026-01-15' },
            { product_id: 'cosmetic-001', price_krw: 30000, recorded_at: '2026-01-14' },
            // 제품 2: 20% 하락
            { product_id: 'cosmetic-002', price_krw: 24000, recorded_at: '2026-01-15' },
            { product_id: 'cosmetic-002', price_krw: 30000, recorded_at: '2026-01-14' },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceDropProducts('cosmetic', 10);

      expect(result).toHaveLength(2);
      expect(result[0].dropPercent).toBe(20);
      expect(result[1].dropPercent).toBe(10);
    });

    it('기록이 2개 미만인 제품은 제외해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            // 기록이 1개뿐
            { product_id: 'cosmetic-001', price_krw: 25000, recorded_at: '2026-01-15' },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceDropProducts('cosmetic', 10);

      expect(result).toHaveLength(0);
    });

    it('가격이 상승한 제품은 제외해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            // 가격 상승 (25000 → 28000)
            { product_id: 'cosmetic-001', price_krw: 28000, recorded_at: '2026-01-15' },
            { product_id: 'cosmetic-001', price_krw: 25000, recorded_at: '2026-01-14' },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceDropProducts('cosmetic', 10);

      expect(result).toHaveLength(0);
    });

    it('기본 하락률 기준 (10%)을 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            // 9% 하락 (기본 기준 10% 미달)
            { product_id: 'cosmetic-001', price_krw: 27300, recorded_at: '2026-01-15' },
            { product_id: 'cosmetic-001', price_krw: 30000, recorded_at: '2026-01-14' },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceDropProducts('cosmetic');

      expect(result).toHaveLength(0);
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getPriceDropProducts('cosmetic', 10);

      expect(result).toEqual([]);
    });
  });
});
