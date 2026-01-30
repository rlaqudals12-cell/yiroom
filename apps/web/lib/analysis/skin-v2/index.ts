/**
 * S-2 피부분석 v2 공개 API
 * 6존 고도화 피부 분석
 *
 * @module lib/analysis/skin-v2
 * @description S-2 피부분석 v2
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 */

// =============================================================================
// Types
// =============================================================================

export type {
  SkinZoneType,
  ZoneGroup,
  GLCMResult,
  LBPResult,
  TextureAnalysis,
  ZoneMetricsV2,
  ZoneAnalysisV2,
  SixZoneAnalysisV2,
  SkinTypeV2,
  SkinCareRoutineRecommendation,
  SkinAnalysisV2Input,
  SkinAnalysisV2Result,
} from './types';

export {
  ZONE_GROUP_MAPPING,
  ZONE_LABELS,
  SKIN_TYPE_LABELS,
  VITALITY_GRADE_THRESHOLDS,
  RECOMMENDED_INGREDIENTS,
  AVOID_INGREDIENTS,
} from './types';

// =============================================================================
// Zone Extraction
// =============================================================================

export {
  extractZoneRegions,
  analyzeZoneConcerns,
  generateZoneRecommendations,
} from './zone-extractor';

// =============================================================================
// Texture Analysis
// =============================================================================

export {
  calculateGLCM,
  calculateLBP,
  analyzeTexture,
  calculatePoreScore,
  calculateWrinkleScore,
  calculateTextureScore,
  toGrayscale,
} from './texture-analyzer';

// =============================================================================
// Scoring
// =============================================================================

export {
  calculateZoneScore,
  extractTextureMetrics,
  calculateGroupAverages,
  calculateTUZoneDifference,
  calculateVitalityScore,
  calculateVitalityGrade,
  calculateScoreBreakdown,
  determineSkinType,
  extractPrimaryConcerns,
  calculateChangeFromPrevious,
} from './scorer';

// =============================================================================
// Mock Data
// =============================================================================

export {
  generateMockSkinAnalysisV2Result,
  generateMockZoneAnalysis,
  generateMockZoneMetrics,
} from './mock';
