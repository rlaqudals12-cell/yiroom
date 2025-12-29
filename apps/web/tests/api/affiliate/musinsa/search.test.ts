/**
 * 무신사 검색 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/affiliate/musinsa/search/route';
import { NextRequest } from 'next/server';

// 모듈 모킹
vi.mock('@/lib/affiliate/musinsa', () => ({
  searchMusinsaProducts: vi.fn().mockResolvedValue([
    {
      id: 'musinsa-mock-1',
      partnerId: 'musinsa',
      partnerName: 'musinsa',
      externalProductId: 'MSS-001',
      name: '무신사 스탠다드 에센셜 반팔티',
      brand: '무신사 스탠다드',
      priceKrw: 19900,
      currency: 'KRW',
      affiliateUrl: 'https://www.musinsa.com/app/goods/3000001?curator=MOCK123',
      isInStock: true,
      isActive: true,
    },
  ]),
  isMusinsaConfigured: vi.fn().mockReturnValue(false),
  MUSINSA_CATEGORIES: {
    top: { ko: '상의', id: '001' },
    outer: { ko: '아우터', id: '002' },
    pants: { ko: '바지', id: '003' },
    onepiece: { ko: '원피스', id: '020' },
    skirt: { ko: '스커트', id: '022' },
    bag: { ko: '가방', id: '004' },
    shoes: { ko: '신발', id: '005' },
    accessory: { ko: '액세서리', id: '006' },
  },
}));

describe('GET /api/affiliate/musinsa/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('키워드로 검색하면 제품 목록을 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?keyword=반팔'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.products).toBeDefined();
    expect(data.products.length).toBeGreaterThan(0);
  });

  it('카테고리로 검색할 수 있다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?category=top'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('키워드와 카테고리 모두 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('검색어');
  });

  it('키워드가 2자 미만이면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?keyword=a'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('2자');
  });

  it('유효하지 않은 카테고리면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?category=invalid'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('카테고리');
  });

  it('limit을 지정할 수 있다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?keyword=맨투맨&limit=5'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('limit이 범위를 벗어나면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?keyword=후드&limit=200'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('limit');
  });

  it('subId를 전달할 수 있다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?keyword=가디건&subId=test-campaign'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('Mock 모드 상태를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/musinsa/search?keyword=신발'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isMock');
    expect(data).toHaveProperty('isConfigured');
  });
});
