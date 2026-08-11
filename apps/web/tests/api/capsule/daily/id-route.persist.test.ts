/**
 * PATCH /api/capsule/daily/[id] — 저장 형상 회귀 테스트 (end-to-end)
 *
 * 라우트 → 실제 checkDailyItems → items JSONB를 실제로 보관하는 Supabase 스텁까지 통과시킨다.
 * lib을 mock한 계약 테스트만으론 "그린인데 저장 안 됨"을 못 잡기 때문에,
 * 여기선 실제 저장된 items 배열을 단언한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DailyItem } from '@/types/capsule';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

const mockSupabaseFrom = vi.fn();
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({ from: mockSupabaseFrom }),
}));

import { PATCH } from '@/app/api/capsule/daily/[id]/route';
import { auth } from '@clerk/nextjs/server';

function makeRequest(body: unknown): Parameters<typeof PATCH>[0] {
  return { json: async () => body } as Parameters<typeof PATCH>[0];
}

const params = { params: Promise.resolve({ id: 'daily-1' }) };

function makeItems(ids: string[]): DailyItem[] {
  return ids.map((id) => ({
    id,
    moduleCode: 'S',
    name: `Item ${id}`,
    reason: '이유',
    compatibilityScore: 80,
    isChecked: false,
  }));
}

/** items를 실제로 보관하는 daily_capsules 스텁 (JSONB 통짜 read-modify-write 재현) */
function stubStore(initial: DailyItem[]): { items: DailyItem[]; status: string } {
  const store = { items: initial, status: 'pending' };
  const row = (): Record<string, unknown> => ({
    id: 'daily-1',
    clerk_user_id: 'user_test',
    date: '2026-08-01',
    items: store.items.map((item) => ({ ...item })),
    total_ccs: 80,
    estimated_minutes: 15,
    status: store.status,
    completed_at: null,
    created_at: '2026-08-01T00:00:00Z',
  });

  const eqPair = <T>(leaf: T): unknown => ({ eq: () => ({ eq: () => leaf }) });

  mockSupabaseFrom.mockReturnValue({
    select: () => eqPair({ single: async () => ({ data: row(), error: null }) }),
    update: (payload: { items: DailyItem[]; status: string }) => {
      store.items = payload.items;
      store.status = payload.status;
      return eqPair({ select: () => ({ single: async () => ({ data: row(), error: null }) }) });
    },
  });

  return store;
}

describe('PATCH /api/capsule/daily/[id] — 저장 형상', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test' } as never);
  });

  it('"모두 완료"(itemIds 4개)가 4/4로 저장된다 — 경합 유실 회귀 방지', async () => {
    const store = stubStore(makeItems(['i1', 'i2', 'i3', 'i4']));

    const response = await PATCH(
      makeRequest({ itemIds: ['i1', 'i2', 'i3', 'i4'], isChecked: true }),
      params
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    // 저장된 형상 = 4/4 (화면만 4/4이고 새로고침하면 1/4이던 결함의 직접 회귀)
    expect(store.items.filter((item) => item.isChecked)).toHaveLength(4);
    expect(store.status).toBe('completed');
    // 응답도 저장 형상과 일치해야 한다 (재조회 없이 화면이 신뢰할 수 있도록)
    expect(json.data.items.every((item: DailyItem) => item.isChecked)).toBe(true);
  });

  it('단수(itemId) 계약도 해당 아이템만 저장한다 (모바일 하위호환)', async () => {
    const store = stubStore(makeItems(['i1', 'i2']));

    const response = await PATCH(makeRequest({ itemId: 'i2', isChecked: true }), params);

    expect(response.status).toBe(200);
    expect(store.items.map((item) => item.isChecked)).toEqual([false, true]);
    expect(store.status).toBe('in_progress');
  });
});
