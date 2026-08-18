import { describe, expect, it, vi } from 'vitest';
import { searchUsers } from '@/lib/friends/queries';

describe('searchUsers AbortSignal', () => {
  it('사용자·관계·레벨 조회 모두 같은 signal로 중단 가능하다', async () => {
    const controller = new AbortController();
    const usersAbort = vi.fn().mockResolvedValue({
      data: [{ clerk_user_id: 'friend-1', display_name: '친구', avatar_url: null }],
      error: null,
    });
    const friendshipsAbort = vi.fn().mockResolvedValue({ data: [], error: null });
    const levelsAbort = vi.fn().mockResolvedValue({ data: [], error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              neq: () => ({
                // eslint-disable-next-line sonarjs/no-nested-functions -- Supabase fluent builder의 종단 호출 mock
                ilike: () => ({ limit: () => ({ abortSignal: usersAbort }) }),
              }),
            }),
          };
        }
        if (table === 'friendships') {
          return { select: () => ({ or: () => ({ abortSignal: friendshipsAbort }) }) };
        }
        return { select: () => ({ in: () => ({ abortSignal: levelsAbort }) }) };
      }),
    };

    await searchUsers(supabase as never, 'user-123', '친구', 10, controller.signal);

    expect(usersAbort).toHaveBeenCalledWith(controller.signal);
    expect(friendshipsAbort).toHaveBeenCalledWith(controller.signal);
    expect(levelsAbort).toHaveBeenCalledWith(controller.signal);
  });
});
