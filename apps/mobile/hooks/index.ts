/**
 * 모바일 앱 커스텀 훅
 */

// 분석 결과 조회
export {
  useUserAnalyses,
  type AnalysisSummary,
  type PersonalColorResult,
  type SkinAnalysisResult,
  type BodyAnalysisResult,
} from './useUserAnalyses';

// 운동 데이터 조회
export {
  useWorkoutData,
  getWorkoutTypeLabel,
  getWorkoutTypeDescription,
  type WorkoutType,
  type WorkoutAnalysis,
  type WorkoutStreak,
  type TodayWorkout,
  type WorkoutExercise,
} from './useWorkoutData';

// 영양 데이터 조회
export {
  useNutritionData,
  calculateCalorieProgress,
  getNutrientStatus,
  getNutrientStatusColor,
  type NutritionSettings,
  type DailyNutritionSummary,
  type NutritionStreak,
  type NutrientStatus,
} from './useNutritionData';
