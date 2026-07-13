/**
 * H-1 헤어 분석 API 클라이언트 테스트 (lib/api/hair)
 *
 * 계약 고정:
 * - 웹 POST /api/analyze/hair 성공 응답(hairType/scalpType + metrics 배열 + concern id) 매핑
 * - 서버 'damage' 지표(건강도) → 화면 손상도로 반전
 * - concern id → 한국어 라벨, 게이트(403) 메시지 관통
 */
import { requestHairAnalysis, HairApiError } from '@/lib/api/hair';

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
    data: { id: 'row-1' },
    result: {
      hairType: 'wavy',
      hairThickness: 'thick',
      scalpType: 'oily',
      overallScore: 70,
      metrics: [
        { id: 'shine', value: 60 },
        { id: 'elasticity', value: 72 },
        { id: 'density', value: 55 },
        { id: 'scalp', value: 65 },
        { id: 'damage', value: 80 }, // 건강도 80 → 손상도 20
      ],
      concerns: ['hairloss', 'frizz'],
      careTips: ['미지근한 물로 샴푸하세요', '주 1-2회 헤어 마스크'],
      analysisReliability: 'medium',
    },
    ...overrides,
  };
}

describe('requestHairAnalysis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('성공 응답을 모발 결과로 매핑한다', async () => {
    mockFetchOnce(200, successBody());

    const result = await requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.texture).toBe('wavy');
    expect(result.thickness).toBe('thick');
    expect(result.scalpCondition).toBe('oily');
    expect(result.scores).toEqual({ shine: 60, elasticity: 72, density: 55, scalpHealth: 65 });
    expect(result.careRoutine).toEqual(['미지근한 물로 샴푸하세요', '주 1-2회 헤어 마스크']);
    expect(result.usedMock).toBe(false);
  });

  it("서버 'damage' 지표(건강도)를 손상도로 반전한다", async () => {
    mockFetchOnce(200, successBody());

    const result = await requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    // 건강도 80 → 손상도 20
    expect(result.damageLevel).toBe(20);
  });

  it('concern id를 한국어 라벨로 바꾼다 (getScalpConcernNotice 키워드 매칭 대상)', async () => {
    mockFetchOnce(200, successBody());

    const result = await requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.mainConcerns).toEqual(['탈모', '푸석함']);
  });

  it('알 수 없는 enum은 안전한 기본값으로 접는다', async () => {
    mockFetchOnce(200, successBody({ result: { hairType: 'zigzag', metrics: [] } }));

    const result = await requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.texture).toBe('straight');
    expect(result.thickness).toBe('medium');
    expect(result.scalpCondition).toBe('normal');
    expect(result.mainConcerns).toEqual([]);
    expect(result.recommendedStyles).toEqual([]);
  });

  it('요청에 웹 계약(Bearer + mobile 헤더)을 담는다', async () => {
    const fetchMock = mockFetchOnce(200, successBody());

    await requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api/analyze/hair`);
    expect(init.headers.Authorization).toBe('Bearer token-1');
    expect(init.headers['x-yiroom-client']).toBe('mobile');
  });

  it('403 게이트의 서버 한국어 메시지를 관통시킨다', async () => {
    mockFetchOnce(403, {
      error: '생체정보 수집·이용 동의가 필요해요.',
      code: 'BIOMETRIC_CONSENT_REQUIRED',
    });

    await expect(requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      name: 'HairApiError',
      status: 403,
      message: '생체정보 수집·이용 동의가 필요해요.',
    });
  });

  it('에러 메시지가 문자열이 아니면 폴백 문구를 쓴다', async () => {
    mockFetchOnce(500, { error: { nested: true } });

    await expect(requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      message: '헤어 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.',
    });
  });

  it('네트워크 실패 시 사용자 대면 한국어 메시지로 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    await expect(requestHairAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('base URL 미설정이면 CONFIG_ERROR', async () => {
    const original = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(requestHairAnalysis(VALID_INPUT, 'token-1')).rejects.toMatchObject({
        code: 'CONFIG_ERROR',
      });
    } finally {
      if (original !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = original;
    }
  });

  it('HairApiError는 인스턴스 판별이 가능하다', () => {
    const err = new HairApiError('메시지', 400, 'VALIDATION_ERROR');
    expect(err).toBeInstanceOf(HairApiError);
    expect(err).toBeInstanceOf(Error);
  });
});
