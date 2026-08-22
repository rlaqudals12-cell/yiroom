import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

const mockTrackAppStarted = jest.fn();
const mockFlushEvents = jest.fn();
const mockResetAnalyticsIdentity = jest.fn();
const mockSetAnalyticsConsent = jest.fn();
const mockFetchConsentPreferences = jest.fn();

jest.mock('../../../lib/api/consent-preferences', () => ({
  fetchConsentPreferences: (...args: unknown[]) => mockFetchConsentPreferences(...args),
}));

jest.mock('../../../lib/analytics/tracker', () => ({
  trackAppStarted: (...args: unknown[]) => mockTrackAppStarted(...args),
  flushEvents: (...args: unknown[]) => mockFlushEvents(...args),
  resetAnalyticsIdentity: (...args: unknown[]) => mockResetAnalyticsIdentity(...args),
  setAnalyticsConsent: (...args: unknown[]) => mockSetAnalyticsConsent(...args),
}));

import { useAnalyticsLifecycle } from '../../../lib/analytics/lifecycle';
import { endSession, getOrCreateSession } from '../../../lib/analytics/session';

describe('useAnalyticsLifecycle', () => {
  let onAppStateChange: ((state: AppStateStatus) => void) | undefined;
  const remove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchConsentPreferences.mockResolvedValue({
      analyticsConsent: true,
      marketingConsent: false,
    });
    onAppStateChange = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onAppStateChange = listener;
      return { remove };
    });
  });

  afterEach(() => {
    endSession();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('짧은 background 복귀는 유지하고 30분 초과 복귀만 새 세션 시작으로 기록한다', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T00:00:00.000Z'));
    getOrCreateSession();
    const getToken = jest.fn().mockResolvedValue('clerk-token');
    renderHook(() => useAnalyticsLifecycle(getToken, true, 'user-a'));

    await waitFor(() => {
      expect(mockTrackAppStarted).toHaveBeenCalledTimes(1);
      expect(mockTrackAppStarted).toHaveBeenLastCalledWith('clerk-token');
    });

    act(() => onAppStateChange?.('inactive'));
    act(() => onAppStateChange?.('active'));
    expect(mockTrackAppStarted).toHaveBeenCalledTimes(1);
    expect(mockFlushEvents).not.toHaveBeenCalled();

    act(() => onAppStateChange?.('background'));
    await waitFor(() => expect(mockFlushEvents).toHaveBeenCalledWith('clerk-token'));

    act(() => jest.advanceTimersByTime(60_000));
    act(() => onAppStateChange?.('inactive'));
    act(() => onAppStateChange?.('active'));
    expect(mockTrackAppStarted).toHaveBeenCalledTimes(1);

    act(() => onAppStateChange?.('background'));
    act(() => jest.advanceTimersByTime(31 * 60_000));
    act(() => onAppStateChange?.('active'));
    await waitFor(() => expect(mockTrackAppStarted).toHaveBeenCalledTimes(2));
  });

  it('signed-out cold start는 요청하지 않고 로그인 전환 때 한 번 시작한다', async () => {
    const getToken = jest.fn().mockResolvedValue('clerk-token');
    const { rerender } = renderHook(
      ({ signedIn, userId }: { signedIn: boolean; userId: string | null }) =>
        useAnalyticsLifecycle(getToken, signedIn, userId),
      { initialProps: { signedIn: false, userId: null } }
    );

    expect(mockTrackAppStarted).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();

    rerender({ signedIn: true, userId: 'user-a' });
    await waitFor(() => expect(mockTrackAppStarted).toHaveBeenCalledTimes(1));
  });

  it('서버의 분석 동의가 false면 gate를 닫고 앱 시작 이벤트를 보내지 않는다', async () => {
    mockFetchConsentPreferences.mockResolvedValue({
      analyticsConsent: false,
      marketingConsent: true,
    });
    const getToken = jest.fn().mockResolvedValue('clerk-token');

    renderHook(() => useAnalyticsLifecycle(getToken, true, 'user-a'));

    await waitFor(() => {
      expect(mockFetchConsentPreferences).toHaveBeenCalledWith('clerk-token');
      expect(mockSetAnalyticsConsent).toHaveBeenCalledWith(false);
    });
    expect(mockTrackAppStarted).not.toHaveBeenCalled();
  });

  it('동의 조회 실패를 옵트인으로 추정하지 않는다', async () => {
    mockFetchConsentPreferences.mockRejectedValue(new Error('network'));
    const getToken = jest.fn().mockResolvedValue('clerk-token');

    renderHook(() => useAnalyticsLifecycle(getToken, true, 'user-a'));

    await waitFor(() => expect(mockSetAnalyticsConsent).toHaveBeenCalledWith(null));
    expect(mockTrackAppStarted).not.toHaveBeenCalled();
  });

  it('A 로그아웃과 B 로그인 경계에서 이전 큐·세션을 각각 초기화한다', async () => {
    const getToken = jest.fn().mockResolvedValue('clerk-token');
    const { rerender } = renderHook(
      ({ signedIn, userId }: { signedIn: boolean; userId: string | null }) =>
        useAnalyticsLifecycle(getToken, signedIn, userId),
      { initialProps: { signedIn: true, userId: 'user-a' } }
    );
    await waitFor(() => expect(mockTrackAppStarted).toHaveBeenCalledTimes(1));

    rerender({ signedIn: false, userId: null });
    expect(mockResetAnalyticsIdentity).toHaveBeenCalledTimes(1);

    rerender({ signedIn: true, userId: 'user-b' });
    await waitFor(() => expect(mockTrackAppStarted).toHaveBeenCalledTimes(2));
    expect(mockResetAnalyticsIdentity).toHaveBeenCalledTimes(2);
  });

  it('계정 전환 전에 요청한 background 토큰이 늦게 도착해도 새 계정 큐를 flush하지 않는다', async () => {
    let resolveBackgroundToken: (token: string | null) => void = () => undefined;
    const backgroundToken = new Promise<string | null>((resolve) => {
      resolveBackgroundToken = resolve;
    });
    const getToken = jest
      .fn()
      .mockResolvedValueOnce('token-a-start')
      .mockReturnValueOnce(backgroundToken)
      .mockResolvedValue('token-b');
    const { rerender } = renderHook(
      ({ userId }: { userId: string }) => useAnalyticsLifecycle(getToken, true, userId),
      { initialProps: { userId: 'user-a' } }
    );
    await waitFor(() => expect(mockTrackAppStarted).toHaveBeenCalledWith('token-a-start'));

    act(() => onAppStateChange?.('background'));
    await waitFor(() => expect(getToken).toHaveBeenCalledTimes(2));

    rerender({ userId: 'user-b' });
    await waitFor(() => expect(mockTrackAppStarted).toHaveBeenCalledWith('token-b'));

    await act(async () => {
      resolveBackgroundToken('token-a-background');
      await backgroundToken;
    });

    expect(mockFlushEvents).not.toHaveBeenCalledWith('token-a-background');
  });
});
