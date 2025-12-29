/**
 * 쿠팡 검색 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/affiliate/coupang/search/route';
import { NextRequest } from 'next/server';

// 모듈 모킹
vi.mock('@/lib/affiliate', () => ({
  searchCoupangProducts: vi.fn().mockResolvedValue([
    {
      id: 'coupang-mock-1',
      partnerId: 'coupang',
      partnerName: 'coupang',
      externalProductId: 'mock-1',
      name: '테스트 상품 1',
      priceKrw: 15000,
      currency: 'KRW',
      affiliateUrl: 'https://link.coupang.com/a/mock-1',
      isInStock: true,
      isActive: true,
    },
  ]),
  isCoupangConfigured: vi.fn().mockReturnValue(false),
}));

describe('GET /api/affiliate/coupang/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('키워드로 검색하면 제품 목록을 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/coupang/search?keyword=비타민'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.products).toBeDefined();
    expect(data.products.length).toBeGreaterThan(0);
  });

  it('키워드가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/coupang/search'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('검색어');
  });

  it('키워드가 2자 미만이면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/coupang/search?keyword=a'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('2자');
  });

  it('limit을 지정할 수 있다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/coupang/search?keyword=영양제&limit=5'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('limit이 범위를 벗어나면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/coupang/search?keyword=영양제&limit=200'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('limit');
  });

  it('subId를 전달할 수 있다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/coupang/search?keyword=오메가3&subId=test-campaign'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('Mock 모드 상태를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/coupang/search?keyword=프로틴'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isMock');
    expect(data).toHaveProperty('isConfigured');
  });
});
