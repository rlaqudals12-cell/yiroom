/**
 * M-1 메이크업 분석 모듈 공개 API
 *
 * @module lib/analysis/makeup
 * @description 퍼스널컬러 연계 메이크업 추천 시스템
 * @see docs/specs/SDD-MAKEUP-ANALYSIS.md
 */

// =============================================================================
// 타입 내보내기
// =============================================================================

export type {
  UndertoneType,
  EyeShapeType,
  LipShapeType,
  FaceShapeType,
  MakeupStyleType,
  MakeupConcernType,
  MakeupCategoryType,
  MakeupMetric,
  ColorRecommendation,
  MakeupTip,
  PersonalColorConnection,
  MakeupAnalysisResult,
  MakeupAnalysisInput,
} from './types';

export {
  UNDERTONE_LABELS,
  EYE_SHAPE_LABELS,
  LIP_SHAPE_LABELS,
  FACE_SHAPE_LABELS,
  MAKEUP_STYLE_LABELS,
  MAKEUP_CONCERN_LABELS,
  MAKEUP_CATEGORY_LABELS,
} from './types';

// =============================================================================
// Mock 데이터 (기존 mock 파일에서 re-export)
// =============================================================================

export {
  generateMockMakeupAnalysisResult,
  UNDERTONES,
  EYE_SHAPES,
  LIP_SHAPES,
  FACE_SHAPES,
  MAKEUP_STYLES,
  MAKEUP_CONCERNS,
} from '@/lib/mock/makeup-analysis';
