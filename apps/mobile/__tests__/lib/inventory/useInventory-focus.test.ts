/**
 * useInventory/useCloset — 포커스 복귀 재조회 회귀 테스트
 *
 * 회귀 배경(실측): 옷 등록에 성공해도 메인 옷장 목록이 갱신되지 않아 사용자가 "등록 실패"로
 * 오인했다. 원인은 마운트 전용 useEffect — 이미 마운트된 목록 화면은 등록/삭제 화면에서
 * 돌아와도 재조회하지 않았다. 이제 useFocusEffect로 포커스마다 재조회한다.
 *
 * 함께 고정하는 것:
 *  - 삭제 후 복귀 시 유령 아이템이 남지 않는다
 *  - 포커스 재조회는 전체 스켈레톤을 다시 띄우지 않는다(isLoading 유지 / isRefreshing만 토글)
 */
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useFocusEffect } from 'expo-router';

import type { InventoryItemRow } from '../../../lib/inventory/types';

// -------------------------------------------------------------------
// Supabase 모킹 — from().select().eq().order().eq() 체인 후 await
// -------------------------------------------------------------------
let rows: InventoryItemRow[] = [];
let fetchCount = 0;

function makeBuilder(): Record<string, unknown> {
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    order: () => b,
    then: (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
      fetchCount += 1;
      return Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected);
    },
  };
  return b;
}

const mockClient = { from: () => makeBuilder() };

jest.mock('@/lib/supabase', () => ({
  useClerkSupabaseClient: () => mockClient,
}));

import { useCloset } from '../../../lib/inventory/useInventory';

// -------------------------------------------------------------------
// 테스트 데이터
// -------------------------------------------------------------------
function makeRow(id: string, name: string): InventoryItemRow {
  return {
    id,
    clerk_user_id: 'test_user_123',
    category: 'closet',
    sub_category: 'top',
    name,
    image_url: '',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 0,
    last_used_at: null,
    expiry_date: null,
    metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

const shirtRow = makeRow('item1', '흰 티');
const pantsRow = makeRow('item2', '청바지');

/**
 * 화면 재포커스 시뮬레이션 — useFocusEffect에 등록된 최신 콜백을 다시 실행한다.
 * (jest.setup의 mock은 마운트 시 1회만 실행하므로, 재포커스는 여기서 명시적으로 발화)
 */
async function refocus(): Promise<void> {
  const calls = (useFocusEffect as unknown as jest.Mock).mock.calls;
  const callback = calls[calls.length - 1][0] as () => void;
  await act(async () => {
    callback();
  });
}

describe('useCloset — 포커스 복귀 재조회', () => {
  beforeEach(() => {
    rows = [shirtRow];
    fetchCount = 0;
    (useFocusEffect as unknown as jest.Mock).mockClear();
  });

  it('마운트 시 목록을 1회 조회한다', async () => {
    const { result } = renderHook(() => useCloset());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(fetchCount).toBe(1);
  });

  it('포커스 복귀 시 재조회해 새로 등록된 아이템이 목록에 나타난다', async () => {
    const { result } = renderHook(() => useCloset());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    // 등록 화면에서 아이템이 추가된 상황 (서버에는 2벌)
    rows = [pantsRow, shirtRow];
    await refocus();

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((i) => i.name)).toContain('청바지');
    expect(fetchCount).toBe(2);
  });

  it('삭제된 아이템은 포커스 복귀 후 사라진다 (유령 아이템 잔존 방지)', async () => {
    const { result } = renderHook(() => useCloset());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    // 상세 화면에서 삭제된 상황 (서버에는 0벌)
    rows = [];
    await refocus();

    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });

  it('포커스 재조회는 전체 스켈레톤을 다시 띄우지 않는다 (isLoading 유지)', async () => {
    const loadingHistory: boolean[] = [];
    const { result } = renderHook(() => {
      const closet = useCloset();
      loadingHistory.push(closet.isLoading);
      return closet;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const markerIndex = loadingHistory.length;

    rows = [pantsRow, shirtRow];
    await refocus();
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    // 최초 로드 이후 렌더에서 isLoading이 다시 true가 된 적이 없어야 한다
    expect(loadingHistory.slice(markerIndex)).not.toContain(true);
    // 재조회가 끝나면 isRefreshing도 내려간다
    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
  });
});
