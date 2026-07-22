/**
 * fetchIssueNo (발급 번호 thin client) 테스트 — "어떤 실패든 null" 계약
 */
import { fetchIssueNo } from '../../../lib/api/issue-no';

const BASE = 'https://api.test';

describe('fetchIssueNo', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('정상 봉투면 발급 번호를 반환한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { issueNo: 42 } }),
    }) as unknown as typeof fetch;

    await expect(fetchIssueNo('token', 'session-1', BASE)).resolves.toBe(42);
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/share/issue-no?sessionId=session-1`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      })
    );
  });

  it('success:false·비숫자·0이면 null (번호를 지어내지 않음)', async () => {
    const cases = [
      { success: false, data: { issueNo: 42 } },
      { success: true, data: { issueNo: 'x' } },
      { success: true, data: { issueNo: 0 } },
      { success: true, data: {} },
      {},
    ];
    for (const body of cases) {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => body,
      }) as unknown as typeof fetch;
      await expect(fetchIssueNo('token', 's', BASE)).resolves.toBeNull();
    }
  });

  it('토큰·URL이 없으면 네트워크 호출 없이 null', async () => {
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;
    await expect(fetchIssueNo(null, 's', BASE)).resolves.toBeNull();
    await expect(fetchIssueNo('token', 's', undefined)).resolves.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('HTTP 실패·네트워크 예외도 null (화면에 에러 미노출 계약)', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;
    await expect(fetchIssueNo('token', 's', BASE)).resolves.toBeNull();

    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
    await expect(fetchIssueNo('token', 's', BASE)).resolves.toBeNull();
  });
});
