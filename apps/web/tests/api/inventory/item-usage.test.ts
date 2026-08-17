/**
 * 착용 기록 API 테스트 (2026-08 외부 리뷰 수리 반영)
 *
 * PATCH /api/inventory        { action:'recordUsage', itemIds:[...] }  — 코디 배치
 * PATCH /api/inventory/[id]   { action:'recordUsage' }                 — 단건
 *
 * 예전 구현의 실측 결함:
 * - 마이그레이션에 없는 RPC(`increment_inventory_use_count`)를 먼저 호출하고,
 *   실패 시 `use_count: supabase.rpc(...)`(=Promise 객체)를 숫자 컬럼에 넣는 UPDATE를 던졌다.
 * - 그마저 실패하면 에러를 통째로 삼켜 호출측은 성공으로 알았다.
 * - 코디 착용은 아이템별 PATCH N회라 중간 실패 시 "일부만 기록"으로 남았다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

interface RecordedOp {
  kind: 'select' | 'update';
  patch?: Record<string, unknown>;
  ids: string[];
  userScoped: boolean;
}

const state = vi.hoisted(() => ({
  rows: [] as Array<{ id: string; use_count: number | null }>,
  selectError: null as unknown,
  updateError: null as unknown,
  ops: [] as RecordedOp[],
}));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({
    from: () => {
      const op: RecordedOp = { kind: 'select', ids: [], userScoped: false };
      const builder: Record<string, unknown> = {};
      Object.assign(builder, {
        select: () => builder,
        update: (patch: Record<string, unknown>) => {
          op.kind = 'update';
          op.patch = patch;
          return builder;
        },
        eq: (column: string) => {
          if (column === 'clerk_user_id') op.userScoped = true;
          return builder;
        },
        in: (_column: string, ids: string[]) => {
          op.ids = ids;
          return builder;
        },
        then: (resolve: (v: unknown) => unknown) => {
          state.ops.push(op);
          const result =
            op.kind === 'update'
              ? { data: null, error: state.updateError }
              : { data: state.rows, error: state.selectError };
          return Promise.resolve(result).then(resolve);
        },
      });
      return builder;
    },
  }),
}));

vi.mock('@/lib/utils/logger', () => ({
  inventoryLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user-1' })),
}));

const { PATCH: BATCH_PATCH } = await import('@/app/api/inventory/route');
const { PATCH: ITEM_PATCH } = await import('@/app/api/inventory/[id]/route');

const TOP = '11111111-1111-4111-8111-111111111111';
const BOTTOM = '22222222-2222-4222-8222-222222222222';

function batchRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/inventory', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function itemRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'recordUsage' }),
    headers: { 'Content-Type': 'application/json' },
  });
}

const updates = (): RecordedOp[] => state.ops.filter((op) => op.kind === 'update');

beforeEach(() => {
  vi.clearAllMocks();
  state.rows = [];
  state.selectError = null;
  state.updateError = null;
  state.ops = [];
});

describe('PATCH /api/inventory — 코디 배치 착용 기록', () => {
  it('여러 아이템의 use_count를 각각 1 올리고 last_used_at을 갱신한다', async () => {
    state.rows = [
      { id: TOP, use_count: 5 },
      { id: BOTTOM, use_count: 9 },
    ];

    const before = Date.now();
    const response = await BATCH_PATCH(
      batchRequest({ action: 'recordUsage', itemIds: [TOP, BOTTOM] })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, recorded: 2 });

    // use_count가 다르면 값별로 묶여 나간다 (숫자 컬럼에 Promise를 넣던 옛 UPDATE 폐지)
    const patches = updates().map((op) => ({ ids: op.ids, patch: op.patch }));
    expect(patches).toEqual(
      expect.arrayContaining([
        { ids: [TOP], patch: expect.objectContaining({ use_count: 6 }) },
        { ids: [BOTTOM], patch: expect.objectContaining({ use_count: 10 }) },
      ])
    );
    for (const op of updates()) {
      expect(op.userScoped).toBe(true); // 소유자 스코프 없는 UPDATE 금지
      expect(new Date(String(op.patch?.last_used_at)).getTime()).toBeGreaterThanOrEqual(before);
    }
  });

  it('같은 착용 횟수의 아이템은 한 문장으로 묶어 갱신한다 (왕복 최소화)', async () => {
    state.rows = [
      { id: TOP, use_count: 0 },
      { id: BOTTOM, use_count: 0 },
    ];

    await BATCH_PATCH(batchRequest({ action: 'recordUsage', itemIds: [TOP, BOTTOM] }));

    expect(updates()).toHaveLength(1);
    expect(updates()[0].ids).toEqual([TOP, BOTTOM]);
    expect(updates()[0].patch).toMatchObject({ use_count: 1 });
  });

  it('내 옷장에 없는 아이템이 섞이면 일부만 기록하지 않고 404로 실패한다', async () => {
    state.rows = [{ id: TOP, use_count: 1 }]; // BOTTOM은 내 것이 아님

    const response = await BATCH_PATCH(
      batchRequest({ action: 'recordUsage', itemIds: [TOP, BOTTOM] })
    );

    expect(response.status).toBe(404);
    expect(updates()).toHaveLength(0);
  });

  it('갱신이 실패하면 성공으로 위장하지 않는다', async () => {
    state.rows = [{ id: TOP, use_count: 1 }];
    state.updateError = { message: 'update failed' };

    const response = await BATCH_PATCH(batchRequest({ action: 'recordUsage', itemIds: [TOP] }));

    expect(response.status).toBe(500);
  });

  it('itemIds가 비었거나 uuid가 아니면 400을 반환한다', async () => {
    const empty = await BATCH_PATCH(batchRequest({ action: 'recordUsage', itemIds: [] }));
    expect(empty.status).toBe(400);

    const bad = await BATCH_PATCH(batchRequest({ action: 'recordUsage', itemIds: ['not-a-uuid'] }));
    expect(bad.status).toBe(400);

    expect(updates()).toHaveLength(0);
  });

  it('로그인하지 않으면 401을 반환한다', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({
      userId: null,
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const response = await BATCH_PATCH(batchRequest({ action: 'recordUsage', itemIds: [TOP] }));

    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/inventory/[id] — 단건 착용 기록', () => {
  it('use_count를 1 올린다', async () => {
    state.rows = [{ id: TOP, use_count: 5 }];

    const response = await ITEM_PATCH(itemRequest(TOP), { params: Promise.resolve({ id: TOP }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(updates()[0].patch).toMatchObject({ use_count: 6 });
    expect(updates()[0].userScoped).toBe(true);
  });

  it('내 아이템이 아니면 404를 반환한다 (예전엔 조용히 성공)', async () => {
    state.rows = [];

    const response = await ITEM_PATCH(itemRequest(TOP), { params: Promise.resolve({ id: TOP }) });

    expect(response.status).toBe(404);
  });

  it('로그인하지 않으면 401을 반환한다', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({
      userId: null,
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const response = await ITEM_PATCH(itemRequest(TOP), { params: Promise.resolve({ id: TOP }) });

    expect(response.status).toBe(401);
  });
});
