/**
 * 앱 환경설정 스토어
 * @description 사용자 앱 설정 (알림, 테마, 언어 등)
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AppLanguage = 'ko' | 'en' | 'ja' | 'zh';

interface NotificationSettings {
  enabled: boolean;
  water: boolean;
  workout: boolean;
  meal: boolean;
  dailyTip: boolean;
  challenge: boolean;
}

interface AppPreferencesState {
  // 테마
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // 언어
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;

  // 알림 설정
  notifications: NotificationSettings;
  setNotificationEnabled: (enabled: boolean) => void;
  setNotificationSetting: (key: keyof Omit<NotificationSettings, 'enabled'>, value: boolean) => void;

  // 햅틱 피드백
  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;

  // 사운드 효과
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // 온보딩 완료 여부
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;

  // 앱 투어 완료 여부
  appTourCompleted: boolean;
  setAppTourCompleted: (completed: boolean) => void;

  // 초기화
  resetPreferences: () => void;
}

const defaultNotifications: NotificationSettings = {
  enabled: true,
  water: true,
  workout: true,
  meal: true,
  dailyTip: true,
  challenge: true,
};

const initialState = {
  theme: 'system' as ThemeMode,
  language: 'ko' as AppLanguage,
  notifications: defaultNotifications,
  hapticEnabled: true,
  soundEnabled: true,
  onboardingCompleted: false,
  appTourCompleted: false,
};

export const useAppPreferencesStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setNotificationEnabled: (enabled) =>
        set((state) => ({
          notifications: { ...state.notifications, enabled },
        })),

      setNotificationSetting: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),

      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),

      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),

      setAppTourCompleted: (appTourCompleted) => set({ appTourCompleted }),

      resetPreferences: () => set(initialState),
    }),
    {
      name: 'yiroom-app-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * 현재 테마 가져오기
 */
export function getCurrentTheme(): ThemeMode {
  return useAppPreferencesStore.getState().theme;
}

/**
 * 알림 활성화 여부
 */
export function isNotificationsEnabled(): boolean {
  return useAppPreferencesStore.getState().notifications.enabled;
}

/**
 * 특정 알림 활성화 여부
 */
export function isNotificationTypeEnabled(
  type: keyof Omit<NotificationSettings, 'enabled'>
): boolean {
  const state = useAppPreferencesStore.getState();
  return state.notifications.enabled && state.notifications[type];
}
