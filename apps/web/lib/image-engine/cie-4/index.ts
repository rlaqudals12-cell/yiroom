/**
 * CIE-4: 조명 분석 모듈 배럴 익스포트
 *
 * @module lib/image-engine/cie-4
 * @description CCT 분석, 6존 분석, 그림자 감지
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 *
 * @example
 * import { processLightingAnalysis } from '@/lib/image-engine/cie-4';
 *
 * const result = processLightingAnalysis(imageData, faceRegion);
 * if (result.isSuitable) {
 *   console.log('CCT:', result.estimatedCCT);
 * }
 */

// 메인 프로세서
export {
  processLightingAnalysis,
  processLightingAnalysisWithTimeout,
  quickLightingCheck,
} from './processor';

// CCT 분석
export {
  calculateRegionAverageRGB,
  estimateCCTFromForehead,
  estimateCCTFromFace,
  estimateCCTFromImage,
  classifyLightingType,
  evaluateCCTSuitability,
  needsCCTCorrection,
} from './cct-analyzer';

// 6존 분석
export {
  FACE_ZONES,
  calculateZoneBrightness,
  analyzeZoneBrightness,
  calculateUniformity,
  calculateLeftRightAsymmetry,
  calculateVerticalGradient,
  performZoneAnalysis,
  uniformityToScore,
} from './zone-analyzer';

// 그림자 감지
export {
  SHADOW_THRESHOLDS,
  detectShadowDirection,
  calculateShadowIntensity,
  calculateDarkAreaRatio,
  calculateOverexposedRatio,
  performShadowAnalysis,
  shadowToScore,
} from './shadow-detector';

// Fallback
export {
  generateZoneAnalysisFallback,
  generateShadowAnalysisFallback,
  generateCIE4Fallback,
  generateErrorCIE4Fallback,
  generateRandomCIE4Mock,
  generateConditionedCIE4Mock,
} from './fallback';
