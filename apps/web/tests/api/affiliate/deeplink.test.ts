/**
 * 딥링크 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, PUT } from '@/app/api/affiliate/deeplink/route';
import { NextRequest } from 'next/server';

// 모듈 모킹
vi.mock('@/lib/affiliate', () => ({
  createDeeplink: vi.fn().mockResolvedValue({
    url: 'https://link.coupang.com/a/mock',
    partner: 'coupang',
    success: true,
  }),
  createMultipleDeeplinks: vi.fn().mockResolvedValue(
    new Map([
      ['coupang', { url: 'https://link.coupang.com/a/1', success: true }],
      ['iherb', { url: 'https://kr.iherb.com/pr/1?pcode=test', success: true }],
    ])
  ),
}));

describe('POST /api/affiliate/deeplink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('딥링크를 생성한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'coupang',
        productUrl: 'https://www.coupang.com/vp/products/123456',
        subId: 'test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deeplink).toBeDefined();
    expect(data.partner).toBe('coupang');
  });

  it('partner가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'POST',
      body: JSON.stringify({
        productUrl: 'https://www.coupang.com/vp/products/123456',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('partner');
  });

  it('productUrl이 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'coupang',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('productUrl');
  });

  it('지원하지 않는 파트너는 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'unknown',
        productUrl: 'https://example.com/product',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('지원하지 않는');
  });

  it('유효하지 않은 URL은 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'coupang',
        productUrl: 'invalid-url',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('URL');
  });
});

describe('PUT /api/affiliate/deeplink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('다중 딥링크를 생성한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'PUT',
      body: JSON.stringify({
        urls: {
          coupang: 'https://www.coupang.com/vp/products/123',
          iherb: 'https://kr.iherb.com/pr/product/456',
        },
        subId: 'bulk-test',
      }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deeplinks).toBeDefined();
    expect(data.deeplinks.coupang).toBeDefined();
    expect(data.deeplinks.iherb).toBeDefined();
  });

  it('urls가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('urls');
  });

  it('빈 urls 객체는 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/deeplink', {
      method: 'PUT',
      body: JSON.stringify({ urls: {} }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('urls');
  });
});
