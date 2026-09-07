/**
 * recordOutfitWear — 코디 착용 기록 원자화 회귀 가드 (2026-08 외부 리뷰 수리)
 *
 * 예전 구현: 코디 UPDATE 결과를 확인하지 않고(에러 무시), 구성 아이템은 한 벌씩 순차 기록해
 * 중간 실패 시 "일부만 기록"된 채 성공을 반환했다. 아이템 갱신 자체도 존재하지 않는 RPC에
 * 의존해 사실상 아무것도 올라가지 않았다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Op {
  table: string;
  kind: 'select' | 'update';
  patch?: Record<string, unknown>;
  ids: string[];
  userScoped: boolean;
}

const TOP = '11111111-1111-4111-8111-111111111111';
const GONE = '22222222-2222-4222-8222-222222222222';

const state = vi.hoisted(() => ({
  outfit: null as Record<string, unknown> | null,
  inventoryRows: [] as Array<Record<string, unknown>>,
  outfitUpdateError: null as unknown,
  ops: [] as Op[],
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({
    rpc: state.rpc,
    from: (table: string) => {
      const op: Op = { table, kind: 'select', ids: [], userScoped: false };
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
        single: async () => {
          state.ops.push(op);
          return state.outfit
            ? { data: state.outfit, error: null }
            : { data: null, error: { code: 'PGRST116' } };
        },
        then: (resolve: (v: unknown) => unknown) => {
          state.ops.push(op);
          const result =
            op.kind === 'update'
              ? { data: null, error: op.table === 'saved_outfits' ? state.outfitUpdateError : null }
              : { data: state.inventoryRows, error: null };
          return Promise.resolve(result).then(resolve);
        },
      });
      return builder;
    },
  }),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({}),
}));

vi.mock('@/lib/utils/logger', () => ({
  inventoryLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { recordOutfitWear, recordItemsUsage } = await import('@/lib/inventory/repository');

function inventoryRow(id: string, useCount: number) {
  return {
    id,
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: 'top',
    name: `아이템 ${id}`,
    image_url: '/img.jpg',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: useCount,
    last_used_at: null,
    expiry_date: null,
    metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

const updatesOn = (table: string): Op[] =>
  state.ops.filter((op) => op.kind === 'update' && op.table === table);

beforeEach(() => {
  vi.clearAllMocks();
  state.ops = [];
  state.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
  state.outfitUpdateError = null;
  state.outfit = {
    id: 'outfit-1',
    clerk_user_id: 'user-1',
    name: '봄 데이트룩',
    description: null,
    item_ids: [TOP],
    season: ['spring'],
    occasion: 'date',
    wear_count: 2,
    last_worn_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  state.inventoryRows = [inventoryRow(TOP, 5)];
});

describe('recordOutfitWear', () => {
  it('RPC 적용 환경은 한 호출로 기록하고 앱 UPDATE를 생략한다', async () => {
    state.rpc.mockResolvedValue({ data: [{ outfit_wear_count: 3 }], error: null });
    await recordOutfitWear('user-1', 'outfit-1');
    expect(state.rpc).toHaveBeenCalledWith('record_outfit_wear', { p_outfit_id: 'outfit-1' });
    expect(state.ops).toEqual([]);
  });

  it.each(['42501', '28000', 'XX000', '42883'])(
    'RPC 실행 오류 %s는 폴백하지 않는다',
    async (code) => {
      const error = { code, message: 'internal failure' };
      state.rpc.mockResolvedValue({ data: null, error });
      await expect(recordOutfitWear('user-1', 'outfit-1')).rejects.toEqual(error);
      expect(state.ops).toEqual([]);
    }
  );

  it('RPC에서 없는 코디는 기존 not found 계약으로 전파한다', async () => {
    state.rpc.mockResolvedValue({ error: { code: 'P0002' } });
    await expect(recordOutfitWear('user-1', 'outfit-1')).rejects.toThrow('Outfit not found');
    expect(state.ops).toEqual([]);
  });
  it('코디와 구성 아이템의 카운트를 함께 올린다', async () => {
    await recordOutfitWear('user-1', 'outfit-1');

    expect(updatesOn('saved_outfits')[0].patch).toMatchObject({ wear_count: 3 });
    expect(updatesOn('user_inventory')[0].patch).toMatchObject({ use_count: 6 });
  });

  it('코디 UPDATE에 소유자 스코프를 건다 (RLS에만 기대지 않음)', async () => {
    await recordOutfitWear('user-1', 'outfit-1');

    expect(updatesOn('saved_outfits')[0].userScoped).toBe(true);
  });

  it('코디 갱신이 실패하면 아이템을 건드리지 않고 에러를 전파한다', async () => {
    state.outfitUpdateError = { message: 'update failed' };

    await expect(recordOutfitWear('user-1', 'outfit-1')).rejects.toBeTruthy();
    expect(updatesOn('user_inventory')).toHaveLength(0);
  });

  it('내 코디가 아니면 실패한다', async () => {
    state.outfit = null;

    await expect(recordOutfitWear('user-1', 'outfit-1')).rejects.toThrow('Outfit not found');
    expect(updatesOn('saved_outfits')).toHaveLength(0);
  });

  // 저장된 코디는 나중에 옷장에서 지운 옷을 계속 가리킬 수 있다
  it('이미 삭제된 구성 아이템이 있어도 남아 있는 옷은 기록한다', async () => {
    state.outfit = { ...state.outfit, item_ids: [TOP, GONE] };
    state.inventoryRows = [inventoryRow(TOP, 5)]; // GONE은 조회되지 않음

    await recordOutfitWear('user-1', 'outfit-1');

    const itemUpdate = updatesOn('user_inventory')[0];
    expect(itemUpdate.ids).toEqual([TOP]);
    expect(itemUpdate.patch).toMatchObject({ use_count: 6 });
  });
});

describe('recordItemsUsage RPC', () => {
  it('중복 ID를 제거하고 requireAll을 전달한다', async () => {
    state.rpc.mockResolvedValue({ error: null });
    await recordItemsUsage('user-1', [TOP, TOP], { requireAll: false });
    expect(state.rpc).toHaveBeenCalledWith('record_inventory_usage', {
      p_item_ids: [TOP],
      p_require_all: false,
    });
    expect(state.ops).toEqual([]);
  });

  it('빈 입력은 DB에 접근하지 않는다', async () => {
    await recordItemsUsage('user-1', []);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('RPC 없는 환경에서 직접 기록하며 소유자를 제한한다', async () => {
    state.rpc.mockResolvedValue({
      error: { code: '42883', message: 'function public.record_inventory_usage does not exist' },
    });
    await recordItemsUsage('user-1', [TOP]);
    expect(updatesOn('user_inventory')[0]).toMatchObject({
      userScoped: true,
      patch: { use_count: 6 },
    });
  });

  it.each(['42501', '28000', 'XX000', '42883'])(
    'RPC 실행 오류 %s는 폴백하지 않는다',
    async (code) => {
      const error = { code, message: 'internal failure' };
      state.rpc.mockResolvedValue({ error });
      await expect(recordItemsUsage('user-1', [TOP])).rejects.toEqual(error);
      expect(state.ops).toEqual([]);
    }
  );

  it('RPC 미적용 환경도 요청한 아이템 전체 소유권을 확인한다', async () => {
    await expect(recordItemsUsage('user-1', [TOP, GONE])).rejects.toThrow('Item not found');
    expect(updatesOn('user_inventory')).toEqual([]);
  });

  it('RPC not found는 기존 오류 계약으로 변환한다', async () => {
    state.rpc.mockResolvedValue({ error: { code: 'P0002' } });
    await expect(recordItemsUsage('user-1', [TOP])).rejects.toThrow('Item not found');
    expect(state.ops).toEqual([]);
  });
});
