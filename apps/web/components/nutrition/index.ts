/**
 * N-1 영양 모듈 컴포넌트
 */

export { default as FoodPhotoCapture } from './FoodPhotoCapture';
export { default as FoodAnalysisLoading } from './FoodAnalysisLoading';
export { default as FoodResultCard } from './FoodResultCard';

// 신호등 표시 컴포넌트 (Task 2.6)
export {
  TrafficLightIndicator,
  TrafficLightSummaryInline,
  TrafficLightCard,
  calculateTrafficLightRatio,
  getTrafficLightFromCalorieDensity,
  TRAFFIC_LIGHT_CONFIG,
  TRAFFIC_LIGHT_TARGETS,
  type TrafficLightColor,
  type TrafficLightRatio,
} from './TrafficLight';

// 식단 기록 화면 컴포넌트 (Task 2.7)
export {
  default as DailyCalorieSummary,
  type DailyCalorieSummaryProps,
} from './DailyCalorieSummary';

// 칼로리 프로그레스 링 컴포넌트 (Task 3.3)
export {
  default as CalorieProgressRing,
  CalorieProgressRingContent,
  type CalorieProgressRingProps,
} from './CalorieProgressRing';

// 영양소 바 차트 컴포넌트 (Task 3.4)
export {
  default as NutrientBarChart,
  NutrientBar,
  type NutrientBarChartProps,
  type NutrientData,
  type NutrientColor,
} from './NutrientBarChart';

export {
  default as MealSection,
  MealSectionList,
} from './MealSection';
export {
  default as QuickActionBar,
  FloatingCameraButton,
  type QuickActionBarProps,
} from './QuickActionBar';

// 수분 섭취 UI 컴포넌트 (Task 2.9)
export {
  default as WaterIntakeCard,
  HYDRATION_FACTORS,
  type DrinkType,
  type WaterIntakeCardProps,
} from './WaterIntakeCard';
export {
  default as WaterInputSheet,
  type WaterInputSheetProps,
} from './WaterInputSheet';

// 음식 직접 입력 UI 컴포넌트 (Task 2.11)
export {
  default as ManualFoodInputSheet,
  type ManualFoodInputSheetProps,
  type ManualFoodData,
} from './ManualFoodInputSheet';

// 간헐적 단식 타이머 컴포넌트 (Task 2.17)
export {
  default as FastingTimer,
  type FastingTimerProps,
} from './FastingTimer';

// Streak UI 컴포넌트 (Task 3.6)
export {
  default as NutritionStreakCard,
  NutritionStreakProgress,
  NutritionStreakBadge,
  NutritionStreakBadgeList,
} from './NutritionStreak';

// S-1 피부 연동 인사이트 컴포넌트 (Task 3.7)
export {
  default as SkinInsightCard,
  FoodRecommendationItem,
  HydrationInsightSection,
  NoAnalysisCard,
  type SkinInsightCardProps,
} from './SkinInsightCard';

// W-1 운동 연동 인사이트 컴포넌트 (Task 3.8)
export {
  default as WorkoutInsightCard,
  CalorieBalanceSection,
  WorkoutSummarySection,
  WorkoutRecommendButton,
  type WorkoutInsightCardProps,
} from './WorkoutInsightCard';

// C-1 체형 연동 인사이트 컴포넌트 (Task 3.9)
export {
  default as BodyInsightCard,
  WeightChangeSection,
  ReanalysisPromptSection,
  CalorieAdjustmentSection,
  NoAnalysisCard as BodyNoAnalysisCard,
  type BodyInsightCardProps,
} from './BodyInsightCard';

// 칼로리 초과 알림 배너 컴포넌트 (P3-5.1)
export {
  default as CalorieSurplusAlert,
  CalorieSurplusAlertSkeleton,
  type CalorieSurplusAlertProps,
} from './CalorieSurplusAlert';

// Voice Record Button (AI Enhancement)
export {
  default as VoiceRecordButton,
  type VoiceRecordButtonProps,
} from './VoiceRecordButton';
