import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../lib/utils/logger', () => ({
  pushLogger: { warn: jest.fn() },
}));

import { cleanupHiddenWellnessNotificationsOnce } from '../../../lib/notifications/hidden-wellness-cleanup';

const mockGetAllScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const mockCancelScheduled = Notifications.cancelScheduledNotificationAsync as jest.Mock;

function scheduled(identifier: string, type: string): Notifications.NotificationRequest {
  return {
    identifier,
    content: { data: { type } },
    trigger: null,
  } as unknown as Notifications.NotificationRequest;
}

describe('앱 시작 시 레거시 웰니스 예약 알림 정리', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('운동·식사·물 알림만 취소하고 아침 브리핑 등 허용 알림은 유지한다', async () => {
    mockGetAllScheduled.mockResolvedValue([
      scheduled('workout-id', 'workout_reminder'),
      scheduled('legacy-meal-id', 'meal_reminder'),
      scheduled('meal-id', 'nutrition_reminder'),
      scheduled('water-id', 'water_reminder'),
      scheduled('briefing-id', 'morning_briefing'),
      scheduled('analysis-id', 'reanalysis_due'),
    ]);

    await expect(cleanupHiddenWellnessNotificationsOnce()).resolves.toBe(4);

    expect(mockCancelScheduled.mock.calls.map(([id]) => id)).toEqual([
      'workout-id',
      'legacy-meal-id',
      'meal-id',
      'water-id',
    ]);
    expect(mockCancelScheduled).not.toHaveBeenCalledWith('briefing-id');
    expect(mockCancelScheduled).not.toHaveBeenCalledWith('analysis-id');
  });

  it('첫 앱 시작에서 완료된 뒤 다음 시작에는 예약 목록을 다시 건드리지 않는다', async () => {
    mockGetAllScheduled.mockResolvedValue([scheduled('workout-id', 'workout_reminder')]);

    await cleanupHiddenWellnessNotificationsOnce();
    await cleanupHiddenWellnessNotificationsOnce();

    expect(mockGetAllScheduled).toHaveBeenCalledTimes(1);
    expect(mockCancelScheduled).toHaveBeenCalledTimes(1);
  });

  it('취소 실패 시 완료 처리하지 않고 다음 앱 시작에서 재시도한다', async () => {
    mockGetAllScheduled.mockResolvedValue([scheduled('workout-id', 'workout_reminder')]);
    mockCancelScheduled.mockRejectedValueOnce(new Error('native failure'));

    await cleanupHiddenWellnessNotificationsOnce();
    await cleanupHiddenWellnessNotificationsOnce();

    expect(mockGetAllScheduled).toHaveBeenCalledTimes(2);
    expect(mockCancelScheduled).toHaveBeenCalledTimes(2);
  });
});
