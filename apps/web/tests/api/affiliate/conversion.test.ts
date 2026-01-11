/**
 * 전환 웹훅 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/affiliate/conversion/route';
import { NextRequest } from 'next/server';

// 모듈 모킹
vi.mock('@/lib/affiliate/clicks', () => ({
  updateClickConversion: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'partner-123' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

describe('POST /api/affiliate/conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('iHerb 전환을 처리한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'iherb',
        subId: 'click-123',
        orderId: 'order-456',
        orderAmount: 55000,
        commission: 2750,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.clickId).toBe('click-123');
    expect(data.conversionValue).toBe(55000);
    expect(data.commission).toBe(2750);
  });

  it('쿠팡 전환을 처리한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'coupang',
        clickId: 'click-789',
        transactionId: 'tx-001',
        saleAmount: 35000,
        commissionAmount: 1050,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.clickId).toBe('click-789');
    expect(data.conversionValue).toBe(35000);
    expect(data.commission).toBe(1050);
  });

  it('무신사 전환을 처리한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'musinsa',
        subId: 'click-abc',
        orderAmount: 89000,
        commission: 4450,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.clickId).toBe('click-abc');
  });

  it('파트너가 없으면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        subId: 'click-123',
        orderAmount: 10000,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(400);
    expect(data.error).toContain('partner');
  });

  it('잘못된 파트너는 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'unknown',
        subId: 'click-123',
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(400);
    expect(data.error).toContain('partner');
  });

  it('클릭 ID 없이도 로깅은 수행된다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'coupang',
        orderId: 'order-no-click',
        orderAmount: 20000,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('without click');
  });

  it('클릭 업데이트 실패 시 200 반환 (재시도 방지)', async () => {
    const { updateClickConversion } = await import('@/lib/affiliate/clicks');
    vi.mocked(updateClickConversion).mockResolvedValueOnce(false);

    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'iherb',
        subId: 'nonexistent-click',
        orderAmount: 10000,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.message).toContain('not found');
  });

  it('유효하지 않은 JSON은 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(400);
    expect(data.error).toContain('Invalid JSON');
  });

  it('금액이 0이어도 처리된다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'coupang',
        subId: 'click-zero',
        orderAmount: 0,
        commission: 0,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(200);
    expect(data.conversionValue).toBe(0);
    expect(data.commission).toBe(0);
  });
});

describe('GET /api/affiliate/conversion', () => {
  it('API 문서를 반환한다', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.endpoint).toBe('/api/affiliate/conversion');
    expect(data.method).toBe('POST');
    expect(data.partners).toContain('iherb');
    expect(data.partners).toContain('coupang');
    expect(data.partners).toContain('musinsa');
    expect(data.requiredFields).toBeDefined();
    expect(data.status).toBe('active');
  });
});
