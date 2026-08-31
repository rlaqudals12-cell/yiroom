/**
 * 모바일 통합 분석 HTTP 클라이언트 테스트
 *
 * @see lib/api/integrated.ts
 * @see docs/specs/SDD-MOBILE-INTEGRATED.md §9
 */

import { DEFAULT_API_BASE_URL } from '@/lib/api/base-url';
import {
  requestIntegratedAnalysis,
  createIntegratedClientRequestId,
  IntegratedApiError,
  type IntegratedAnalysisInput,
  type IntegratedAnalysisResult,
} from '@/lib/api';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
}));

// ============================================
// Fixtures
// ============================================

const validInput: IntegratedAnalysisInput = {
  faceImageBase64: 'data:image/jpeg;base64,/9j/4AAQ',
  clientRequestId: '11111111-2222-4333-8444-555555555555',
  questionnaire: {
    skin: { selfReportedType: 'combination', concerns: [] },
    hair: { length: 'medium' },
    body: { heightCm: 170 },
  },
  options: { locale: 'ko', skipMakeup: false },
};

const mockSuccessResult: IntegratedAnalysisResult = {
  sessionId: '7a3f1234-5678-4abc-def0-0123456789ab',
  status: 'completed',
  axes: {
    personalColor: { success: true, data: { id: 'pc-1' }, usedFallback: false },
    skin: { success: true, data: { id: 'skin-1' }, usedFallback: false },
    body: { success: true, data: { id: 'body-1' }, usedFallback: false },
    hair: { success: true, data: { id: 'hair-1' }, usedFallback: false },
    makeup: { success: true, data: { id: 'makeup-1' }, usedFallback: false },
  },
  // 5축 모두 성공 → 나 프로필 존재 (persona는 성공 축 0개일 때만 null)
  persona: {
    oneLine: '따뜻하고 부드러운 인상의 당신',
    narrative: '5축 분석을 종합한 나 프로필',
    keyInsights: ['봄 웜톤', '복합성 피부'],
    usedFallback: false,
  },
  axesCompleted: ['personal_color', 'skin', 'body', 'hair', 'makeup'],
  axesFailed: [],
  usedFallback: [],
  createdAt: '2026-04-24T10:00:00Z',
  completedAt: '2026-04-24T10:00:08Z',
};

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

// ============================================
// Tests
// ============================================

describe('requestIntegratedAnalysis', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('성공 응답을 result로 반환', async () => {
    global.fetch = mockFetch({
      ok: true,
      status: 200,
      body: { success: true, result: mockSuccessResult },
    });

    const result = await requestIntegratedAnalysis(validInput, 'fake-token', 'http://test');
    expect(result.sessionId).toBe('7a3f1234-5678-4abc-def0-0123456789ab');
    expect(result.status).toBe('completed');
    expect(result.reused).not.toBe(true);
    if (result.reused === true) throw new Error('완전 결과 대신 재사용 요약이 반환됨');
    expect(result.axesCompleted).toHaveLength(5);
    expect(result.recommendationGender).toBe('neutral');
  });

  it('선택한 남성 성별을 서버 questionnaire와 직후 결과 payload에 보존한다', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      body: { success: true, result: mockSuccessResult },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await requestIntegratedAnalysis(
      {
        ...validInput,
        questionnaire: { ...validInput.questionnaire, gender: 'male' },
      },
      'fake-token',
      'http://test'
    );

    const requestBody = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body)
    ) as IntegratedAnalysisInput;
    expect(requestBody.questionnaire.gender).toBe('male');
    expect(result.reused).not.toBe(true);
    if (result.reused === true) throw new Error('완전 결과 대신 재사용 요약이 반환됨');
    expect(result.recommendationGender).toBe('male');
  });

  it('멱등 재사용 응답은 축 payload 없는 세션 요약으로 구분한다', async () => {
    global.fetch = mockFetch({
      ok: true,
      status: 200,
      body: {
        success: true,
        result: { sessionId: 'session-reused', status: 'completed', reused: true },
      },
    });

    await expect(
      requestIntegratedAnalysis(validInput, 'fake-token', 'http://test')
    ).resolves.toEqual({ sessionId: 'session-reused', status: 'completed', reused: true });
  });

  it('reused 표식도 axes도 없는 불완전 성공 응답을 완전 결과로 단언하지 않는다', async () => {
    global.fetch = mockFetch({
      ok: true,
      status: 200,
      body: { success: true, result: { sessionId: 'session-broken', status: 'completed' } },
    });

    await expect(
      requestIntegratedAnalysis(validInput, 'fake-token', 'http://test')
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE', status: 200 });
  });

  it('Authorization 헤더에 Clerk 토큰이 포함', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      body: { success: true, result: mockSuccessResult },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await requestIntegratedAnalysis(validInput, 'my-jwt', 'http://test');

    const callArgs = fetchMock.mock.calls[0];
    const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer my-jwt');
    expect(headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(String((callArgs[1] as RequestInit).body)) as Record<string, unknown>;
    expect(body.clientRequestId).toBe('11111111-2222-4333-8444-555555555555');
  });

  it('Expo Crypto가 만든 UUID v4를 웹 멱등 계약용 ID로 사용한다', () => {
    expect(createIntegratedClientRequestId()).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
  });

  it('401 응답 시 IntegratedApiError + status 401', async () => {
    global.fetch = mockFetch({
      ok: false,
      status: 401,
      body: {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Unauthorized', userMessage: '로그인 필요' },
      },
    });

    await expect(
      requestIntegratedAnalysis(validInput, 'invalid', 'http://test')
    ).rejects.toMatchObject({
      name: 'IntegratedApiError',
      status: 401,
      message: '로그인 필요',
    });
  });

  it('403 연령 게이트 — 플랫 에러 봉투({error:string,code})의 userMessage를 그대로 표면화', async () => {
    // 웹 error-response.ts(forbiddenError)는 중첩이 아닌 플랫 형태를 반환한다.
    // 기존 코드는 중첩만 파싱해 "만 14세..." 메시지를 잃고 일반 문구로 뭉갰다 (근본 버그).
    global.fetch = mockFetch({
      ok: false,
      status: 403,
      body: {
        error:
          '만 14세 이상만 이용할 수 있어요. 만 14세 미만은 법정대리인 동의가 필요해 생체정보 분석을 제공하지 않아요.',
        code: 'FORBIDDEN',
      },
    });

    await expect(
      requestIntegratedAnalysis(validInput, 'token', 'http://test')
    ).rejects.toMatchObject({
      name: 'IntegratedApiError',
      status: 403,
      code: 'FORBIDDEN',
      message:
        '만 14세 이상만 이용할 수 있어요. 만 14세 미만은 법정대리인 동의가 필요해 생체정보 분석을 제공하지 않아요.',
    });
  });

  it('429 Rate Limit 에러', async () => {
    global.fetch = mockFetch({
      ok: false,
      status: 429,
      body: {
        success: false,
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: 'Too many requests',
          userMessage: '요청이 많아요',
        },
      },
    });

    await expect(
      requestIntegratedAnalysis(validInput, 'token', 'http://test')
    ).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMIT_ERROR',
    });
  });

  it('네트워크 실패 시 NETWORK_ERROR 코드', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      requestIntegratedAnalysis(validInput, 'token', 'http://test')
    ).rejects.toMatchObject({
      name: 'IntegratedApiError',
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('멎은 응답은 상한 초과 시 abort되고 재시도 가능한 status 0 에러가 된다', async () => {
    jest.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        requestSignal?.addEventListener(
          'abort',
          () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          },
          { once: true }
        );
      });
    }) as unknown as typeof fetch;

    try {
      const request = requestIntegratedAnalysis(validInput, 'token', 'http://test', {
        timeoutMs: 100,
      });
      jest.advanceTimersByTime(100);

      await expect(request).rejects.toMatchObject({
        name: 'IntegratedApiError',
        status: 0,
        code: 'REQUEST_TIMEOUT',
        message: expect.stringContaining('응답이 지연'),
      });
      expect(requestSignal?.aborted).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('base URL 미설정이면 CONFIG_ERROR 대신 프로덕션 웹으로 폴백한다', async () => {
    // 왜: 두 env 어느 것도 실제 빌드에 설정된 적이 없다. 설정 누락을 에러로 처리하던
    // 옛 계약은 EAS 빌드에서 분석을 전멸시켰다 — 이제는 프로덕션 웹으로 붙는다.
    const originalYiroom = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    const originalApi = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;

    // 네트워크 단계에서 끊어 URL만 관찰한다 (응답 형태는 이 테스트의 관심사가 아님)
    const fetchMock = jest.fn().mockRejectedValue(new Error('stop-after-url'));
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      await Promise.resolve(requestIntegratedAnalysis(validInput, 'token')).catch(() => undefined);

      const calledUrl = String(fetchMock.mock.calls[0][0]);
      expect(calledUrl.startsWith(`${DEFAULT_API_BASE_URL}/api/`)).toBe(true);
    } finally {
      if (originalYiroom !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalYiroom;
      if (originalApi !== undefined) process.env.EXPO_PUBLIC_API_URL = originalApi;
    }
  });

  it('JSON 파싱 실패해도 안전하게 에러 반환', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(
      requestIntegratedAnalysis(validInput, 'token', 'http://test')
    ).rejects.toMatchObject({
      name: 'IntegratedApiError',
      status: 500,
    });
  });
});

describe('IntegratedApiError', () => {
  it('Error 상속 + name 속성', () => {
    const err = new IntegratedApiError('msg', 400, 'VALIDATION_ERROR');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('IntegratedApiError');
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('msg');
  });

  it('code 선택 (undefined 허용)', () => {
    const err = new IntegratedApiError('msg', 500);
    expect(err.code).toBeUndefined();
  });
});
