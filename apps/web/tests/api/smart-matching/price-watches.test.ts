/**
 * 가격 모니터링 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/smart-matching/price-watches/route';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

vi.mock('@/lib/smart-matching', () => ({
  getPriceWatches: vi.fn(),
  getPriceWatchByProduct: vi.fn(),
  createPriceWatch: vi.fn(),
}));

import { getPriceWatches, getPriceWatchByProduct, createPriceWatch } from '@/lib/smart-matching';

describe('GET /api/smart-matching/price-watches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용자의 가격 알림 목록을 반환한다', async () => {
    const mockWatches = [
      {
        id: 'watch-1',
        productId: 'product-1',
        targetPrice: 45000,
        platforms: ['coupang'],
        notified: false,
      },
    ];

    vi.mocked(getPriceWatches).mockResolvedValue(mockWatches as never);

    const request = new NextRequest('http://localhost/api/smart-matching/price-watches');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].targetPrice).toBe(45000);
  });

  it('productId가 있으면 해당 제품의 알림만 반환한다', async () => {
    const mockWatch = {
      id: 'watch-1',
      productId: 'product-1',
      targetPrice: 45000,
      platforms: ['coupang'],
    };

    vi.mocked(getPriceWatchByProduct).mockResolvedValue(mockWatch as never);

    const request = new NextRequest(
      'http://localhost/api/smart-matching/price-watches?productId=product-1'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.productId).toBe('product-1');
  });

  it('인증되지 않으면 401을 반환한다', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

    const request = new NextRequest('http://localhost/api/smart-matching/price-watches');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

describe('POST /api/smart-matching/price-watches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('가격 알림을 생성한다', async () => {
    vi.mocked(getPriceWatchByProduct).mockResolvedValue(null);
    vi.mocked(createPriceWatch).mockResolvedValue({
      id: 'watch-new',
      productId: 'product-1',
      targetPrice: 40000,
      platforms: ['coupang'],
      notified: false,
      createdAt: new Date(),
    } as never);

    const request = new NextRequest('http://localhost/api/smart-matching/price-watches', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        targetPrice: 40000,
        platforms: ['coupang'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.targetPrice).toBe(40000);
  });

  it('productId 없이 요청하면 400을 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/smart-matching/price-watches', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('이미 등록된 알림이면 409를 반환한다', async () => {
    vi.mocked(getPriceWatchByProduct).mockResolvedValue({
      id: 'existing-watch',
      productId: 'product-1',
      targetPrice: 45000,
      platforms: ['coupang'],
    } as never);

    const request = new NextRequest('http://localhost/api/smart-matching/price-watches', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        targetPrice: 40000,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
  });

  it('percentDrop 조건으로 알림을 생성할 수 있다', async () => {
    vi.mocked(getPriceWatchByProduct).mockResolvedValue(null);
    vi.mocked(createPriceWatch).mockResolvedValue({
      id: 'watch-new',
      productId: 'product-1',
      percentDrop: 20,
      platforms: ['coupang', 'naver'],
      notified: false,
      createdAt: new Date(),
    } as never);

    const request = new NextRequest('http://localhost/api/smart-matching/price-watches', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        percentDrop: 20,
        platforms: ['coupang', 'naver'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.percentDrop).toBe(20);
  });
});
