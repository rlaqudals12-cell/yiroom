/**
 * 알림 시스템 훅
 * 푸시 알림 권한 관리, 설정, 스케줄링
 */

import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import type { NotificationType } from './templates';
import { createNotification } from './templates';
import {
  type NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './types';

// Re-export for backward compatibility
export type { NotificationSettings } from './types';
export { DEFAULT_NOTIFICATION_SETTINGS } from './types';

const SETTINGS_KEY = 'yiroom_notification_settings';
const PUSH_TOKEN_KEY = 'yiroom_push_token';

// ============================================================
// 알림 핸들러 설정
// ============================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================================
// 알림 권한 훅
// ============================================================

interface UseNotificationPermissionResult {
  hasPermission: boolean | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useNotificationPermission(): UseNotificationPermissionResult {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
    setIsLoading(false);
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      setHasPermission(true);
      setIsLoading(false);
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';

    if (granted && Platform.OS === 'android') {
      await setupAndroidChannels();
    }

    setHasPermission(granted);
    setIsLoading(false);
    return granted;
  }, []);

  return {
    hasPermission,
    isLoading,
    requestPermission,
  };
}

// ============================================================
// 푸시 토큰 훅 (서버 연동용)
// ============================================================

interface UsePushTokenResult {
  token: string | null;
  isLoading: boolean;
  registerToken: () => Promise<string | null>;
  syncWithServer: (userId: string) => Promise<boolean>;
}

export function usePushToken(): UsePushTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (stored) {
        setToken(stored);
      }
    } catch (error) {
      console.error('[Mobile] loadToken error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerToken = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);

    try {
      // 권한 확인
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        setIsLoading(false);
        return null;
      }

      // Expo Push Token 가져오기
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      const tokenString = pushToken.data;
      setToken(tokenString);

      // 로컬 저장
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, tokenString);

      console.log('[Mobile] Push token registered:', tokenString.slice(0, 20));
      return tokenString;
    } catch (error) {
      console.error('[Mobile] registerToken error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 서버에 푸시 토큰 동기화
  const syncWithServer = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!token) {
        console.warn('[Mobile] No token to sync');
        return false;
      }

      try {
        // Supabase API 호출 (웹앱과 동일한 엔드포인트 사용)
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/user_push_tokens`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
              clerk_user_id: userId,
              push_token: token,
              platform: Platform.OS,
              device_name: Platform.OS === 'ios' ? 'iPhone' : 'Android',
              last_active: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        console.log('[Mobile] Push token synced with server');
        return true;
      } catch (error) {
        console.error('[Mobile] syncWithServer error:', error);
        return false;
      }
    },
    [token]
  );

  return {
    token,
    isLoading,
    registerToken,
    syncWithServer,
  };
}

// ============================================================
// 알림 설정 훅
// ============================================================

interface UseNotificationSettingsResult {
  settings: NotificationSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  applySettings: () => Promise<void>;
}

export function useNotificationSettings(): UseNotificationSettingsResult {
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...JSON.parse(stored),
        });
      }
    } catch (error) {
      console.error('[Mobile] loadSettings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('[Mobile] saveSettings error:', error);
    }
  };

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings]
  );

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    await saveSettings(DEFAULT_NOTIFICATION_SETTINGS);
  }, []);

  const applySettings = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.enabled) return;

    // 운동 리마인더
    if (settings.workoutReminder) {
      const [hour, minute] = settings.workoutReminderTime
        .split(':')
        .map(Number);
      await scheduleNotification('workout_reminder', { hour, minute });
    }

    // 식단 리마인더
    if (settings.nutritionReminder) {
      for (const [meal, time] of Object.entries(settings.mealReminderTimes)) {
        const [hour, minute] = time.split(':').map(Number);
        await scheduleNotification('nutrition_reminder', {
          hour,
          minute,
          data: { meal },
        });
      }
    }

    // 수분 리마인더 (일정 간격)
    if (settings.waterReminder) {
      await scheduleWaterReminder(settings.waterReminderInterval);
    }
  }, [settings]);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    applySettings,
  };
}

// ============================================================
// 알림 전송/스케줄 훅
// ============================================================

interface UseNotificationSchedulerResult {
  sendNow: (
    type: NotificationType,
    variables?: Record<string, string | number>
  ) => Promise<string | null>;
  schedule: (
    type: NotificationType,
    trigger: Notifications.NotificationTriggerInput,
    variables?: Record<string, string | number>
  ) => Promise<string | null>;
  cancel: (notificationId: string) => Promise<void>;
  cancelAll: () => Promise<void>;
}

export function useNotificationScheduler(): UseNotificationSchedulerResult {
  const sendNow = useCallback(
    async (
      type: NotificationType,
      variables?: Record<string, string | number>
    ): Promise<string | null> => {
      try {
        const notification = createNotification(type, variables);

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: {
              type,
              route: notification.action?.route,
              variables,
            },
            sound: true,
          },
          trigger: null,
        });

        return id;
      } catch (error) {
        console.error('[Mobile] sendNow error:', error);
        return null;
      }
    },
    []
  );

  const schedule = useCallback(
    async (
      type: NotificationType,
      trigger: Notifications.NotificationTriggerInput,
      variables?: Record<string, string | number>
    ): Promise<string | null> => {
      try {
        const notification = createNotification(type, variables);

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: {
              type,
              route: notification.action?.route,
              variables,
            },
            sound: true,
          },
          trigger,
        });

        return id;
      } catch (error) {
        console.error('[Mobile] schedule error:', error);
        return null;
      }
    },
    []
  );

  const cancel = useCallback(async (notificationId: string) => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }, []);

  const cancelAll = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  return {
    sendNow,
    schedule,
    cancel,
    cancelAll,
  };
}

// ============================================================
// 알림 응답 훅
// ============================================================

export function useNotificationResponse() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const route = data?.route as string | undefined;

        if (route) {
          router.push(route as never);
        }
      }
    );

    return () => subscription.remove();
  }, [router]);
}

// ============================================================
// 헬퍼 함수
// ============================================================

async function setupAndroidChannels() {
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

  await Notifications.setNotificationChannelAsync('social', {
    name: '소셜 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#8b5cf6',
  });

  await Notifications.setNotificationChannelAsync('achievement', {
    name: '성취 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#f59e0b',
  });

  await Notifications.setNotificationChannelAsync('system', {
    name: '시스템 알림',
    importance: Notifications.AndroidImportance.LOW,
  });
}

async function scheduleNotification(
  type: NotificationType,
  options: {
    hour: number;
    minute?: number;
    data?: Record<string, unknown>;
  }
): Promise<string | null> {
  try {
    const notification = createNotification(type);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          type,
          route: notification.action?.route,
          ...options.data,
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: options.hour,
        minute: options.minute ?? 0,
      },
    });

    return id;
  } catch (error) {
    console.error('[Mobile] scheduleNotification error:', error);
    return null;
  }
}

async function scheduleWaterReminder(intervalHours: number): Promise<void> {
  // 8시부터 22시까지 일정 간격으로 알림
  const startHour = 8;
  const endHour = 22;

  for (let hour = startHour; hour <= endHour; hour += intervalHours) {
    try {
      const notification = createNotification('water_reminder');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: '물 한 잔 마시는 건 어떨까요?',
          data: {
            type: 'water_reminder',
            route: notification.action?.route,
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });
    } catch (error) {
      console.error('[Mobile] scheduleWaterReminder error:', error);
    }
  }
}
