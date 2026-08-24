import { requestPostureAnalysis } from '../../../lib/api/posture';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

describe('posture API thin client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('인증된 웹 API만 호출하고 서버가 준 근거 문구를 그대로 매핑한다', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        usedMock: false,
        result: {
          postureType: 'forward_head',
          concerns: ['목이 앞으로 기울어져 있어요'],
          stretchingRecommendations: [
            { name: '턱 당기기', description: '턱을 뒤로 당겨요', duration: '30초' },
          ],
          insight: '화면 높이를 눈높이에 맞춰보세요.',
          bodyTypeCorrelation: { correlationNote: '어깨 긴장을 함께 살펴보세요.' },
        },
      }),
    });

    const result = await requestPostureAnalysis('front-base64', 'token', 'https://example.com');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/analyze/posture',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        body: JSON.stringify({ frontImageBase64: 'front-base64' }),
      })
    );
    expect(result).toMatchObject({
      postureType: 'forward_head',
      issues: ['목이 앞으로 기울어져 있어요'],
      exercises: [{ name: '턱 당기기', description: '턱을 뒤로 당겨요', duration: '30초' }],
      dailyTips: ['화면 높이를 눈높이에 맞춰보세요.', '어깨 긴장을 함께 살펴보세요.'],
      usedMock: false,
    });
  });

  it('서버 폴백 출처를 보존한다', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        usedMock: true,
        result: { postureType: 'normal', concerns: [], stretchingRecommendations: [] },
      }),
    });

    await expect(
      requestPostureAnalysis('front-base64', 'token', 'https://example.com')
    ).resolves.toMatchObject({ usedMock: true, dailyTips: [] });
  });

  it('유효하지 않은 서버 결과를 임의 기본값으로 꾸미지 않고 실패시킨다', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: { postureType: 'unknown' } }),
    });

    await expect(
      requestPostureAnalysis('front-base64', 'token', 'https://example.com')
    ).rejects.toMatchObject({ name: 'PostureApiError', code: 'PARSE_ERROR' });
  });

  it('인증·동의 게이트 오류의 사용자 문구와 코드를 보존한다', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: { code: 'BIOMETRIC_CONSENT_REQUIRED', userMessage: '생체정보 동의가 필요해요.' },
      }),
    });

    await expect(
      requestPostureAnalysis('front-base64', 'token', 'https://example.com')
    ).rejects.toMatchObject({
      name: 'PostureApiError',
      status: 403,
      code: 'BIOMETRIC_CONSENT_REQUIRED',
      message: '생체정보 동의가 필요해요.',
    });
  });
});
