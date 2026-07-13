/**
 * M-1 메이크업 분석 API 클라이언트 테스트 (lib/api/makeup)
 *
 * 계약 고정:
 * - 웹 POST /api/analyze/makeup 성공 응답(형태 + colorRecommendations + makeupTips) 재구성
 * - 웹 넓은 enum(눈꼬리 처짐·입술 small/heart/asymmetric) → 모바일 값으로 접기
 * - 게이트(403) 메시지 관통
 */
import { requestMakeupAnalysis, MakeupApiError } from '@/lib/api/makeup';

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
      undertone: 'warm',
      eyeShape: 'almond',
      lipShape: 'full',
      faceShape: 'oval',
      overallScore: 76,
      metrics: [
        { id: 'skinTone', value: 68 },
        { id: 'skinTexture', value: 72 },
      ],
      concerns: ['redness'],
      colorRecommendations: [
        {
          category: 'lip',
          categoryLabel: '립',
          colors: [{ name: '코랄 오렌지', hex: '#FF6B4A', description: '화사한 코랄' }],
        },
        {
          category: 'blush',
          categoryLabel: '블러셔',
          colors: [{ name: '피치 핑크', hex: '#FFAB91', description: '복숭아빛' }],
        },
      ],
      makeupTips: [
        { category: '베이스', tips: ['프라이머를 얇게 바르세요'] },
        { category: '립 메이크업', tips: ['그라데이션 립을 연출하세요'] },
      ],
    },
    ...overrides,
  };
}

describe('requestMakeupAnalysis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('성공 응답을 메이크업 결과로 재구성한다', async () => {
    mockFetchOnce(200, successBody());

    const result = await requestMakeupAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.faceShape).toBe('oval');
    expect(result.undertone).toBe('warm');
    expect(result.eyeShape).toBe('almond');
    expect(result.lipShape).toBe('full');
    expect(result.scores.skinTone).toBe(68);
    expect(result.scores.overall).toBe(76);
    // 눈/입술 밸런스는 종합 점수로 근사
    expect(result.scores.eyeBalance).toBe(76);
    expect(result.recommendations.base).toBe('프라이머를 얇게 바르세요');
    expect(result.recommendations.lip).toBe('그라데이션 립을 연출하세요');
    expect(result.bestColors).toEqual(['#FF6B4A', '#FFAB91']);
    expect(result.usedMock).toBe(false);
  });

  it('웹 넓은 enum(downturned·small)을 모바일 값으로 접는다', async () => {
    mockFetchOnce(
      200,
      successBody({
        result: {
          undertone: 'cool',
          eyeShape: 'downturned',
          lipShape: 'small',
          faceShape: 'round',
          overallScore: 60,
          metrics: [],
          colorRecommendations: [],
          makeupTips: [],
        },
      })
    );

    const result = await requestMakeupAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.eyeShape).toBe('almond'); // downturned → almond
    expect(result.lipShape).toBe('thin'); // small → thin
  });

  it('팁·색상이 없으면 기본 문구/빈 팔레트로 폴백한다', async () => {
    mockFetchOnce(
      200,
      successBody({
        result: {
          undertone: 'neutral',
          faceShape: 'heart',
          overallScore: 50,
          metrics: [],
          colorRecommendations: [],
          makeupTips: [],
        },
      })
    );

    const result = await requestMakeupAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    expect(result.recommendations.base.length).toBeGreaterThan(0);
    expect(result.recommendations.blush.length).toBeGreaterThan(0);
    expect(result.bestColors).toEqual([]);
  });

  it('요청에 웹 계약(Bearer + mobile 헤더)을 담는다', async () => {
    const fetchMock = mockFetchOnce(200, successBody());

    await requestMakeupAnalysis(VALID_INPUT, 'token-1', BASE_URL);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api/analyze/makeup`);
    expect(init.headers.Authorization).toBe('Bearer token-1');
    expect(init.headers['x-yiroom-client']).toBe('mobile');
  });

  it('403 게이트의 서버 한국어 메시지를 관통시킨다', async () => {
    mockFetchOnce(403, {
      error: '생체정보 수집·이용 동의가 필요해요.',
      code: 'BIOMETRIC_CONSENT_REQUIRED',
    });

    await expect(requestMakeupAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      name: 'MakeupApiError',
      status: 403,
      message: '생체정보 수집·이용 동의가 필요해요.',
    });
  });

  it('에러 메시지가 문자열이 아니면 폴백 문구를 쓴다', async () => {
    mockFetchOnce(500, { error: { nested: true } });

    await expect(requestMakeupAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      message: '메이크업 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.',
    });
  });

  it('네트워크 실패 시 사용자 대면 한국어 메시지로 던진다', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    await expect(requestMakeupAnalysis(VALID_INPUT, 'token-1', BASE_URL)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('base URL 미설정이면 CONFIG_ERROR', async () => {
    const original = process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    try {
      await expect(requestMakeupAnalysis(VALID_INPUT, 'token-1')).rejects.toMatchObject({
        code: 'CONFIG_ERROR',
      });
    } finally {
      if (original !== undefined) process.env.EXPO_PUBLIC_YIROOM_API_URL = original;
    }
  });

  it('MakeupApiError는 인스턴스 판별이 가능하다', () => {
    const err = new MakeupApiError('메시지', 400, 'VALIDATION_ERROR');
    expect(err).toBeInstanceOf(MakeupApiError);
    expect(err).toBeInstanceOf(Error);
  });
});
