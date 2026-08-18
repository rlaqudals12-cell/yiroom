import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSearchResult } from '@/types/friends';

const { searchRequests, mockSearchUsers, mockFriendClient, debounceState } = vi.hoisted(() => ({
  searchRequests: [] as Array<{
    query: string;
    signal?: AbortSignal;
    resolve: (value: UserSearchResult[]) => void;
  }>,
  mockSearchUsers: vi.fn(),
  mockFriendClient: {},
  debounceState: { override: null as string | null },
}));

mockSearchUsers.mockImplementation(
  (_client: unknown, _userId: string, query: string, _limit: number, signal?: AbortSignal) =>
    new Promise<UserSearchResult[]>((resolve) => {
      searchRequests.push({ query, signal, resolve });
    })
);

vi.mock('@/lib/friends/queries', () => ({ searchUsers: mockSearchUsers }));
vi.mock('@/lib/friends/mutations', () => ({ sendFriendRequest: vi.fn() }));
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockFriendClient,
}));
vi.mock('@clerk/nextjs', () => ({ useAuth: () => ({ userId: 'user-123' }) }));
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => debounceState.override ?? value,
}));

import { FriendSearchClient } from '@/app/(main)/friends/search/FriendSearchClient';

function result(userId: string, displayName: string): UserSearchResult {
  return {
    userId,
    displayName,
    avatarUrl: null,
    level: 1,
    tier: 'BRONZE',
    isFriend: false,
    isPending: false,
    isBlocked: false,
  };
}

describe('FriendSearchClient 요청 경합', () => {
  beforeEach(() => {
    searchRequests.length = 0;
    debounceState.override = null;
  });

  it('이전 검색을 중단하고 최신 검색 결과만 유지한다', async () => {
    render(<FriendSearchClient />);
    const input = screen.getByTestId('friend-search-input-field');

    fireEvent.change(input, { target: { value: '가나' } });
    await waitFor(() => expect(searchRequests).toHaveLength(1));
    fireEvent.change(input, { target: { value: '다라' } });
    await waitFor(() => expect(searchRequests).toHaveLength(2));

    expect(searchRequests[0].signal?.aborted).toBe(true);
    expect(searchRequests[1].signal?.aborted).toBe(false);

    await act(async () => searchRequests[1].resolve([result('new', '최신 사용자')]));
    expect(await screen.findByText('최신 사용자')).toBeInTheDocument();

    await act(async () => searchRequests[0].resolve([result('old', '오래된 사용자')]));
    expect(screen.queryByText('오래된 사용자')).not.toBeInTheDocument();
    expect(screen.getByText('최신 사용자')).toBeInTheDocument();
  });

  it('새 원문 입력은 디바운스가 갱신되기 전에도 이전 요청을 즉시 중단한다', async () => {
    render(<FriendSearchClient />);
    const input = screen.getByTestId('friend-search-input-field');

    fireEvent.change(input, { target: { value: '이전' } });
    await waitFor(() => expect(searchRequests).toHaveLength(1));

    // 실제 useDebounce의 300ms 창을 재현: 원문만 바뀌고 debouncedQuery는 아직 '이전'이다.
    debounceState.override = '이전';
    fireEvent.change(input, { target: { value: '최신' } });

    expect(searchRequests[0].signal?.aborted).toBe(true);
    expect(searchRequests).toHaveLength(1);
  });
});
