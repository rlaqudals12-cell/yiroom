/**
 * CIE-1: 이미지 품질 검증 모듈 배럴 익스포트
 *
 * @module lib/image-engine/cie-1
 * @description 선명도, 노출, 색온도, 해상도 검증
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 *
 * @example
 * import { validateImageQuality } from '@/lib/image-engine/cie-1';
 *
 * const result = validateImageQuality(imageData);
 * if (!result.isAcceptable) {
 *   console.log(result.primaryIssue);
 * }
 */

// 메인 검증 함수
export {
  validateImageQuality,
  validateImageQualityWithTimeout,
  calculateOverallScore,
  calculateOverallConfidence,
  isAcceptable,
  determinePrimaryIssue,
  collectAllIssues,
} from './quality-validator';

// 선명도 분석
export {
  analyzeSharpness,
  analyzeSharpnessFromGray,
  applyLaplacianFilter,
  calculateLaplacianVariance,
  normalizeSharpnessScore,
  getSharpnessVerdict,
  getSharpnessFeedback,
} from './sharpness';

// 노출 분석
export {
  analyzeExposure,
  analyzeExposureFromGray,
  analyzeExposureDetailed,
  getExposureVerdict,
  calculateExposureConfidence,
  getExposureFeedback,
  analyzeHistogram,
} from './exposure';

// 색온도 분석
export {
  analyzeColorTemperature,
  analyzeColorTemperatureFromRGB,
  getCCTVerdict,
  calculateCCTConfidence,
  getCCTFeedback,
  calculateImageAverageRGB,
  calculateBrightRegionAverageRGB,
} from './color-temperature';

// 해상도 검증
export {
  validateResolution,
  validateResolutionDirect,
  calculateResolutionScore,
  isSuitableForFaceAnalysis,
  calculateRecommendedSize,
} from './resolution';

// Fallback
export {
  generateCIE1Fallback,
  generatePartialCIE1Fallback,
  generateRejectedFallback,
  generateRandomCIE1Mock,
  generateSharpnessFallback,
  generateExposureFallback,
  generateCCTFallback,
} from './fallback';
