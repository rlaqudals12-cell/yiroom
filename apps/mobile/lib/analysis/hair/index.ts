/**
 * H-1 헤어분석 모듈 공개 API
 *
 * @module lib/analysis/hair
 * @description 얼굴형 기반 헤어스타일 추천 시스템
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

// =============================================================================
// 타입 내보내기
// =============================================================================

export type {
  FaceShapeType,
  HairThickness,
  HairTexture,
  HairDensity,
  ScalpCondition,
  HairLength,
  HairstyleRecommendation,
  HairColorRecommendation,
  HairAnalysisInput,
  FaceShapeAnalysis,
  HairColorAnalysis,
  HairAnalysisResult,
} from './types';

export {
  FACE_SHAPE_LABELS,
  FACE_SHAPE_DESCRIPTIONS,
  FACE_SHAPE_STYLE_MAPPING,
  HAIR_THICKNESS_LABELS,
  HAIR_TEXTURE_LABELS,
  SCALP_CONDITION_LABELS,
} from './types';

// =============================================================================
// 얼굴형 분석
// =============================================================================

export {
  analyzeFaceShape,
  estimateFaceShapeFromPose,
  getFaceShapeDescription,
  getFaceShapeConfidenceGrade,
} from './face-shape-analyzer';

// =============================================================================
// 헤어스타일 추천
// =============================================================================

export {
  recommendHairstyles,
  recommendHairColors,
  generateCareTips,
  getStylesToAvoid,
} from './style-recommender';

// =============================================================================
// Mock 데이터
// =============================================================================

export {
  generateMockFaceShapeAnalysis,
  generateMockHairColorAnalysis,
  generateMockHairAnalysisResult,
} from './mock';
