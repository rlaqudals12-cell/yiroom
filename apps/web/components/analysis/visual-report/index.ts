// 비주얼 리포트 시스템
// 피부 분석 결과 시각화 컴포넌트 모음.
// 구세대 채점표 계열(VisualReportCard·GradeDisplay·MetricBar·StrengthsFirst·
// ScoreChangeBadge·DetailedFaceZoneMap·PhotoOverlayMap·constants)은 진단지 문법
// 전환(ADR-120)으로 소비처가 소멸해 삭제됨 — 표현 정본은 components/analysis/report.

// 컴포넌트
export { FaceZoneMap } from './FaceZoneMap';
export { SkinVitalityScore } from './SkinVitalityScore';
export { ZoneDetailCard } from './ZoneDetailCard';
export { LightingGuide } from './LightingGuide';
export { TrendChart } from './TrendChart';

// 타입
export type {
  AnalysisType,
  SkinZoneScores,
  BodyZoneScores,
  MetricItem,
  StrengthItem,
  VisualReportData,
} from './types';
export type { ZoneStatus, FaceZoneMapProps } from './FaceZoneMap';
export type { SkinVitalityScoreProps } from './SkinVitalityScore';
export type { ZoneDetailCardProps } from './ZoneDetailCard';
export type { LightingGuideProps, QualityCheckResult } from './LightingGuide';
export type { TrendChartProps } from './TrendChart';
