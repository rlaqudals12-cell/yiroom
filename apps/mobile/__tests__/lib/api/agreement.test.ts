/**
 * 약관·생체정보 동의 HTTP 클라이언트 + 동의 게이트 테스트
 *
 * @see lib/api/agreement.ts
 * @see apps/web/app/api/agreement/route.ts
 */

import {
  fetchAgreementStatus,
  saveAgreement,
  evaluateAgreementGate,
  AgreementApiError,
} from '@/lib/api';

// ============================================
// Helpers
// ============================================

function mockFetch(response: { ok: boolean; status: number; body: unknown }): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: () => Promise.resolve(response.body),
  });
}

const ALL_CHECKED = { terms: true, privacy: true, biometric: true };

// ============================================
// evaluateAgreementGate (순수 함수 — 서버 게이트·POST 검증 재현)
// ============================================

describe('evaluateAgreementGate', () => {
  it('이미 동의돼 있으면 체크·저장 없이 통과', () => {
    const gate = evaluateAgreementGate(
      true,
      { terms: false, privacy: false, biometric: false },
      undefined
    );
    expect(gate).toEqual({ ok: true, needsSave: false });
  });

  it('필수 항목이 하나라도 미체크면 안내 에러 (분석 호출 금지)', () => {
    const gate = evaluateAgreementGate(false, { ...ALL_CHECKED, biometric: false }, 'female');
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.message).toContain('필수 약관');
  });

  it('성별 미선택이면 안내 에러 (서버 400 재현)', () => {
    const gate = evaluateAgreementGate(false, ALL_CHECKED, undefined);
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.message).toContain('성별');
  });

  it('필수 체크 + 성별 선택이면 저장 필요로 통과', () => {
    const gate = evaluateAgreementGate(false, ALL_CHECKED, 'male');
    expect(gate).toEqual({ ok: true, needsSave: true, gender: 'male' });
  });
});

// ============================================
// fetchAgreementStatus (GET /api/agreement)
// ============================================

describe('fetchAgreementStatus', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('필수 동의 완료면 hasAgreed=true', async () => {
    global.fetch = mockFetch({ ok: true, status: 200, body: { hasAgreed: true, agreement: {} } });

    const status = await fetchAgreementStatus('token', 'http://test');
    expect(status).toEqual({ hasAgreed: true });
  });

  it('미동의(또는 버전 불일치)면 hasAgreed=false', async () => {
    global.fetch = mockFetch({
      ok: true,
      status: 200,
      body: { hasAgreed: false, agreement: null },
    });

    const status = await fetchAgreementStatus('token', 'http://test');
    expect(status).toEqual({ hasAgreed: false });
  });

  it('Authorization 헤더에 Clerk 토큰 포함', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, body: { hasAgreed: true } });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchAgreementStatus('my-jwt', 'http://test');
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer my-jwt');
  });

  it('서버 오류면 AgreementApiError', async () => {
    global.fetch = mockFetch({ ok: false, status: 500, body: { error: 'Internal server error' } });

    await expect(fetchAgreementStatus('token', 'http://test')).rejects.toThrow(AgreementApiError);
  });

  it('네트워크 실패면 NETWORK_ERROR', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch;

    await expect(fetchAgreementStatus('token', 'http://test')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('baseUrl 없으면 CONFIG_ERROR', async () => {
    const originalEnv = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(fetchAgreementStatus('token')).rejects.toMatchObject({ code: 'CONFIG_ERROR' });
    } finally {
      if (originalEnv !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalEnv;
    }
  });
});

// ============================================
// saveAgreement (POST /api/agreement)
// ============================================

describe('saveAgreement', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('필수 3종 true + 성별을 서버 계약대로 전송', async () => {
    const fetchMock = mockFetch({ ok: true, status: 201, body: { success: true } });
    global.fetch = fetchMock as unknown as typeof fetch;

    await saveAgreement({ gender: 'female', marketingAgreed: true }, 'token', 'http://test');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({
      termsAgreed: true,
      privacyAgreed: true,
      biometricAgreed: true,
      marketingAgreed: true,
      gender: 'female',
    });
  });

  it('marketingAgreed 생략 시 false로 전송', async () => {
    const fetchMock = mockFetch({ ok: true, status: 201, body: { success: true } });
    global.fetch = fetchMock as unknown as typeof fetch;

    await saveAgreement({ gender: 'male' }, 'token', 'http://test');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as Record<
      string,
      unknown
    >;
    expect(body.marketingAgreed).toBe(false);
  });

  it('서버 검증 실패(400)면 서버 메시지를 담은 AgreementApiError', async () => {
    global.fetch = mockFetch({
      ok: false,
      status: 400,
      body: { error: '필수 약관에 동의해주세요' },
    });

    await expect(saveAgreement({ gender: 'female' }, 'token', 'http://test')).rejects.toMatchObject(
      {
        status: 400,
        message: '필수 약관에 동의해주세요',
      }
    );
  });

  it('네트워크 실패면 NETWORK_ERROR', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch;

    await expect(saveAgreement({ gender: 'female' }, 'token', 'http://test')).rejects.toMatchObject(
      {
        code: 'NETWORK_ERROR',
      }
    );
  });
});
