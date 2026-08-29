import {
  ConsentPreferencesApiError,
  fetchConsentPreferences,
  updateConsentPreferences,
} from '../../../lib/api/consent-preferences';

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('consent preferences API client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('인증 헤더로 서버 선택 동의를 조회한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({
        success: true,
        data: { analyticsConsent: false, marketingConsent: true },
      })
    );

    await expect(
      fetchConsentPreferences('clerk-token', 'https://api.example.test/')
    ).resolves.toEqual({ analyticsConsent: false, marketingConsent: true });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/agreement/preferences',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer clerk-token',
          'x-yiroom-client': 'mobile',
        },
      }
    );
  });

  it('단일 또는 양쪽 선택 동의를 PATCH하고 서버의 최종 상태를 반환한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({
        success: true,
        data: { analyticsConsent: true, marketingConsent: false },
      })
    );

    await expect(
      updateConsentPreferences(
        { analyticsConsent: true, marketingConsent: false },
        'clerk-token',
        'https://api.example.test'
      )
    ).resolves.toEqual({ analyticsConsent: true, marketingConsent: false });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({
      analyticsConsent: true,
      marketingConsent: false,
    });
  });

  it('빈 변경은 네트워크 요청 전에 거절한다', async () => {
    await expect(updateConsentPreferences({}, 'clerk-token')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('표준 서버 오류의 사용자 문구와 코드를 보존한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User not authenticated',
            userMessage: '로그인이 필요합니다.',
          },
        },
        false,
        401
      )
    );

    const error = await fetchConsentPreferences('expired-token', 'https://api.example.test').catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ConsentPreferencesApiError);
    expect(error).toMatchObject({
      message: '로그인이 필요합니다.',
      status: 401,
      code: 'AUTH_ERROR',
    });
  });

  it('성공 봉투의 데이터 타입이 틀리면 fail-closed 오류를 낸다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({
        success: true,
        data: { analyticsConsent: 'yes', marketingConsent: false },
      })
    );

    await expect(
      fetchConsentPreferences('clerk-token', 'https://api.example.test')
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('조회 중 네트워크 실패를 NETWORK_ERROR로 구분한다', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    await expect(
      fetchConsentPreferences('clerk-token', 'https://api.example.test')
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
      message: '네트워크 연결을 확인해주세요.',
    });
  });

  it('저장 중 네트워크 실패를 NETWORK_ERROR로 구분한다', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    await expect(
      updateConsentPreferences(
        { analyticsConsent: false },
        'clerk-token',
        'https://api.example.test'
      )
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
      message: '네트워크 연결을 확인해주세요.',
    });
  });
});
