/**
 * Core Image Engine (CIE) 메인 배럴 익스포트
 *
 * @module lib/image-engine
 * @description CIE-1~4 이미지 처리 파이프라인
 * @see docs/principles/image-processing.md
 * @see docs/adr/ADR-001-core-image-engine.md
 *
 * @example
 * import { validateImageQuality, CIE1Output } from '@/lib/image-engine';
 *
 * const result = await validateImageQuality(imageData);
 * if (!result.isAcceptable) {
 *   console.log(result.primaryIssue);
 * }
 */

// ============================================
// 타입 익스포트
// ============================================

export type {
  // 기본 타입
  RGB,
  RGBNormalized,
  XYZ,
  Chromaticity,
  LMS,
  YCbCr,
  Point2D,
  Point3D,
  BoundingBox,
  NormalizedRect,
  EulerAngles,
  // 이미지 데이터 타입
  ImageMetadata,
  GrayscaleImageData,
  RGBImageData,
  // CIE-1 타입
  SharpnessResult,
  ResolutionResult,
  ExposureResult,
  CCTResult,
  CIE1Output,
  // CIE-2 타입
  FaceLandmarks,
  DetectedFace,
  FrontalityResult,
  FaceRegion,
  CIE2Output,
  // CIE-3 타입
  SkinMask,
  AWBGains,
  AWBCorrectionResult,
  CIE3Output,
  // CIE-4 타입
  FaceZone,
  ZoneBrightness,
  ZoneResult,
  LightingZoneAnalysis,
  ShadowAnalysis,
  UniformityResult,
  ShadowResult,
  LightingQualityResult,
  CIE4Output,
  // 파이프라인 타입 (레거시, pipeline/ 모듈 사용 권장)
  PipelineStatus,
  CIEPipelineResult,
  // 설정 타입
  CIE1Config,
  CIE2Config,
  CIE3Config,
  CIE4Config,
  CIEConfig,
} from './types';

// ============================================
// 상수 익스포트
// ============================================

export {
  // 물리 상수
  D65_WHITE_POINT,
  D65_XYZ,
  D65_CCT,
  CCT_THRESHOLDS,
  // 색공간 변환 행렬
  SRGB_TO_XYZ_MATRIX,
  XYZ_TO_SRGB_MATRIX,
  BRADFORD_MATRIX,
  BRADFORD_INVERSE_MATRIX,
  // 그레이스케일 가중치
  GRAYSCALE_WEIGHTS,
  GRAYSCALE_WEIGHTS_BT709,
  // Laplacian 커널
  LAPLACIAN_KERNEL_3X3,
  LAPLACIAN_KERNEL_5X5,
  // McCamy CCT 계수
  MCCAMY_COEFFICIENTS,
  // 피부 감지
  SKIN_DETECTION_YCBCR,
  // 얼굴 각도
  FACE_ANGLE_THRESHOLDS,
  FRONTALITY_WEIGHTS,
  // 랜드마크 인덱스
  FACE_LANDMARK_INDICES,
  // 기본 설정
  DEFAULT_CIE_CONFIG,
  // 등급 기준
  SHARPNESS_GRADES,
  UNIFORMITY_GRADES,
  CCT_RANGES,
  // 피드백 메시지
  FEEDBACK_MESSAGES,
  // 타임아웃
  PROCESSING_TIMEOUT,
  MAX_RETRIES,
} from './constants';

// ============================================
// 유틸리티 익스포트
// ============================================

export {
  // 그레이스케일
  toGrayscale,
  toGrayscaleBT709,
  calculateMeanBrightness,
  calculateStdDev,
  calculateHistogram,
  normalizeHistogram,
  extractRegion,
  fromCanvasImageData,
  fromBase64,
  // 색공간
  srgbToLinear,
  linearToSrgb,
  normalizeRGB,
  denormalizeRGB,
  rgbToXYZ,
  xyzToRGB,
  xyzToChromaticity,
  rgbToChromaticity,
  xyzToLMS,
  lmsToXYZ,
  vonKriesAdaptation,
  rgbToYCbCr,
  ycbcrToRGB,
  estimateCCT,
  estimateCCTFromRGB,
  calculateColorDifference,
  calculateAverageRGB,
  // 행렬
  multiplyMatrixVector,
  multiplyMatrices,
  identityMatrix3x3,
  transposeMatrix,
  determinant3x3,
  inverseMatrix3x3,
  scaleMatrix,
  diagonalMatrix,
  // 벡터
  add2D,
  subtract2D,
  scale2D,
  magnitude2D,
  normalize2D,
  dot2D,
  distance2D,
  add3D,
  subtract3D,
  scale3D,
  magnitude3D,
  normalize3D,
  dot3D,
  cross3D,
  distance3D,
  radiansToDegrees,
  degreesToRadians,
  eulerToDegrees,
  calculateFaceNormal,
  normalToEulerAngles,
  calculateRollFromEyes,
  calculateFaceEulerAngles,
  calculateFrontalityScore,
  centroid3D,
  lerp,
  lerp3D,
  clamp,
} from './utils';
export type { Matrix3x3, Vector3 } from './utils';

// ============================================
// CIE-1: 이미지 품질 검증
// ============================================

export {
  // 메인 검증 함수
  validateImageQuality,
  validateImageQualityWithTimeout,
  calculateOverallScore,
  calculateOverallConfidence,
  isAcceptable,
  determinePrimaryIssue,
  collectAllIssues,
  // 선명도 분석
  analyzeSharpness,
  analyzeSharpnessFromGray,
  applyLaplacianFilter,
  calculateLaplacianVariance,
  normalizeSharpnessScore,
  getSharpnessVerdict,
  getSharpnessFeedback,
  // 노출 분석
  analyzeExposure,
  analyzeExposureFromGray,
  analyzeExposureDetailed,
  getExposureVerdict,
  calculateExposureConfidence,
  getExposureFeedback,
  analyzeHistogram,
  // 색온도 분석
  analyzeColorTemperature,
  analyzeColorTemperatureFromRGB,
  getCCTVerdict,
  calculateCCTConfidence,
  getCCTFeedback,
  calculateImageAverageRGB,
  calculateBrightRegionAverageRGB,
  // 해상도 검증
  validateResolution,
  validateResolutionDirect,
  calculateResolutionScore,
  isSuitableForFaceAnalysis,
  calculateRecommendedSize,
  // Fallback
  generateCIE1Fallback,
  generatePartialCIE1Fallback,
  generateRejectedFallback,
  generateRandomCIE1Mock,
  generateSharpnessFallback,
  generateExposureFallback,
  generateCCTFallback,
} from './cie-1';

// ============================================
// CIE-2: 얼굴 감지 및 랜드마크
// ============================================

export {
  // 메인 프로세서
  processMediaPipeResults,
  processMock,
  isMediaPipeAvailable,
  generateMockMediaPipeResult,
  // 얼굴 감지
  convertLandmarksToPoints,
  calculateBoundingBoxFromLandmarks,
  getLandmarkPoint,
  calculateFaceAngle,
  calculateFrontalityFromLandmarks,
  convertToDetectedFace,
  selectBestFace,
  validateFaceAngle,
  // 영역 추출
  normalizeBoundingBox,
  extractRegionFromImage,
  getPaddedBoundingBox,
  extractFaceRegion,
  extractSquareFaceRegion,
  // Fallback
  generateCIE2Fallback,
  generateNoFaceFallback,
  generateErrorFallback,
  generateRandomCIE2Mock,
  generateFrontalityFallback,
} from './cie-2';
export type { MediaPipeFaceResult } from './cie-2';

// ============================================
// CIE-3: AWB 보정
// ============================================

export {
  // 메인 프로세서
  processAWBCorrection,
  processAWBCorrectionWithTimeout,
  selectAndApplyAWB,
  // 피부 감지
  isSkinPixel,
  detectSkinMask,
  calculateSkinAverageRGB,
  calculateNonSkinAverageRGB,
  hasSufficientSkinCoverage,
  cleanSkinMask,
  // AWB 알고리즘
  calculateGrayWorldGains,
  applyGrayWorld,
  applyVonKries,
  applySkinAwareAWB,
  applyGains,
  calculateAppliedGains,
  isValidGains,
  // Fallback
  generateCIE3Fallback,
  generateAWBCorrectionFallback,
  generateCorrectedFallback,
  generateErrorCIE3Fallback,
  generateRandomCIE3Mock,
} from './cie-3';

// ============================================
// CIE-4: 조명 분석
// ============================================

export {
  // 메인 프로세서
  processLightingAnalysis,
  processLightingAnalysisWithTimeout,
  quickLightingCheck,
  // CCT 분석
  calculateRegionAverageRGB,
  estimateCCTFromForehead,
  estimateCCTFromFace,
  estimateCCTFromImage,
  classifyLightingType,
  evaluateCCTSuitability,
  needsCCTCorrection,
  // 6존 분석
  FACE_ZONES,
  calculateZoneBrightness,
  analyzeZoneBrightness,
  calculateUniformity,
  calculateLeftRightAsymmetry,
  calculateVerticalGradient,
  performZoneAnalysis,
  uniformityToScore,
  // 그림자 감지
  SHADOW_THRESHOLDS,
  detectShadowDirection,
  calculateShadowIntensity,
  calculateDarkAreaRatio,
  calculateOverexposedRatio,
  performShadowAnalysis,
  shadowToScore,
  // Fallback
  generateZoneAnalysisFallback,
  generateShadowAnalysisFallback,
  generateCIE4Fallback,
  generateErrorCIE4Fallback,
  generateRandomCIE4Mock,
  generateConditionedCIE4Mock,
} from './cie-4';

// ============================================
// 파이프라인 (CIE-1~4 통합)
// ============================================

export {
  runCIEPipeline,
  runCIEPipelineWithTimeout,
} from './pipeline';

export type {
  PipelineStage,
  PipelineProgress,
  PipelineOptions,
  PipelineResult,
} from './pipeline';
