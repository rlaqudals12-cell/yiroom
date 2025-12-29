/**
 * 가격 모니터링 서비스 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';
import {
  getPriceWatches,
  getPriceWatchByProduct,
  createPriceWatch,
  updatePriceWatch,
  deletePriceWatch,
  markAsNotified,
  getPriceHistory,
  recordPrice,
  getLowestPrice,
  getPriceChangePercent,
} from '@/lib/smart-matching/price-watches';

describe('가격 모니터링 서비스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPriceWatches', () => {
    it('사용자의 가격 알림 목록을 반환한다', async () => {
      const mockWatches = [
        {
          id: 'watch-1',
          clerk_user_id: 'user-1',
          product_id: 'product-1',
          target_price: 45000,
          percent_drop: null,
          platforms: ['coupang'],
          notified: false,
          notified_at: null,
          current_lowest_price: 50000,
          lowest_platform: 'coupang',
          expires_at: null,
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockWatches, error: null }),
          }),
        }),
      } as never);

      const result = await getPriceWatches('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].targetPrice).toBe(45000);
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
          }),
        }),
      } as never);

      const result = await getPriceWatches('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getPriceWatchByProduct', () => {
    it('제품별 가격 알림을 반환한다', async () => {
      const mockWatch = {
        id: 'watch-1',
        clerk_user_id: 'user-1',
        product_id: 'product-1',
        target_price: 45000,
        percent_drop: null,
        platforms: ['coupang'],
        notified: false,
        notified_at: null,
        current_lowest_price: 50000,
        lowest_platform: 'coupang',
        expires_at: null,
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWatch, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getPriceWatchByProduct('user-1', 'product-1');

      expect(result).not.toBeNull();
      expect(result?.productId).toBe('product-1');
    });
  });

  describe('createPriceWatch', () => {
    it('가격 알림을 생성한다', async () => {
      const mockCreated = {
        id: 'watch-new',
        clerk_user_id: 'user-1',
        product_id: 'product-1',
        target_price: 40000,
        percent_drop: null,
        platforms: ['coupang', 'naver'],
        notified: false,
        notified_at: null,
        current_lowest_price: null,
        lowest_platform: null,
        expires_at: null,
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
          }),
        }),
      } as never);

      const result = await createPriceWatch({
        clerkUserId: 'user-1',
        productId: 'product-1',
        targetPrice: 40000,
        platforms: ['coupang', 'naver'],
      });

      expect(result).not.toBeNull();
      expect(result?.targetPrice).toBe(40000);
    });
  });

  describe('updatePriceWatch', () => {
    it('가격 알림을 업데이트한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);

      const result = await updatePriceWatch('watch-1', { targetPrice: 35000 });

      expect(result).toBe(true);
    });
  });

  describe('deletePriceWatch', () => {
    it('가격 알림을 삭제한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);

      const result = await deletePriceWatch('watch-1');

      expect(result).toBe(true);
    });
  });

  describe('markAsNotified', () => {
    it('알림 발송 완료 처리를 한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);

      const result = await markAsNotified('watch-1');

      expect(result).toBe(true);
    });
  });

  describe('getPriceHistory', () => {
    it('제품 가격 히스토리를 반환한다', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          product_id: 'product-1',
          platform: 'coupang',
          price: 45000,
          original_price: 50000,
          recorded_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
          }),
        }),
      } as never);

      const result = await getPriceHistory('product-1');

      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(45000);
    });
  });

  describe('recordPrice', () => {
    it('가격 히스토리를 기록한다', async () => {
      const mockRecord = {
        id: 'history-new',
        product_id: 'product-1',
        platform: 'coupang',
        price: 42000,
        original_price: 50000,
        recorded_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRecord, error: null }),
          }),
        }),
      } as never);

      const result = await recordPrice({
        productId: 'product-1',
        platform: 'coupang',
        price: 42000,
        originalPrice: 50000,
      });

      expect(result).not.toBeNull();
      expect(result?.price).toBe(42000);
    });
  });

  describe('getLowestPrice', () => {
    it('역대 최저가를 반환한다', async () => {
      const mockLowest = {
        id: 'history-lowest',
        product_id: 'product-1',
        platform: 'naver',
        price: 38000,
        original_price: 50000,
        recorded_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLowest, error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await getLowestPrice('product-1');

      expect(result).not.toBeNull();
      expect(result?.price).toBe(38000);
      expect(result?.platform).toBe('naver');
    });
  });

  describe('getPriceChangePercent', () => {
    it('가격 변동률을 계산한다', async () => {
      const mockHistory = [
        { id: 'h1', product_id: 'p1', platform: 'coupang', price: 45000, original_price: null, recorded_at: new Date().toISOString() },
        { id: 'h2', product_id: 'p1', platform: 'coupang', price: 48000, original_price: null, recorded_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'h3', product_id: 'p1', platform: 'coupang', price: 50000, original_price: null, recorded_at: new Date(Date.now() - 172800000).toISOString() },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await getPriceChangePercent('product-1', 7);

      // (45000 - 50000) / 50000 * 100 = -10%
      expect(result).toBe(-10);
    });

    it('히스토리가 2개 미만이면 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await getPriceChangePercent('product-1', 7);

      expect(result).toBeNull();
    });
  });
});
