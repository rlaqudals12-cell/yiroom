/**
 * 사용자 설정 Repository 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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
  getPreferences,
  upsertPreferences,
  updateBudget,
  addFavoriteBrand,
  removeFavoriteBrand,
  addBlockedBrand,
  removeBlockedBrand,
  updateNotificationSettings,
} from '@/lib/smart-matching/preferences';

const NOW_ISO = '2026-01-15T10:00:00Z';

function createMockPreferencesDB(overrides = {}) {
  return {
    clerk_user_id: 'user-1',
    budget: { skincare: { min: 10000, max: 50000 } },
    favorite_brands: ['이니스프리', '설화수'],
    blocked_brands: [],
    preferred_platforms: ['coupang'],
    prioritize_free_delivery: true,
    prioritize_fast_delivery: false,
    prioritize_points: false,
    show_alternatives: true,
    show_price_comparison: true,
    notify_price_drop: true,
    notify_restock: true,
    notification_email: true,
    notification_push: true,
    notification_frequency: 'daily',
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
    ...overrides,
  };
}

describe('사용자 설정 Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('사용자 설정을 반환한다', async () => {
      const mockRow = createMockPreferencesDB();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      } as never);

      const result = await getPreferences('user-1');

      expect(result).not.toBeNull();
      expect(result!.favoriteBrands).toEqual(['이니스프리', '설화수']);
      expect(result!.notificationFrequency).toBe('daily');
      expect(result!.prioritizeFreeDelivery).toBe(true);
    });

    it('설정이 없으면 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as never);

      const result = await getPreferences('user-1');

      expect(result).toBeNull();
    });
  });

  describe('upsertPreferences', () => {
    it('설정을 upsert하고 결과를 반환한다', async () => {
      const mockRow = createMockPreferencesDB();
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as never);

      const result = await upsertPreferences('user-1', {
        favoriteBrands: ['이니스프리', '설화수'],
        notificationFrequency: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.favoriteBrands).toEqual(['이니스프리', '설화수']);
    });

    it('기본값이 적용된다', async () => {
      const mockRow = createMockPreferencesDB();
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as never);

      await upsertPreferences('user-1', {});

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clerk_user_id: 'user-1',
          budget: {},
          favorite_brands: [],
          blocked_brands: [],
          prioritize_free_delivery: true,
          prioritize_fast_delivery: false,
          show_alternatives: true,
          notification_frequency: 'daily',
        })
      );
    });

    it('에러 시 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Upsert failed') }),
          }),
        }),
      } as never);

      const result = await upsertPreferences('user-1', {});

      expect(result).toBeNull();
    });
  });

  describe('updateBudget', () => {
    it('예산 설정을 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const budget = { skincare: { min: 20000, max: 80000, preferred: 40000 } };
      const result = await updateBudget('user-1', budget);

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ budget });
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      } as never);

      const result = await updateBudget('user-1', {});

      expect(result).toBe(false);
    });
  });

  describe('addFavoriteBrand', () => {
    it('즐겨찾기 브랜드를 추가한다', async () => {
      // getPreferences 호출 (기존 목록 조회)
      const mockPrefs = createMockPreferencesDB({ favorite_brands: ['이니스프리'] });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockPrefs, error: null }),
              }),
            }),
          } as never;
        }
        return { update: mockUpdate } as never;
      });

      const result = await addFavoriteBrand('user-1', '설화수');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        favorite_brands: ['이니스프리', '설화수'],
      });
    });

    it('이미 추가된 브랜드는 중복 추가하지 않는다', async () => {
      const mockPrefs = createMockPreferencesDB({ favorite_brands: ['이니스프리'] });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPrefs, error: null }),
          }),
        }),
      } as never);

      const result = await addFavoriteBrand('user-1', '이니스프리');

      expect(result).toBe(true);
      // update가 호출되지 않음 (이미 존재)
    });

    it('기존 설정이 없을 때 빈 배열에서 시작한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          } as never;
        }
        return { update: mockUpdate } as never;
      });

      const result = await addFavoriteBrand('user-1', '라네즈');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        favorite_brands: ['라네즈'],
      });
    });

    it('DB 에러 시 false를 반환한다', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: createMockPreferencesDB({ favorite_brands: [] }),
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
          }),
        } as never;
      });

      const result = await addFavoriteBrand('user-1', '라네즈');

      expect(result).toBe(false);
    });
  });

  describe('removeFavoriteBrand', () => {
    it('즐겨찾기 브랜드를 제거한다', async () => {
      const mockPrefs = createMockPreferencesDB({
        favorite_brands: ['이니스프리', '설화수', '라네즈'],
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockPrefs, error: null }),
              }),
            }),
          } as never;
        }
        return { update: mockUpdate } as never;
      });

      const result = await removeFavoriteBrand('user-1', '설화수');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        favorite_brands: ['이니스프리', '라네즈'],
      });
    });

    it('에러 시 false를 반환한다', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: createMockPreferencesDB(),
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
          }),
        } as never;
      });

      const result = await removeFavoriteBrand('user-1', '이니스프리');

      expect(result).toBe(false);
    });
  });

  describe('addBlockedBrand', () => {
    it('차단 브랜드를 추가한다', async () => {
      const mockPrefs = createMockPreferencesDB({ blocked_brands: [] });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockPrefs, error: null }),
              }),
            }),
          } as never;
        }
        return { update: mockUpdate } as never;
      });

      const result = await addBlockedBrand('user-1', '브랜드X');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        blocked_brands: ['브랜드X'],
      });
    });

    it('이미 차단된 브랜드는 중복 추가하지 않는다', async () => {
      const mockPrefs = createMockPreferencesDB({ blocked_brands: ['브랜드X'] });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPrefs, error: null }),
          }),
        }),
      } as never);

      const result = await addBlockedBrand('user-1', '브랜드X');

      expect(result).toBe(true);
    });
  });

  describe('removeBlockedBrand', () => {
    it('차단 브랜드를 제거한다', async () => {
      const mockPrefs = createMockPreferencesDB({ blocked_brands: ['브랜드X', '브랜드Y'] });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockPrefs, error: null }),
              }),
            }),
          } as never;
        }
        return { update: mockUpdate } as never;
      });

      const result = await removeBlockedBrand('user-1', '브랜드X');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        blocked_brands: ['브랜드Y'],
      });
    });
  });

  describe('updateNotificationSettings', () => {
    it('알림 설정을 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const result = await updateNotificationSettings('user-1', {
        email: false,
        push: true,
        frequency: 'weekly',
        priceDrop: false,
        restock: true,
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        notification_email: false,
        notification_push: true,
        notification_frequency: 'weekly',
        notify_price_drop: false,
        notify_restock: true,
      });
    });

    it('일부 설정만 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      await updateNotificationSettings('user-1', { email: false });

      expect(mockUpdate).toHaveBeenCalledWith({
        notification_email: false,
      });
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      } as never);

      const result = await updateNotificationSettings('user-1', { email: true });

      expect(result).toBe(false);
    });
  });
});
