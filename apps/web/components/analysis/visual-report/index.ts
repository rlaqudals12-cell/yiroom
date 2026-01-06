// 비주얼 리포트 시스템
// 피부/체형/퍼스널컬러 분석 결과를 시각화하는 컴포넌트 모음

// 컴포넌트
export { GradeDisplay } from './GradeDisplay';
export { MetricBar } from './MetricBar';
export { StrengthsFirst } from './StrengthsFirst';
export { VisualReportCard } from './VisualReportCard';

// 상수 및 유틸리티
export {
  GRADE_CONFIGS,
  GRADE_ICONS,
  ANALYSIS_TYPE_LABELS,
  ANALYSIS_TYPE_ICONS,
  ANALYSIS_TYPE_COLORS,
  POSITIVE_MESSAGES,
  SIZE_STYLES,
  getGradeFromScore,
} from './constants';

// 타입
export type { AnalysisGrade, GradeConfig } from './constants';
export type {
  AnalysisType,
  SkinZoneScores,
  BodyZoneScores,
  MetricItem,
  StrengthItem,
  GradeDisplayProps,
  MetricBarProps,
  StrengthsFirstProps,
  VisualReportCardProps,
  VisualReportData,
} from './types';
