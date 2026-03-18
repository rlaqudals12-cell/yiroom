/**
 * 개인화 푸시 알림 스케줄링 훅
 *
 * 앱 실행 시 + 로그인 시 개인화 트리거를 평가하고 스케줄링한다.
 * 사용자 데이터를 기반으로 조건을 평가하여 필요한 알림만 등록한다.
 *
 * DB 미연동 시 AsyncStorage fallback으로 동작한다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';

import { PERSONALIZED_TRIGGERS, evaluateTriggers } from './personalized-triggers';
import { createNotification } from './templates';
import type {
  PersonalizedTriggerSettings,
  UserTriggerData,
  PersonalizedTriggerType,
} from './types';
import { DEFAULT_PERSONALIZED_TRIGGER_SETTINGS } from './types';
import { pushLogger } from '../utils/logger';

// Expo Go에서는 push notification 미지원
const IS_EXPO_GO = Constants.appOwnership === 'expo';

const SCHEDULED_TRIGGERS_KEY = 'yiroom_scheduled_personalized_triggers';
const USER_TRIGGER_DATA_KEY = 'yiroom_user_trigger_data';

// ============================================================
// 사용자 데이터 로드 (AsyncStorage fallback)
// ============================================================

/** 사용자 트리거 데이터 저장 (외부에서 업데이트 시 호출) */
export async function saveUserTriggerData(data: UserTriggerData): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_TRIGGER_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    pushLogger.error('saveUserTriggerData error:', error);
  }
}

/** 사용자 트리거 데이터 로드 */
export async function loadUserTriggerData(): Promise<UserTriggerData> {
  try {
    const stored = await AsyncStorage.getItem(USER_TRIGGER_DATA_KEY);
    if (stored) {
      return JSON.parse(stored) as UserTriggerData;
    }
  } catch (error) {
    pushLogger.error('loadUserTriggerData error:', error);
  }

  // 기본값 (데이터 없으면 안전한 기본값)
  return {
    currentStreak: 0,
    todayCompleted: false,
    lastAnalysisDate: null,
    hasSkincareRoutine: false,
    todayRecordCount: 0,
  };
}

// ============================================================
// 스케줄 관리
// ============================================================

/** 스케줄된 트리거 ID 저장 */
async function saveScheduledTriggerIds(ids: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEDULED_TRIGGERS_KEY, JSON.stringify(ids));
  } catch (error) {
    pushLogger.error('saveScheduledTriggerIds error:', error);
  }
}

/** 스케줄된 트리거 ID 로드 */
async function loadScheduledTriggerIds(): Promise<Record<string, string>> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_TRIGGERS_KEY);
    if (stored) {
      return JSON.parse(stored) as Record<string, string>;
    }
  } catch (error) {
    pushLogger.error('loadScheduledTriggerIds error:', error);
  }
  return {};
}

/** 기존 개인화 알림 모두 취소 */
async function cancelAllPersonalizedNotifications(): Promise<void> {
  const scheduledIds = await loadScheduledTriggerIds();

  for (const [, notificationId] of Object.entries(scheduledIds)) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // 이미 취소된 알림은 무시
    }
  }

  await saveScheduledTriggerIds({});
}

// ============================================================
// 개인화 알림 스케줄링
// ============================================================

/** 개인화 트리거를 평가하고 알림을 스케줄링한다 */
export async function schedulePersonalizedNotifications(
  userData: UserTriggerData,
  triggerSettings: PersonalizedTriggerSettings
): Promise<number> {
  if (IS_EXPO_GO) return 0;

  // 기존 개인화 알림 취소
  await cancelAllPersonalizedNotifications();

  // 권한 확인
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return 0;

  // 설정을 Record 형태로 변환
  const enabledMap: Record<string, boolean> = { ...triggerSettings };

  // 조건 평가하여 활성 트리거 필터링
  const activeTriggers = evaluateTriggers(PERSONALIZED_TRIGGERS, userData, enabledMap);

  const scheduledIds: Record<string, string> = {};

  for (const trigger of activeTriggers) {
    try {
      const variables = trigger.getVariables(userData);
      const notification = createNotification(
        trigger.id as PersonalizedTriggerType,
        variables
      );

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: trigger.id,
            route: notification.action?.route,
            personalized: true,
            variables,
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: trigger.schedule.hour,
          minute: trigger.schedule.minute,
        },
      });

      scheduledIds[trigger.id] = notificationId;
      pushLogger.info(`Personalized trigger scheduled: ${trigger.id} at ${trigger.schedule.hour}:${String(trigger.schedule.minute).padStart(2, '0')}`);
    } catch (error) {
      pushLogger.error(`Failed to schedule trigger ${trigger.id}:`, error);
    }
  }

  await saveScheduledTriggerIds(scheduledIds);
  return Object.keys(scheduledIds).length;
}

// ============================================================
// 훅: usePersonalizedNotifications
// ============================================================

interface UsePersonalizedNotificationsResult {
  /** 개인화 알림을 수동으로 재스케줄링 */
  reschedule: (userData?: UserTriggerData) => Promise<number>;
  /** 사용자 트리거 데이터 업데이트 (기록/분석 완료 시 호출) */
  updateUserData: (data: Partial<UserTriggerData>) => Promise<void>;
  /** 모든 개인화 알림 취소 */
  cancelAll: () => Promise<void>;
}

export function usePersonalizedNotifications(
  triggerSettings: PersonalizedTriggerSettings = DEFAULT_PERSONALIZED_TRIGGER_SETTINGS,
  enabled: boolean = true
): UsePersonalizedNotificationsResult {
  const hasInitializedRef = useRef(false);

  // 앱 시작 시 자동 스케줄링
  useEffect(() => {
    if (!enabled || IS_EXPO_GO || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const init = async (): Promise<void> => {
      const userData = await loadUserTriggerData();
      const count = await schedulePersonalizedNotifications(userData, triggerSettings);
      pushLogger.info(`Personalized notifications initialized: ${count} scheduled`);
    };

    init().catch((error) => {
      pushLogger.error('Personalized notification init error:', error);
    });
  }, [enabled, triggerSettings]);

  // 수동 재스케줄링
  const reschedule = useCallback(
    async (userData?: UserTriggerData): Promise<number> => {
      const data = userData ?? (await loadUserTriggerData());
      return schedulePersonalizedNotifications(data, triggerSettings);
    },
    [triggerSettings]
  );

  // 사용자 데이터 업데이트 + 자동 재스케줄링
  const updateUserData = useCallback(
    async (partial: Partial<UserTriggerData>): Promise<void> => {
      const current = await loadUserTriggerData();
      const updated: UserTriggerData = { ...current, ...partial };
      await saveUserTriggerData(updated);

      // 데이터 변경 후 트리거 재평가
      if (enabled) {
        await schedulePersonalizedNotifications(updated, triggerSettings);
      }
    },
    [enabled, triggerSettings]
  );

  const cancelAll = useCallback(async (): Promise<void> => {
    await cancelAllPersonalizedNotifications();
  }, []);

  return {
    reschedule,
    updateUserData,
    cancelAll,
  };
}
