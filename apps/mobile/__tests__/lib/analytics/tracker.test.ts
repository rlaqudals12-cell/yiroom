jest.mock('../../../lib/utils/logger', () => ({
  analyticsLogger: { error: jest.fn() },
}));

let mockUpdatesChannel: string | null = 'preview';
jest.mock('expo-updates', () => ({
  get channel() {
    return mockUpdatesChannel;
  },
}));

describe('mobile analytics tracker', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_YIROOM_API_URL;
  const originalLegacyApiUrl = process.env.EXPO_PUBLIC_API_URL;

  beforeEach(() => {
    jest.resetModules();
    mockUpdatesChannel = 'preview';
    process.env.EXPO_PUBLIC_YIROOM_API_URL = 'https://analytics.example.test/';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as jest.Mock;
    const { setAnalyticsConsent } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');
    setAnalyticsConsent(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    else process.env.EXPO_PUBLIC_YIROOM_API_URL = originalApiUrl;
    if (originalLegacyApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalLegacyApiUrl;
  });

  it('앱 세션 시작을 Clerk 토큰과 함께 전송한다', async () => {
    const { trackAppStarted } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAppStarted('clerk-token');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://analytics.example.test/api/analytics/events');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer clerk-token',
    });
    const body = JSON.parse(String(init.body));
    expect(body.events).toEqual([
      {
        eventType: 'session_start',
        eventName: 'Mobile App Started',
        eventData: { platform: 'mobile' },
      },
    ]);
  });

  it('분석 시작 이벤트에는 정적 분류만 담고 사진·문진·사용자 식별자는 담지 않는다', async () => {
    const { trackAnalysisStart } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAnalysisStart('integrated', 'update', 'clerk-token');

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.events[0]).toEqual({
      eventType: 'feature_use',
      eventName: 'Analysis Started',
      eventData: {
        featureId: 'analysis',
        analysisType: 'integrated',
        mode: 'update',
      },
    });
    expect(JSON.stringify(body.events[0].eventData)).not.toMatch(
      /base64|image|email|userId|sessionId/i
    );
  });

  it('단독 결과 조회는 해당 분석의 실제 정적 경로로 기록한다', async () => {
    const { trackAnalysisResultView } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAnalysisResultView('skin', 'result-screen', 'clerk-token');

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.events[0]).toEqual({
      eventType: 'page_view',
      eventName: 'Analysis Result Viewed',
      eventData: { analysisType: 'skin', source: 'result-screen' },
      pagePath: '/(analysis)/skin/result',
    });
  });

  it('Clerk 토큰이 없으면 전송하거나 나중 큐에 남기지 않는다', async () => {
    const { flushEvents, trackAppStarted } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAppStarted(null);
    await flushEvents('later-token');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('동의 상태 로딩 전에는 토큰이 있어도 전송하거나 큐잉하지 않는다', async () => {
    const { flushEvents, setAnalyticsConsent, trackAppStarted } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');
    setAnalyticsConsent(null);

    await trackAppStarted('clerk-token');
    setAnalyticsConsent(true);
    await flushEvents('clerk-token');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('분석 동의 false에서는 fetch와 지연 큐 전송이 모두 0회다', async () => {
    const { flushEvents, setAnalyticsConsent, trackEvent } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');
    setAnalyticsConsent(false);

    await trackEvent(
      { eventType: 'feature_use', eventName: 'Should Not Queue' },
      { clerkToken: 'clerk-token' }
    );
    setAnalyticsConsent(true);
    await flushEvents('clerk-token');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('옵트아웃은 이미 대기 중인 이벤트와 재시도 타이머도 폐기한다', async () => {
    jest.useFakeTimers();
    const { flushEvents, setAnalyticsConsent, trackEvent } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackEvent(
      { eventType: 'feature_use', eventName: 'Queued Before Opt Out' },
      { clerkToken: 'clerk-token' }
    );
    setAnalyticsConsent(false);
    setAnalyticsConsent(true);
    await jest.advanceTimersByTimeAsync(10_000);
    await flushEvents('clerk-token');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('preview/null 채널에서 API URL이 명시되지 않으면 prod로 전송하거나 큐잉하지 않는다', async () => {
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
    const { flushEvents, trackAppStarted } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAppStarted('clerk-token');
    process.env.EXPO_PUBLIC_YIROOM_API_URL = 'https://analytics.example.test';
    await flushEvents('clerk-token');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('production 채널은 명시 URL 없이도 prod 폴백 전송을 허용한다', async () => {
    delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
    mockUpdatesChannel = 'production';
    const { trackAppStarted } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAppStarted('clerk-token');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'https://yiroom.vercel.app/api/analytics/events'
    );
  });

  it('비정상 응답도 UX 오류로 전파하지 않고 같은 토큰으로 예약 재시도한다', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const { trackAnalysisComplete } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await expect(
      trackAnalysisComplete(
        'integrated',
        { status: 'partial', axesCompletedCount: 4, usedFallback: true },
        'clerk-token'
      )
    ).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5000);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[1][1].headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer clerk-token',
    });
    const firstBody = JSON.parse(String((global.fetch as jest.Mock).mock.calls[0][1].body));
    const retryBody = JSON.parse(String((global.fetch as jest.Mock).mock.calls[1][1].body));
    expect(retryBody.events).toEqual(firstBody.events);
  });

  it('영구 실패 자동 전송은 총 3시도에서 멈추고 다음 명시적 flush까지 큐를 보존한다', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });
    const { flushEvents, trackAnalysisComplete } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAnalysisComplete('skin', { status: 'completed' }, 'clerk-token');
    await jest.advanceTimersByTimeAsync(5000);
    await jest.advanceTimersByTimeAsync(5000);
    await jest.advanceTimersByTimeAsync(20000);
    expect(global.fetch).toHaveBeenCalledTimes(3);

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
    await flushEvents('clerk-token');
    expect(global.fetch).toHaveBeenCalledTimes(4);
    const retryBody = JSON.parse(String((global.fetch as jest.Mock).mock.calls[3][1].body));
    expect(retryBody.events).toHaveLength(1);
    expect(retryBody.events[0].eventName).toBe('Analysis Completed');
  });

  it('A 계정 큐를 로그아웃 때 폐기하고 B 계정은 새 세션으로 시작한다', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const {
      resetAnalyticsIdentity,
      setAnalyticsConsent,
      trackAnalysisComplete,
      trackAppStarted,
    } =
      require('../../../lib/analytics/tracker') as typeof import('../../../lib/analytics/tracker');

    await trackAnalysisComplete('body', { status: 'completed' }, 'token-a');
    const accountABody = JSON.parse(String((global.fetch as jest.Mock).mock.calls[0][1].body));

    resetAnalyticsIdentity();
    // 새 계정은 서버 동의 조회가 완료된 뒤에만 tracker를 다시 연다.
    setAnalyticsConsent(true);
    await trackAppStarted('token-b');
    await jest.advanceTimersByTimeAsync(10000);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [, accountBInit] = (global.fetch as jest.Mock).mock.calls[1] as [string, RequestInit];
    const accountBBody = JSON.parse(String(accountBInit.body));
    expect((accountBInit.headers as Record<string, string>).Authorization).toBe('Bearer token-b');
    expect(accountBBody.events).toEqual([
      {
        eventType: 'session_start',
        eventName: 'Mobile App Started',
        eventData: { platform: 'mobile' },
      },
    ]);
    expect(accountBBody.sessionId).not.toBe(accountABody.sessionId);
  });
});
