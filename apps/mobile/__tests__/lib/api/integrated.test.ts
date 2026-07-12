/**
 * 모바일 통합 분석 HTTP 클라이언트 테스트
 *
 * @see lib/api/integrated.ts
 * @see docs/specs/SDD-MOBILE-INTEGRATED.md §9
 */

import {
  requestIntegratedAnalysis,
  IntegratedApiError,
  type IntegratedAnalysisInput,
  type IntegratedAnalysisResult,
} from '@/lib/api';

// ============================================
// Fixtures
// ============================================

const validInput: IntegratedAnalysisInput = {
  faceImageBase64: 'data:image/jpeg;base64,/9j/4AAQ',
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
    expect(result.axesCompleted).toHaveLength(5);
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

  it('baseUrl 없으면 CONFIG_ERROR', async () => {
    // process.env.EXPO_PUBLIC_YIROOM_API_URL도 비어있다고 가정
    const originalEnv = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;

    try {
      await expect(requestIntegratedAnalysis(validInput, 'token')).rejects.toMatchObject({
        code: 'CONFIG_ERROR',
      });
    } finally {
      if (originalEnv) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalEnv;
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
