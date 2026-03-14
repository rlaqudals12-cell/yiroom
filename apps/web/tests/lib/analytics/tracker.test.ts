/**
 * Analytics 이벤트 트래커 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 세션/디바이스 모듈 mock
vi.mock('@/lib/analytics/session', () => ({
  getOrCreateSession: vi.fn(() => 'sess_mock_123'),
  refreshSession: vi.fn(),
  detectDeviceType: vi.fn(() => 'desktop' as const),
  detectBrowser: vi.fn(() => 'Chrome'),
  detectOS: vi.fn(() => 'Windows'),
}));

// 로거 mock
vi.mock('@/lib/utils/logger', () => ({
  analyticsLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 동적 import로 모듈 상태 초기화
let trackEvent: typeof import('@/lib/analytics/tracker').trackEvent;
let flushEvents: typeof import('@/lib/analytics/tracker').flushEvents;
let trackPageView: typeof import('@/lib/analytics/tracker').trackPageView;
let trackFeatureUse: typeof import('@/lib/analytics/tracker').trackFeatureUse;
let trackAnalysisComplete: typeof import('@/lib/analytics/tracker').trackAnalysisComplete;
let trackWorkoutStart: typeof import('@/lib/analytics/tracker').trackWorkoutStart;
let trackWorkoutComplete: typeof import('@/lib/analytics/tracker').trackWorkoutComplete;
let trackSearch: typeof import('@/lib/analytics/tracker').trackSearch;
let trackButtonClick: typeof import('@/lib/analytics/tracker').trackButtonClick;
let trackShoppingClick: typeof import('@/lib/analytics/tracker').trackShoppingClick;
let trackCustomEvent: typeof import('@/lib/analytics/tracker').trackCustomEvent;

describe('Analytics Tracker', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    // production 모드로 설정해야 fetch가 호출됨
    vi.stubEnv('NODE_ENV', 'production');

    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    // 모듈 상태 초기화를 위해 재import
    vi.resetModules();
    const mod = await import('@/lib/analytics/tracker');
    trackEvent = mod.trackEvent;
    flushEvents = mod.flushEvents;
    trackPageView = mod.trackPageView;
    trackFeatureUse = mod.trackFeatureUse;
    trackAnalysisComplete = mod.trackAnalysisComplete;
    trackWorkoutStart = mod.trackWorkoutStart;
    trackWorkoutComplete = mod.trackWorkoutComplete;
    trackSearch = mod.trackSearch;
    trackButtonClick = mod.trackButtonClick;
    trackShoppingClick = mod.trackShoppingClick;
    trackCustomEvent = mod.trackCustomEvent;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('trackEvent', () => {
    it('이벤트를 큐에 추가하고 타이머를 설정한다', async () => {
      await trackEvent({
        eventType: 'page_view',
        eventName: 'Test Event',
      });

      // 아직 fetch 호출 안 됨 (배치 크기 미달)
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('배치 크기(10)에 도달하면 즉시 전송한다', async () => {
      for (let i = 0; i < 10; i++) {
        await trackEvent({
          eventType: 'button_click',
          eventName: `Click ${i}`,
        });
      }

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('/api/analytics/events');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.events).toHaveLength(10);
      expect(body.sessionId).toBe('sess_mock_123');
    });

    it('5초 후 타이머로 자동 전송한다', async () => {
      await trackEvent({
        eventType: 'page_view',
        eventName: 'Timer Test',
      });

      expect(fetchSpy).not.toHaveBeenCalled();

      // 5초 경과
      await vi.advanceTimersByTimeAsync(5000);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events).toHaveLength(1);
    });
  });

  describe('flushEvents', () => {
    it('큐가 비어있으면 전송하지 않는다', async () => {
      await flushEvents();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('큐의 모든 이벤트를 전송하고 큐를 비운다', async () => {
      await trackEvent({ eventType: 'page_view', eventName: 'Event 1' });
      await trackEvent({ eventType: 'page_view', eventName: 'Event 2' });
      await trackEvent({ eventType: 'page_view', eventName: 'Event 3' });

      await flushEvents();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events).toHaveLength(3);

      // 큐가 비워졌으므로 다시 flush해도 전송 안 됨
      await flushEvents();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('전송 실패 시 이벤트를 큐에 다시 추가한다', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      await trackEvent({ eventType: 'page_view', eventName: 'Retry Event' });
      await flushEvents();

      // 실패 후 큐에 다시 들어갔으므로, 다음 flush에서 전송 시도
      fetchSpy.mockResolvedValueOnce({ ok: true });
      await flushEvents();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('전송 실패 시 큐 최대 크기를 100으로 제한한다', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      // 50개 이벤트 추가 후 flush 실패
      for (let i = 0; i < 50; i++) {
        await trackEvent({ eventType: 'button_click', eventName: `Click ${i}` });
        if (i > 0 && i % 10 === 9) {
          // 배치 크기 도달 시 자동 flush (실패)
        }
      }

      // 추가 60개 더 넣어서 큐에 100개 넘게 시도
      for (let i = 50; i < 110; i++) {
        await trackEvent({ eventType: 'button_click', eventName: `Click ${i}` });
      }

      // flush 실패 후 큐에 다시 추가될 때 100개로 제한됨
      // 정확한 수는 배치 타이밍에 따라 다르지만, 100 이하여야 함
      fetchSpy.mockResolvedValueOnce({ ok: true });
      await flushEvents();

      if (fetchSpy.mock.calls.length > 0) {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
        const body = JSON.parse(lastCall[1].body);
        expect(body.events.length).toBeLessThanOrEqual(100);
      }
    });

    it('디바이스 정보를 payload에 포함한다', async () => {
      await trackEvent({ eventType: 'page_view', eventName: 'Device Info Test' });
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.deviceType).toBe('desktop');
      expect(body.browser).toBe('Chrome');
      expect(body.os).toBe('Windows');
    });
  });

  describe('개발 모드', () => {
    it('개발 환경에서는 fetch 대신 로깅만 한다', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      // 모듈 재로드
      vi.resetModules();
      const devMod = await import('@/lib/analytics/tracker');

      await devMod.trackEvent({ eventType: 'page_view', eventName: 'Dev Test' });
      await devMod.flushEvents();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('편의 함수', () => {
    it('trackPageView는 page_view 이벤트를 생성한다', async () => {
      await trackPageView('/dashboard', 1500);
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      const event = body.events[0];
      expect(event.eventType).toBe('page_view');
      expect(event.eventName).toBe('Page View: /dashboard');
      expect(event.eventData.duration).toBe(1500);
      expect(event.pagePath).toBe('/dashboard');
    });

    it('trackFeatureUse는 feature_use 이벤트를 생성한다', async () => {
      await trackFeatureUse('skin-analysis', '피부 분석');
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventType).toBe('feature_use');
      expect(body.events[0].eventData.featureId).toBe('skin-analysis');
    });

    it('trackAnalysisComplete는 분석 타입을 포함한다', async () => {
      await trackAnalysisComplete('skin');
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventType).toBe('analysis_complete');
      expect(body.events[0].eventData.analysisType).toBe('skin');
    });

    it('trackWorkoutStart는 운동 계획 ID를 포함한다', async () => {
      await trackWorkoutStart('plan_456');
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventData.workoutPlanId).toBe('plan_456');
    });

    it('trackWorkoutComplete는 운동 시간을 포함한다', async () => {
      await trackWorkoutComplete('plan_456', 45);
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventData.durationMin).toBe(45);
    });

    it('trackSearch는 검색어와 결과 수를 포함한다', async () => {
      await trackSearch('스킨케어', 15);
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventData.query).toBe('스킨케어');
      expect(body.events[0].eventData.resultsCount).toBe(15);
    });

    it('trackButtonClick은 버튼 ID와 컨텍스트를 포함한다', async () => {
      await trackButtonClick('cta-start', 'homepage');
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventData.buttonId).toBe('cta-start');
      expect(body.events[0].eventData.context).toBe('homepage');
    });

    it('trackShoppingClick은 플랫폼과 카테고리를 포함한다', async () => {
      await trackShoppingClick('coupang', 'workout-top', {
        personalColor: 'spring',
        bodyType: 'hourglass',
      });
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventData.platform).toBe('coupang');
      expect(body.events[0].eventData.category).toBe('workout-top');
      expect(body.events[0].eventData.personalColor).toBe('spring');
    });

    it('trackCustomEvent는 사용자 지정 이벤트를 생성한다', async () => {
      await trackCustomEvent('product_view', '제품 조회', { productId: 'p_123' });
      await flushEvents();

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.events[0].eventType).toBe('product_view');
      expect(body.events[0].eventName).toBe('제품 조회');
    });
  });
});
