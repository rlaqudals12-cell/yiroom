/**
 * Zustand 스토어 내보내기
 */

// 사용자 상태
export { useUserStore } from './userStore';

// 제품 관련
export {
  useFavoritesStore,
  getFavoritesCount,
  getFavoritesCountByType,
} from './favoritesStore';
export type { FavoriteItem, FavoriteProductType } from './favoritesStore';

export {
  useRecentlyViewedStore,
  getRecentlyViewed,
  getRecentlyViewedCount,
} from './recentlyViewedStore';
export type {
  RecentlyViewedItem,
  RecentProductType,
} from './recentlyViewedStore';

export {
  useProductFilterStore,
  SORT_OPTIONS,
  CATEGORY_OPTIONS,
} from './productFilterStore';
export type { ProductCategory, SortOption } from './productFilterStore';

// 앱 설정
export {
  useAppPreferencesStore,
  getCurrentTheme,
  isNotificationsEnabled,
  isNotificationTypeEnabled,
} from './appPreferencesStore';
export type { ThemeMode, AppLanguage } from './appPreferencesStore';

// 온보딩 폼
export {
  useNutritionInputStore,
  isNutritionOnboardingComplete,
} from './nutritionInputStore';
export type {
  NutritionGoal,
  Gender,
  ActivityLevel,
  MealStyle,
  CookingSkill,
  BudgetLevel,
  AllergyType,
} from './nutritionInputStore';

export {
  useWorkoutInputStore,
  isWorkoutOnboardingComplete,
  WORKOUT_GOAL_LABELS,
  FREQUENCY_LABELS,
} from './workoutInputStore';
export type {
  WorkoutGoal,
  WorkoutLocation,
  WorkoutFrequency,
  FitnessLevel,
  EquipmentType,
} from './workoutInputStore';

// 운동 세션
export {
  useWorkoutSessionStore,
  isSessionActive,
  formatSessionTime,
} from './workoutSessionStore';
export type {
  SessionStatus,
  ExerciseSet,
  SessionExercise,
  WorkoutSession,
} from './workoutSessionStore';
