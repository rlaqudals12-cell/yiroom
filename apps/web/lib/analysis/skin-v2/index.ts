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
  rgbaToGrayscale,
  cropZoneGrayscale,
  analyzeZoneTexture,
  analyzeAllZonesTexture,
} from './texture-analyzer';

export type { ZoneTextureResult, AllZonesTextureResult } from './texture-analyzer';

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

// =============================================================================
// Identity Label (ADR-080)
// =============================================================================

export { generateSkinIdentityLabel, generateSkinIdentityLabelFromMetrics } from './identity-label';

// =============================================================================
// 12-Zone Expansion (S-2 확장)
// =============================================================================

export {
  extractTwelveZoneRegions,
  analyzeDetailedZoneConcerns,
  generateDetailedZoneRecommendations,
} from './twelve-zone-extractor';

export type { DetailedZoneRegion, TwelveZoneExtractionResult } from './twelve-zone-extractor';

export { scoreDetailedZone, analyzeTwelveZones } from './twelve-zone-scorer';

export type { TwelveZoneAnalysis } from './twelve-zone-scorer';

export {
  analyzeExtendedTUZone,
  analyzeSymmetry,
  detectProblemClusters,
  analyzeZoneInteractions,
} from './zone-interaction';

export type {
  ExtendedTUAnalysis,
  SymmetryAnalysis,
  SymmetryPair,
  ProblemCluster,
  ZoneInteractionAnalysis,
} from './zone-interaction';

export {
  analyzeSkinTrend,
  detectDeteriorationAlerts,
  calculateDiaryStreak,
  createDiaryEntryFromAnalysis,
} from './skin-diary-zone';

export type {
  SkinDiaryEntry,
  TrendDirection,
  ZoneTrend,
  SkinTrendAnalysis,
  DeteriorationAlert,
  DiaryStreak,
} from './skin-diary-zone';

// =============================================================================
// Gemini 12-Zone Prompt (T4.5.4)
// =============================================================================

export {
  TWELVE_ZONE_SYSTEM_PROMPT,
  buildTwelveZoneUserPrompt,
  parseTwelveZoneResponse,
} from './gemini-twelve-zone';

export type { TwelveZonePromptResult, ParsedTwelveZoneResult } from './gemini-twelve-zone';

// =============================================================================
// Zone Product Targeting (T4.5.6)
// =============================================================================

export {
  generateZoneProductRecommendations,
  getZoneApplicationTip,
} from './zone-product-targeting';

export type { RecommendedProduct, ZoneProductRecommendation } from './zone-product-targeting';

// =============================================================================
// Zone Heatmap Data (T4.5.7)
// =============================================================================

export {
  scoreToColor,
  scoreToOpacity,
  getScoreStatus,
  getZonePosition,
  prepareHeatmapData,
} from './zone-heatmap-data';

export type {
  HeatmapStatus,
  HeatmapZoneData,
  HeatmapData,
  ZoneEllipsePosition,
} from './zone-heatmap-data';
