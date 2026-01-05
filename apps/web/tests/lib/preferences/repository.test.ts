/**
 * 사용자 선호/기피 Repository 테스트
 * @description preferences repository 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserPreferences,
  getPreferenceById,
  getAvoidedItemNames,
  getCriticalAvoids,
  getPreferenceSummary,
  addPreference,
  updatePreference,
  removePreference,
  preferenceExists,
  upsertPreferences,
} from '@/lib/preferences/repository';
import type { UserPreferenceRow } from '@/types/preferences';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockPreferenceRow: UserPreferenceRow = {
  id: 'pref-001',
  clerk_user_id: 'user_123',
  domain: 'nutrition',
  item_type: 'allergen',
  item_id: null,
  item_name: '땅콩',
  item_name_en: 'Peanuts',
  is_favorite: false,
  avoid_level: 'danger',
  avoid_reason: 'allergy',
  avoid_note: '아나필락시스 위험',
  priority: 5,
  source: 'user',
  created_at: '2026-01-05T00:00:00Z',
  updated_at: '2026-01-05T00:00:00Z',
};

const mockFavoriteRow: UserPreferenceRow = {
  ...mockPreferenceRow,
  id: 'pref-002',
  item_name: '닭가슴살',
  item_name_en: 'Chicken Breast',
  item_type: 'food',
  is_favorite: true,
  avoid_level: null,
  avoid_reason: null,
  avoid_note: null,
  priority: 3,
};

// =============================================================================
// 테스트
// =============================================================================

describe('Preferences Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getUserPreferences
  // ---------------------------------------------------------------------------

  describe('getUserPreferences', () => {
    it('사용자의 선호/기피 목록을 조회해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [mockPreferenceRow, mockFavoriteRow],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await getUserPreferences(mockSupabase, 'user_123');

      expect(result).toHaveLength(2);
      expect(result[0].itemName).toBe('땅콩');
      expect(result[0].avoidLevel).toBe('danger');
      expect(result[1].isFavorite).toBe(true);
    });

    it('도메인 필터를 적용할 수 있어야 함', async () => {
      // order().order() 결과가 eq() 메서드를 가지고, 최종적으로 Promise를 반환
      const finalResult = {
        data: [mockPreferenceRow],
        error: null,
      };

      const domainEq = vi.fn().mockResolvedValue(finalResult);

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  // 도메인 필터 적용 시 추가 eq 호출됨
                  eq: domainEq,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await getUserPreferences(mockSupabase, 'user_123', { domain: 'nutrition' });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_preferences');
      expect(domainEq).toHaveBeenCalledWith('domain', 'nutrition');
      expect(result).toHaveLength(1);
      expect(result[0].itemName).toBe('땅콩');
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await getUserPreferences(mockSupabase, 'user_123');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getPreferenceById
  // ---------------------------------------------------------------------------

  describe('getPreferenceById', () => {
    it('ID로 항목을 조회해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPreferenceRow,
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await getPreferenceById(mockSupabase, 'pref-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('pref-001');
      expect(result?.itemName).toBe('땅콩');
    });

    it('없는 ID는 null을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      } as any;

      const result = await getPreferenceById(mockSupabase, 'non-existent');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getAvoidedItemNames
  // ---------------------------------------------------------------------------

  describe('getAvoidedItemNames', () => {
    it('기피 항목 이름 목록을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ item_name: '땅콩' }, { item_name: '우유' }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await getAvoidedItemNames(mockSupabase, 'user_123', 'nutrition');

      expect(result).toEqual(['땅콩', '우유']);
    });
  });

  // ---------------------------------------------------------------------------
  // getCriticalAvoids
  // ---------------------------------------------------------------------------

  describe('getCriticalAvoids', () => {
    it('위험/불가 항목만 조회해야 함', async () => {
      const dangerRow = { ...mockPreferenceRow, avoid_level: 'danger' };
      const cannotRow = { ...mockPreferenceRow, id: 'pref-003', avoid_level: 'cannot' };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [dangerRow, cannotRow],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await getCriticalAvoids(mockSupabase, 'user_123');

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.avoidLevel === 'danger' || r.avoidLevel === 'cannot')).toBe(
        true
      );
    });
  });

  // ---------------------------------------------------------------------------
  // addPreference
  // ---------------------------------------------------------------------------

  describe('addPreference', () => {
    it('새 항목을 추가해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPreferenceRow,
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await addPreference(mockSupabase, {
        clerkUserId: 'user_123',
        domain: 'nutrition',
        itemType: 'allergen',
        itemName: '땅콩',
        itemNameEn: 'Peanuts',
        isFavorite: false,
        avoidLevel: 'danger',
        avoidReason: 'allergy',
      });

      expect(result).not.toBeNull();
      expect(result?.itemName).toBe('땅콩');
    });

    it('에러 시 null을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' },
              }),
            }),
          }),
        }),
      } as any;

      const result = await addPreference(mockSupabase, {
        clerkUserId: 'user_123',
        domain: 'nutrition',
        itemType: 'allergen',
        itemName: '땅콩',
        isFavorite: false,
      });

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // updatePreference
  // ---------------------------------------------------------------------------

  describe('updatePreference', () => {
    it('항목을 수정해야 함', async () => {
      const updatedRow = { ...mockPreferenceRow, avoid_level: 'cannot' };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedRow,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await updatePreference(mockSupabase, 'pref-001', {
        avoidLevel: 'cannot',
      });

      expect(result).not.toBeNull();
      expect(result?.avoidLevel).toBe('cannot');
    });
  });

  // ---------------------------------------------------------------------------
  // removePreference
  // ---------------------------------------------------------------------------

  describe('removePreference', () => {
    it('항목을 삭제해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      } as any;

      const result = await removePreference(mockSupabase, 'pref-001');
      expect(result).toBe(true);
    });

    it('에러 시 false를 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          }),
        }),
      } as any;

      const result = await removePreference(mockSupabase, 'pref-001');
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // preferenceExists
  // ---------------------------------------------------------------------------

  describe('preferenceExists', () => {
    it('존재하는 항목은 true를 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    count: 1,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await preferenceExists(
        mockSupabase,
        'user_123',
        'nutrition',
        'allergen',
        '땅콩'
      );
      expect(result).toBe(true);
    });

    it('존재하지 않는 항목은 false를 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await preferenceExists(
        mockSupabase,
        'user_123',
        'nutrition',
        'allergen',
        '없는음식'
      );
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getPreferenceSummary
  // ---------------------------------------------------------------------------

  describe('getPreferenceSummary', () => {
    it('도메인별 요약을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { domain: 'nutrition', is_favorite: true },
                { domain: 'nutrition', is_favorite: false },
                { domain: 'nutrition', is_favorite: false },
                { domain: 'workout', is_favorite: false },
              ],
              error: null,
            }),
          }),
        }),
      } as any;

      const result = await getPreferenceSummary(mockSupabase, 'user_123');

      expect(result.nutrition.favorites).toBe(1);
      expect(result.nutrition.avoids).toBe(2);
      expect(result.workout.avoids).toBe(1);
      expect(result.beauty.favorites).toBe(0);
    });
  });
});
