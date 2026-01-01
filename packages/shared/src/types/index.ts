/**
 * 공통 타입 정의
 * 웹과 모바일 앱에서 공유
 */

// 퍼스널 컬러 타입
export type PersonalColorSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type PersonalColorTone =
  | 'Spring Light' | 'Spring Bright' | 'Spring True' | 'Spring Warm'
  | 'Summer Light' | 'Summer Bright' | 'Summer True' | 'Summer Muted'
  | 'Autumn True' | 'Autumn Deep' | 'Autumn Warm' | 'Autumn Muted'
  | 'Winter True' | 'Winter Deep' | 'Winter Bright' | 'Winter Clear';

// 피부 타입
export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

// 피부 고민
export type SkinConcern = 'acne' | 'aging' | 'whitening' | 'hydration' | 'pore' | 'redness';

// 체형 타입
export type BodyType =
  | 'Rectangle' | 'Triangle' | 'InvertedTriangle' | 'Hourglass'
  | 'Oval' | 'Diamond' | 'Pear' | 'Athletic';

// 운동 타입
export type WorkoutType = 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';

// 영양제 카테고리
export type SupplementCategory = 'vitamin' | 'mineral' | 'protein' | 'omega' | 'probiotic' | 'collagen' | 'other';

// 화장품 카테고리
export type CosmeticCategory = 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'mask' | 'makeup';

// 가격대
export type PriceRange = 'budget' | 'mid' | 'premium';

// 사용자 기본 정보
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 페이지네이션
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 운동 기록
export interface WorkoutLog {
  id: string;
  user_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg?: number;
  duration_seconds?: number;
  calories_burned?: number;
  completed_at: string;
  created_at: string;
}

// 식사 기록
export interface MealRecord {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  image_url?: string;
  created_at: string;
}

// 물 섭취 기록
export interface WaterRecord {
  id: string;
  user_id: string;
  amount_ml: number;
  created_at: string;
}

// 일일 영양 요약
export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_water_ml: number;
  meal_count: number;
}

// 알림 타입
export type NotificationType =
  | 'water_reminder'
  | 'workout_reminder'
  | 'meal_reminder'
  | 'streak_milestone'
  | 'badge_earned'
  | 'friend_request'
  | 'challenge_invite';

// 알림 데이터
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  created_at: string;
}

// 딥링크 경로
export type DeepLinkPath =
  | '/workout/session'
  | '/nutrition/water'
  | '/nutrition/record'
  | '/nutrition/camera'
  | '/products'
  | '/products/search'
  | '/profile'
  | '/settings'
  | '/settings/notifications'
  | '/settings/goals'
  | '/analysis/personal-color'
  | '/analysis/skin'
  | '/analysis/body';

// 위젯 액션
export type WidgetAction = 'workout' | 'water' | 'meal' | 'products';

// 목표 타입
export interface UserGoals {
  daily_calories?: number;
  daily_water_ml?: number;
  daily_steps?: number;
  weekly_workout_count?: number;
  target_weight_kg?: number;
}

// 웰니스 점수
export interface WellnessScore {
  overall: number;
  nutrition: number;
  workout: number;
  hydration: number;
  streak_days: number;
  updated_at: string;
}

// 배지 타입
export type BadgeCategory = 'workout' | 'nutrition' | 'streak' | 'social' | 'achievement';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  earned_at?: string;
}

// 챌린지 상태
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'workout' | 'nutrition' | 'hydration' | 'steps';
  target_value: number;
  current_value: number;
  status: ChallengeStatus;
  start_date: string;
  end_date: string;
  participant_count: number;
}
