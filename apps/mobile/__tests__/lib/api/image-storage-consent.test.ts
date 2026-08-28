import {
  fetchImageStorageConsent,
  ImageStorageConsentApiError,
  isImageStorageConsentActive,
  saveImageStorageConsent,
} from '@/lib/api/image-storage-consent';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('모바일 이미지 저장 동의 클라이언트', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('최신·미만료 동의만 활성으로 판정한다', () => {
    const now = new Date('2026-08-27T00:00:00.000Z');
    expect(
      isImageStorageConsentActive(
        {
          consent_given: true,
          consent_version: 'v1.0',
          retention_until: '2027-08-27T00:00:00.000Z',
        },
        now
      )
    ).toBe(true);
    expect(
      isImageStorageConsentActive(
        {
          consent_given: true,
          consent_version: 'v1.0',
          retention_until: '2026-08-26T00:00:00.000Z',
        },
        now
      )
    ).toBe(false);
    expect(
      isImageStorageConsentActive({
        consent_given: true,
        consent_version: 'v0.9',
        retention_until: '2027-08-27T00:00:00.000Z',
      })
    ).toBe(false);
  });

  it('전용 twin 동의를 Bearer 인증과 모바일 헤더로 조회한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response({
        consent: {
          consent_given: true,
          consent_version: 'v1.0',
          retention_until: '2099-01-01T00:00:00.000Z',
        },
      })
    );
    global.fetch = fetchMock as typeof fetch;

    await expect(
      fetchImageStorageConsent('twin', 'clerk-token', 'https://api.example')
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example/api/consent?analysisType=twin',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer clerk-token',
          'x-yiroom-client': 'mobile',
        }),
      })
    );
  });

  it('동의 저장은 twin만 담은 기존 웹 API 계약을 사용한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ consent: {} }));
    global.fetch = fetchMock as typeof fetch;

    await saveImageStorageConsent('twin', 'clerk-token', 'https://api.example/');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example/api/consent',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ analysisType: 'twin' }),
      })
    );
  });

  it('조회 실패를 활성 동의로 추정하지 않고 오류로 전달한다', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      response(
        {
          success: false,
          error: { code: 'CONSENT_QUERY_FAILED', userMessage: '동의 상태를 확인하지 못했어요.' },
        },
        500
      )
    ) as typeof fetch;

    await expect(
      fetchImageStorageConsent('twin', 'token', 'https://api.example')
    ).rejects.toMatchObject({
      name: 'ImageStorageConsentApiError',
      message: '동의 상태를 확인하지 못했어요.',
      code: 'CONSENT_QUERY_FAILED',
      status: 500,
    } satisfies Partial<ImageStorageConsentApiError>);
  });
});
