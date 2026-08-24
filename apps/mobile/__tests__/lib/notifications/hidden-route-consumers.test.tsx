import { act, renderHook, waitFor } from '@testing-library/react-native';

let mockResponseListeners: Array<(response: Record<string, unknown>) => void> = [];
const mockScheduleNotification = jest.fn().mockResolvedValue('scheduled-id');

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'standalone', isDevice: true, expoConfig: { extra: {} } },
}));

jest.mock('expo-router', () => {
  const push = jest.fn();
  return {
    router: { push },
    useRouter: () => ({ push }),
    mockPush: push,
  };
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(
    (listener: (response: Record<string, unknown>) => void) => {
      mockResponseListeners.push(listener);
      return { remove: jest.fn() };
    }
  ),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'token' }),
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotification(...args),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('../../../lib/push/token', () => ({
  initializePushNotifications: jest.fn().mockResolvedValue(null),
  registerPushTokenWithServer: jest.fn(),
  unregisterPushTokenFromServer: jest.fn(),
}));

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({}),
}));

import {
  useNotificationResponse,
  useNotificationScheduler,
} from '../../../lib/notifications/useNotifications';
import { usePush } from '../../../lib/push/usePush';

function notificationResponse(data: Record<string, unknown>): Record<string, unknown> {
  return { notification: { request: { content: { data } } } };
}

describe('숨김 W/N 알림 소비 경계', () => {
  beforeEach(() => {
    (require('expo-router').mockPush as jest.Mock).mockClear();
    mockScheduleNotification.mockClear();
    mockResponseListeners = [];
  });

  it('예약된 구 알림의 직접 route도 탭 시 오늘 화면으로 보낸다', async () => {
    renderHook(() => useNotificationResponse());
    await waitFor(() => expect(mockResponseListeners).toHaveLength(1));

    act(() => {
      mockResponseListeners[0](notificationResponse({ route: '/(nutrition)/water' }));
    });

    expect(require('expo-router').mockPush).toHaveBeenCalledWith('/(tabs)');
  });

  it('구형 type 기반 운동 푸시도 탭 시 숨김 화면을 열지 않는다', async () => {
    renderHook(() => usePush('user-1'));
    await waitFor(() => expect(mockResponseListeners).toHaveLength(1));

    act(() => {
      mockResponseListeners[0](notificationResponse({ type: 'workout_reminder' }));
    });

    expect(require('expo-router').mockPush).toHaveBeenCalledWith('/(tabs)');
  });

  it.each(['workout_reminder', 'nutrition_reminder', 'water_reminder'] as const)(
    '%s를 새로 예약하지 않는다',
    async (type) => {
      const { result } = renderHook(() => useNotificationScheduler());

      let notificationId: string | null = 'not-called';
      await act(async () => {
        notificationId = await result.current.schedule(type, null as never);
      });

      expect(notificationId).toBeNull();
      expect(mockScheduleNotification).not.toHaveBeenCalled();
    }
  );
});
