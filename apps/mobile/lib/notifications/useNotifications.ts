/**
 * 알림 시스템 훅
 * 푸시 알림 권한 관리, 설정, 스케줄링
 *
 * DB 연동 전략:
 * - 초기 로드: DB 우선 → AsyncStorage fallback
 * - 저장 시: DB 저장 → AsyncStorage 백업
 * - 오프라인: DB 실패 시 AsyncStorage만 사용
 */

import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useClerkSupabaseClient } from '../supabase';
import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
  savePushToken,
  deactivatePushToken,
} from './api';
import type { NotificationType } from './templates';
import { createNotification } from './templates';
import {
  type NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './types';
import { pushLogger } from '../utils/logger';

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
  syncWithServer: () => Promise<boolean>;
  deactivateToken: () => Promise<boolean>;
}

export function usePushToken(): UsePushTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { userId } = useAuth();
  const supabase = useClerkSupabaseClient();

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
      pushLogger.error('loadToken error:', error);
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

      pushLogger.info('Push token registered:', tokenString.slice(0, 20));
      return tokenString;
    } catch (error) {
      pushLogger.error('registerToken error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // DB에 푸시 토큰 동기화 (Clerk 인증된 Supabase 클라이언트 사용)
  const syncWithServer = useCallback(async (): Promise<boolean> => {
    if (!token || !userId) {
      pushLogger.warn('No token or userId to sync');
      return false;
    }

    try {
      await savePushToken(
        supabase,
        userId,
        token,
        Platform.OS === 'ios' ? 'iPhone' : 'Android'
      );
      pushLogger.info('Push token synced with server');
      return true;
    } catch (error) {
      pushLogger.error('syncWithServer error:', error);
      return false;
    }
  }, [token, userId, supabase]);

  // 로그아웃 시 토큰 비활성화
  const deactivateToken = useCallback(async (): Promise<boolean> => {
    if (!token || !userId) {
      return false;
    }

    try {
      await deactivatePushToken(supabase, userId, token);
      pushLogger.info('Push token deactivated');
      return true;
    } catch (error) {
      pushLogger.error('deactivateToken error:', error);
      return false;
    }
  }, [token, userId, supabase]);

  return {
    token,
    isLoading,
    registerToken,
    syncWithServer,
    deactivateToken,
  };
}

// ============================================================
// 알림 설정 훅
// DB 연동: 초기 로드 시 DB 우선, 저장 시 DB + AsyncStorage 동시 저장
// ============================================================

interface UseNotificationSettingsResult {
  settings: NotificationSettings;
  isLoading: boolean;
  isSyncing: boolean;
  updateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  applySettings: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

export function useNotificationSettings(): UseNotificationSettingsResult {
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const { userId, isSignedIn } = useAuth();
  const supabase = useClerkSupabaseClient();

  // 중복 로드 방지를 위한 ref
  const hasLoadedRef = useRef(false);

  // DB 우선, AsyncStorage fallback 로드
  const loadSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      // 로그인 상태라면 DB에서 먼저 시도
      if (isSignedIn && userId) {
        try {
          const dbSettings = await getUserNotificationSettings(
            supabase,
            userId
          );
          if (dbSettings) {
            setSettings(dbSettings);
            // DB 데이터를 AsyncStorage에도 백업
            await AsyncStorage.setItem(
              SETTINGS_KEY,
              JSON.stringify(dbSettings)
            );
            pushLogger.info('Settings loaded from DB');
            return;
          }
          // DB에 없으면 AsyncStorage fallback
          pushLogger.info('No DB settings, falling back to AsyncStorage');
        } catch (dbError) {
          pushLogger.warn(
            'DB load failed, falling back to AsyncStorage:',
            dbError
          );
        }
      }

      // AsyncStorage fallback
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...parsed,
        });
        pushLogger.info('Settings loaded from AsyncStorage');
      }
    } catch (error) {
      pushLogger.error('loadSettings error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, userId, supabase]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadSettings();
      hasLoadedRef.current = true;
    }
  }, [loadSettings]);

  // DB + AsyncStorage 동시 저장
  const saveSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      // AsyncStorage 저장 (항상 성공해야 함)
      try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      } catch (error) {
        pushLogger.error('AsyncStorage save error:', error);
      }

      // DB 저장 (로그인 시에만, 실패해도 graceful)
      if (isSignedIn && userId) {
        try {
          await saveUserNotificationSettings(supabase, userId, newSettings);
          pushLogger.info('Settings saved to DB');
        } catch (error) {
          pushLogger.warn(
            'DB save failed (AsyncStorage backup exists):',
            error
          );
        }
      }
    },
    [isSignedIn, userId, supabase]
  );

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    await saveSettings(DEFAULT_NOTIFICATION_SETTINGS);
  }, [saveSettings]);

  // 서버에서 설정 다시 가져오기 (수동 동기화)
  const syncFromServer = useCallback(async () => {
    if (!isSignedIn || !userId) {
      pushLogger.warn('Cannot sync: not signed in');
      return;
    }

    setIsSyncing(true);
    try {
      const dbSettings = await getUserNotificationSettings(supabase, userId);
      if (dbSettings) {
        setSettings(dbSettings);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(dbSettings));
        pushLogger.info('Settings synced from server');
      }
    } catch (error) {
      pushLogger.error('syncFromServer error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, userId, supabase]);

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
    isSyncing,
    updateSettings,
    resetSettings,
    applySettings,
    syncFromServer,
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
        pushLogger.error('sendNow error:', error);
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
        pushLogger.error('schedule error:', error);
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
    pushLogger.error('scheduleNotification error:', error);
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
      pushLogger.error('scheduleWaterReminder error:', error);
    }
  }
}
