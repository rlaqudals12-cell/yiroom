/**
 * 생년월일 HTTP 클라이언트 + 연령 게이트 테스트
 *
 * @see lib/api/birthdate.ts
 * @see apps/web/app/api/user/birthdate/route.ts
 */

import { fetchBirthdate, saveBirthdate, evaluateBirthdateGate, BirthdateApiError } from '@/lib/api';

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

/** Date → 'YYYY-MM-DD' */
function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return ymd(d);
}

// ============================================
// evaluateBirthdateGate (순수 함수 — 서버 requireAgeVerified 재현)
// ============================================

describe('evaluateBirthdateGate', () => {
  it('이미 저장돼 있으면 입력·저장 없이 통과', () => {
    const gate = evaluateBirthdateGate(true, '');
    expect(gate).toEqual({ ok: true, needsSave: false });
  });

  it('저장 안 됐고 미입력이면 안내 에러', () => {
    const gate = evaluateBirthdateGate(false, '   ');
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.message).toContain('생년월일');
  });

  it('형식이 틀리면 형식 에러', () => {
    const gate = evaluateBirthdateGate(false, '20000615');
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.message).toContain('형식');
  });

  it('만 14세 미만이면 정직하게 차단 (isMinor)', () => {
    const gate = evaluateBirthdateGate(false, yearsAgo(10));
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.isMinor).toBe(true);
      expect(gate.message).toContain('만 14세');
    }
  });

  it('유효한 성인이면 저장 필요로 통과', () => {
    const birthDate = yearsAgo(25);
    const gate = evaluateBirthdateGate(false, birthDate);
    expect(gate).toEqual({ ok: true, needsSave: true, birthDate });
  });

  it('앞뒤 공백은 잘라내고 처리', () => {
    const birthDate = yearsAgo(30);
    const gate = evaluateBirthdateGate(false, `  ${birthDate}  `);
    expect(gate).toEqual({ ok: true, needsSave: true, birthDate });
  });
});

// ============================================
// fetchBirthdate (GET /api/user/birthdate)
// ============================================

describe('fetchBirthdate', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('저장된 생년월일 상태를 반환', async () => {
    global.fetch = mockFetch({
      ok: true,
      status: 200,
      body: { success: true, data: { birthDate: '2000-06-15', hasBirthDate: true } },
    });

    const status = await fetchBirthdate('token', 'http://test');
    expect(status).toEqual({ birthDate: '2000-06-15', hasBirthDate: true });
  });

  it('미저장이면 hasBirthDate=false', async () => {
    global.fetch = mockFetch({
      ok: true,
      status: 200,
      body: { success: true, data: { birthDate: null, hasBirthDate: false } },
    });

    const status = await fetchBirthdate('token', 'http://test');
    expect(status).toEqual({ birthDate: null, hasBirthDate: false });
  });

  it('Authorization 헤더에 Clerk 토큰 포함', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      body: { success: true, data: { birthDate: null, hasBirthDate: false } },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchBirthdate('my-jwt', 'http://test');
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer my-jwt');
  });

  it('baseUrl 없으면 CONFIG_ERROR', async () => {
    const originalEnv = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(fetchBirthdate('token')).rejects.toMatchObject({
        name: 'BirthdateApiError',
        code: 'CONFIG_ERROR',
      });
    } finally {
      if (originalEnv) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalEnv;
    }
  });

  it('네트워크 실패 시 NETWORK_ERROR', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));
    await expect(fetchBirthdate('token', 'http://test')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });
});

// ============================================
// saveBirthdate (POST /api/user/birthdate)
// ============================================

describe('saveBirthdate', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('성공 시 예외 없이 완료', async () => {
    global.fetch = mockFetch({
      ok: true,
      status: 200,
      body: {
        success: true,
        message: '생년월일이 저장되었습니다.',
        data: { birthDate: '2000-06-15' },
      },
    });

    await expect(saveBirthdate('2000-06-15', 'token', 'http://test')).resolves.toBeUndefined();
  });

  it('만 14세 미만은 서버 403 message + isMinor 표면화', async () => {
    global.fetch = mockFetch({
      ok: false,
      status: 403,
      body: {
        success: false,
        error: 'AGE_RESTRICTION',
        message: '만 14세 이상만 서비스를 이용할 수 있습니다.',
        isMinor: true,
      },
    });

    await expect(saveBirthdate('2018-01-01', 'token', 'http://test')).rejects.toMatchObject({
      name: 'BirthdateApiError',
      status: 403,
      code: 'AGE_RESTRICTION',
      message: '만 14세 이상만 서비스를 이용할 수 있습니다.',
      isMinor: true,
    });
  });

  it('검증 실패(400) message 표면화', async () => {
    global.fetch = mockFetch({
      ok: false,
      status: 400,
      body: {
        success: false,
        error: 'VALIDATION_ERROR',
        message: '올바른 생년월일 형식이 아닙니다. (YYYY-MM-DD)',
      },
    });

    await expect(saveBirthdate('bad', 'token', 'http://test')).rejects.toMatchObject({
      name: 'BirthdateApiError',
      status: 400,
      message: '올바른 생년월일 형식이 아닙니다. (YYYY-MM-DD)',
    });
  });

  it('message가 객체인 예외 응답이면 "[object Object]" 대신 일반 문구', async () => {
    // 근본 회귀: 예외 응답(Next 500 { message:{...} } 등)에서 message가 객체면
    // 그대로 승격돼 "[object Object]"가 노출됐다. 이제 일반 문구로 대체돼야 한다.
    global.fetch = mockFetch({
      ok: false,
      status: 500,
      body: { success: false, message: { detail: 'boom' }, error: { code: 'X' } },
    });

    await expect(saveBirthdate('2000-06-15', 'token', 'http://test')).rejects.toMatchObject({
      name: 'BirthdateApiError',
      status: 500,
      message: '생년월일을 저장할 수 없어요.',
      code: undefined,
    });

    await expect(saveBirthdate('2000-06-15', 'token', 'http://test')).rejects.toThrow(
      /^(?!.*\[object Object\]).*$/
    );
  });
});

describe('BirthdateApiError', () => {
  it('Error 상속 + isMinor 기본값 false', () => {
    const err = new BirthdateApiError('msg', 500, 'DB_ERROR');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('BirthdateApiError');
    expect(err.status).toBe(500);
    expect(err.code).toBe('DB_ERROR');
    expect(err.isMinor).toBe(false);
  });
});
