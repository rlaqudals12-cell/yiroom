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
 * 사용자 데이터 파기 대상 테이블 — **단일 정본**.
 *
 * 계정 즉시삭제(`/api/user/account`)와 GDPR 하드삭제 크론이 모두 이 목록을 쓴다.
 * (과거엔 두 곳이 서로 다른 목록을 들고 있어, 어느 쪽에도 없는 테이블의
 *  clerk_user_id 데이터가 계정 삭제 후 영구 잔존했다 — 2026-08 수리.)
 *
 * 규칙:
 * - 마이그레이션에 `clerk_user_id` 컬럼이 있는 테이블은 **전부** 이 목록 또는
 *   `DELETION_EXEMPT_TABLES`에 있어야 한다. 회귀 방지 = `tests/api/user/deletion-coverage.test.ts`
 *   (마이그레이션을 직접 파싱해 누락을 실패로 만든다).
 * - `users`는 여기 넣지 않는다 — FK CASCADE 기점이라 파기 루프 **마지막에 별도 삭제**.
 * - clerk_user_id 컬럼이 없고 부모 FK가 `ON DELETE CASCADE`인 테이블
 *   (coach_messages·friendships·encouragements·friend_activity_notifications 등)은
 *   users/부모 행 삭제로 함께 사라지므로 목록에 없어도 잔존하지 않는다.
 * - 존재하지 않는 테이블/컬럼은 삭제 루프가 'does not exist'로 무시하므로,
 *   prod에 수동 생성됐을 수 있는 옛 이름도 안전하게 유지한다.
 */
export const DELETION_TABLES = [
  // ── FK 자식 우선 (ON DELETE CASCADE가 없는 참조 — 부모보다 먼저 지워야 한다)
  //    face_analyses → personal_color_assessments / workout_analyses → body_analyses
  'face_analyses',
  'workout_analyses',

  // ── 5축 분석·생체 (BIPA/PIPA 파기의무 최우선)
  'personal_color_assessments',
  'skin_analyses',
  'skin_diary_entries',
  'body_analyses',
  'posture_analyses',
  'posture_assessments', // 옛 이름 (실 테이블은 posture_analyses)
  'hair_analyses',
  'makeup_analyses',
  'analysis_images',
  'analysis_visual_data',
  'analysis_cross_links',
  'integrated_analysis_sessions', // 통합분석 온보딩 세션 (얼굴·체형 생체)
  'report_shares',
  'user_twins', // AI 아바타/트윈 (얼굴 유래 생체)
  'image_consents',
  'user_body_measurements',

  // ── 뷰티 프로필·캡슐·루틴
  'beauty_profiles',
  'safety_profiles',
  'capsule_items',
  'daily_capsules',
  'rotation_history',
  'capsules',
  'user_routines',
  'connection_awareness',
  'connection_awareness_stats',

  // ── 옷장·제품·쇼핑
  'user_inventory', // 실제 옷장/화장대 인벤토리 테이블
  'inventory_items', // 옛 이름
  'saved_outfits',
  'user_product_shelf',
  'user_wishlists',
  'wishlist', // 옛 이름
  'user_favorites',
  'user_favorite_recipes',
  'price_watches',
  'user_shopping_preferences',
  'user_size_history',
  'user_barcode_history',
  'user_coupons',
  'affiliate_clicks',
  'product_reviews',
  'review_helpful',

  // ── 코치 대화 (coach_messages는 coach_sessions FK CASCADE로 함께 삭제)
  'coach_sessions',
  'coach_chat_history', // 옛 이름

  // ── 영양·운동 (숨김 모듈이어도 데이터는 파기)
  'meal_records',
  'meal_items',
  'daily_nutrition_summary',
  'water_records',
  'water_intake_logs', // 옛 이름
  'fasting_records',
  'favorite_foods',
  'nutrition_settings',
  'nutrition_streaks',
  'workout_logs',
  'workout_plans',
  'workout_sets',
  'mental_health_logs',

  // ── 소셜·게이미피케이션
  'feed_comments',
  'feed_interactions',
  'feed_posts',
  'post_likes', // 옛 이름
  'post_comments', // 옛 이름
  'activity_comments',
  'activity_likes',
  'activity_logs',
  'social_activities',
  'lookbook_likes',
  'lookbook_posts',
  'friendships',
  'challenge_participations',
  'user_challenges',
  'team_members',
  'daily_checkins',
  'user_badges',
  'user_levels',
  'wellness_scores',
  'leaderboard_cache',

  // ── 설정·알림·동의·피드백·계측
  'user_preferences',
  'user_preference_items',
  'user_notification_settings',
  'user_push_tokens',
  'push_subscriptions',
  'smart_notifications',
  'user_ui_preferences',
  'announcement_reads',
  'user_agreements',
  'feedback',
  'user_feedback',
  'analytics_events',
  'analytics_sessions',
] as const;

export type DeletionTable = (typeof DELETION_TABLES)[number];

/**
 * 파기 대상에서 **의도적으로** 제외하는 clerk_user_id 보유 테이블 (사유 필수).
 *
 * 회귀 방지 테스트가 "정본 목록 ∪ 이 예외" 밖의 테이블을 발견하면 실패한다 —
 * 새 테이블을 만들 때 "삭제할지 말지"를 반드시 결정하게 만드는 장치.
 */
export const DELETION_EXEMPT_TABLES: Record<string, string> = {
  users: '계정 행 자체 — 파기 루프 마지막에 별도 삭제 (자식 테이블 FK CASCADE 기점)',
  admin_logs:
    '관리자 행위 감사 로그 — 보안·감사 목적 보존 (기록 주체=운영자, 서비스 사용자 데이터 아님)',
};

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
