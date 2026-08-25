/**
 * 배치 E 이전에 예약된 숨김 웰니스 알림 정리.
 *
 * 왜: 예약 시점의 기능 플래그는 앱 업데이트 뒤에도 이미 등록된 로컬 알림을 취소하지 못한다.
 * 허용 알림까지 지우지 않도록 운동·식사·물 식별자만 골라 한 번 정리한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FEATURE_FLAGS } from '@yiroom/shared';
import * as Notifications from 'expo-notifications';

import { pushLogger } from '../utils/logger';

const CLEANUP_COMPLETE_KEY = 'yiroom_hidden_wellness_notifications_cleaned_v1';

const HIDDEN_WELLNESS_REMINDER_TYPES = new Set([
  'workout_reminder',
  'meal_reminder',
  'nutrition_reminder',
  'water_reminder',
]);

function isHiddenWellnessReminder(request: Notifications.NotificationRequest): boolean {
  const type = request.content.data?.type;
  return typeof type === 'string' && HIDDEN_WELLNESS_REMINDER_TYPES.has(type);
}

/**
 * 설치 단위로 한 번만 과거 웰니스 예약 알림을 정리한다.
 * 조회·취소가 실패하면 완료 표식을 남기지 않아 다음 앱 시작 때 재시도한다.
 */
export async function cleanupHiddenWellnessNotificationsOnce(): Promise<number> {
  if (FEATURE_FLAGS.WELLNESS_PHASE2) return 0;

  try {
    const isComplete = await AsyncStorage.getItem(CLEANUP_COMPLETE_KEY);
    if (isComplete === 'true') return 0;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hiddenReminders = scheduled.filter(isHiddenWellnessReminder);

    await Promise.all(
      hiddenReminders.map((request) =>
        Notifications.cancelScheduledNotificationAsync(request.identifier)
      )
    );
    await AsyncStorage.setItem(CLEANUP_COMPLETE_KEY, 'true');

    return hiddenReminders.length;
  } catch (error) {
    pushLogger.warn('숨김 웰니스 예약 알림 정리에 실패했습니다. 다음 시작 때 재시도합니다.', error);
    return 0;
  }
}
