/**
 * CIE-3: AWB 보정 모듈 배럴 익스포트
 *
 * @module lib/image-engine/cie-3
 * @description Gray World, Von Kries, Skin-Aware AWB 알고리즘
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 *
 * @example
 * import { processAWBCorrection } from '@/lib/image-engine/cie-3';
 *
 * const result = processAWBCorrection(imageData);
 * if (result.correctionApplied) {
 *   const correctedImage = result.result.correctedImage;
 * }
 */

// 메인 프로세서
export {
  processAWBCorrection,
  processAWBCorrectionWithTimeout,
  selectAndApplyAWB,
} from './processor';

// 피부 감지
export {
  isSkinPixel,
  detectSkinMask,
  calculateSkinAverageRGB,
  calculateNonSkinAverageRGB,
  hasSufficientSkinCoverage,
  cleanSkinMask,
} from './skin-detector';

// AWB 알고리즘
export {
  calculateGrayWorldGains,
  applyGrayWorld,
  applyVonKries,
  applySkinAwareAWB,
  applyGains,
  calculateAppliedGains,
  isValidGains,
} from './awb-algorithms';

// Fallback
export {
  generateCIE3Fallback,
  generateAWBCorrectionFallback,
  generateCorrectedFallback,
  generateErrorCIE3Fallback,
  generateRandomCIE3Mock,
} from './fallback';

// 신뢰도 계산 (P8: 모듈 경계 분리)
export {
  calculateConfidence,
  calculateAWBConfidence,
  calculateConfidenceDetails,
  calculateGainScore,
  calculateCCTScore,
  calculateNonSkinScore,
  getMethodDefaultConfidence,
  adjustConfidenceForFallback,
} from './confidence';

export type { ColorStats, ConfidenceDetails } from './confidence';
