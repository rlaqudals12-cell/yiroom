/**
 * S-1 피부 분석 API 클라이언트 테스트 (lib/api/skin)
 *
 * 계약 고정:
 * - 웹 POST /api/analyze/skin 성공 응답(result.metrics 배열 + data.skin_type) 매핑
 * - 게이트(403)·검증(400) 에러의 서버 한국어 메시지 관통 (플랫 봉투)
 * - usedMock 정직 전달, 피부 타입을 못 읽으면 지어내지 않고 실패 처리
 */
import { requestSkinAnalysis, SkinApiError } from '@/lib/api/skin';

const BASE_URL = 'https://example.test';

const VALID_INPUT = { imageBase64: 'x'.repeat(200) };

function mockFetchOnce(status: number, json: unknown): jest.Mock {
  const mock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(json),
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

function successBody(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    usedMock: false,
    data: { id: 'row-1', skin_type: 'combination' },
    result: {
      skinType: 'normal',
      overallScore: 72,
      metrics: [
        { id: 'hydration', value: 65 },
        { id: 'oil', value: 40 },
        { id: 'pores', value: 55 },
        { id: 'wrinkles', value: 20 },
        { id: 'pigmentation', value: 30 },
        { id: 'sensitivity', value: 25 },
        { id: 'elasticity', value: 70 },
      ],
    },
    ...overrides,
  };
}

describe('requestSkinAnalysis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('성공 응답의 metrics 배열을 지표 객체로 매핑한다', async () => {
    mockFetchOnce(200, successBody());

    const result = await requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    // data.skin_type(서버 검증값)이 result.skinType(AI 원본)보다 우선
    expect(result.skinType).toBe('combination');
    expect(result.metrics.moisture).toBe(65);
    expect(result.metrics.oil).toBe(40);
    expect(result.metrics.pores).toBe(55);
    expect(result.metrics.sensitivity).toBe(25);
    expect(result.metrics.elasticity).toBe(70);
    expect(result.usedMock).toBe(false);
    expect(result.analysisId).toBe('row-1');
  });

  it('요청에 웹 계약(imageBase64 + Bearer + mobile 헤더)을 담는다', async () => {
    const fetchMock = mockFetchOnce(200, successBody());

    await requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api/analyze/skin`);
    expect(init.headers.Authorization).toBe('Bearer token-1');
    expect(init.headers['x-yiroom-client']).toBe('mobile');
    expect(JSON.parse(init.body).imageBase64).toBe(VALID_INPUT.imageBase64);
  });

  it('data.skin_type가 없으면 result.skinType로 폴백한다', async () => {
    mockFetchOnce(200, successBody({ data: { id: 'row-2' } }));

    const result = await requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.skinType).toBe('normal');
  });

  it('누락된 지표는 중립값 50으로 채운다', async () => {
    mockFetchOnce(200, {
      success: true,
      usedMock: false,
      data: { id: 'row-3', skin_type: 'dry' },
      result: { skinType: 'dry', metrics: [{ id: 'hydration', value: 30 }] },
    });

    const result = await requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.metrics.moisture).toBe(30);
    expect(result.metrics.oil).toBe(50);
    expect(result.metrics.elasticity).toBe(50);
  });

  it('usedMock=true(폴백)를 그대로 전달한다 — 정직 표시용', async () => {
    mockFetchOnce(200, { ...successBody(), usedMock: true });

    const result = await requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.usedMock).toBe(true);
  });

  it('403 게이트의 플랫 에러 봉투에서 서버 한국어 메시지를 관통시킨다', async () => {
    mockFetchOnce(403, {
      error: '생체정보 수집·이용 동의가 필요해요.',
      code: 'BIOMETRIC_CONSENT_REQUIRED',
    });

    await expect(requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      name: 'SkinApiError',
      status: 403,
      code: 'BIOMETRIC_CONSENT_REQUIRED',
      message: '생체정보 수집·이용 동의가 필요해요.',
    });
  });

  it('에러 메시지가 문자열이 아니면 폴백 문구를 쓴다 ([object Object] 방어)', async () => {
    mockFetchOnce(500, { error: { some: 'object-without-message' } });

    await expect(requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      message: '피부 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.',
    });
  });

  it('네트워크 실패 시 사용자 대면 한국어 메시지로 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    await expect(requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인해주세요.',
    });
  });

  it('피부 타입을 못 읽으면 지어내지 않고 PARSE_ERROR로 실패한다', async () => {
    mockFetchOnce(200, { success: true, usedMock: false, data: {}, result: {} });

    await expect(requestSkinAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
  });

  it('base URL 미설정이면 CONFIG_ERROR', async () => {
    const original = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(requestSkinAnalysis(VALID_INPUT, 'token-1')).rejects.toMatchObject({
        code: 'CONFIG_ERROR',
      });
    } finally {
      if (original !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = original;
    }
  });

  it('SkinApiError는 인스턴스 판별이 가능하다', () => {
    const err = new SkinApiError('메시지', 400, 'VALIDATION_ERROR');
    expect(err).toBeInstanceOf(SkinApiError);
    expect(err).toBeInstanceOf(Error);
  });
});
