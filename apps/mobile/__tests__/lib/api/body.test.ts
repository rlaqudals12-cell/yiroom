/**
 * C-1 체형 분석 API 클라이언트 테스트 (lib/api/body)
 *
 * 계약 고정:
 * - 웹 POST /api/analyze/body 성공 응답(result 3타입 체계) 파싱
 * - 게이트(403)·검증(400) 에러의 서버 한국어 메시지 관통 (플랫 봉투)
 * - usedMock 정직 전달, 비정상 bodyType은 지어내지 않고 실패 처리
 */
import { requestBodyAnalysis, BodyApiError } from '@/lib/api/body';

const BASE_URL = 'https://example.test';

const VALID_INPUT = {
  imageBase64: 'x'.repeat(200),
  height: 175,
  weight: 70,
};

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
    result: {
      bodyType: 'S',
      bodyTypeLabel: '스트레이트',
      bodyTypeDescription: '직선적인 실루엣의 골격이에요.',
      strengths: ['어깨 라인이 반듯해요'],
      avoidStyles: ['오버핏'],
      styleRecommendations: [{ item: '테일러드 재킷', reason: '골격의 직선을 살려요' }],
      insight: '핏이 살아있는 옷이 잘 어울려요.',
      bmi: 22.9,
      ...overrides,
    },
  };
}

describe('requestBodyAnalysis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('성공 응답을 3타입 결과로 파싱한다', async () => {
    mockFetchOnce(200, successBody());

    const result = await requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.bodyType).toBe('S');
    expect(result.bodyTypeLabel).toBe('스트레이트');
    expect(result.styleRecommendations).toEqual([
      { item: '테일러드 재킷', reason: '골격의 직선을 살려요' },
    ]);
    expect(result.avoidStyles).toEqual(['오버핏']);
    expect(result.bmi).toBe(22.9);
    expect(result.usedMock).toBe(false);
  });

  it('요청 본문에 웹 계약(imageBase64 + userInput.height/weight)을 담는다', async () => {
    const fetchMock = mockFetchOnce(200, successBody());

    await requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api/analyze/body`);
    expect(init.headers.Authorization).toBe('Bearer token-1');
    const parsed = JSON.parse(init.body);
    expect(parsed.userInput).toEqual({ height: 175, weight: 70 });
    expect(typeof parsed.imageBase64).toBe('string');
  });

  it('usedMock=true(폴백)를 그대로 전달한다 — 정직 표시용', async () => {
    mockFetchOnce(200, { ...successBody(), usedMock: true });

    const result = await requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.usedMock).toBe(true);
  });

  it('403 게이트의 플랫 에러 봉투에서 서버 한국어 메시지를 관통시킨다', async () => {
    mockFetchOnce(403, {
      error: '생체정보 수집·이용 동의가 필요해요.',
      code: 'BIOMETRIC_CONSENT_REQUIRED',
    });

    await expect(requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      name: 'BodyApiError',
      status: 403,
      code: 'BIOMETRIC_CONSENT_REQUIRED',
      message: '생체정보 수집·이용 동의가 필요해요.',
    });
  });

  it('에러 메시지가 문자열이 아니면 폴백 문구를 쓴다 ([object Object] 방어)', async () => {
    mockFetchOnce(500, { error: { some: 'object-without-message' } });

    await expect(requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      message: '체형 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.',
    });
  });

  it('네트워크 실패 시 사용자 대면 한국어 메시지로 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    await expect(requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인해주세요.',
    });
  });

  it('bodyType이 S/W/N이 아니면 지어내지 않고 PARSE_ERROR로 실패한다', async () => {
    mockFetchOnce(200, successBody({ bodyType: 'rectangle' }));

    await expect(requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
  });

  it('base URL 미설정이면 CONFIG_ERROR', async () => {
    const original = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(requestBodyAnalysis(VALID_INPUT, 'token-1')).rejects.toMatchObject({
        code: 'CONFIG_ERROR',
      });
    } finally {
      if (original !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = original;
    }
  });

  it('불완전한 result 필드는 안전한 기본값으로 채운다 (배열/문자열 방어)', async () => {
    mockFetchOnce(200, {
      success: true,
      usedMock: false,
      result: { bodyType: 'W' },
    });

    const result = await requestBodyAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.bodyType).toBe('W');
    expect(result.bodyTypeLabel).toBe('W');
    expect(result.strengths).toEqual([]);
    expect(result.avoidStyles).toEqual([]);
    expect(result.styleRecommendations).toEqual([]);
    expect(result.bmi).toBeUndefined();
  });

  it('BodyApiError는 인스턴스 판별이 가능하다', () => {
    const err = new BodyApiError('메시지', 400, 'VALIDATION_ERROR');
    expect(err).toBeInstanceOf(BodyApiError);
    expect(err).toBeInstanceOf(Error);
  });
});
