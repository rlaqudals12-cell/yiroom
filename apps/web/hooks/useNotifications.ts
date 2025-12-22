'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  loadNotificationSettings,
  saveNotificationSettings,
  showWorkoutReminder,
  showNutritionReminder,
  showStreakWarning,
  showCheckinReminder,
  showTestNotification,
  startReminderSchedule,
  stopReminderSchedule,
  type NotificationSettings,
} from '@/lib/notifications';

/**
 * 알림 관련 훅
 * 알림 권한, 설정, 표시 기능 제공
 */
export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  // 초기화
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(getNotificationPermission());
      setSettings(loadNotificationSettings());
    }
  }, []);

  // 권한 요청
  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newSettings };
      saveNotificationSettings(updated);

      // 스케줄 관리
      if (updated.enabled && permission === 'granted') {
        startReminderSchedule();
      } else {
        stopReminderSchedule();
      }

      return updated;
    });
  }, [permission]);

  // 알림 표시 함수들
  const notify = {
    workout: showWorkoutReminder,
    nutrition: showNutritionReminder,
    streakWarning: showStreakWarning,
    checkin: showCheckinReminder,
    test: showTestNotification,
  };

  return {
    isSupported,
    permission,
    settings,
    requestPermission,
    updateSettings,
    notify,
    // 편의 속성
    canNotify: isSupported && permission === 'granted',
    isEnabled: settings?.enabled ?? false,
  };
}

export default useNotifications;
