import {
  BiometricConsentApiError,
  revokeBiometricConsent,
} from '../../../lib/api/biometric-consent';

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('biometric consent withdrawal API client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('명시적 확인과 Clerk 토큰으로 철회 API를 호출하고 완료 결과를 반환한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({
        success: true,
        data: {
          consentRevoked: true,
          imagesDeleted: 3,
          databaseTargetsCleared: 11,
          fullyPurged: true,
        },
      })
    );

    await expect(
      revokeBiometricConsent('clerk-token', 'https://api.example.test/')
    ).resolves.toEqual({
      consentRevoked: true,
      imagesDeleted: 3,
      databaseTargetsCleared: 11,
      fullyPurged: true,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/agreement/biometric',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer clerk-token' }),
        body: JSON.stringify({ confirm: true }),
      })
    );
  });

  it('부분 파기 응답은 성공으로 반환하지 않고 재시도 상태가 있는 오류로 던진다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response(
        {
          success: false,
          error: {
            code: 'PARTIAL_PURGE_ERROR',
            message: 'Biometric consent withdrawal completed partially',
            userMessage:
              '생체정보 동의는 철회했지만 일부 이미지 파기가 끝나지 않았습니다. 잠시 후 다시 시도해주세요.',
            details: {
              consentRevoked: true,
              imagesDeleted: 2,
              databaseTargetsCleared: 10,
              fullyPurged: false,
            },
          },
        },
        false,
        500
      )
    );

    const error = await revokeBiometricConsent('clerk-token', 'https://api.example.test').catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(BiometricConsentApiError);
    expect(error).toMatchObject({
      code: 'PARTIAL_PURGE_ERROR',
      status: 500,
      partialResult: {
        consentRevoked: true,
        imagesDeleted: 2,
        databaseTargetsCleared: 10,
        fullyPurged: false,
      },
    });
  });

  it('성공 봉투의 데이터가 불완전하면 fail-closed 오류를 낸다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({ success: true, data: { consentRevoked: true } })
    );

    await expect(
      revokeBiometricConsent('clerk-token', 'https://api.example.test')
    ).rejects.toMatchObject({
      status: 200,
      message: '생체정보 동의 철회를 완료하지 못했어요.',
    });
  });

  it('네트워크 실패는 NETWORK_ERROR로 구분한다', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    await expect(
      revokeBiometricConsent('clerk-token', 'https://api.example.test')
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });
});
