/**
 * 사이즈 기록 Repository 테스트
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
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  smartMatchingLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';
import {
  getSizeHistory,
  getSizeHistoryByBrand,
  getSizeHistoryByCategory,
  addSizeHistory,
  updateSizeFit,
  deleteSizeHistory,
  getLatestSizeByBrand,
  getPerfectFitHistory,
} from '@/lib/smart-matching/size-history';

const NOW_ISO = '2026-01-15T10:00:00Z';

function createMockSizeHistoryDB(overrides = {}) {
  return {
    id: 'sh-1',
    clerk_user_id: 'user-1',
    brand_id: 'brand-1',
    brand_name: '나이키',
    category: 'shoes',
    size: '270',
    fit: 'perfect',
    product_id: 'prod-1',
    purchase_date: '2026-01-10',
    created_at: NOW_ISO,
    ...overrides,
  };
}

describe('사이즈 기록 Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSizeHistory', () => {
    it('사용자의 전체 사이즈 기록을 반환한다', async () => {
      const mockRows = [
        createMockSizeHistoryDB(),
        createMockSizeHistoryDB({ id: 'sh-2', brand_name: '아디다스', size: '275' }),
      ];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
          }),
        }),
      } as never);

      const result = await getSizeHistory('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].brandName).toBe('나이키');
      expect(result[0].size).toBe('270');
      expect(result[0].fit).toBe('perfect');
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
          }),
        }),
      } as never);

      const result = await getSizeHistory('user-1');

      expect(result).toEqual([]);
    });

    it('기록이 없으면 빈 배열을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never);

      const result = await getSizeHistory('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getSizeHistoryByBrand', () => {
    it('브랜드별 사이즈 기록을 반환한다', async () => {
      const mockRows = [createMockSizeHistoryDB()];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getSizeHistoryByBrand('user-1', 'brand-1');

      expect(result).toHaveLength(1);
      expect(result[0].brandId).toBe('brand-1');
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
            }),
          }),
        }),
      } as never);

      const result = await getSizeHistoryByBrand('user-1', 'brand-1');

      expect(result).toEqual([]);
    });
  });

  describe('getSizeHistoryByCategory', () => {
    it('카테고리별 사이즈 기록을 반환한다', async () => {
      const mockRows = [createMockSizeHistoryDB({ category: 'top', size: 'L' })];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getSizeHistoryByCategory('user-1', 'top');

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('top');
      expect(result[0].size).toBe('L');
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
            }),
          }),
        }),
      } as never);

      const result = await getSizeHistoryByCategory('user-1', 'top');

      expect(result).toEqual([]);
    });
  });

  describe('addSizeHistory', () => {
    it('사이즈 기록을 추가하고 결과를 반환한다', async () => {
      const mockRow = createMockSizeHistoryDB();
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as never);

      const result = await addSizeHistory({
        clerkUserId: 'user-1',
        brandId: 'brand-1',
        brandName: '나이키',
        category: 'shoes',
        size: '270',
        fit: 'perfect',
        productId: 'prod-1',
        purchaseDate: new Date('2026-01-10'),
      });

      expect(result).not.toBeNull();
      expect(result!.brandName).toBe('나이키');
      expect(result!.size).toBe('270');
    });

    it('purchaseDate를 ISO 문자열 날짜 부분으로 변환한다', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockSizeHistoryDB(),
            error: null,
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as never);

      await addSizeHistory({
        clerkUserId: 'user-1',
        brandId: 'brand-1',
        brandName: '나이키',
        category: 'shoes',
        size: '270',
        purchaseDate: new Date('2026-03-15T12:30:00Z'),
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          purchase_date: '2026-03-15',
        })
      );
    });

    it('선택적 필드 없이 최소 데이터로 생성한다', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockSizeHistoryDB({ fit: null, product_id: null, purchase_date: null }),
            error: null,
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as never);

      await addSizeHistory({
        clerkUserId: 'user-1',
        brandId: 'brand-1',
        brandName: '나이키',
        category: 'shoes',
        size: '270',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          fit: null,
          product_id: null,
          purchase_date: null,
        })
      );
    });

    it('에러 시 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      } as never);

      const result = await addSizeHistory({
        clerkUserId: 'user-1',
        brandId: 'brand-1',
        brandName: '나이키',
        category: 'shoes',
        size: '270',
      });

      expect(result).toBeNull();
    });
  });

  describe('updateSizeFit', () => {
    it('사이즈 핏을 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const result = await updateSizeFit('sh-1', 'small');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ fit: 'small' });
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      } as never);

      const result = await updateSizeFit('sh-1', 'large');

      expect(result).toBe(false);
    });
  });

  describe('deleteSizeHistory', () => {
    it('사이즈 기록을 삭제한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);

      const result = await deleteSizeHistory('sh-1');

      expect(result).toBe(true);
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        }),
      } as never);

      const result = await deleteSizeHistory('sh-1');

      expect(result).toBe(false);
    });
  });

  describe('getLatestSizeByBrand', () => {
    it('브랜드별 최신 사이즈를 반환한다', async () => {
      const mockRow = createMockSizeHistoryDB();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await getLatestSizeByBrand('user-1', 'brand-1', 'shoes');

      expect(result).not.toBeNull();
      expect(result!.brandId).toBe('brand-1');
      expect(result!.size).toBe('270');
    });

    it('기록이 없으면 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as never);

      const result = await getLatestSizeByBrand('user-1', 'brand-1', 'shoes');

      expect(result).toBeNull();
    });
  });

  describe('getPerfectFitHistory', () => {
    it('핏이 좋았던 기록을 반환한다', async () => {
      const mockRows = [
        createMockSizeHistoryDB({ fit: 'perfect' }),
        createMockSizeHistoryDB({ id: 'sh-2', fit: 'perfect', brand_name: '아디다스' }),
      ];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getPerfectFitHistory('user-1');

      expect(result).toHaveLength(2);
    });

    it('카테고리 필터를 적용한다', async () => {
      const mockRows = [createMockSizeHistoryDB({ category: 'top', fit: 'perfect' })];
      const mockEq3 = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: mockEq3,
            }),
          }),
        }),
      } as never);

      const result = await getPerfectFitHistory('user-1', 'top');

      expect(result).toHaveLength(1);
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
            }),
          }),
        }),
      } as never);

      const result = await getPerfectFitHistory('user-1');

      expect(result).toEqual([]);
    });

    it('purchaseDate가 null인 기록을 올바르게 매핑한다', async () => {
      const mockRows = [createMockSizeHistoryDB({ purchase_date: null, fit: 'perfect' })];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getPerfectFitHistory('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].purchaseDate).toBeUndefined();
    });
  });
});
