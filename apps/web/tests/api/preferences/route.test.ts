/**
 * 사용자 선호/기피 API 테스트
 * @description GET, POST, PATCH, DELETE, Summary 엔드포인트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import * as preferencesLib from '@/lib/preferences';
import type { UserPreference, PreferenceDomain, AvoidLevel } from '@/types/preferences';

// Mock 모듈
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/preferences');

// 테스트 데이터
const mockUserId = 'test-user-123';
const mockPreferenceId = 'pref-123';

const mockPreference: UserPreference = {
  id: mockPreferenceId,
  clerkUserId: mockUserId,
  domain: 'nutrition',
  itemType: 'allergen',
  itemId: 'allergen-1',
  itemName: '우유',
  itemNameEn: 'Milk',
  isFavorite: false,
  avoidLevel: 'cannot',
  avoidReason: 'allergy',
  avoidNote: '락토스 불내증',
  priority: 5,
  source: 'user',
  createdAt: '2026-01-05T10:00:00Z',
  updatedAt: '2026-01-05T10:00:00Z',
};

const mockPreference2: UserPreference = {
  id: 'pref-456',
  clerkUserId: mockUserId,
  domain: 'workout',
  itemType: 'exercise',
  itemId: 'exercise-1',
  itemName: '스쿼트',
  itemNameEn: 'Squat',
  isFavorite: false,
  avoidLevel: 'avoid',
  avoidReason: 'injury',
  avoidNote: '무릎 부상',
  priority: 4,
  source: 'user',
  createdAt: '2026-01-05T10:00:00Z',
  updatedAt: '2026-01-05T10:00:00Z',
};

const mockFavoritePreference: UserPreference = {
  id: 'pref-789',
  clerkUserId: mockUserId,
  domain: 'nutrition',
  itemType: 'food',
  itemId: 'food-1',
  itemName: '고등어',
  itemNameEn: 'Mackerel',
  isFavorite: true,
  priority: 3,
  source: 'user',
  createdAt: '2026-01-05T10:00:00Z',
  updatedAt: '2026-01-05T10:00:00Z',
};

describe('Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/preferences', () => {
    it('should return user preferences when authenticated', async () => {
      const mockGetUserPreferences = vi.mocked(preferencesLib.getUserPreferences);
      mockGetUserPreferences.mockResolvedValue([mockPreference, mockFavoritePreference]);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { GET } = await import('@/app/api/preferences/route');

      const response = await GET(new Request('http://localhost/api/preferences'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockPreference, mockFavoritePreference]);
      expect(data.count).toBe(2);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const { GET } = await import('@/app/api/preferences/route');

      const response = await GET(new Request('http://localhost/api/preferences'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should filter preferences by domain', async () => {
      const mockGetUserPreferences = vi.mocked(preferencesLib.getUserPreferences);
      mockGetUserPreferences.mockResolvedValue([mockPreference]);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { GET } = await import('@/app/api/preferences/route');

      const response = await GET(new Request('http://localhost/api/preferences?domain=nutrition'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([mockPreference]);
      expect(mockGetUserPreferences).toHaveBeenCalledWith(
        {},
        mockUserId,
        expect.objectContaining({ domain: 'nutrition' })
      );
    });

    it('should filter preferences by isFavorite', async () => {
      const mockGetUserPreferences = vi.mocked(preferencesLib.getUserPreferences);
      mockGetUserPreferences.mockResolvedValue([mockFavoritePreference]);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { GET } = await import('@/app/api/preferences/route');

      const response = await GET(new Request('http://localhost/api/preferences?isFavorite=true'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([mockFavoritePreference]);
      expect(mockGetUserPreferences).toHaveBeenCalledWith(
        {},
        mockUserId,
        expect.objectContaining({ isFavorite: true })
      );
    });

    it('should handle empty preferences list', async () => {
      const mockGetUserPreferences = vi.mocked(preferencesLib.getUserPreferences);
      mockGetUserPreferences.mockResolvedValue([]);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { GET } = await import('@/app/api/preferences/route');

      const response = await GET(new Request('http://localhost/api/preferences'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('POST /api/preferences', () => {
    it('should add a new preference', async () => {
      const mockAddPreference = vi.mocked(preferencesLib.addPreference);
      mockAddPreference.mockResolvedValue(mockPreference);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { POST } = await import('@/app/api/preferences/route');

      const requestBody = {
        domain: 'nutrition' as PreferenceDomain,
        itemType: 'allergen',
        itemName: '우유',
        itemNameEn: 'Milk',
        isFavorite: false,
        avoidLevel: 'cannot' as AvoidLevel,
        avoidReason: 'allergy',
      };

      const response = await POST(
        new Request('http://localhost/api/preferences', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPreference);
    });

    it('should add a favorite preference', async () => {
      const mockAddPreference = vi.mocked(preferencesLib.addPreference);
      mockAddPreference.mockResolvedValue(mockFavoritePreference);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { POST } = await import('@/app/api/preferences/route');

      const requestBody = {
        domain: 'nutrition' as PreferenceDomain,
        itemType: 'food',
        itemName: '고등어',
        isFavorite: true,
      };

      const response = await POST(
        new Request('http://localhost/api/preferences', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.isFavorite).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const { POST } = await import('@/app/api/preferences/route');

      const response = await POST(
        new Request('http://localhost/api/preferences', {
          method: 'POST',
          body: JSON.stringify({
            domain: 'nutrition',
            itemType: 'allergen',
            itemName: '우유',
            isFavorite: false,
          }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { POST } = await import('@/app/api/preferences/route');

      const response = await POST(
        new Request('http://localhost/api/preferences', {
          method: 'POST',
          body: JSON.stringify({ domain: 'nutrition' }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 if isFavorite is not boolean', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { POST } = await import('@/app/api/preferences/route');

      const response = await POST(
        new Request('http://localhost/api/preferences', {
          method: 'POST',
          body: JSON.stringify({
            domain: 'nutrition',
            itemType: 'allergen',
            itemName: '우유',
            isFavorite: 'yes',
          }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('isFavorite must be a boolean');
    });

    it('should return 400 if avoidLevel is missing for non-favorite items', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { POST } = await import('@/app/api/preferences/route');

      const response = await POST(
        new Request('http://localhost/api/preferences', {
          method: 'POST',
          body: JSON.stringify({
            domain: 'nutrition',
            itemType: 'allergen',
            itemName: '우유',
            isFavorite: false,
          }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('avoidLevel is required');
    });

    it('should handle server errors gracefully', async () => {
      const mockAddPreference = vi.mocked(preferencesLib.addPreference);
      mockAddPreference.mockResolvedValue(null);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { POST } = await import('@/app/api/preferences/route');

      const response = await POST(
        new Request('http://localhost/api/preferences', {
          method: 'POST',
          body: JSON.stringify({
            domain: 'nutrition',
            itemType: 'allergen',
            itemName: '우유',
            isFavorite: false,
            avoidLevel: 'cannot',
          }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('PATCH /api/preferences/[id]', () => {
    it('should update a preference', async () => {
      const mockGetPreferenceById = vi.mocked(preferencesLib.getPreferenceById);
      const mockUpdatePreference = vi.mocked(preferencesLib.updatePreference);

      const updatedPreference: UserPreference = {
        ...mockPreference,
        avoidLevel: 'avoid',
        priority: 2,
      };

      mockGetPreferenceById.mockResolvedValue(mockPreference);
      mockUpdatePreference.mockResolvedValue(updatedPreference);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { PATCH } = await import('@/app/api/preferences/[id]/route');

      const response = await PATCH(
        new Request('http://localhost/api/preferences/pref-123', {
          method: 'PATCH',
          body: JSON.stringify({ avoidLevel: 'avoid', priority: 2 }),
        }),
        { params: Promise.resolve({ id: mockPreferenceId }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.avoidLevel).toBe('avoid');
      expect(data.data.priority).toBe(2);
    });

    it('should return 404 if preference not found', async () => {
      const mockGetPreferenceById = vi.mocked(preferencesLib.getPreferenceById);
      mockGetPreferenceById.mockResolvedValue(null);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { PATCH } = await import('@/app/api/preferences/[id]/route');

      const response = await PATCH(
        new Request('http://localhost/api/preferences/invalid-id', {
          method: 'PATCH',
          body: JSON.stringify({ priority: 1 }),
        }),
        { params: Promise.resolve({ id: 'invalid-id' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return 403 if user does not own the preference', async () => {
      const mockGetPreferenceById = vi.mocked(preferencesLib.getPreferenceById);
      mockGetPreferenceById.mockResolvedValue({
        ...mockPreference,
        clerkUserId: 'other-user-id',
      });

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { PATCH } = await import('@/app/api/preferences/[id]/route');

      const response = await PATCH(
        new Request('http://localhost/api/preferences/pref-456', {
          method: 'PATCH',
          body: JSON.stringify({ priority: 1 }),
        }),
        { params: Promise.resolve({ id: 'pref-456' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should validate priority range', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);
      // 소유권 검사를 통과하기 위해 해당 사용자의 preference를 반환
      vi.mocked(preferencesLib.getPreferenceById).mockResolvedValue(mockPreference);

      const { PATCH } = await import('@/app/api/preferences/[id]/route');

      // Test priority too high
      let response = await PATCH(
        new Request('http://localhost/api/preferences/pref-123', {
          method: 'PATCH',
          body: JSON.stringify({ priority: 10 }),
        }),
        { params: Promise.resolve({ id: mockPreferenceId }) }
      );
      let data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Priority must be between 1 and 5');

      // Test priority too low
      response = await PATCH(
        new Request('http://localhost/api/preferences/pref-123', {
          method: 'PATCH',
          body: JSON.stringify({ priority: 0 }),
        }),
        { params: Promise.resolve({ id: mockPreferenceId }) }
      );
      data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/preferences/[id]', () => {
    it('should delete a preference', async () => {
      const mockGetPreferenceById = vi.mocked(preferencesLib.getPreferenceById);
      const mockRemovePreference = vi.mocked(preferencesLib.removePreference);

      mockGetPreferenceById.mockResolvedValue(mockPreference);
      mockRemovePreference.mockResolvedValue(true);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { DELETE } = await import('@/app/api/preferences/[id]/route');

      const response = await DELETE(
        new Request('http://localhost/api/preferences/pref-123', {
          method: 'DELETE',
        }),
        { params: Promise.resolve({ id: mockPreferenceId }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(mockPreferenceId);
      expect(mockRemovePreference).toHaveBeenCalledWith({}, mockPreferenceId);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const { DELETE } = await import('@/app/api/preferences/[id]/route');

      const response = await DELETE(
        new Request('http://localhost/api/preferences/pref-123', {
          method: 'DELETE',
        }),
        { params: Promise.resolve({ id: mockPreferenceId }) }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 404 if preference not found', async () => {
      const mockGetPreferenceById = vi.mocked(preferencesLib.getPreferenceById);
      mockGetPreferenceById.mockResolvedValue(null);

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { DELETE } = await import('@/app/api/preferences/[id]/route');

      const response = await DELETE(
        new Request('http://localhost/api/preferences/invalid-id', {
          method: 'DELETE',
        }),
        { params: Promise.resolve({ id: 'invalid-id' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return 403 if user does not own the preference', async () => {
      const mockGetPreferenceById = vi.mocked(preferencesLib.getPreferenceById);
      mockGetPreferenceById.mockResolvedValue({
        ...mockPreference,
        clerkUserId: 'other-user-id',
      });

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { DELETE } = await import('@/app/api/preferences/[id]/route');

      const response = await DELETE(
        new Request('http://localhost/api/preferences/pref-456', {
          method: 'DELETE',
        }),
        { params: Promise.resolve({ id: 'pref-456' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/preferences/summary', () => {
    it('should return preference summary', async () => {
      const mockGetPreferenceSummary = vi.mocked(preferencesLib.getPreferenceSummary);
      mockGetPreferenceSummary.mockResolvedValue({
        beauty: { favorites: 3, avoids: 2 },
        style: { favorites: 5, avoids: 1 },
        nutrition: { favorites: 4, avoids: 5 },
        workout: { favorites: 2, avoids: 3 },
        color: { favorites: 1, avoids: 0 },
      });

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { GET } = await import('@/app/api/preferences/summary/route');

      const response = await GET(new Request('http://localhost/api/preferences/summary'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        beauty: { favorites: 3, avoids: 2 },
        style: { favorites: 5, avoids: 1 },
        nutrition: { favorites: 4, avoids: 5 },
        workout: { favorites: 2, avoids: 3 },
        color: { favorites: 1, avoids: 0 },
      });
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const { GET } = await import('@/app/api/preferences/summary/route');

      const response = await GET(new Request('http://localhost/api/preferences/summary'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should handle empty summary', async () => {
      const mockGetPreferenceSummary = vi.mocked(preferencesLib.getPreferenceSummary);
      mockGetPreferenceSummary.mockResolvedValue({
        beauty: { favorites: 0, avoids: 0 },
        style: { favorites: 0, avoids: 0 },
        nutrition: { favorites: 0, avoids: 0 },
        workout: { favorites: 0, avoids: 0 },
        color: { favorites: 0, avoids: 0 },
      });

      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
      vi.mocked(createClerkSupabaseClient).mockReturnValue({} as any);

      const { GET } = await import('@/app/api/preferences/summary/route');

      const response = await GET(new Request('http://localhost/api/preferences/summary'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // 모든 도메인이 0으로 초기화되어야 함
      Object.values(data.data).forEach((domain: any) => {
        expect(domain.favorites).toBe(0);
        expect(domain.avoids).toBe(0);
      });
    });
  });
});
