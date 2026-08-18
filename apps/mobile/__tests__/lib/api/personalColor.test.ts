/**
 * PC-1 퍼스널 컬러 분석 API 클라이언트 테스트 (lib/api/personalColor)
 *
 * 계약 고정:
 * - 웹 POST /api/analyze/personal-color 성공 응답(data.season + result.seasonType) 매핑
 * - 신뢰도 0~100 → 0~1 정규화
 * - 게이트(403) 서버 한국어 메시지 관통, 시즌 못 읽으면 실패 처리
 */
import { DEFAULT_API_BASE_URL } from '@/lib/api/base-url';
import { requestPersonalColorAnalysis, PersonalColorApiError } from '@/lib/api/personalColor';

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
    data: { season: 'Spring' },
    result: {
      seasonType: 'spring',
      seasonLabel: '봄 웜톤',
      seasonDescription: '밝고 화사한 색이 잘 어울려요.',
      confidence: 88,
    },
    ...overrides,
  };
}

describe('requestPersonalColorAnalysis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('성공 응답을 4계절 결과로 매핑하고 신뢰도를 0~1로 정규화한다', async () => {
    mockFetchOnce(200, successBody());

    const result = await requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.season).toBe('Spring');
    expect(result.confidence).toBeCloseTo(0.88);
    expect(result.description).toBe('밝고 화사한 색이 잘 어울려요.');
    expect(result.usedMock).toBe(false);
  });

  it('서버가 판정한 12톤과 객체형 베스트·워스트 팔레트를 응답 경계에서 보존한다', async () => {
    mockFetchOnce(200, {
      ...successBody(),
      data: {
        season: 'Spring',
        season_subtype: 'light',
        best_colors: [{ hex: '#DADADA', name: 'DB 폴백 색' }],
        worst_colors: [{ hex: '#121212', name: 'DB 폴백 색' }],
      },
      result: {
        ...successBody().result,
        seasonSubtype: 'bright',
        bestColors: [
          { hex: '#123456', name: '서버 베스트 1' },
          { hex: '#ABCDEF', name: '서버 베스트 2' },
        ],
        worstColors: [{ hex: '#654321', name: '서버 워스트' }],
      },
    });

    const result = await requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result).toMatchObject({
      seasonSubtype: 'bright',
      bestColors: ['#123456', '#ABCDEF'],
      worstColors: ['#654321'],
    });
  });

  it('data.season이 없으면 result.seasonType(소문자)를 정규화한다', async () => {
    mockFetchOnce(200, successBody({ data: {} }));

    const result = await requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.season).toBe('Spring');
  });

  it('요청에 웹 계약(imageBase64 + Bearer + mobile 헤더)을 담는다', async () => {
    const fetchMock = mockFetchOnce(200, successBody());

    await requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api/analyze/personal-color`);
    expect(init.headers.Authorization).toBe('Bearer token-1');
    expect(init.headers['x-yiroom-client']).toBe('mobile');
  });

  it('usedMock=true(폴백)를 그대로 전달한다', async () => {
    mockFetchOnce(200, { ...successBody(), usedMock: true });

    const result = await requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.usedMock).toBe(true);
  });

  it('DB 저장 실패 플래그를 결과 화면까지 보존한다', async () => {
    mockFetchOnce(200, { ...successBody(), dbSaveFailed: true });

    const result = await requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.dbSaveFailed).toBe(true);
  });

  it('403 게이트의 플랫 에러 봉투에서 서버 한국어 메시지를 관통시킨다', async () => {
    mockFetchOnce(403, {
      error: '만 14세 미만은 이용할 수 없어요.',
      code: 'AGE_VERIFICATION_REQUIRED',
    });

    await expect(
      requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL)
    ).rejects.toMatchObject({
      name: 'PersonalColorApiError',
      status: 403,
      code: 'AGE_VERIFICATION_REQUIRED',
      message: '만 14세 미만은 이용할 수 없어요.',
    });
  });

  it('에러 메시지가 문자열이 아니면 폴백 문구를 쓴다 ([object Object] 방어)', async () => {
    mockFetchOnce(500, { error: { nested: true } });

    await expect(
      requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL)
    ).rejects.toMatchObject({
      message: '퍼스널 컬러 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.',
    });
  });

  it('네트워크 실패 시 사용자 대면 한국어 메시지로 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    await expect(
      requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL)
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('시즌을 못 읽으면 지어내지 않고 PARSE_ERROR로 실패한다', async () => {
    mockFetchOnce(200, { success: true, data: {}, result: { seasonType: 'unknown' } });

    await expect(
      requestPersonalColorAnalysis(VALID_INPUT, 'token-1', BASE_URL)
    ).rejects.toMatchObject({
      code: 'PARSE_ERROR',
    });
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
      await Promise.resolve(requestPersonalColorAnalysis(VALID_INPUT, 'token-1')).catch(
        () => undefined
      );

      const calledUrl = String(fetchMock.mock.calls[0][0]);
      expect(calledUrl.startsWith(`${DEFAULT_API_BASE_URL}/api/`)).toBe(true);
    } finally {
      if (originalYiroom !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = originalYiroom;
      if (originalApi !== undefined) process.env.EXPO_PUBLIC_API_URL = originalApi;
    }
  });

  it('PersonalColorApiError는 인스턴스 판별이 가능하다', () => {
    const err = new PersonalColorApiError('메시지', 400, 'VALIDATION_ERROR');
    expect(err).toBeInstanceOf(PersonalColorApiError);
    expect(err).toBeInstanceOf(Error);
  });
});
