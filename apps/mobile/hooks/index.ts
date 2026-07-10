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

// 프로필 페르소나 한 줄 (ADR-109)
export { useProfilePersona } from './useProfilePersona';

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
export { useCrossModuleInsights, type CrossModuleInsight } from './useCrossModuleInsights';

// 아침 브리핑 (ADR-118)
export { useBriefing, type UseBriefingResult } from './useBriefing';

// 오늘의 맞춤 루틴 (ADR-118)
export { useDailyRoutine, type UseDailyRoutineResult } from './useDailyRoutine';

// 리포트
export { useWeeklyReport } from './useWeeklyReport';
export { useMonthlyReport } from './useMonthlyReport';

// 분석 비교
export {
  useAnalysisComparison,
  type ComparisonMetric,
  type AnalysisComparisonData,
} from './useAnalysisComparison';
