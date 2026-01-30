/**
 * GDPR 삭제 프로세스 타입 정의
 * @see SDD-GDPR-DELETION-CRON.md
 */

export interface DeletionRequest {
  userId: string;
  requestedAt: string;
  scheduledAt: string;
  gracePeriodDays: number;
}

export interface DeletionAuditLog {
  id: string;
  userId: string;
  action: DeletionAuditAction;
  performedAt: string;
  details: Record<string, unknown>;
  isPermanent: boolean;
}

export type DeletionAuditAction =
  | 'DELETION_REQUESTED'
  | 'DELETION_CANCELLED'
  | 'REMINDER_7D_SENT'
  | 'REMINDER_3D_SENT'
  | 'REMINDER_1D_SENT'
  | 'SOFT_DELETED'
  | 'HARD_DELETED'
  | 'CLERK_DELETED'
  | 'HARD_DELETE_FAILED';

export interface CronJobResult {
  success: boolean;
  processed?: number;
  failed?: number;
  remaining?: boolean;
}

export interface DeletionRequestResponse {
  success: true;
  data: {
    scheduledAt: string;
    gracePeriodDays: number;
    canCancelUntil: string;
  };
}

export interface DeletionReminderResult {
  success: boolean;
  sent: Record<string, number>;
}

/**
 * 삭제 대상 테이블 목록 (의존성 순서)
 * Hard Delete 시 이 순서대로 삭제
 */
export const DELETION_TABLES = [
  'user_body_measurements',
  'personal_color_assessments',
  'skin_analyses',
  'body_analyses',
  'hair_analyses',
  'makeup_analyses',
  'posture_assessments',
  'workout_logs',
  'workout_sets',
  'meal_records',
  'meal_items',
  'daily_nutrition_summary',
  'water_intake_logs',
  'fasting_records',
  'friendships',
  'feed_posts',
  'post_likes',
  'post_comments',
  'product_reviews',
  'user_preferences',
  'user_notification_settings',
  'user_push_tokens',
  'user_badges',
  'user_levels',
  'wellness_scores',
  'image_consents',
  'skin_diary_entries',
  'saved_outfits',
  'wishlist',
  'inventory_items',
  'user_agreements',
  'coach_chat_history',
  'daily_checkins',
] as const;

export type DeletionTable = typeof DELETION_TABLES[number];

/**
 * GDPR 삭제 설정
 */
export const GDPR_CONFIG = {
  /** 삭제 유예 기간 (일) - 30일 */
  GRACE_PERIOD_DAYS: 30,
  /** PIPA 하드 삭제 유예 기간 (일) - 5일 */
  PIPA_HARD_DELETE_DAYS: 5,
  /** 알림 발송 일수 */
  REMINDER_DAYS: [7, 3, 1] as const,
  /** 배치 처리 크기 */
  BATCH_SIZE: {
    SOFT_DELETE: 50,
    HARD_DELETE: 20,
  },
} as const;
