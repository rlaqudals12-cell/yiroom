/**
 * 모바일 앱 커스텀 훅
 */

// 햅틱 피드백
export { useHapticFeedback } from './useHapticFeedback';

// 스크롤 애니메이션
export { useScrollAnimation } from './useScrollAnimation';

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
  type WorkoutLog,
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

// 웰니스 점수
export {
  useWellnessScore,
  type WellnessBreakdown,
  type WellnessLevel,
  type UseWellnessScoreReturn,
  type Achievement,
} from './useWellnessScore';

// 교차 모듈 인사이트
export {
  useCrossModuleInsights,
  type CrossModuleInsight,
} from './useCrossModuleInsights';
