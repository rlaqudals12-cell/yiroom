/**
 * useUserPreferences 훅 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import type { UserPreference } from '@/types/preferences';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn() as any;

const mockUser = {
  id: 'user_test123',
  emailAddresses: [],
};

const mockPreference: UserPreference = {
  id: 'pref_1',
  clerkUserId: 'user_test123',
  domain: 'beauty',
  itemType: 'ingredient',
  itemName: '히알루론산',
  itemNameEn: 'Hyaluronic Acid',
  isFavorite: true,
  priority: 3,
  source: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAvoidPreference: UserPreference = {
  id: 'pref_2',
  clerkUserId: 'user_test123',
  domain: 'nutrition',
  itemType: 'allergen',
  itemName: '우유',
  isFavorite: false,
  avoidLevel: 'cannot',
  avoidReason: 'allergy',
  priority: 4,
  source: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useUserPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    } as any);
  });

  it('초기 로드 시 선호/기피 목록 조회', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: [mockPreference, mockAvoidPreference],
        count: 2,
      }),
    });

    const { result } = renderHook(() => useUserPreferences());

    // 로딩 상태 확인
    expect(result.current.isLoading).toBe(true);

    // 로드 완료 대기
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 선호/기피 목록 확인
    expect(result.current.preferences).toHaveLength(2);
    expect(result.current.preferences[0].itemName).toBe('히알루론산');
  });

  it('도메인 필터링으로 조회', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: [mockPreference],
        count: 1,
      }),
    });

    const { result } = renderHook(() => useUserPreferences({ domain: 'beauty' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // API 호출 확인
    expect(global.fetch).toHaveBeenCalledWith('/api/preferences?domain=beauty');
  });

  it('선호/기피 항목 추가', async () => {
    (global.fetch as any)
      // 초기 로드
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: [mockPreference],
          count: 1,
        }),
      })
      // 추가 요청
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvoidPreference,
      });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let newPreference: UserPreference | null = null;

    await act(async () => {
      // clerkUserId는 hook에서 자동으로 추가됨
      newPreference = await result.current.addPreference({
        domain: 'nutrition',
        itemType: 'allergen',
        itemName: '우유',
        isFavorite: false,
        avoidLevel: 'cannot',
        avoidReason: 'allergy',
        priority: 4,
        source: 'user',
      });
    });

    // 추가된 항목 확인
    expect(newPreference).toEqual(mockAvoidPreference);
    expect(result.current.preferences).toHaveLength(2);
  });

  it('선호/기피 항목 수정', async () => {
    (global.fetch as any)
      // 초기 로드
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: [mockAvoidPreference],
          count: 1,
        }),
      })
      // 수정 요청
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAvoidPreference,
          avoidLevel: 'avoid',
        }),
      });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let updatedPref: UserPreference | null = null;

    await act(async () => {
      updatedPref = await result.current.updatePreference('pref_2', {
        avoidLevel: 'avoid',
      });
    });

    // 수정된 항목 확인
    expect(updatedPref).toBeDefined();
    expect((updatedPref as any)?.avoidLevel).toBe('avoid');
  });

  it('선호/기피 항목 삭제', async () => {
    (global.fetch as any)
      // 초기 로드
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: [mockPreference, mockAvoidPreference],
          count: 2,
        }),
      })
      // 삭제 요청
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let deleteSuccess = false;

    await act(async () => {
      deleteSuccess = await result.current.removePreference('pref_1');
    });

    // 삭제 확인
    expect(deleteSuccess).toBe(true);
    expect(result.current.preferences).toHaveLength(1);
  });

  it('도메인별 선호/기피 조회', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: [mockPreference, mockAvoidPreference],
        count: 2,
      }),
    });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const beautyPrefs = result.current.getPreferencesByDomain('beauty');
    const nutritionPrefs = result.current.getPreferencesByDomain('nutrition');

    expect(beautyPrefs).toHaveLength(1);
    expect(beautyPrefs[0].itemName).toBe('히알루론산');

    expect(nutritionPrefs).toHaveLength(1);
    expect(nutritionPrefs[0].itemName).toBe('우유');
  });

  it('좋아하는 항목 조회', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: [mockPreference, mockAvoidPreference],
        count: 2,
      }),
    });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const favorites = result.current.getFavorites();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].isFavorite).toBe(true);
  });

  it('기피 항목 조회', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: [mockPreference, mockAvoidPreference],
        count: 2,
      }),
    });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const avoids = result.current.getAvoids();

    expect(avoids).toHaveLength(1);
    expect(avoids[0].isFavorite).toBe(false);
  });

  it('에러 처리', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.preferences).toHaveLength(0);
  });

  it('인증되지 않은 사용자 처리', async () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoaded: true,
    } as any);

    const { result } = renderHook(() => useUserPreferences());

    // useEffect가 실행되어 isLoading이 false로 변경되기를 대기
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.preferences).toHaveLength(0);
  });
});
