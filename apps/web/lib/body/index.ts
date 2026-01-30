/**
 * 체형 비율 계산 모듈 - 공개 API
 *
 * @description P2 준수: docs/principles/body-mechanics.md 원리 문서 기반
 * @description P8 준수: Barrel Export 패턴으로 모듈 경계 정의
 * @module lib/body
 *
 * @example
 * import {
 *   calculateWHR,
 *   calculateSHR,
 *   calculateWHtR,
 *   classifyBodyType,
 *   normalizeToKorean,
 * } from '@/lib/body';
 *
 * // WHR 계산
 * const whr = calculateWHR(78.4, 94.3); // 0.83
 *
 * // 체형 분류
 * const result = classifyBodyType({
 *   bust: 88,
 *   waist: 68,
 *   hip: 91,
 *   shoulder: 36,
 *   height: 161,
 *   gender: 'female',
 * });
 */

// 타입 export
export type {
  Gender,
  AgeGroup,
  BodyMeasurements,
  BodyRatios,
  WHRHealthStatus,
  WHtRHealthStatus,
  SHRBodyShape,
  BodyShape7,
  BodyTypeResult,
  WHRClassification,
  WHtRClassification,
  SHRClassification,
  KoreanStandard,
  NormalizedResult,
  // 자세 분석 타입 (C-2)
  PostureMetrics,
  PostureLevel,
  PostureScoreResult,
  CVASeverity,
  CobbSeverity,
} from './types';

// 비율 계산 함수 export
export {
  calculateWHR,
  calculateSHR,
  calculateWHtR,
  classifyWHR,
  classifyWHtR,
  classifySHR,
} from './ratios';

// 체형 분류 함수 export
export type { ClassifyInput } from './classify';
export {
  classifyBodyType,
  classifyBodyTypeFromRatios,
  calculateAllRatios,
} from './classify';

// 한국인 표준 데이터 및 정규화 함수 export
export {
  KOREAN_STANDARDS,
  STD_DEV,
  normalizeToKorean,
  ageToAgeGroup,
  getStandardWHR,
  isWithinNormalRange,
} from './korean-standards';

// ============================================
// MediaPipe Pose 33 랜드마크 관련 export (C-2)
// ============================================

// 랜드마크 타입 export
export type {
  LandmarkIndex,
  Point2D,
  Point3D,
  PoseLandmark,
  LandmarkMeasurements,
  BodyProportions,
  PixelToRealConfig,
  RealMeasurementsCm,
} from './types';

// 랜드마크 상수 및 함수 export
export {
  LANDMARK_INDEX,
  ESSENTIAL_LANDMARKS,
  isReliableLandmark,
  areEssentialLandmarksReliable,
  getLandmarkReliabilitySummary,
  estimateShoulderWidth,
  estimateHipWidth,
  estimateWaistPosition,
  estimateWaistWidth,
  estimateUpperBodyLength,
  estimateLowerBodyLength,
  estimateTotalHeight,
  calculatePixelToCmRatio,
  estimateHeadSizePixels,
  extractLandmarkMeasurements,
  calculateBodyProportions,
  convertMeasurementsToCm,
} from './landmarks';

// ============================================
// 자세 점수 계산 함수 export (C-2)
// ============================================

export {
  calculateCVAScore,
  calculateSpineSymmetryScore,
  calculateKyphosisScore,
  calculatePelvicTiltScore,
  calculatePostureScore,
  classifyCVASeverity,
  classifyCobbSeverity,
  cobbAngleToSymmetry,
  symmetryToCobbAngle,
} from './posture-score';
