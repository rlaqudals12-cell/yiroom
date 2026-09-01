import {
  checkProductSafety,
  fetchSafetyProfile,
  saveSafetyProfile,
  SafetyApiError,
} from '@/lib/api/safety';

const BASE = 'https://api.test';

function response<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data }),
  };
}

describe('mobile safety thin client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Bearer 토큰으로 안전 프로필을 조회한다', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response({ conditions: [], medications: [], consentGiven: false }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchSafetyProfile('jwt', BASE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/safety/profile`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt',
          'x-yiroom-client': 'mobile',
        }),
      })
    );
  });

  it('결합 임신·수유 marker를 웹 프로필 API에 그대로 저장한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response({
        conditions: ['pregnancy_or_breastfeeding'],
        medications: ['isotretinoin'],
        consentGiven: true,
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await saveSafetyProfile(
      {
        conditions: ['pregnancy_or_breastfeeding'],
        medications: ['isotretinoin'],
        consentGiven: true,
      },
      'jwt',
      BASE
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/safety/profile`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          conditions: ['pregnancy_or_breastfeeding'],
          medications: ['isotretinoin'],
          consentGiven: true,
        }),
      })
    );
  });

  it('제품 전체 성분을 웹 안전 검사 API로 전달한다', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response({ productId: 'p1', alerts: [], disclaimer: '일반 참고 정보' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await checkProductSafety(
      { productId: 'p1', ingredients: ['retinol', 'glycerin'] },
      'jwt',
      BASE
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/api/safety/check`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', ingredients: ['retinol', 'glycerin'] }),
      })
    );
  });

  it('봉투가 아니거나 실패한 응답을 성공으로 처리하지 않는다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    await expect(fetchSafetyProfile('jwt', BASE)).rejects.toBeInstanceOf(SafetyApiError);
  });
});
