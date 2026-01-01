/**
 * 푸시 알림 훅
 * 알림 수신 및 처리
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  initializePushNotifications,
  registerPushTokenWithServer,
  unregisterPushTokenFromServer,
} from './token';
import {
  NotificationData,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './types';
import { handleDeepLinkUrl } from '../deeplink';

// 알림 설정 저장 키
const NOTIFICATION_SETTINGS_KEY = '@yiroom/notification_settings';

interface UsePushReturn {
  // 푸시 토큰
  pushToken: string | null;
  // 알림 설정
  settings: NotificationSettings;
  // 설정 업데이트
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  // 초기화 완료 여부
  isInitialized: boolean;
  // 마지막 알림
  lastNotification: Notifications.Notification | null;
  // 수동 토큰 등록
  registerToken: () => Promise<void>;
  // 토큰 해제
  unregisterToken: () => Promise<void>;
}

/**
 * 푸시 알림 훅
 */
export function usePush(userId?: string): UsePushReturn {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotification, setLastNotification] =
    useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // 알림 설정 로드
  const loadSettings = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (data) {
        setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) });
      }
    } catch (error) {
      console.error('[Push] 설정 로드 실패:', error);
    }
  }, []);

  // 알림 설정 저장
  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(updated)
      );
    },
    [settings]
  );

  // 알림 응답 처리 (딥링크)
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content
        .data as NotificationData;
      console.log('[Push] 알림 응답:', data);

      // 딥링크 처리
      if (data.deepLink) {
        handleDeepLinkUrl(`yiroom://${data.deepLink}`);
      } else {
        // 타입별 기본 네비게이션
        switch (data.type) {
          case 'workout_reminder':
          case 'workout_complete':
            router.push('/(workout)/session');
            break;
          case 'meal_reminder':
            router.push('/(nutrition)/record');
            break;
          case 'water_reminder':
            router.push('/(nutrition)/water');
            break;
          case 'challenge_update':
            router.push('/(tabs)/profile');
            break;
          case 'friend_request':
            router.push('/(tabs)/profile');
            break;
          case 'announcement':
            router.push('/(tabs)');
            break;
        }
      }
    },
    []
  );

  // 토큰 등록
  const registerToken = useCallback(async () => {
    if (userId && pushToken) {
      await registerPushTokenWithServer(pushToken, userId);
    }
  }, [userId, pushToken]);

  // 토큰 해제
  const unregisterToken = useCallback(async () => {
    if (userId) {
      await unregisterPushTokenFromServer(userId);
    }
  }, [userId]);

  // 초기화
  useEffect(() => {
    const init = async () => {
      // 설정 로드
      await loadSettings();

      // 푸시 토큰 획득 및 등록
      const token = await initializePushNotifications(userId);
      setPushToken(token);
      setIsInitialized(true);
    };

    init();
  }, [userId, loadSettings]);

  // 알림 리스너 설정
  useEffect(() => {
    // 알림 수신 리스너
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Push] 알림 수신:', notification);
        setLastNotification(notification);
      });

    // 알림 응답 리스너 (탭 시)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationResponse]);

  // 앱 포그라운드 복귀 시 초기 알림 확인
  useEffect(() => {
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        handleNotificationResponse(response);
      }
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkInitialNotification();
      }
    };

    checkInitialNotification();
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => subscription.remove();
  }, [handleNotificationResponse]);

  return {
    pushToken,
    settings,
    updateSettings,
    isInitialized,
    lastNotification,
    registerToken,
    unregisterToken,
  };
}
