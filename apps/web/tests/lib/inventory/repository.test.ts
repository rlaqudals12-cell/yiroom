/**
 * 인벤토리 Repository 테스트
 * CRUD, 통계, 의류 유틸리티 함수 검증
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과를 저장하는 변수
let terminalResult: { data: unknown; error: unknown; count?: number } = {
  data: null,
  error: null,
};

// Supabase 체이너블 mock
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.ilike = vi.fn(() => chain);
  chain.overlaps = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockChain,
}));

vi.mock('@/lib/utils/logger', () => ({
  inventoryLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  toggleFavorite,
  getSavedOutfits,
  getSavedOutfitById,
  createOutfit,
  updateOutfit,
  deleteOutfit,
  getInventoryStats,
  getTopUsedItems,
  getUnusedItems,
  getClothingByColor,
  getClothingBySeason,
  getOutfitCandidates,
} from '@/lib/inventory/repository';

// DB 행 팩토리
function createItemDB(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: 'top',
    name: '흰색 셔츠',
    image_url: '/img.jpg',
    original_image_url: null,
    brand: '유니클로',
    tags: ['캐주얼'],
    is_favorite: false,
    use_count: 5,
    last_used_at: '2026-03-01T00:00:00Z',
    expiry_date: null,
    metadata: { season: ['spring', 'autumn'], color: ['화이트'] },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

function createOutfitDB(overrides: Record<string, unknown> = {}) {
  return {
    id: 'outfit-1',
    clerk_user_id: 'user-1',
    name: '봄 코디',
    description: '봄에 어울리는 코디',
    item_ids: ['item-1', 'item-2'],
    collage_image_url: null,
    occasion: 'casual',
    season: ['spring'],
    weather_condition: null,
    wear_count: 3,
    last_worn_at: '2026-03-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

// =====================================================
// 인벤토리 아이템 CRUD
// =====================================================

describe('getInventoryItems', () => {
  it('사용자의 아이템 목록을 반환한다', async () => {
    const rows = [createItemDB(), createItemDB({ id: 'item-2', name: '검정 바지' })];
    terminalResult = { data: rows, error: null };

    const result = await getInventoryItems('user-1');

    expect(mockChain.from).toHaveBeenCalledWith('user_inventory');
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user-1');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('item-1');
    expect(result[0].name).toBe('흰색 셔츠');
  });

  it('카테고리 필터를 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getInventoryItems('user-1', { category: 'beauty' });

    expect(mockChain.eq).toHaveBeenCalledWith('category', 'beauty');
  });

  it('즐겨찾기 필터를 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getInventoryItems('user-1', { isFavorite: true });

    expect(mockChain.eq).toHaveBeenCalledWith('is_favorite', true);
  });

  it('태그 필터를 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getInventoryItems('user-1', { tags: ['캐주얼', '데일리'] });

    expect(mockChain.overlaps).toHaveBeenCalledWith('tags', ['캐주얼', '데일리']);
  });

  it('검색 필터를 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getInventoryItems('user-1', { search: '셔츠' });

    expect(mockChain.ilike).toHaveBeenCalledWith('name', '%셔츠%');
  });

  it('계절 필터를 의류에만 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getInventoryItems('user-1', { category: 'closet', season: 'spring' });

    expect(mockChain.contains).toHaveBeenCalledWith('metadata', { season: ['spring'] });
  });

  it('offset/limit 페이지네이션을 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getInventoryItems('user-1', { offset: 20, limit: 10 });

    expect(mockChain.range).toHaveBeenCalledWith(20, 29);
  });

  it('에러 발생 시 throw 한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    await expect(getInventoryItems('user-1')).rejects.toEqual({ message: 'DB error' });
  });
});

describe('getInventoryItemById', () => {
  it('아이템을 찾으면 반환한다', async () => {
    terminalResult = { data: createItemDB(), error: null };

    const result = await getInventoryItemById('user-1', 'item-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('item-1');
    expect(result?.name).toBe('흰색 셔츠');
  });

  it('아이템이 없으면 null을 반환한다', async () => {
    terminalResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } };

    const result = await getInventoryItemById('user-1', 'nonexistent');

    expect(result).toBeNull();
  });

  it('기타 에러 시 throw 한다', async () => {
    terminalResult = { data: null, error: { code: 'OTHER', message: 'Server error' } };

    await expect(getInventoryItemById('user-1', 'item-1')).rejects.toEqual({
      code: 'OTHER',
      message: 'Server error',
    });
  });
});

describe('createInventoryItem', () => {
  it('아이템을 생성하고 반환한다', async () => {
    terminalResult = { data: createItemDB(), error: null };

    const result = await createInventoryItem('user-1', {
      category: 'closet',
      name: '흰색 셔츠',
      imageUrl: '/img.jpg',
    });

    expect(mockChain.insert).toHaveBeenCalled();
    expect(result.id).toBe('item-1');
    expect(result.name).toBe('흰색 셔츠');
  });

  // 저장 정본 테이블은 user_inventory — prod 부재로 옷장 저장이 전멸했던 근본
  // (마이그레이션 20260711_user_inventory_closet.sql로 신설). 테이블명이 바뀌면 회귀.
  it('옷장 저장은 user_inventory 테이블에 코드 컬럼 전집으로 insert 한다', async () => {
    terminalResult = { data: createItemDB(), error: null };

    await createInventoryItem('user-1', {
      category: 'closet',
      subCategory: 'top',
      name: '베이지 트렌치코트',
      imageUrl: 'https://cdn/img.png',
      brand: 'ZARA',
      tags: ['데일리'],
      metadata: { color: ['베이지'], season: ['spring'], occasion: [], pattern: 'solid' },
    });

    // 테이블명 단언 (유령 배선 재발 방지)
    expect(mockChain.from).toHaveBeenCalledWith('user_inventory');

    // insert 페이로드 = DB 컬럼(snake_case) 정합 — 마이그레이션 스키마와 1:1
    const payload = mockChain.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.clerk_user_id).toBe('user-1');
    expect(payload.category).toBe('closet');
    expect(payload.sub_category).toBe('top');
    expect(payload.name).toBe('베이지 트렌치코트');
    expect(payload.image_url).toBe('https://cdn/img.png');
    expect(payload.brand).toBe('ZARA');
    expect(payload.tags).toEqual(['데일리']);
    expect(payload.metadata).toMatchObject({ color: ['베이지'], season: ['spring'] });
  });

  it('에러 발생 시 throw 한다', async () => {
    terminalResult = { data: null, error: { message: 'Insert error' } };

    await expect(
      createInventoryItem('user-1', {
        category: 'closet',
        name: '셔츠',
        imageUrl: '/img.jpg',
      })
    ).rejects.toEqual({ message: 'Insert error' });
  });
});

describe('updateInventoryItem', () => {
  it('아이템을 수정하고 반환한다', async () => {
    terminalResult = { data: createItemDB({ name: '수정된 셔츠' }), error: null };

    const result = await updateInventoryItem('user-1', 'item-1', { name: '수정된 셔츠' });

    expect(mockChain.update).toHaveBeenCalled();
    expect(result.name).toBe('수정된 셔츠');
  });

  it('에러 발생 시 throw 한다', async () => {
    terminalResult = { data: null, error: { message: 'Update error' } };

    await expect(updateInventoryItem('user-1', 'item-1', { name: 'test' })).rejects.toEqual({
      message: 'Update error',
    });
  });
});

describe('deleteInventoryItem', () => {
  it('아이템을 삭제한다', async () => {
    terminalResult = { data: null, error: null };

    await expect(deleteInventoryItem('user-1', 'item-1')).resolves.toBeUndefined();

    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user-1');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'item-1');
  });

  it('에러 발생 시 throw 한다', async () => {
    terminalResult = { data: null, error: { message: 'Delete error' } };

    await expect(deleteInventoryItem('user-1', 'item-1')).rejects.toEqual({
      message: 'Delete error',
    });
  });
});

describe('toggleFavorite', () => {
  it('즐겨찾기를 토글한다 (false -> true)', async () => {
    // getInventoryItemById 호출 시
    const getResult = createItemDB({ is_favorite: false });
    terminalResult = { data: getResult, error: null };

    // 첫 await (getInventoryItemById) 후 업데이트
    mockChain.then
      .mockImplementationOnce((resolve: (v: unknown) => void) =>
        Promise.resolve({ data: getResult, error: null }).then(resolve)
      )
      .mockImplementation((resolve: (v: unknown) => void) =>
        Promise.resolve({ data: null, error: null }).then(resolve)
      );

    const result = await toggleFavorite('user-1', 'item-1');

    expect(result).toBe(true);
  });

  it('아이템이 없으면 에러를 throw 한다', async () => {
    terminalResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } };

    await expect(toggleFavorite('user-1', 'nonexistent')).rejects.toThrow('Item not found');
  });
});

// =====================================================
// 저장된 코디 CRUD
// =====================================================

describe('getSavedOutfits', () => {
  it('코디 목록을 반환한다', async () => {
    const rows = [createOutfitDB()];
    terminalResult = { data: rows, error: null };

    const result = await getSavedOutfits('user-1');

    expect(mockChain.from).toHaveBeenCalledWith('saved_outfits');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('봄 코디');
  });

  it('occasion 필터를 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getSavedOutfits('user-1', { occasion: 'formal' });

    expect(mockChain.eq).toHaveBeenCalledWith('occasion', 'formal');
  });

  it('season 필터를 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getSavedOutfits('user-1', { season: 'summer' });

    expect(mockChain.contains).toHaveBeenCalledWith('season', ['summer']);
  });

  it('에러 발생 시 throw 한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    await expect(getSavedOutfits('user-1')).rejects.toEqual({ message: 'DB error' });
  });
});

describe('getSavedOutfitById', () => {
  it('코디를 찾으면 아이템과 함께 반환한다', async () => {
    const outfitRow = createOutfitDB();
    const itemRows = [createItemDB({ id: 'item-1', sub_category: 'top', category: 'closet' })];

    // 첫 번째 await: outfit 조회
    // 두 번째 await: items 조회
    mockChain.then
      .mockImplementationOnce((resolve: (v: unknown) => void) =>
        Promise.resolve({ data: outfitRow, error: null }).then(resolve)
      )
      .mockImplementation((resolve: (v: unknown) => void) =>
        Promise.resolve({ data: itemRows, error: null }).then(resolve)
      );

    const result = await getSavedOutfitById('user-1', 'outfit-1');

    expect(result).not.toBeNull();
    expect(result?.name).toBe('봄 코디');
    expect(result?.items).toHaveLength(1);
  });

  it('코디가 없으면 null을 반환한다', async () => {
    terminalResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } };

    const result = await getSavedOutfitById('user-1', 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('createOutfit', () => {
  it('코디를 생성하고 반환한다', async () => {
    terminalResult = { data: createOutfitDB(), error: null };

    const result = await createOutfit('user-1', {
      name: '봄 코디',
      itemIds: ['item-1', 'item-2'],
    });

    expect(mockChain.insert).toHaveBeenCalled();
    expect(result.name).toBe('봄 코디');
    expect(result.itemIds).toEqual(['item-1', 'item-2']);
  });

  it('에러 발생 시 throw 한다', async () => {
    terminalResult = { data: null, error: { message: 'Insert error' } };

    await expect(createOutfit('user-1', { name: '코디', itemIds: ['item-1'] })).rejects.toEqual({
      message: 'Insert error',
    });
  });
});

describe('updateOutfit', () => {
  it('코디를 수정하고 반환한다', async () => {
    terminalResult = { data: createOutfitDB({ name: '여름 코디' }), error: null };

    const result = await updateOutfit('user-1', 'outfit-1', { name: '여름 코디' });

    expect(mockChain.update).toHaveBeenCalled();
    expect(result.name).toBe('여름 코디');
  });
});

describe('deleteOutfit', () => {
  it('코디를 삭제한다', async () => {
    terminalResult = { data: null, error: null };

    await expect(deleteOutfit('user-1', 'outfit-1')).resolves.toBeUndefined();

    expect(mockChain.delete).toHaveBeenCalled();
  });
});

// =====================================================
// 통계
// =====================================================

describe('getInventoryStats', () => {
  it('카테고리별 통계를 반환한다', async () => {
    const now = new Date();
    const recentDate = new Date(now);
    recentDate.setDate(recentDate.getDate() - 3);
    const oldDate = new Date(now);
    oldDate.setMonth(oldDate.getMonth() - 6);

    const rows = [
      createItemDB({
        id: 'a',
        sub_category: 'top',
        is_favorite: true,
        last_used_at: recentDate.toISOString(),
      }),
      createItemDB({
        id: 'b',
        sub_category: 'bottom',
        is_favorite: false,
        last_used_at: oldDate.toISOString(),
      }),
      createItemDB({
        id: 'c',
        sub_category: 'top',
        is_favorite: false,
        last_used_at: null,
      }),
    ];
    terminalResult = { data: rows, error: null };

    const result = await getInventoryStats('user-1', 'closet');

    expect(result.total).toBe(3);
    expect(result.bySubCategory.top).toBe(2);
    expect(result.bySubCategory.bottom).toBe(1);
    expect(result.favorites).toBe(1);
    expect(result.recentlyUsed).toBe(1);
    // 미사용: oldDate(6개월 전) + null = 2개
    expect(result.unused).toBe(2);
  });

  it('의류 카테고리에서 계절별 통계를 포함한다', async () => {
    const rows = [
      createItemDB({ id: 'a', metadata: { season: ['spring', 'autumn'] } }),
      createItemDB({ id: 'b', metadata: { season: ['summer'] } }),
    ];
    terminalResult = { data: rows, error: null };

    const result = await getInventoryStats('user-1', 'closet');

    expect(result.bySeason).toBeDefined();
    expect(result.bySeason?.spring).toBe(1);
    expect(result.bySeason?.summer).toBe(1);
    expect(result.bySeason?.autumn).toBe(1);
    expect(result.bySeason?.winter).toBe(0);
  });

  it('에러 발생 시 throw 한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    await expect(getInventoryStats('user-1', 'closet')).rejects.toEqual({
      message: 'DB error',
    });
  });
});

describe('getTopUsedItems', () => {
  it('사용 횟수 순으로 아이템을 반환한다', async () => {
    const rows = [
      createItemDB({ id: 'a', use_count: 20 }),
      createItemDB({ id: 'b', use_count: 10 }),
    ];
    terminalResult = { data: rows, error: null };

    const result = await getTopUsedItems('user-1', 'closet', 5);

    expect(result).toHaveLength(2);
    expect(mockChain.gt).toHaveBeenCalledWith('use_count', 0);
    expect(mockChain.limit).toHaveBeenCalledWith(5);
  });
});

describe('getUnusedItems', () => {
  it('미사용 아이템을 반환한다', async () => {
    const rows = [createItemDB({ last_used_at: null })];
    terminalResult = { data: rows, error: null };

    const result = await getUnusedItems('user-1', 'closet');

    expect(result).toHaveLength(1);
    expect(mockChain.or).toHaveBeenCalled();
  });
});

// =====================================================
// 의류 전용 유틸리티
// =====================================================

describe('getClothingByColor', () => {
  it('특정 색상의 의류를 반환한다', async () => {
    const rows = [createItemDB({ category: 'closet', sub_category: 'top' })];
    terminalResult = { data: rows, error: null };

    const result = await getClothingByColor('user-1', '화이트');

    expect(result).toHaveLength(1);
  });
});

describe('getClothingBySeason', () => {
  it('특정 계절의 의류를 반환한다', async () => {
    const rows = [createItemDB({ category: 'closet', sub_category: 'top' })];
    terminalResult = { data: rows, error: null };

    const result = await getClothingBySeason('user-1', 'spring');

    expect(result).toHaveLength(1);
  });
});

describe('getOutfitCandidates', () => {
  it('카테고리별로 분류된 의류를 반환한다', async () => {
    const rows = [
      createItemDB({ id: 'a', category: 'closet', sub_category: 'top' }),
      createItemDB({ id: 'b', category: 'closet', sub_category: 'bottom' }),
      createItemDB({ id: 'c', category: 'closet', sub_category: 'outer' }),
      createItemDB({ id: 'd', category: 'closet', sub_category: 'shoes' }),
    ];
    terminalResult = { data: rows, error: null };

    const result = await getOutfitCandidates('user-1');

    expect(result.top).toHaveLength(1);
    expect(result.bottom).toHaveLength(1);
    expect(result.outer).toHaveLength(1);
    expect(result.shoes).toHaveLength(1);
    expect(result.bag).toHaveLength(0);
    expect(result.accessory).toHaveLength(0);
  });
});
