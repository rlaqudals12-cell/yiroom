/**
 * 아이템 착용 기록 API 테스트
 *
 * PATCH /api/inventory/[id] { action: 'recordUsage' }
 * — 코디 추천 화면의 "오늘 입었어요"가 use_count·last_used_at을 실제로 올리는지 검증한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 체이너블 mock — 터미널 결과를 큐로 공급한다(호출 순서대로 소비)
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
  chain.then = vi.fn();
  return chain;
});

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockChain,
}));

vi.mock('@/lib/utils/logger', () => ({
  inventoryLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user-1' })),
}));

import { PATCH } from '@/app/api/inventory/[id]/route';
import { NextRequest } from 'next/server';

const ITEM_ROW = {
  id: 'item-1',
  clerk_user_id: 'user-1',
  category: 'closet',
  sub_category: 'top',
  name: '화이트 블라우스',
  image_url: '/img.jpg',
  original_image_url: null,
  brand: null,
  tags: [],
  is_favorite: false,
  use_count: 5,
  last_used_at: '2026-08-01T00:00:00Z',
  expiry_date: null,
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

/** 터미널(await) 결과를 순서대로 공급 */
function queueResults(results: Array<{ data: unknown; error: unknown }>) {
  let index = 0;
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    const next = results[index] ?? { data: null, error: null };
    index += 1;
    return Promise.resolve(next).then(resolve);
  });
}

function createRequest() {
  return new NextRequest('http://localhost:3000/api/inventory/item-1', {
    method: 'PATCH',
    body: JSON.stringify({ action: 'recordUsage' }),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockChain.rpc.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  queueResults([]);
});

describe('PATCH /api/inventory/[id] — recordUsage', () => {
  it('증가 RPC가 있으면 RPC로 착용을 기록한다', async () => {
    const response = await PATCH(createRequest(), { params: Promise.resolve({ id: 'item-1' }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockChain.rpc).toHaveBeenCalledWith('increment_inventory_use_count', {
      p_user_id: 'user-1',
      p_item_id: 'item-1',
    });
  });

  it('RPC를 쓸 수 없으면 use_count를 1 올리고 last_used_at을 갱신한다', async () => {
    mockChain.rpc.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: 'function does not exist' } })
    );
    queueResults([
      // ① RPC 없이 시도한 직접 업데이트 실패
      { data: null, error: { message: 'invalid input' } },
      // ② 현재 아이템 조회 (use_count: 5)
      { data: ITEM_ROW, error: null },
      // ③ 읽고 쓰기 폴백 업데이트 성공
      { data: null, error: null },
    ]);

    const before = Date.now();
    const response = await PATCH(createRequest(), { params: Promise.resolve({ id: 'item-1' }) });

    expect(response.status).toBe(200);

    const lastUpdate = mockChain.update.mock.calls.at(-1)?.[0] as {
      use_count: number;
      last_used_at: string;
    };
    expect(lastUpdate.use_count).toBe(ITEM_ROW.use_count + 1);
    expect(new Date(lastUpdate.last_used_at).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('로그인하지 않으면 401을 반환한다', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({
      userId: null,
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const response = await PATCH(createRequest(), { params: Promise.resolve({ id: 'item-1' }) });

    expect(response.status).toBe(401);
  });
});
