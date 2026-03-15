import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockUseUser, mockSupabaseFrom } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

import { useUserProfile } from '@/hooks/useUserProfile';

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용자가 없으면 기본 프로필을 반환한다', () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: true });

    const { result } = renderHook(() => useUserProfile());

    expect(result.current.profile.gender).toBeNull();
    expect(result.current.profile.heightCm).toBeNull();
    expect(result.current.profile.weightKg).toBeNull();
    expect(result.current.profile.allergies).toEqual([]);
  });

  it('사용자 없이 로드되면 isLoading이 false가 된다', async () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: true });

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('updateGender 함수가 존재한다', () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: true });

    const { result } = renderHook(() => useUserProfile());

    expect(result.current.updateGender).toBeInstanceOf(Function);
    expect(result.current.updateHeight).toBeInstanceOf(Function);
    expect(result.current.updateWeight).toBeInstanceOf(Function);
    expect(result.current.updatePhysicalInfo).toBeInstanceOf(Function);
    expect(result.current.updateAllergies).toBeInstanceOf(Function);
    expect(result.current.updateProfile).toBeInstanceOf(Function);
    expect(result.current.refetch).toBeInstanceOf(Function);
  });

  it('사용자가 로드되면 DB에서 프로필을 조회한다', async () => {
    mockUseUser.mockReturnValue({
      user: { id: 'user_123' },
      isLoaded: true,
    });

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              gender: 'female',
              height_cm: 165,
              weight_kg: '55.5',
              allergies: ['nuts'],
            },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUserProfile());

    // useEffect가 실행될 때까지 대기
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile.gender).toBe('female');
    expect(result.current.profile.heightCm).toBe(165);
    expect(result.current.profile.weightKg).toBe(55.5);
    expect(result.current.profile.allergies).toEqual(['nuts']);
  });

  it('DB 조회 실패 시 에러를 설정한다', async () => {
    mockUseUser.mockReturnValue({
      user: { id: 'user_123' },
      isLoaded: true,
    });

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'DB error' },
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toContain('Failed to fetch profile');
  });
});
