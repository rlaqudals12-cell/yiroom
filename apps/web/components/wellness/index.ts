// Wellness 컴포넌트 통합 Export
export { WellnessScoreCard } from './WellnessScoreCard';
export { WellnessBreakdown } from './WellnessBreakdown';
export { WellnessInsight } from './WellnessInsight';

// 차트 컴포넌트 (정적 import - 직접 사용 시)
export { WellnessTrendChart } from './WellnessTrendChart';

// 차트 컴포넌트 (Dynamic Import - 페이지에서 사용 권장)
export {
  WellnessTrendChartDynamic,
  WellnessInsightDynamic,
  WellnessBreakdownDynamic,
} from './dynamic';
