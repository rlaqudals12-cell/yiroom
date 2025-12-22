/**
 * 브라우저 푸시 알림 유틸리티
 * Phase 6.3: 알림 시스템
 */

// =====================================================
// 타입 정의
// =====================================================

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM 형식
  workoutReminder: boolean;
  nutritionReminder: boolean;
  streakWarning: boolean;
}

export interface ReminderNotification {
  type: 'workout' | 'nutrition' | 'streak_warning' | 'checkin';
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

// =====================================================
// 상수 정의
// =====================================================

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderTime: '09:00',
  workoutReminder: true,
  nutritionReminder: true,
  streakWarning: true,
};

export const NOTIFICATION_ICONS = {
  workout: '/icons/icon-192x192.png',
  nutrition: '/icons/icon-192x192.png',
  streak_warning: '/icons/icon-192x192.png',
  checkin: '/icons/icon-192x192.png',
};

// =====================================================
// 권한 관리
// =====================================================

/**
 * 브라우저 알림 지원 여부 확인
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * 현재 알림 권한 상태
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';

  // 이미 권한이 있으면 그대로 반환
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  // 권한 요청
  const permission = await Notification.requestPermission();
  return permission;
}

// =====================================================
// 알림 표시
// =====================================================

/**
 * 브라우저 알림 표시
 */
export function showNotification(notification: ReminderNotification): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const icon = notification.icon || NOTIFICATION_ICONS[notification.type];

  new Notification(notification.title, {
    body: notification.body,
    icon,
    tag: notification.tag || notification.type,
    data: notification.data,
  });

  return true;
}

/**
 * 운동 리마인더 알림
 */
export function showWorkoutReminder(): boolean {
  return showNotification({
    type: 'workout',
    title: '💪 운동할 시간이에요!',
    body: '오늘의 운동 루틴을 확인해보세요.',
    tag: 'workout-reminder',
    data: { url: '/workout' },
  });
}

/**
 * 식단 리마인더 알림
 */
export function showNutritionReminder(): boolean {
  return showNotification({
    type: 'nutrition',
    title: '🍽️ 식단 기록 시간이에요!',
    body: '오늘 먹은 음식을 기록해보세요.',
    tag: 'nutrition-reminder',
    data: { url: '/nutrition' },
  });
}

/**
 * Streak 끊김 경고 알림
 */
export function showStreakWarning(streakType: 'workout' | 'nutrition', currentStreak: number): boolean {
  const emoji = streakType === 'workout' ? '🏃' : '🥗';
  const typeName = streakType === 'workout' ? '운동' : '식단';

  return showNotification({
    type: 'streak_warning',
    title: `${emoji} ${currentStreak}일 연속 기록이 끊길 위험!`,
    body: `오늘 ${typeName} 기록을 남기면 연속 기록이 유지됩니다.`,
    tag: `streak-warning-${streakType}`,
    data: { url: streakType === 'workout' ? '/workout' : '/nutrition' },
  });
}

/**
 * 체크인 리마인더 알림
 */
export function showCheckinReminder(): boolean {
  return showNotification({
    type: 'checkin',
    title: '✨ 오늘의 나 체크인하기',
    body: '30초만 투자해서 오늘의 상태를 기록해보세요.',
    tag: 'checkin-reminder',
    data: { url: '/dashboard' },
  });
}

// =====================================================
// 설정 관리 (LocalStorage)
// =====================================================

const NOTIFICATION_SETTINGS_KEY = 'yiroom_notification_settings';

/**
 * 알림 설정 저장
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * 알림 설정 불러오기
 */
export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;

  const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (!stored) return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

// =====================================================
// 스케줄링 (간단 버전 - 앱이 열려있을 때만 작동)
// =====================================================

let reminderInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 리마인더 스케줄 시작
 * - 앱이 열려있는 동안만 작동
 * - 설정된 시간에 알림 표시
 */
export function startReminderSchedule(): void {
  if (reminderInterval) return;

  // 1분마다 체크
  reminderInterval = setInterval(() => {
    const settings = loadNotificationSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 설정된 시간과 일치하면 알림 표시
    if (currentTime === settings.reminderTime) {
      if (settings.workoutReminder) showWorkoutReminder();
      if (settings.nutritionReminder) showNutritionReminder();
    }
  }, 60000); // 1분마다 체크
}

/**
 * 리마인더 스케줄 중지
 */
export function stopReminderSchedule(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

// =====================================================
// 테스트 알림
// =====================================================

/**
 * 테스트 알림 표시
 */
export function showTestNotification(): boolean {
  return showNotification({
    type: 'checkin',
    title: '🎉 알림 설정 완료!',
    body: '이룸에서 리마인더 알림을 받을 준비가 되었습니다.',
    tag: 'test-notification',
  });
}
