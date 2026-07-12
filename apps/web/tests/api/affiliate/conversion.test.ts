/**
 * 전환 웹훅 API 테스트
 *
 * 보안: 서명은 필수이며, 파트너 시크릿 미설정 시 fail-closed(거부)한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
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

const TEST_SECRET = 'test-webhook-secret';

/**
 * 라우트와 동일한 방식으로 서명을 만들어 body 문자열을 반환한다.
 * (라우트는 signature 필드를 제외한 나머지를 JSON.stringify하여 HMAC 검증)
 */
function signedBody(bodyWithoutSig: Record<string, unknown>, secret = TEST_SECRET): string {
  const payload = JSON.stringify(bodyWithoutSig);
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return JSON.stringify({ ...bodyWithoutSig, signature });
}

describe('POST /api/affiliate/conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 모든 파트너 웹훅 시크릿 설정 (검증 통과 조건)
    process.env.IHERB_WEBHOOK_SECRET = TEST_SECRET;
    process.env.COUPANG_WEBHOOK_SECRET = TEST_SECRET;
    process.env.MUSINSA_WEBHOOK_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.IHERB_WEBHOOK_SECRET;
    delete process.env.COUPANG_WEBHOOK_SECRET;
    delete process.env.MUSINSA_WEBHOOK_SECRET;
  });

  it('유효한 서명이 있는 iHerb 전환을 처리한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: signedBody({
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

  it('유효한 서명이 있는 쿠팡 전환을 처리한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: signedBody({
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

  it('유효한 서명이 있는 무신사 전환을 처리한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: signedBody({
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

  it('서명이 없으면 401을 반환한다 (우회 방지)', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'iherb',
        subId: 'click-123',
        orderAmount: 55000,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(401);
    expect(data.error).toContain('signature');
  });

  it('서명이 유효하지 않으면 401을 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: JSON.stringify({
        partner: 'iherb',
        subId: 'click-123',
        orderAmount: 55000,
        // 형식은 hex 64자이지만 값이 틀린 서명
        signature: 'f'.repeat(64),
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(401);
    expect(data.error).toContain('signature');
  });

  it('파트너 시크릿 미설정 시 fail-closed로 거부한다', async () => {
    delete process.env.IHERB_WEBHOOK_SECRET;

    // 서명은 존재하지만 서버에 시크릿이 없어 검증 불가 → 거부
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: signedBody({
        partner: 'iherb',
        subId: 'click-123',
        orderAmount: 55000,
      }),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
    const data = await response!.json();

    expect(response!.status).toBe(401);
    expect(data.error).toContain('signature');
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

  it('클릭 ID 없이도 (서명 유효 시) 로깅은 수행된다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: signedBody({
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
      body: signedBody({
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

  it('금액이 0이어도 (서명 유효 시) 처리된다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/conversion', {
      method: 'POST',
      body: signedBody({
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
    // 서명이 필수 필드로 문서화되어야 한다
    expect(data.requiredFields.signature).toBeDefined();
    expect(data.status).toBe('active');
  });
});
