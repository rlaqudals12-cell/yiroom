import { renderHook, waitFor } from '@testing-library/react-native';

const mockGetToken = jest.fn();
const mockUser = { id: 'user_auth_1' };
let mockAuthState = { isLoaded: true, isSignedIn: true };

jest.mock('@clerk/clerk-expo', () => ({
  // 실제 clerk-expo는 렌더마다 getToken·user에 새 참조를 줄 수 있다 — 참조를 deps에 넣는
  // effect-storm 회귀(무한 재조회)를 테스트가 잡을 수 있도록 매 호출 새 참조를 반환한다.
  useAuth: () => ({
    getToken: (options?: { skipCache?: boolean }) => mockGetToken(options),
    ...mockAuthState,
  }),
  useUser: () => ({ user: { ...mockUser }, isLoaded: true }),
}));

const emptyQueryResult = { data: null, error: null };
const queryBuilder: Record<string, unknown> = {};
queryBuilder.select = () => queryBuilder;
queryBuilder.eq = () => queryBuilder;
queryBuilder.order = () => queryBuilder;
queryBuilder.limit = () => queryBuilder;
queryBuilder.single = () => Promise.resolve(emptyQueryResult);
queryBuilder.maybeSingle = () => Promise.resolve(emptyQueryResult);

const mockSupabase = { from: jest.fn(() => queryBuilder) };

jest.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockSupabase,
}));

import { useUserMatching } from '../../hooks/useUserMatching';

describe('useUserMatching 분석 이력 인증', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { isLoaded: true, isSignedIn: true };
    mockGetToken.mockResolvedValue('clerk-session-token');
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ analyses: [] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('뷰티 탭의 이력 3축 요청 모두 현재 Clerk Bearer 토큰을 싣는다', async () => {
    const { result } = renderHook(() => useUserMatching());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetToken).toHaveBeenCalledTimes(1);
    expect(mockGetToken).toHaveBeenCalledWith({ skipCache: true });
    const historyCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/analysis/history?type=')
    );
    expect(historyCalls).toHaveLength(3);
    for (const [, init] of historyCalls) {
      expect(init).toMatchObject({
        headers: {
          Authorization: 'Bearer clerk-session-token',
          'x-yiroom-client': 'mobile',
        },
      });
    }
  });

  it('Clerk 세션 복원이 끝나기 전에는 분석 이력 요청을 보내지 않는다', async () => {
    mockAuthState = { isLoaded: false, isSignedIn: false };

    const { result, rerender } = renderHook(() => useUserMatching());

    expect(result.current.isLoading).toBe(true);
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    mockAuthState = { isLoaded: true, isSignedIn: true };
    rerender(undefined);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetToken).toHaveBeenCalledWith({ skipCache: true });
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/analysis/history?type='))
    ).toHaveLength(3);
  });

  it('같은 세션에서 렌더가 반복돼도 분석 조회를 재실행하지 않는다 (effect-storm 방지)', async () => {
    const { result, rerender } = renderHook(() => useUserMatching());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetToken).toHaveBeenCalledTimes(1);

    // 리렌더마다 getToken·user 참조가 바뀌어도(위 모킹) 재조회가 일어나면 안 된다
    rerender(undefined);
    rerender(undefined);
    rerender(undefined);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetToken).toHaveBeenCalledTimes(1);
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/analysis/history?type='))
    ).toHaveLength(3);
  });
});
