import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { POST } from '@/app/api/scan/shelf/route';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user-1' }),
}));

const mockDb = { from: vi.fn() };
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => mockDb),
}));

vi.mock('@/lib/scan/product-shelf', () => ({
  addToShelf: vi.fn(),
  getShelfItems: vi.fn(),
  getShelfCounts: vi.fn(),
}));

import { addToShelf } from '@/lib/scan/product-shelf';

const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';

describe('POST /api/scan/shelf', () => {
  beforeEach(() => vi.clearAllMocks());

  it('미인증 요청은 저장 전에 401 표준 봉투로 거부한다', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const response = await POST(
      new NextRequest('http://localhost/api/scan/shelf', {
        method: 'POST',
        body: JSON.stringify({ productName: '수분 크림', scanMethod: 'manual' }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'AUTH_ERROR' },
    });
    expect(addToShelf).not.toHaveBeenCalled();
  });

  it('검증한 제품을 인증 사용자 제품함에 넣고 표준 봉투를 반환한다', async () => {
    vi.mocked(addToShelf).mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      clerkUserId: 'user-1',
      productId: PRODUCT_ID,
      productName: '수분 크림',
      productIngredients: [],
      scannedAt: new Date('2026-08-21T00:00:00.000Z'),
      scanMethod: 'barcode',
      status: 'owned',
      createdAt: new Date('2026-08-21T00:00:00.000Z'),
      updatedAt: new Date('2026-08-21T00:00:00.000Z'),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/scan/shelf', {
        method: 'POST',
        body: JSON.stringify({
          productId: PRODUCT_ID,
          productName: '수분 크림',
          productBarcode: '8801234567890',
          scanMethod: 'barcode',
          status: 'owned',
        }),
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { productName: '수분 크림', status: 'owned' },
    });
    expect(addToShelf).toHaveBeenCalledWith(
      mockDb,
      'user-1',
      expect.objectContaining({ productId: PRODUCT_ID, scanMethod: 'barcode' })
    );
  });

  it('UUID가 아닌 제품 ID와 알 수 없는 스캔 방법을 저장 전에 거부한다', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/scan/shelf', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'affiliate-product',
          productName: '수분 크림',
          scanMethod: 'camera',
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(addToShelf).not.toHaveBeenCalled();
  });

  it('이름만 있고 스캔 방법이 없는 요청도 거부한다', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/scan/shelf', {
        method: 'POST',
        body: JSON.stringify({ productName: '수분 크림' }),
      })
    );

    expect(response.status).toBe(400);
    expect(addToShelf).not.toHaveBeenCalled();
  });
});
