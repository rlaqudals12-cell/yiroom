/**
 * 푸시 알림 타입 정의
 */

// 푸시 토큰 정보
export interface PushTokenInfo {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
  createdAt: string;
  updatedAt: string;
}

// 푸시 알림 페이로드
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: boolean | string;
  categoryId?: string;
}

// 알림 타입
export type NotificationType =
  | 'workout_reminder'
  | 'meal_reminder'
  | 'water_reminder'
  | 'streak_reminder'
  | 'workout_complete'
  | 'calorie_warning'
  | 'challenge_update'
  | 'friend_request'
  | 'achievement'
  | 'announcement';

// 알림 데이터
export interface NotificationData {
  type: NotificationType;
  // 딥링크 경로
  deepLink?: string;
  // 추가 데이터
  [key: string]: unknown;
}

// 알림 설정
export interface NotificationSettings {
  // 전체 알림 활성화
  enabled: boolean;
  // 운동 알림
  workout: boolean;
  workoutTime?: string; // HH:mm
  // 식사 알림
  meal: boolean;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  // 물 알림
  water: boolean;
  waterInterval?: number; // 시간 단위
  // 도전 알림
  challenge: boolean;
  // 친구 알림
  friend: boolean;
  // 업적 알림
  achievement: boolean;
  // 공지사항
  announcement: boolean;
}

// 기본 알림 설정
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  workout: true,
  workoutTime: '09:00',
  meal: true,
  breakfastTime: '08:30',
  lunchTime: '12:30',
  dinnerTime: '18:30',
  water: true,
  waterInterval: 2,
  challenge: true,
  friend: true,
  achievement: true,
  announcement: true,
};
