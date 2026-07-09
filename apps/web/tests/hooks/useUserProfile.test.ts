import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockUseUser, mockSupabaseFrom, stableClient } = vi.hoisted(() => {
  const from = vi.fn();
  // 안정적인 클라이언트 객체 — 매 렌더마다 새 객체를 반환하면 supabase 식별자가 바뀌어
  // fetchProfile useCallback → useEffect가 무한 재실행(렌더 루프)된다.
  return { mockUseUser: vi.fn(), mockSupabaseFrom: from, stableClient: { from } };
});

vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => stableClient,
}));

import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * 테이블별 응답을 지정하는 체이너블 Supabase 목.
 * update().eq() / update().eq().select() / maybeSingle() 모두 thenable로 해석되도록 구성.
 */
type QueryResult = { data: unknown; error: unknown };

function makeChain(result: QueryResult, selectSpy?: (cols?: string) => void) {
  const chain: any = {
    select: vi.fn((cols?: string) => {
      selectSpy?.(cols);
      return chain;
    }),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    // await from()...  → result
    then: (onF: (v: QueryResult) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onF, onR),
  };
  return chain;
}

interface TableResponses {
  users?: QueryResult;
  user_body_measurements?: QueryResult;
  nutrition_settings?: QueryResult;
  body_analyses?: QueryResult;
}

const EMPTY: QueryResult = { data: null, error: null };

function setupTables(responses: TableResponses, usersSelectSpy?: (cols?: string) => void) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    switch (table) {
      case 'users':
        return makeChain(responses.users ?? EMPTY, usersSelectSpy);
      case 'user_body_measurements':
        return makeChain(responses.user_body_measurements ?? EMPTY);
      case 'nutrition_settings':
        return makeChain(responses.nutrition_settings ?? EMPTY);
      case 'body_analyses':
        return makeChain(responses.body_analyses ?? EMPTY);
      default:
        return makeChain(EMPTY);
    }
  });
}

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseFrom.mockReturnValue(makeChain(EMPTY));
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

  it('업데이트 함수들이 존재한다', () => {
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

  it('정본 테이블에서 프로필을 조합한다 (users.gender + measurements + nutrition_settings)', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });

    setupTables({
      users: { data: { gender: 'female' }, error: null },
      user_body_measurements: { data: { height: 165, weight: 55.5 }, error: null },
      nutrition_settings: { data: { allergies: ['nuts'] }, error: null },
    });

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile.gender).toBe('female');
    expect(result.current.profile.heightCm).toBe(165);
    expect(result.current.profile.weightKg).toBe(55.5);
    expect(result.current.profile.allergies).toEqual(['nuts']);
  });

  it('users select에 유령 컬럼(height_cm/weight_kg/allergies)이 포함되지 않는다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });

    const usersSelectCols: (string | undefined)[] = [];
    setupTables({ users: { data: { gender: 'male' }, error: null } }, (cols) =>
      usersSelectCols.push(cols)
    );

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(usersSelectCols.length).toBeGreaterThan(0);
    const joined = usersSelectCols.join(',');
    expect(joined).toContain('gender');
    expect(joined).not.toContain('height_cm');
    expect(joined).not.toContain('weight_kg');
    expect(joined).not.toContain('allergies');
  });

  it('측정값이 없으면 body_analyses 최신 행으로 폴백한다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });

    setupTables({
      users: { data: { gender: 'neutral' }, error: null },
      user_body_measurements: { data: null, error: null },
      body_analyses: { data: { height: 172, weight: 68 }, error: null },
    });

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile.heightCm).toBe(172);
    expect(result.current.profile.weightKg).toBe(68);
  });

  it('updateGender는 users 테이블에 쓴다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    setupTables({ users: { data: { gender: null }, error: null } });

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockSupabaseFrom.mockClear();
    let ok = false;
    await act(async () => {
      ok = await result.current.updateGender('female');
    });

    expect(ok).toBe(true);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
    expect(result.current.profile.gender).toBe('female');
  });

  it('updateHeight는 user_body_measurements에 upsert 한다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    setupTables({});

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockSupabaseFrom.mockClear();
    let ok = false;
    await act(async () => {
      ok = await result.current.updateHeight(180);
    });

    expect(ok).toBe(true);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('user_body_measurements');
    expect(result.current.profile.heightCm).toBe(180);
  });

  it('supabase 접근이 예외를 던지면 에러를 설정한다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    mockSupabaseFrom.mockImplementation(() => {
      throw new Error('client boom');
    });

    const { result } = renderHook(() => useUserProfile());

    await vi.waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
  });
});
