/**
 * R-1/R-2 리포트 컴포넌트 모듈 export
 */

// 공통 컴포넌트
export { ReportHeader } from './ReportHeader';
export { NutritionSummaryCard } from './NutritionSummaryCard';
export { WorkoutSummaryCard } from './WorkoutSummaryCard';
export { InsightCard } from './InsightCard';
export { StreakBadge } from './StreakBadge';

// 차트 컴포넌트 (정적 import - 직접 사용 시)
export { CalorieTrendChart } from './CalorieTrendChart';
export { WeeklyComparisonChart } from './WeeklyComparisonChart';

// 차트 컴포넌트 (Dynamic Import - 페이지에서 사용 권장)
export {
  CalorieTrendChartDynamic,
  WeeklyComparisonChartDynamic,
} from './dynamic';

// R-2 월간 리포트 컴포넌트
export { BodyProgressCard } from './BodyProgressCard';
export { GoalProgressCard } from './GoalProgressCard';
