/**
 * 모니터링 타입 정의
 * Sentry, Analytics 공통 타입
 */

// 에러 심각도
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

// 에러 컨텍스트
export interface ErrorContext {
  // 사용자 ID
  userId?: string;
  // 화면 이름
  screen?: string;
  // 추가 데이터
  extra?: Record<string, unknown>;
  // 태그
  tags?: Record<string, string>;
}

// 이벤트 타입
export type AnalyticsEventType =
  // 화면 조회
  | 'screen_view'
  // 운동 관련
  | 'workout_started'
  | 'workout_completed'
  | 'workout_cancelled'
  | 'exercise_completed'
  // 영양 관련
  | 'meal_recorded'
  | 'water_added'
  | 'calorie_goal_reached'
  // 분석 관련
  | 'analysis_started'
  | 'analysis_completed'
  // 제품 관련
  | 'product_viewed'
  | 'product_clicked'
  | 'product_purchased'
  // 소셜 관련
  | 'friend_added'
  | 'challenge_joined'
  | 'achievement_unlocked'
  // 앱 관련
  | 'app_opened'
  | 'app_backgrounded'
  | 'notification_received'
  | 'notification_clicked'
  | 'deep_link_opened'
  // 에러
  | 'error_occurred';

// 이벤트 속성
export interface AnalyticsEventProperties {
  // 화면 이름
  screen_name?: string;
  // 운동 ID
  workout_id?: string;
  // 운동 시간 (분)
  workout_duration?: number;
  // 소모 칼로리
  calories_burned?: number;
  // 식사 타입
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  // 물 섭취량 (ml)
  water_amount?: number;
  // 제품 ID
  product_id?: string;
  // 제품 카테고리
  product_category?: string;
  // 분석 타입
  analysis_type?: 'personal_color' | 'skin' | 'body';
  // 에러 메시지
  error_message?: string;
  // 추가 속성
  [key: string]: unknown;
}

// 사용자 속성
export interface UserProperties {
  // 사용자 ID
  user_id?: string;
  // 가입일
  created_at?: string;
  // 퍼스널 컬러
  personal_color?: string;
  // 체형 타입
  body_type?: string;
  // 피부 타입
  skin_type?: string;
  // 운동 목표
  fitness_goal?: string;
  // 프리미엄 여부
  is_premium?: boolean;
  // 운동 스트릭
  workout_streak?: number;
}
