import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllergies, getDislikedFoods, getInjuries } from '@/lib/preferences/helpers';
import type { UserPreference } from '@/types/preferences';
import type { AllergyType } from '@/types/nutrition';

// Mock Supabase repository functions
vi.mock('@/lib/preferences/repository', () => ({
  getCriticalAvoids: vi.fn(),
  getAvoidedItemNames: vi.fn(),
}));

import { getCriticalAvoids, getAvoidedItemNames } from '@/lib/preferences/repository';

describe('Preferences Helpers', () => {
  const mockUserId = 'user_test123';
  const mockSupabase = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllergies', () => {
    it('user_preferences에서 알레르기 조회 성공', async () => {
      const mockPreferences: UserPreference[] = [
        {
          id: '1',
          clerkUserId: mockUserId,
          domain: 'nutrition',
          itemType: 'food_category',
          itemName: '유제품',
          itemNameEn: 'dairy',
          isFavorite: false,
          avoidLevel: 'cannot',
          avoidReason: 'allergy',
          priority: 5,
          source: 'user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(getCriticalAvoids).mockResolvedValue(mockPreferences);

      const result = await getAllergies(mockSupabase, mockUserId, []);

      expect(result).toEqual(['dairy']);
      expect(getCriticalAvoids).toHaveBeenCalledWith(mockSupabase, mockUserId, 'nutrition');
    });

    it('데이터 없으면 fallback 사용', async () => {
      vi.mocked(getCriticalAvoids).mockResolvedValue([]);

      const fallback = ['nuts', 'seafood'] as AllergyType[];
      const result = await getAllergies(mockSupabase, mockUserId, fallback);

      expect(result).toEqual(fallback);
    });

    it('에러 발생 시 fallback 반환', async () => {
      vi.mocked(getCriticalAvoids).mockRejectedValue(new Error('DB error'));

      const fallback = ['gluten'] as AllergyType[];
      const result = await getAllergies(mockSupabase, mockUserId, fallback);

      expect(result).toEqual(fallback);
    });
  });

  describe('getDislikedFoods', () => {
    it('user_preferences에서 기피 음식 조회 성공', async () => {
      vi.mocked(getAvoidedItemNames).mockResolvedValue(['브로콜리', '당근']);

      const result = await getDislikedFoods(mockSupabase, mockUserId);

      expect(result).toEqual(['브로콜리', '당근']);
      expect(getAvoidedItemNames).toHaveBeenCalledWith(mockSupabase, mockUserId, 'nutrition');
    });

    it('데이터 없으면 빈 배열 반환', async () => {
      vi.mocked(getAvoidedItemNames).mockResolvedValue([]);

      const result = await getDislikedFoods(mockSupabase, mockUserId);

      expect(result).toEqual([]);
    });

    it('에러 발생 시 fallback 반환', async () => {
      vi.mocked(getAvoidedItemNames).mockRejectedValue(new Error('Network error'));

      const fallback = ['양파'];
      const result = await getDislikedFoods(mockSupabase, mockUserId, fallback);

      expect(result).toEqual(fallback);
    });
  });

  describe('getInjuries', () => {
    it('user_preferences에서 부상 부위 조회 성공', async () => {
      vi.mocked(getAvoidedItemNames).mockResolvedValue(['knee', 'back']);

      const result = await getInjuries(mockSupabase, mockUserId);

      expect(result).toEqual(['knee', 'back']);
      expect(getAvoidedItemNames).toHaveBeenCalledWith(mockSupabase, mockUserId, 'workout');
    });

    it('데이터 없으면 fallback 사용 (none 제외)', async () => {
      vi.mocked(getAvoidedItemNames).mockResolvedValue([]);

      const fallback = ['shoulder', 'none'];
      const result = await getInjuries(mockSupabase, mockUserId, fallback);

      expect(result).toEqual(['shoulder']); // 'none' 필터링됨
    });

    it('에러 발생 시 fallback 반환 (none 제외)', async () => {
      vi.mocked(getAvoidedItemNames).mockRejectedValue(new Error('Timeout'));

      const fallback = ['wrist', 'none', 'ankle'];
      const result = await getInjuries(mockSupabase, mockUserId, fallback);

      expect(result).toEqual(['wrist', 'ankle']); // 'none' 필터링됨
    });

    it('빈 fallback이면 빈 배열 반환', async () => {
      vi.mocked(getAvoidedItemNames).mockResolvedValue([]);

      const result = await getInjuries(mockSupabase, mockUserId, []);

      expect(result).toEqual([]);
    });
  });
});
