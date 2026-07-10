/**
 * GenderProvider 테스트
 * @description 유령 배선 수리 검증 — 성별 정본은 users.gender.
 *   과거엔 존재하지 않는 user_profiles 테이블을 조회해 전 사용자 gender가
 *   'neutral'로 고정됐다(성별 적응 기능 전멸). 재발 방지 단언 포함.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockUseUser, mockSupabaseFrom, stableClient } = vi.hoisted(() => {
  const from = vi.fn();
  // 안정적인 클라이언트 객체 — 매 렌더마다 새 객체면 useCallback 의존성이 바뀌어 렌더 루프
  return { mockUseUser: vi.fn(), mockSupabaseFrom: from, stableClient: { from } };
});

vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => stableClient,
}));

import { GenderProvider, useGenderProfile } from '@/components/providers/gender-provider';

type QueryResult = { data: unknown; error: unknown };
const EMPTY: QueryResult = { data: null, error: null };

function makeChain(result: QueryResult) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    then: (onF: (v: QueryResult) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onF, onR),
  };
  return chain;
}

/** 컨텍스트 값을 노출하는 소비자 */
function Consumer() {
  const { genderProfile } = useGenderProfile();
  return (
    <div>
      <span data-testid="gender-value">{genderProfile.gender}</span>
      <span data-testid="style-value">{genderProfile.stylePreference}</span>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <GenderProvider>
      <Consumer />
    </GenderProvider>
  );
}

describe('GenderProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockSupabaseFrom.mockReturnValue(makeChain(EMPTY));
  });

  it('로그인 사용자의 성별을 users.gender 정본에서 로드한다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    const usersChain = makeChain({ data: { gender: 'male' }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) =>
      table === 'users' ? usersChain : makeChain(EMPTY)
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('gender-value').textContent).toBe('male');
    });
    // 정본 테이블 확인
    expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
    expect(usersChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
  });

  it('재발 방지: 존재하지 않는 user_profiles 테이블을 절대 조회하지 않는다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    mockSupabaseFrom.mockImplementation(() =>
      makeChain({ data: { gender: 'female' }, error: null })
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('gender-value').textContent).toBe('female');
    });
    const calledTables = mockSupabaseFrom.mock.calls.map((c) => c[0]);
    expect(calledTables).not.toContain('user_profiles');
  });

  it("DB의 'other' 값은 콘텐츠 적응 관점에서 'neutral'로 매핑한다", async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    mockSupabaseFrom.mockImplementation(() =>
      makeChain({ data: { gender: 'other' }, error: null })
    );

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('gender-value').textContent).toBe('neutral');
      expect(screen.getByTestId('style-value').textContent).toBe('unisex');
    });
  });

  it('DB에 성별이 없으면 로컬 저장값을 users.gender로 동기화한다', async () => {
    localStorage.setItem(
      'yiroom_gender_profile',
      JSON.stringify({ gender: 'female', stylePreference: 'feminine' })
    );
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    const usersChain = makeChain({ data: { gender: null }, error: null });
    mockSupabaseFrom.mockImplementation((table: string) =>
      table === 'users' ? usersChain : makeChain(EMPTY)
    );

    renderWithProvider();

    await waitFor(() => {
      expect(usersChain.update).toHaveBeenCalledWith({ gender: 'female' });
    });
  });

  it('비로그인 사용자는 기본 neutral 프로필을 쓴다 (DB 조회 없음)', async () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: true });

    renderWithProvider();

    expect(screen.getByTestId('gender-value').textContent).toBe('neutral');
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });
});
