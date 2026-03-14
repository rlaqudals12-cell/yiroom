/**
 * 제품함 Repository 테스트
 * CRUD, 바코드 조회, 상태별 카운트 검증
 */
import { describe, it, expect, vi } from 'vitest';

import {
  getShelfItems,
  getRecentScans,
  addToShelf,
  getShelfItem,
  updateShelfItem,
  removeFromShelf,
  findByBarcode,
  getShelfCounts,
} from '@/lib/scan/product-shelf';

// 제품함 DB 행 팩토리
function createShelfRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'shelf-1',
    clerk_user_id: 'user-1',
    product_id: 'prod-1',
    product_name: 'AHA BHA PHA 토너',
    product_brand: 'SOME BY MI',
    product_barcode: '8809598453234',
    product_image_url: 'https://example.com/img.jpg',
    product_ingredients: [{ order: 1, inciName: 'WATER', nameKo: '정제수', concentration: 'high' }],
    scanned_at: '2026-03-01T10:00:00Z',
    scan_method: 'barcode',
    compatibility_score: 85,
    analysis_result: null,
    status: 'owned',
    user_note: null,
    rating: null,
    purchased_at: null,
    opened_at: null,
    expires_at: null,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

// Supabase mock 생성 함수
function createMockSupabase(data: unknown = null, error: unknown = null, count: number = 0) {
  const terminalResult = { data, error, count };
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
}

describe('getShelfItems', () => {
  it('사용자의 제품함 목록을 반환한다', async () => {
    const rows = [
      createShelfRow(),
      createShelfRow({ id: 'shelf-2', product_name: '스네일 에센스' }),
    ];
    const supabase = createMockSupabase(rows, null, 2);

    const result = await getShelfItems(supabase as never, 'user-1');

    expect(supabase.from).toHaveBeenCalledWith('user_product_shelf');
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items[0].productName).toBe('AHA BHA PHA 토너');
  });

  it('status 필터를 적용한다', async () => {
    const supabase = createMockSupabase([], null, 0);

    await getShelfItems(supabase as never, 'user-1', { status: 'wishlist' });

    expect(supabase.eq).toHaveBeenCalledWith('status', 'wishlist');
  });

  it('limit을 적용한다', async () => {
    const supabase = createMockSupabase([], null, 0);

    await getShelfItems(supabase as never, 'user-1', { limit: 5 });

    expect(supabase.limit).toHaveBeenCalledWith(5);
  });

  it('offset/limit 페이지네이션을 적용한다', async () => {
    const supabase = createMockSupabase([], null, 0);

    await getShelfItems(supabase as never, 'user-1', { offset: 10, limit: 5 });

    expect(supabase.range).toHaveBeenCalledWith(10, 14);
  });

  it('에러 발생 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { message: 'DB error' });

    await expect(getShelfItems(supabase as never, 'user-1')).rejects.toEqual({
      message: 'DB error',
    });
  });
});

describe('getRecentScans', () => {
  it('최근 스캔 목록을 반환한다', async () => {
    const rows = [createShelfRow()];
    const supabase = createMockSupabase(rows);

    const result = await getRecentScans(supabase as never, 'user-1', 10);

    expect(result).toHaveLength(1);
    expect(supabase.limit).toHaveBeenCalledWith(10);
    expect(supabase.order).toHaveBeenCalledWith('scanned_at', { ascending: false });
  });

  it('기본 limit은 10이다', async () => {
    const supabase = createMockSupabase([]);

    await getRecentScans(supabase as never, 'user-1');

    expect(supabase.limit).toHaveBeenCalledWith(10);
  });

  it('에러 발생 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { message: 'DB error' });

    await expect(getRecentScans(supabase as never, 'user-1')).rejects.toEqual({
      message: 'DB error',
    });
  });
});

describe('addToShelf', () => {
  it('제품함에 아이템을 추가한다', async () => {
    const row = createShelfRow();
    const supabase = createMockSupabase(row);

    const result = await addToShelf(supabase as never, 'user-1', {
      productName: 'AHA BHA PHA 토너',
      productBrand: 'SOME BY MI',
      scanMethod: 'barcode',
    });

    expect(supabase.insert).toHaveBeenCalled();
    expect(result.productName).toBe('AHA BHA PHA 토너');
    expect(result.scanMethod).toBe('barcode');
  });

  it('에러 발생 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { message: 'Insert error' });

    await expect(
      addToShelf(supabase as never, 'user-1', {
        productName: '제품',
        scanMethod: 'manual',
      })
    ).rejects.toEqual({ message: 'Insert error' });
  });
});

describe('getShelfItem', () => {
  it('아이템을 찾으면 반환한다', async () => {
    const supabase = createMockSupabase(createShelfRow());

    const result = await getShelfItem(supabase as never, 'user-1', 'shelf-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('shelf-1');
    expect(result?.productName).toBe('AHA BHA PHA 토너');
    expect(result?.productIngredients).toHaveLength(1);
  });

  it('아이템이 없으면 null을 반환한다 (PGRST116)', async () => {
    const supabase = createMockSupabase(null, { code: 'PGRST116', message: 'Not found' });

    const result = await getShelfItem(supabase as never, 'user-1', 'nonexistent');

    expect(result).toBeNull();
  });

  it('기타 에러 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { code: 'OTHER', message: 'Server error' });

    await expect(getShelfItem(supabase as never, 'user-1', 'item-1')).rejects.toEqual({
      code: 'OTHER',
      message: 'Server error',
    });
  });
});

describe('updateShelfItem', () => {
  it('아이템을 수정하고 반환한다', async () => {
    const supabase = createMockSupabase(createShelfRow({ status: 'used_up', rating: 4 }));

    const result = await updateShelfItem(supabase as never, 'user-1', 'shelf-1', {
      status: 'used_up',
      rating: 4,
    });

    expect(supabase.update).toHaveBeenCalled();
    expect(result.status).toBe('used_up');
    expect(result.rating).toBe(4);
  });

  it('에러 발생 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { message: 'Update error' });

    await expect(
      updateShelfItem(supabase as never, 'user-1', 'shelf-1', { status: 'archived' })
    ).rejects.toEqual({ message: 'Update error' });
  });
});

describe('removeFromShelf', () => {
  it('아이템을 삭제한다', async () => {
    const supabase = createMockSupabase(null, null);

    await expect(removeFromShelf(supabase as never, 'user-1', 'shelf-1')).resolves.toBeUndefined();

    expect(supabase.delete).toHaveBeenCalled();
    expect(supabase.eq).toHaveBeenCalledWith('clerk_user_id', 'user-1');
    expect(supabase.eq).toHaveBeenCalledWith('id', 'shelf-1');
  });

  it('에러 발생 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { message: 'Delete error' });

    await expect(removeFromShelf(supabase as never, 'user-1', 'shelf-1')).rejects.toEqual({
      message: 'Delete error',
    });
  });
});

describe('findByBarcode', () => {
  it('바코드로 아이템을 찾는다', async () => {
    const supabase = createMockSupabase(createShelfRow());

    const result = await findByBarcode(supabase as never, 'user-1', '8809598453234');

    expect(result).not.toBeNull();
    expect(result?.productBarcode).toBe('8809598453234');
    expect(supabase.eq).toHaveBeenCalledWith('product_barcode', '8809598453234');
  });

  it('바코드가 없으면 null을 반환한다', async () => {
    const supabase = createMockSupabase(null, { code: 'PGRST116', message: 'Not found' });

    const result = await findByBarcode(supabase as never, 'user-1', '0000000000000');

    expect(result).toBeNull();
  });

  it('기타 에러 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { code: 'OTHER', message: 'Server error' });

    await expect(findByBarcode(supabase as never, 'user-1', '123')).rejects.toEqual({
      code: 'OTHER',
      message: 'Server error',
    });
  });
});

describe('getShelfCounts', () => {
  it('상태별 아이템 수를 반환한다', async () => {
    const data = [
      { status: 'owned' },
      { status: 'owned' },
      { status: 'wishlist' },
      { status: 'used_up' },
      { status: 'owned' },
    ];
    const supabase = createMockSupabase(data);

    const result = await getShelfCounts(supabase as never, 'user-1');

    expect(result.owned).toBe(3);
    expect(result.wishlist).toBe(1);
    expect(result.used_up).toBe(1);
    expect(result.archived).toBe(0);
  });

  it('빈 데이터일 때 모든 카운트가 0이다', async () => {
    const supabase = createMockSupabase([]);

    const result = await getShelfCounts(supabase as never, 'user-1');

    expect(result.owned).toBe(0);
    expect(result.wishlist).toBe(0);
    expect(result.used_up).toBe(0);
    expect(result.archived).toBe(0);
  });

  it('에러 발생 시 throw 한다', async () => {
    const supabase = createMockSupabase(null, { message: 'DB error' });

    await expect(getShelfCounts(supabase as never, 'user-1')).rejects.toEqual({
      message: 'DB error',
    });
  });
});

// =====================================================
// rowToShelfItem 변환 검증 (통합)
// =====================================================

describe('rowToShelfItem 변환 (통합 검증)', () => {
  it('DB 행의 snake_case를 camelCase로 변환한다', async () => {
    const row = createShelfRow({
      product_brand: 'COSRX',
      user_note: '매일 사용',
      rating: 5,
      purchased_at: '2026-01-15T00:00:00Z',
      opened_at: '2026-02-01T00:00:00Z',
      expires_at: '2026-12-31T00:00:00Z',
    });
    const supabase = createMockSupabase(row);

    const result = await getShelfItem(supabase as never, 'user-1', 'shelf-1');

    expect(result?.productBrand).toBe('COSRX');
    expect(result?.userNote).toBe('매일 사용');
    expect(result?.rating).toBe(5);
    expect(result?.purchasedAt).toBeInstanceOf(Date);
    expect(result?.openedAt).toBeInstanceOf(Date);
    expect(result?.expiresAt).toBeInstanceOf(Date);
  });

  it('null 필드를 undefined로 변환한다', async () => {
    const row = createShelfRow({
      product_id: null,
      product_brand: null,
      product_barcode: null,
      user_note: null,
      rating: null,
      purchased_at: null,
    });
    const supabase = createMockSupabase(row);

    const result = await getShelfItem(supabase as never, 'user-1', 'shelf-1');

    expect(result?.productId).toBeUndefined();
    expect(result?.productBrand).toBeUndefined();
    expect(result?.productBarcode).toBeUndefined();
    expect(result?.userNote).toBeUndefined();
    expect(result?.rating).toBeUndefined();
    expect(result?.purchasedAt).toBeUndefined();
  });

  it('scan_method가 null이면 manual로 기본값 적용', async () => {
    const row = createShelfRow({ scan_method: null });
    const supabase = createMockSupabase(row);

    const result = await getShelfItem(supabase as never, 'user-1', 'shelf-1');

    expect(result?.scanMethod).toBe('manual');
  });

  it('status가 null이면 owned로 기본값 적용', async () => {
    const row = createShelfRow({ status: null });
    const supabase = createMockSupabase(row);

    const result = await getShelfItem(supabase as never, 'user-1', 'shelf-1');

    expect(result?.status).toBe('owned');
  });
});
