/**
 * W-1 운동 모듈 공개 API (Barrel Export)
 *
 * @module lib/workout
 * @description MET 기반 칼로리 계산, 5-Type 운동 분류, 주간 플랜 생성
 *
 * P8 모듈 경계 규칙 준수:
 * - 외부는 이 index.ts를 통해서만 import
 * - 내부 구현 파일 직접 import 금지
 *
 * @example
 * import { calculateCaloriesWithMET, generateWeeklyPlan } from '@/lib/workout';
 */

// ============================================
// 운동 분류 (5-Type)
// ============================================
export {
  classifyWorkoutType,
  WORKOUT_TYPE_INFO,
  type WorkoutTypeResult,
} from './classifyWorkoutType';

// ============================================
// 칼로리 계산 (MET 기반)
// ============================================
export {
  calculateCaloriesWithMET,
  calculateCaloriesBurned,
  calculateCaloriesDetailed,
  calculateExerciseCalories,
  calculateSessionCalories,
  calculateWeeklyCalories,
  calculateCalorieAchievement,
  inferExerciseType,
  getMETValue,
  getAllMETValues,
  calculateCaloriesPerMinute,
  calculateRequiredDuration,
  calculateCaloriesPerSet,
  calculateCaloriesPerSetFromCPM,
  calculateExerciseTotalCalories,
  MET_VALUES,
  type ExerciseType,
  type CalorieResult,
  type SessionCalorieResult,
  type WeeklyCalorieSummary,
} from './calorieCalculations';

// ============================================
// 무게/횟수 계산
// ============================================
export {
  estimate1RM,
  estimate1RMBrzycki,
  calculateTrainingWeightFrom1RM,
  generateSetSchemeFrom1RM,
  checkPRAchievement,
  calculateRecommendedWeight,
  calculateProgressiveOverload,
  getRecommendedRepsAndSets,
  roundToNearest,
  calculateTotalVolume,
  calculateVolumeChange,
  mapGoalToTrainingGoal,
  type TrainingGoal,
  type SetScheme,
  type PRAchievementResult,
  type ExerciseRecord,
  type WeightRecommendation,
  type RepsRecommendation,
} from './calculations';

// ============================================
// 운동생리학 함수
// ============================================
export {
  calculateMaxHR,
  calculateTargetHRZone,
  calculateWorkVolume,
  calculateWeeklyVolume,
  calculateVolumeChangeRate,
  estimateRPE,
  calculateRecoveryTime,
  suggestProgressiveOverload,
  getWorkoutTypeParams,
  getIntensityLevel,
  roundToNearest as roundToNearestPhysiology,
  WORKOUT_TYPE_PARAMS,
  type MuscleGroup,
  type WorkoutHistory,
  type OverloadSuggestion,
  type RecoveryTimeResult,
  type RPEEstimate,
  type FitnessLevel,
  type IntensityLevel,
  type WorkoutTypeParams,
} from './physiology';

// ============================================
// 주간 플랜 생성 (기존 - 5-Type 기반)
// ============================================
export {
  getWeeklySplitTemplate,
  filterExercises,
  selectExercisesForBodyParts,
  calculateExerciseDetails,
  generateDayPlan as generateDayPlanByType,
  generateWeeklyPlan as generateWeeklyPlanByType,
  createWeeklyPlanFromInput,
  countWorkoutDays,
  calculateBodyPartDistribution,
  generatePlanSummary,
  type DayOfWeek,
  type DayFocus,
  type WeeklyPlanInput,
} from './weeklyPlan';

// ============================================
// 주간 플랜 생성 (신규 - 목표 기반)
// ============================================
export {
  generateWeeklyPlan,
  getWorkoutTemplate,
  adjustPlanForTime,
  generateNextWeekPlan,
  calculateTargetVolume,
  isDeloadNeeded,
  WORKOUT_TEMPLATES,
  type FitnessGoal,
  type PlannedExercise,
  type DayPlan,
  type WeeklyPlan,
  type WorkoutTemplate,
  type WeeklyPlanParams,
} from './weekly-plan';

// ============================================
// 운동 데이터
// ============================================
export {
  getAllExercises,
  getExerciseById,
  getExercisesByCategory,
  getRecommendedExercises,
  getAlternativeExercises,
} from './exercises';

// ============================================
// Best 5 운동 추천
// ============================================
export {
  generateBest5,
  GOAL_LABELS,
  GOAL_ICONS,
  type ExerciseGoal,
  type ExerciseRecommendation,
  type Best5Result,
} from './best5-generator';

// ============================================
// 스트릭 (연속 운동 기록)
// ============================================
export {
  STREAK_MILESTONES,
  STREAK_BADGES,
  STREAK_REWARDS,
  getDaysDifference,
  isStreakBroken,
  calculateCurrentStreak,
  getNextMilestone,
  getDaysToNextMilestone,
  getAchievedMilestones,
  getNewlyAchievedMilestones,
  getBadgesForMilestones,
  getNewBadges,
  getStreakMessage,
  getStreakWarningMessage,
  getReEngagementMessage,
  getMilestoneAchievementMessage,
  getStreakSummary,
  type StreakSummary,
} from './streak';

// ============================================
// 스타일 추천
// ============================================
export {
  getWorkoutStyleRecommendation,
  getPersonalColorLabel,
  getPersonalColorEmoji,
  getPersonalColorTheme,
  type ColorInfo,
  type FitRecommendation,
  type AccessoryRecommendation,
  type AmbientRecommendation,
  type WorkoutStyleRecommendation,
} from './styleRecommendations';

// ============================================
// 영양 팁
// ============================================
export {
  inferIntensity,
  estimateCaloriesBurned,
  getPostWorkoutNutritionTips,
  getQuickNutritionMessage,
  calculateProteinRecommendation,
  type NutritionTip,
  type PostWorkoutNutrition,
  type CalorieEstimate,
} from './nutritionTips';

// ============================================
// 피부 관리 팁
// ============================================
export {
  inferWorkoutCategory,
  inferWorkoutIntensity,
  getPostWorkoutSkinCareTips,
  getQuickPostWorkoutMessage,
  convertToSkinSummary,
  type SkinMetricKey,
  type SkinCareTip,
  type PostWorkoutSkinCare,
  type SkinAnalysisSummary,
} from './skinTips';

// ============================================
// 쇼핑 링크
// ============================================
export {
  generateSearchUrl,
  getColorKeywordsForPC,
  getFitKeywordsForBodyType,
  buildOptimizedQuery,
  generateShoppingLinks,
  generateAllWorkoutShoppingLinks,
  generateQuickShoppingLink,
  getRecommendedSearchTerms,
  PLATFORM_INFO,
  CATEGORY_INFO,
  type ShoppingPlatform,
  type ShoppingCategory,
  type ShoppingLink,
} from './shoppingLinks';

// ============================================
// W-2 스트레칭 고도화
// ============================================
export {
  // 자세-스트레칭 매핑
  POSTURE_PROTOCOLS,
  STRETCH_DATABASE,
  SPORT_STRETCH_PROTOCOLS,
  MUSCLE_NAME_KO,
  getStretchesForMuscle,
  getStretchProtocolForImbalance,
  mapPostureToStretches,
  getStretchesForSport,
  // 루틴 생성기
  ACSM_GUIDELINES,
  MEDICAL_DISCLAIMER,
  generatePostureCorrectionPrescription,
  generateSportStretchingPrescription,
  generateGeneralFlexibilityPrescription,
  generateWeeklyStretchingPlan,
  generatePrescriptionSummary,
  generateWeeklyPlanSummary,
} from './stretching';
