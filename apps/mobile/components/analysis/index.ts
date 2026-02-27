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

// 공통 결과 레이아웃
export { ResultLayout } from './ResultLayout';
export type { ResultLayoutProps } from './ResultLayout';

// 색상 시각화 컴포넌트
export { ColorSwatch } from './ColorSwatch';
export type { ColorSwatchProps } from './ColorSwatch';

export { ColorPalette } from './ColorPalette';
export type { ColorItem, ColorGroup } from './ColorPalette';

// 분석 이력 + 비교
export { AnalysisTimeline } from './AnalysisTimeline';
export type { AnalysisTimelineProps } from './AnalysisTimeline';

export { ComparisonCard } from './ComparisonCard';
export type { ComparisonCardProps, MetricComparison } from './ComparisonCard';

export { AnalysisHistoryCard } from './AnalysisHistoryCard';
export type { AnalysisHistoryCardProps } from './AnalysisHistoryCard';

// 등급 시각화
export { GradeDisplay, getGrade } from './GradeDisplay';
export type { GradeDisplayProps } from './GradeDisplay';

// 시각화 컴포넌트
export { BeforeAfterSlider } from './BeforeAfterSlider';
export { FaceZoneMap } from './FaceZoneMap';
export type { FaceZone } from './FaceZoneMap';
export { DrapingPreview } from './DrapingPreview';

// 동적 스타일 훅 (useTheme 기반)
export { useAnalysisStyles } from './styles/useAnalysisStyles';

