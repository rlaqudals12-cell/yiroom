/**
 * iHerb 검색 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/affiliate/iherb/search/route';
import { NextRequest } from 'next/server';

// 모듈 모킹
vi.mock('@/lib/affiliate', () => ({
  searchIHerbProducts: vi.fn().mockResolvedValue([
    {
      id: 'iherb-mock-1',
      partnerId: 'iherb',
      partnerName: 'iherb',
      externalProductId: 'CGN-01066',
      name: '테스트 비타민 D',
      brand: 'California Gold Nutrition',
      priceKrw: 17500,
      currency: 'KRW',
      affiliateUrl: 'https://kr.iherb.com/pr/test?rcode=MOCK123',
      isInStock: true,
      isActive: true,
    },
  ]),
  isIHerbConfigured: vi.fn().mockReturnValue(false),
  IHERB_CATEGORIES: {
    supplements: { ko: '영양제', id: '2' },
    vitamins: { ko: '비타민', id: '3' },
    sports: { ko: '스포츠 영양', id: '7' },
    beauty: { ko: '뷰티', id: '4' },
    bath: { ko: '목욕/퍼스널케어', id: '5' },
    grocery: { ko: '식료품', id: '6' },
    baby: { ko: '유아', id: '8' },
    pets: { ko: '반려동물', id: '9' },
  },
}));

describe('GET /api/affiliate/iherb/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('키워드로 검색하면 제품 목록을 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search?keyword=비타민'
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
      'http://localhost/api/affiliate/iherb/search?category=supplements'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('키워드와 카테고리 모두 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('검색어');
  });

  it('키워드가 2자 미만이면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search?keyword=a'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('2자');
  });

  it('유효하지 않은 카테고리면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search?category=invalid'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('카테고리');
  });

  it('limit을 지정할 수 있다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search?keyword=오메가&limit=5'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('limit이 범위를 벗어나면 400 에러를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search?keyword=프로틴&limit=200'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('limit');
  });

  it('subId를 전달할 수 있다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search?keyword=마그네슘&subId=test-campaign'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('Mock 모드 상태를 반환한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/iherb/search?keyword=아연'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isMock');
    expect(data).toHaveProperty('isConfigured');
  });
});
