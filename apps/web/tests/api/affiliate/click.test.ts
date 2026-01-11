/**
 * 클릭 트래킹 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/affiliate/click/route';
import { NextRequest } from 'next/server';

// 모듈 모킹
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_test123' }),
}));

vi.mock('@/lib/affiliate/clicks', () => ({
  createAffiliateClick: vi.fn().mockResolvedValue({
    id: 'click-123',
    productId: 'product-123',
    clickedAt: new Date(),
  }),
  hashIpAddress: vi.fn().mockReturnValue('abc123hash'),
}));

vi.mock('@/lib/affiliate/products', () => ({
  getAffiliateProductById: vi.fn().mockResolvedValue({
    id: 'product-123',
    name: '테스트 제품',
    affiliateUrl: 'https://link.coupang.com/a/123',
    isActive: true,
  }),
}));

describe('POST /api/affiliate/click', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('클릭을 기록하고 어필리에이트 URL을 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-123',
        sourcePage: '/products',
        sourceComponent: 'ProductCard',
        recommendationType: 'skin_match',
      }),
      headers: {
        'x-forwarded-for': '1.2.3.4',
        'user-agent': 'Mozilla/5.0 Test',
      },
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affiliateUrl).toBe('https://link.coupang.com/a/123');
    expect(data.clickId).toBe('click-123');
  });

  it('productId가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        sourcePage: '/products',
        sourceComponent: 'ProductCard',
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(400);
    expect(data.error).toContain('필수 필드');
  });

  it('sourcePage가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-123',
        sourceComponent: 'ProductCard',
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(400);
    expect(data.error).toContain('필수 필드');
  });

  it('sourceComponent가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-123',
        sourcePage: '/products',
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(400);
    expect(data.error).toContain('필수 필드');
  });

  it('존재하지 않는 제품은 404 에러를 반환한다', async () => {
    const { getAffiliateProductById } = await import('@/lib/affiliate/products');
    vi.mocked(getAffiliateProductById).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'nonexistent-product',
        sourcePage: '/products',
        sourceComponent: 'ProductCard',
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(404);
    expect(data.error).toContain('제품을 찾을 수 없습니다');
  });

  it('클릭 기록 실패해도 어필리에이트 URL은 반환한다', async () => {
    const { createAffiliateClick } = await import('@/lib/affiliate/clicks');
    vi.mocked(createAffiliateClick).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-123',
        sourcePage: '/products',
        sourceComponent: 'ProductCard',
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affiliateUrl).toBeDefined();
    expect(data.clickId).toBeUndefined();
  });

  it('sessionId를 전달할 수 있다', async () => {
    const { createAffiliateClick } = await import('@/lib/affiliate/clicks');

    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-123',
        sourcePage: '/products',
        sourceComponent: 'ProductCard',
        sessionId: 'session-abc123',
      }),
    });

    await POST(request);

    expect(createAffiliateClick).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-abc123',
      })
    );
  });

  it('x-forwarded-for 헤더에서 IP를 추출하여 해시한다', async () => {
    const { hashIpAddress } = await import('@/lib/affiliate/clicks');

    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-123',
        sourcePage: '/products',
        sourceComponent: 'ProductCard',
      }),
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
    });

    await POST(request);

    // 첫 번째 IP만 사용
    expect(hashIpAddress).toHaveBeenCalledWith('192.168.1.1');
  });

  it('user-agent 헤더를 전달한다', async () => {
    const { createAffiliateClick } = await import('@/lib/affiliate/clicks');

    const request = new NextRequest('http://localhost/api/affiliate/click', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-123',
        sourcePage: '/products',
        sourceComponent: 'ProductCard',
      }),
      headers: {
        'user-agent': 'Mozilla/5.0 Custom Browser',
      },
    });

    await POST(request);

    expect(createAffiliateClick).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: 'Mozilla/5.0 Custom Browser',
      })
    );
  });
});
