/**
 * Web Push 타입 정의
 * Phase L: L-1 Web Push 알림
 */

// Push 구독 정보 (브라우저에서 받는 형식)
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// DB에 저장되는 Push 구독 정보
export interface PushSubscriptionRow {
  id: string;
  clerk_user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Push 알림 페이로드
export interface PushPayload {
  title: string;
  body: string;
  type?: PushNotificationType;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Push 알림 타입
export type PushNotificationType =
  | 'workout_reminder'
  | 'nutrition_reminder'
  | 'streak_warning'
  | 'daily_checkin'
  | 'badge_earned'
  | 'level_up'
  | 'friend_request'
  | 'friend_accepted'
  | 'challenge_invite'
  | 'challenge_complete'
  | 'weekly_report'
  | 'test';

// Push 발송 결과
export interface PushSendResult {
  success: boolean;
  endpoint: string;
  error?: string;
}

// Push 구독 상태
export interface PushSubscriptionStatus {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
}

// API 응답 타입
export interface PushSubscribeResponse {
  success: boolean;
  message: string;
}

export interface PushSendResponse {
  success: boolean;
  sent: number;
  failed: number;
  results: PushSendResult[];
}
