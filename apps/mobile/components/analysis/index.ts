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

// 비주얼 리포트
export { VisualReportCard } from './VisualReportCard';
export type { VisualReportCardProps, AnalysisType, MetricItem } from './VisualReportCard';

export { ZoneDetailCard } from './ZoneDetailCard';
export type { ZoneDetailCardProps, ZoneStatus } from './ZoneDetailCard';

export { TrendChart } from './TrendChart';
export type { TrendChartProps, TrendDataPoint, TrendMetric } from './TrendChart';

export { StrengthsFirst } from './StrengthsFirst';
export type { StrengthsFirstProps } from './StrengthsFirst';

export { LightingGuide } from './LightingGuide';
export type { LightingGuideProps, BrightnessLevel, UniformityLevel } from './LightingGuide';

export { SkinVitalityScore } from './SkinVitalityScore';
export type { SkinVitalityScoreProps } from './SkinVitalityScore';

export { DetailedFaceZoneMap } from './DetailedFaceZoneMap';
export type {
  DetailedFaceZoneMapProps,
  DetailedZoneId,
  DetailedStatusLevel,
  DetailedZoneStatus,
} from './DetailedFaceZoneMap';

export { PhotoOverlayMap } from './PhotoOverlayMap';
export type {
  PhotoOverlayMapProps,
  OverlayZoneId,
  OverlayZoneStatus,
} from './PhotoOverlayMap';

export { ContextLinkingCard } from './ContextLinkingCard';
export type { ContextLinkingCardProps, ContextLink } from './ContextLinkingCard';

export { SolutionPanel } from './SolutionPanel';
export type { SolutionPanelProps, SolutionStep } from './SolutionPanel';

// 모듈별 특화 컴포넌트
export { ScientificTermTooltip } from './ScientificTermTooltip';
export type { ScientificTermTooltipProps } from './ScientificTermTooltip';

export { HairResultCard } from './HairResultCard';
export type {
  HairResultCardProps, FaceShapeType, HairStyle, HairColor, HairCareTip,
} from './HairResultCard';

export { MakeupResultCard } from './MakeupResultCard';
export type {
  MakeupResultCardProps, UndertoneType, MakeupColorCategory, MakeupStyle,
} from './MakeupResultCard';

export { GumHealthIndicator } from './GumHealthIndicator';
export type {
  GumHealthIndicatorProps, GumHealthStatus, GumHealthResult, AffectedArea,
} from './GumHealthIndicator';

export { OralHealthResultCard } from './OralHealthResultCard';
export type {
  OralHealthResultCardProps, ToothColorInfo, WhiteningGoal,
} from './OralHealthResultCard';

export { PostureResultCard } from './PostureResultCard';
export type {
  PostureResultCardProps, PostureType, PostureMeasurement,
} from './PostureResultCard';

export { StretchingRecommendation } from './StretchingRecommendation';
export type {
  StretchingRecommendationProps, StretchingItem, DifficultyLevel,
} from './StretchingRecommendation';

export { MultiAngleCapture } from './MultiAngleCapture';
export type {
  MultiAngleCaptureProps, FaceAngle, MultiAngleImages,
} from './MultiAngleCapture';

export { ZoneVisualization } from './ZoneVisualization';
export type {
  ZoneVisualizationProps, ZoneId, ZoneStatusLevel, ZoneData,
} from './ZoneVisualization';

export { ProfessionalSkinMap } from './ProfessionalSkinMap';
export type {
  ProfessionalSkinMapProps, ViewMode,
} from './ProfessionalSkinMap';

// 동적 스타일 훅 (useTheme 기반)
export { useAnalysisStyles } from './styles/useAnalysisStyles';

