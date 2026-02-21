/**
 * 푸시 알림 유틸리티
 * 운동/식단 리마인더 및 Streak 알림
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationLogger } from './utils/logger';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 푸시 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    notificationLogger.warn('알림 권한이 거부되었습니다.');
    return false;
  }

  // Android 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout', {
      name: '운동 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ef4444',
    });

    await Notifications.setNotificationChannelAsync('nutrition', {
      name: '식단 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });

    await Notifications.setNotificationChannelAsync('streak', {
      name: 'Streak 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#f59e0b',
    });
  }

  return true;
}

/**
 * 운동 리마인더 스케줄
 */
export async function scheduleWorkoutReminder(
  hour: number = 9,
  minute: number = 0
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '오늘의 운동 시간이에요! 💪',
        body: '계획한 운동을 시작해볼까요?',
        data: { type: 'workout_reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch (error) {
    notificationLogger.error('운동 리마인더 스케줄 실패:', error);
    return null;
  }
}

/**
 * 식단 기록 리마인더 스케줄
 */
export async function scheduleMealReminder(
  mealType: 'breakfast' | 'lunch' | 'dinner',
  hour: number,
  minute: number = 0
): Promise<string | null> {
  const mealNames = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
  };

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${mealNames[mealType]} 식사 기록 📝`,
        body: '오늘 뭐 드셨나요? 식사를 기록해보세요!',
        data: { type: 'meal_reminder', mealType },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch (error) {
    notificationLogger.error('식단 리마인더 스케줄 실패:', error);
    return null;
  }
}

/**
 * Streak 유지 알림
 */
export async function sendStreakReminder(
  streakType: 'workout' | 'nutrition',
  currentStreak: number
): Promise<string | null> {
  const typeNames = {
    workout: '운동',
    nutrition: '식단',
  };

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${currentStreak}일 연속 ${typeNames[streakType]} 🔥`,
        body: '오늘도 기록을 이어가세요! 포기하지 마세요!',
        data: { type: 'streak_reminder', streakType, currentStreak },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
    return id;
  } catch (error) {
    notificationLogger.error('Streak 알림 전송 실패:', error);
    return null;
  }
}

/**
 * 운동 완료 축하 알림
 */
export async function sendWorkoutCompleteNotification(
  caloriesBurned: number,
  duration: number
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '운동 완료! 🎉',
        body: `${Math.round(caloriesBurned)}kcal 소모 | ${Math.round(duration / 60)}분 운동`,
        data: { type: 'workout_complete', caloriesBurned, duration },
        sound: true,
      },
      trigger: null, // 즉시 전송
    });
    return id;
  } catch (error) {
    notificationLogger.error('운동 완료 알림 전송 실패:', error);
    return null;
  }
}

/**
 * 칼로리 초과 경고 알림
 */
export async function sendCalorieWarningNotification(
  currentCalories: number,
  goalCalories: number
): Promise<string | null> {
  const overAmount = currentCalories - goalCalories;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '칼로리 목표 초과 ⚠️',
        body: `${overAmount}kcal 초과했어요. 가벼운 운동으로 소모해볼까요?`,
        data: { type: 'calorie_warning', currentCalories, goalCalories },
        sound: true,
      },
      trigger: null,
    });
    return id;
  } catch (error) {
    notificationLogger.error('칼로리 경고 알림 전송 실패:', error);
    return null;
  }
}

/**
 * 모든 예약된 알림 취소
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 특정 알림 취소
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * 알림 리스너 등록
 */
export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * 알림 응답 리스너 등록 (알림 탭 시)
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * 기본 알림 설정 (앱 시작 시 호출)
 */
export async function setupDefaultNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermission();

  if (hasPermission) {
    // 아침 운동 리마인더 (9시)
    await scheduleWorkoutReminder(9, 0);

    // 식사 리마인더
    await scheduleMealReminder('breakfast', 8, 30);
    await scheduleMealReminder('lunch', 12, 30);
    await scheduleMealReminder('dinner', 18, 30);
  }
}
