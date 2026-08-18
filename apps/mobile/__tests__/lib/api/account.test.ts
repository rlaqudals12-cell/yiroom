/**
 * 계정 즉시 삭제 HTTP 클라이언트 테스트
 *
 * @see lib/api/account.ts
 * @see apps/web/app/api/user/account/route.ts
 */

import { AccountApiError, deleteAccount } from '@/lib/api';

function mockFetch(response: { ok: boolean; status: number; body: unknown }): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: () => Promise.resolve(response.body),
  });
}

describe('deleteAccount', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('Clerk 토큰과 이메일 확인값으로 웹 hard-delete API를 호출한다', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      body: {
        success: true,
        message: '계정이 성공적으로 삭제되었습니다.',
        deletedAt: '2026-08-18T00:00:00.000Z',
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await deleteAccount('test@example.com', 'clerk-jwt', 'https://api.test');

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/user/account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer clerk-jwt',
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ confirmation: 'test@example.com' }),
    });
  });

  it('웹이 보낸 삭제 실패 코드와 사용자 메시지를 보존한다', async () => {
    global.fetch = mockFetch({
      ok: false,
      status: 500,
      body: {
        success: false,
        error: 'DELETION_FAILED',
        message: '일부 데이터를 삭제하지 못해 계정 삭제를 중단했어요.',
      },
    }) as unknown as typeof fetch;

    await expect(deleteAccount('test@example.com', 'clerk-jwt', 'https://api.test')).rejects.toMatchObject({
      name: 'AccountApiError',
      status: 500,
      code: 'DELETION_FAILED',
      message: '일부 데이터를 삭제하지 못해 계정 삭제를 중단했어요.',
    });
  });

  it('네트워크 실패를 재시도 가능한 사용자 메시지로 변환한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(deleteAccount('test@example.com', 'clerk-jwt', 'https://api.test')).rejects.toEqual(
      expect.objectContaining<AccountApiError>({
        name: 'AccountApiError',
        status: 0,
        code: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해주세요.',
      })
    );
  });
});
