/**
 * T2-MOD-6: 피드 차단 필터링 통합 테스트
 * 차단된 사용자의 게시물이 피드에서 숨겨지는지 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 체이닝 mock 트래커
const callLog: { method: string; args: unknown[] }[] = [];

/**
 * Thenable Supabase chain mock.
 * 모든 메서드가 chain을 반환하고, await 시 .then()으로 응답 resolve.
 * user_blocks: eq('blocker_clerk_user_id') / eq('blocked_clerk_user_id')로 분기.
 * feed_posts: await 시점에 { data, error, count } 반환.
 */
function createSupabaseMock(tableResponses: Record<string, { data: unknown; error: unknown }>) {
  callLog.length = 0;

  const makeChain = (tableName: string) => {
    const response = tableResponses[tableName] || { data: [], error: null };

    // user_blocks 테이블용: eq 호출에 따라 응답이 달라짐
    let resolvedResponse = response;

    const chain: Record<string, unknown> = {};
    const methods = ['select', 'eq', 'not', 'order', 'range', 'contains', 'or', 'in', 'single'];

    for (const method of methods) {
      chain[method] = (...args: unknown[]) => {
        callLog.push({ method, args });

        // user_blocks 테이블의 eq 호출 시 응답 분기 결정
        if (tableName === 'user_blocks' && method === 'eq') {
          const field = args[0] as string;
          if (field === 'blocker_clerk_user_id') {
            resolvedResponse = tableResponses['user_blocks_by_me'] || response;
          }
          if (field === 'blocked_clerk_user_id') {
            resolvedResponse = tableResponses['user_blocks_by_them'] || response;
          }
        }

        // 항상 chain 반환 (체이닝 유지)
        return chain;
      };
    }

    // thenable: await chain 시 최종 응답 반환
    chain.then = (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
      const result =
        tableName === 'feed_posts'
          ? { ...resolvedResponse, count: (resolvedResponse.data as unknown[])?.length || 0 }
          : resolvedResponse;
      return Promise.resolve(result).then(resolve, reject);
    };

    return chain;
  };

  return {
    from: (table: string) => {
      callLog.push({ method: 'from', args: [table] });
      return makeChain(table);
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(),
}));

describe('피드 차단 필터링 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('차단한 사용자의 게시물이 쿼리에서 제외되어야 한다', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue(
      createSupabaseMock({
        user_blocks_by_me: {
          data: [{ blocked_clerk_user_id: 'user_blocked' }],
          error: null,
        },
        user_blocks_by_them: {
          data: [],
          error: null,
        },
        feed_posts: {
          data: [{ id: 'post_1', clerk_user_id: 'user_normal', users: { name: '정상유저' } }],
          error: null,
        },
      }) as ReturnType<typeof createClerkSupabaseClient>
    );

    const { getFeedPosts } = await import('@/lib/feed/repository');
    await getFeedPosts({}, 'current_user');

    // .not() 호출로 차단 사용자 제외 확인
    const notCall = callLog.find((c) => c.method === 'not');
    expect(notCall).toBeDefined();
    expect(notCall!.args[0]).toBe('clerk_user_id');
    expect(notCall!.args[1]).toBe('in');
    expect(String(notCall!.args[2])).toContain('user_blocked');
  });

  it('나를 차단한 사용자의 게시물도 제외되어야 한다 (양방향)', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue(
      createSupabaseMock({
        user_blocks_by_me: { data: [], error: null },
        user_blocks_by_them: {
          data: [{ blocker_clerk_user_id: 'user_who_blocked_me' }],
          error: null,
        },
        feed_posts: { data: [], error: null },
      }) as ReturnType<typeof createClerkSupabaseClient>
    );

    const { getFeedPosts } = await import('@/lib/feed/repository');
    await getFeedPosts({}, 'current_user');

    const notCall = callLog.find((c) => c.method === 'not');
    expect(notCall).toBeDefined();
    expect(String(notCall!.args[2])).toContain('user_who_blocked_me');
  });

  it('차단 목록이 비어있으면 .not() 호출하지 않아야 한다', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue(
      createSupabaseMock({
        user_blocks_by_me: { data: [], error: null },
        user_blocks_by_them: { data: [], error: null },
        feed_posts: { data: [], error: null },
      }) as ReturnType<typeof createClerkSupabaseClient>
    );

    const { getFeedPosts } = await import('@/lib/feed/repository');
    await getFeedPosts({}, 'current_user');

    const notCall = callLog.find((c) => c.method === 'not');
    expect(notCall).toBeUndefined();
  });

  it('비로그인 사용자는 차단 필터링 없이 전체 피드를 받아야 한다', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue(
      createSupabaseMock({
        feed_posts: {
          data: [
            { id: 'post_1', clerk_user_id: 'u1', users: { name: 'A' } },
            { id: 'post_2', clerk_user_id: 'u2', users: { name: 'B' } },
          ],
          error: null,
        },
      }) as ReturnType<typeof createClerkSupabaseClient>
    );

    const { getFeedPosts } = await import('@/lib/feed/repository');
    await getFeedPosts({}); // userId 없음

    // user_blocks 테이블 조회 없음
    const blockTableCalls = callLog.filter(
      (c) => c.method === 'from' && c.args[0] === 'user_blocks'
    );
    expect(blockTableCalls).toHaveLength(0);

    // .not() 호출 없음
    const notCall = callLog.find((c) => c.method === 'not');
    expect(notCall).toBeUndefined();
  });

  it('양방향 차단 ID가 중복 제거되어야 한다', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue(
      createSupabaseMock({
        user_blocks_by_me: {
          data: [{ blocked_clerk_user_id: 'user_mutual' }, { blocked_clerk_user_id: 'user_a' }],
          error: null,
        },
        user_blocks_by_them: {
          data: [{ blocker_clerk_user_id: 'user_mutual' }, { blocker_clerk_user_id: 'user_b' }],
          error: null,
        },
        feed_posts: { data: [], error: null },
      }) as ReturnType<typeof createClerkSupabaseClient>
    );

    const { getFeedPosts } = await import('@/lib/feed/repository');
    await getFeedPosts({}, 'current_user');

    const notCall = callLog.find((c) => c.method === 'not');
    expect(notCall).toBeDefined();

    // Set 중복 제거: user_mutual, user_a, user_b → 3개
    const idString = String(notCall!.args[2]);
    const ids = idString.replace('(', '').replace(')', '').split(',');
    expect(ids).toHaveLength(3);
    expect(ids).toContain('user_mutual');
    expect(ids).toContain('user_a');
    expect(ids).toContain('user_b');
  });
});
