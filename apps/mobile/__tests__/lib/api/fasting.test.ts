import {
  completeFastingSession,
  getFastingSessions,
  startFastingSession,
} from '@/lib/api/fasting';

const fetchMock = jest.fn();

function response(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('fasting API client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('인증 헤더로 활성 세션과 이력을 조회한다', async () => {
    const activeSession = {
      id: 'fast-active',
      start_time: '2026-08-18T00:00:00.000Z',
      end_time: null,
      target_hours: 16,
      actual_hours: null,
      is_completed: false,
    };
    const history = [
      {
        id: 'fast-done',
        start_time: '2026-08-17T00:00:00.000Z',
        end_time: '2026-08-17T16:00:00.000Z',
        target_hours: 16,
        actual_hours: 16,
        is_completed: true,
      },
    ];
    fetchMock.mockResolvedValueOnce(
      response({ success: true, activeSession, history })
    );

    await expect(getFastingSessions('token', 'https://api.example.com')).resolves.toEqual({
      activeSession,
      history,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/nutrition/fasting?includeHistory=true&historyLimit=10',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'x-yiroom-client': 'mobile',
        }),
      })
    );
  });

  it('시작·완료 요청을 웹 API에 위임한다', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ success: true, data: { id: 'fast-1' } }, 201))
      .mockResolvedValueOnce(response({ success: true, data: { id: 'fast-1' } }));

    await startFastingSession('token', 16, 'https://api.example.com');
    await completeFastingSession('token', 'fast-1', 'https://api.example.com');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/nutrition/fasting',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ targetHours: 16 }) })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/nutrition/fasting',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ id: 'fast-1', isCompleted: true }),
      })
    );
  });

  it('인증 토큰이 없으면 네트워크를 호출하지 않는다', async () => {
    await expect(getFastingSessions('', 'https://api.example.com')).rejects.toThrow(
      '로그인이 필요합니다.'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
