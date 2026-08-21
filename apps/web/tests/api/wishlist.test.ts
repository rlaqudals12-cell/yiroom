import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { DELETE, GET, POST } from '@/app/api/wishlist/route';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user-1' }),
}));

const mockProductLookup = vi.fn();
const mockDb = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({ in: mockProductLookup })),
  })),
};
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => mockDb),
}));

vi.mock('@/lib/wishlist', () => ({
  addToWishlist: vi.fn(),
  checkWishlistStatusOrThrow: vi.fn(),
  getUserWishlistOrThrow: vi.fn(),
  removeFromWishlist: vi.fn(),
}));

import {
  addToWishlist,
  checkWishlistStatusOrThrow,
  getUserWishlistOrThrow,
  removeFromWishlist,
} from '@/lib/wishlist';

const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
const WISHLIST_ID = '11111111-1111-4111-8111-111111111111';

describe('/api/wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductLookup.mockResolvedValue({ data: [], error: null });
  });

  it('미인증 요청은 DB 호출 전에 401 표준 봉투로 거부한다', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const response = await GET(new NextRequest('http://localhost/api/wishlist'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'AUTH_ERROR' },
    });
    expect(getUserWishlistOrThrow).not.toHaveBeenCalled();
  });

  it('서버 목록을 실제 제품 메타와 결합해 성공 봉투로 반환한다', async () => {
    vi.mocked(getUserWishlistOrThrow).mockResolvedValue([
      {
        id: WISHLIST_ID,
        clerkUserId: 'user-1',
        productType: 'cosmetic',
        productId: PRODUCT_ID,
        createdAt: '2026-08-21T00:00:00.000Z',
      },
    ]);
    mockProductLookup.mockResolvedValue({
      data: [{ id: PRODUCT_ID, name: '수분 크림', brand: '이룸랩', price_krw: 19000 }],
      error: null,
    });

    const response = await GET(new NextRequest('http://localhost/api/wishlist'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        items: [
          {
            productType: 'cosmetic',
            productId: PRODUCT_ID,
            name: '수분 크림',
            brand: '이룸랩',
            priceKrw: 19000,
          },
        ],
      },
    });
    expect(mockDb.from).toHaveBeenCalledWith('cosmetic_products');
  });

  it('제품 메타가 실제 테이블에 없으면 식별자를 유지하고 문구를 지어내지 않는다', async () => {
    vi.mocked(getUserWishlistOrThrow).mockResolvedValue([
      {
        id: WISHLIST_ID,
        clerkUserId: 'user-1',
        productType: 'health_food',
        productId: PRODUCT_ID,
        createdAt: '2026-08-21T00:00:00.000Z',
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/wishlist'));
    const payload = await response.json();

    expect(payload.data.items[0]).toEqual(
      expect.objectContaining({ productType: 'health_food', productId: PRODUCT_ID })
    );
    expect(payload.data.items[0]).not.toHaveProperty('name');
    expect(mockDb.from).toHaveBeenCalledWith('health_foods');
  });

  it('위시리스트 DB 실패를 성공한 빈 목록으로 위장하지 않는다', async () => {
    vi.mocked(getUserWishlistOrThrow).mockRejectedValue(new Error('database unavailable'));

    const response = await GET(new NextRequest('http://localhost/api/wishlist'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'INTERNAL_ERROR' },
    });
  });

  it('제품 상태 조회도 DB 실패를 false로 위장하지 않는다', async () => {
    vi.mocked(checkWishlistStatusOrThrow).mockRejectedValue(new Error('database unavailable'));
    const response = await GET(
      new NextRequest(`http://localhost/api/wishlist?productType=cosmetic&productId=${PRODUCT_ID}`)
    );

    expect(response.status).toBe(500);
  });

  it('UUID가 아닌 제품 ID와 모바일 별칭 enum을 저장 전에 거부한다', async () => {
    const invalidId = await POST(
      new NextRequest('http://localhost/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productType: 'cosmetic', productId: 'product-1' }),
      })
    );
    const invalidType = await POST(
      new NextRequest('http://localhost/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productType: 'equipment', productId: PRODUCT_ID }),
      })
    );

    expect(invalidId.status).toBe(400);
    expect(invalidType.status).toBe(400);
    expect(addToWishlist).not.toHaveBeenCalled();
  });

  it('검증된 DB enum과 UUID로 추가·삭제한다', async () => {
    vi.mocked(addToWishlist).mockResolvedValue({ success: true });
    vi.mocked(removeFromWishlist).mockResolvedValue({ success: true });
    const body = { productType: 'workout_equipment', productId: PRODUCT_ID };

    const postResponse = await POST(
      new NextRequest('http://localhost/api/wishlist', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
    const deleteResponse = await DELETE(
      new NextRequest('http://localhost/api/wishlist', {
        method: 'DELETE',
        body: JSON.stringify(body),
      })
    );

    expect(postResponse.status).toBe(201);
    await expect(postResponse.json()).resolves.toEqual({
      success: true,
      data: { isWishlisted: true },
    });
    await expect(deleteResponse.json()).resolves.toEqual({
      success: true,
      data: { isWishlisted: false },
    });
    expect(addToWishlist).toHaveBeenCalledWith(mockDb, 'user-1', 'workout_equipment', PRODUCT_ID);
    expect(removeFromWishlist).toHaveBeenCalledWith(
      mockDb,
      'user-1',
      'workout_equipment',
      PRODUCT_ID
    );
  });
});
