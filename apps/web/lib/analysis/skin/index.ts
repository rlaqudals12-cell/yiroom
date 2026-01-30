/**
 * 피부 분석 모듈 공개 API
 *
 * @module lib/analysis/skin
 * @description ITA 기반 피부톤 분석, T-zone/U-zone 분리 분석, 6-Zone 세밀 분석
 *
 * P8 원칙: 모듈 경계 준수
 * - 이 파일을 통해서만 외부 접근 가능
 * - 내부 구현은 직접 import 금지
 *
 * @see docs/principles/color-science.md (ITA 공식)
 * @see docs/principles/skin-physiology.md (T-zone/U-zone, 6-Zone)
 */

// ITA 분석
export {
  calculateITA,
  classifySkinToneByITA,
  analyzeITA,
  ITA_THRESHOLDS,
} from './ita';

export type {
  SkinToneLevel,
  ITAAnalysisResult,
} from './ita';

// T-zone / U-zone 분석 (기존)
export {
  analyzeTZone,
  analyzeUZone,
  combineZoneAnalysis,
  SEBUM_THRESHOLDS,
} from './zone-analysis';

export type {
  FaceRegion,
  BoundingBox as ZoneBoundingBox,
  ZoneAnalysis,
  ZoneSkinCondition,
  SkinAnalysis,
  OverallSkinType,
} from './zone-analysis';

// 6-Zone 분석 (S-2 고도화)
export {
  extractZoneRegion,
  analyzeZone,
  analyzeSixZones,
  determineSkinTypeFrom6Zones,
} from './six-zone-analysis';

// 6-Zone 타입
export type {
  SkinZone,
  PoreSize,
  ZoneConcern,
  ZoneMetrics,
  SixZoneAnalysis,
  SixZoneFaceRegion,
  BoundingBox,
  SkinType,
} from './types';

export {
  ZONE_SEBUM_DENSITY,
  ZONE_OILINESS_THRESHOLDS,
  ZONE_SENSITIVITY_THRESHOLDS,
} from './types';

// GLCM Texture Analysis (S-2 고도화)
export {
  calculateGLCM,
  extractHaralickFeatures,
  analyzeTexture,
  calculateTroubleScore,
  analyzeTextureMultiAngle,
  GLCM_DEFAULTS,
} from './glcm-analysis';

export type {
  GLCMMatrix,
  HaralickFeatures,
  TextureAnalysis,
  TroubleScoreResult,
} from './glcm-analysis';

// 수분도-Roughness 보정 (S-2 고도화)
export {
  estimateHydrationFromRoughness,
  correctHydrationWithTEWL,
  applyEnvironmentalCorrection,
  classifyHydrationLevel,
  calculateCorrectedHydration,
  validateRoughnessRa,
  interpretTEWL,
  RA_MODEL,
  TEWL_THRESHOLDS,
  ENVIRONMENT_BASELINE,
  HYDRATION_THRESHOLDS,
} from './hydration-correction';

export type {
  HydrationCorrectionInput,
  HydrationCorrectionResult,
  HydrationLevel,
} from './hydration-correction';
