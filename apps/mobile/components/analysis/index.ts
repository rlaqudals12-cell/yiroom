/**
 * 분석 관련 컴포넌트 모음
 */

export { CircularProgress } from './CircularProgress';
export type { CircularProgressProps, AnalysisGrade } from './CircularProgress';

export { ScoreChangeBadge, MetricDelta } from './ScoreChangeBadge';
export type { ScoreChangeBadgeProps, MetricDeltaProps } from './ScoreChangeBadge';

// 공통 상태 컴포넌트
export { AnalysisLoadingState } from './AnalysisLoadingState';
export type { AnalysisLoadingStateProps } from './AnalysisLoadingState';

export { AnalysisErrorState } from './AnalysisErrorState';
export type { AnalysisErrorStateProps } from './AnalysisErrorState';

export { AnalysisTrustBadge } from './AnalysisTrustBadge';
export type { AnalysisTrustBadgeProps, TrustBadgeType } from './AnalysisTrustBadge';

export { MetricBar } from './MetricBar';
export type { MetricBarProps } from './MetricBar';

// 공통 버튼 그룹
export { AnalysisResultButtons } from './AnalysisResultButtons';
export type { AnalysisResultButtonsProps } from './AnalysisResultButtons';

// 동적 스타일 훅 (useTheme 기반)
export { useAnalysisStyles } from './styles/useAnalysisStyles';

// 정적 스타일 (deprecated — useAnalysisStyles 사용 권장)
export {
  ANALYSIS_COLORS,
  commonAnalysisStyles,
  buttonStyles,
  badgeStyles,
} from './styles/commonAnalysisStyles';
