/**
 * Core Image Engine 공통 타입 정의
 *
 * @module lib/image-engine/types
 * @description CIE-1~4 모듈에서 공유하는 타입 정의
 */

// ============================================
// 기본 타입
// ============================================

/** RGB 색상 (0-255) */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** 정규화된 RGB (0-1) */
export interface RGBNormalized {
  r: number;
  g: number;
  b: number;
}

/** XYZ 색공간 */
export interface XYZ {
  x: number;
  y: number;
  z: number;
}

/** xy 색도 좌표 */
export interface Chromaticity {
  x: number;
  y: number;
}

/** LMS 색공간 (원추세포 응답) */
export interface LMS {
  l: number;
  m: number;
  s: number;
}

/** YCbCr 색공간 */
export interface YCbCr {
  y: number;
  cb: number;
  cr: number;
}

/** 2D 좌표 */
export interface Point2D {
  x: number;
  y: number;
}

/** 3D 좌표 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/** 바운딩 박스 (픽셀 좌표) */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 정규화된 사각형 영역 (0-1 좌표) - CIE-4 조명 분석용 */
export interface NormalizedRect {
  x: number; // 0-1
  y: number; // 0-1
  width: number; // 0-1
  height: number; // 0-1
}

/** 오일러 각도 (라디안) */
export interface EulerAngles {
  pitch: number; // 상하 회전 (고개 끄덕임)
  yaw: number; // 좌우 회전 (고개 돌림)
  roll: number; // 기울기 (고개 갸우뚱)
}

// ============================================
// 이미지 데이터 타입
// ============================================

/** 이미지 메타데이터 */
export interface ImageMetadata {
  width: number;
  height: number;
  channels: 3 | 4; // RGB or RGBA
}

/** 그레이스케일 이미지 데이터 */
export interface GrayscaleImageData {
  data: Uint8Array;
  width: number;
  height: number;
}

/** RGB 이미지 데이터 */
export interface RGBImageData {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  channels: 3 | 4;
}

// ============================================
// CIE-1: 이미지 품질 검증 타입
// ============================================

/** 선명도 분석 결과 */
export interface SharpnessResult {
  score: number; // 0-100 정규화 점수
  laplacianVariance: number; // 원시 Laplacian 분산값
  verdict: 'rejected' | 'warning' | 'acceptable' | 'optimal';
  feedback: string;
}

/** 해상도 검증 결과 */
export interface ResolutionResult {
  width: number;
  height: number;
  pixelCount: number;
  isValid: boolean;
  feedback: string | null;
}

/** 노출 분석 결과 */
export interface ExposureResult {
  meanBrightness: number; // 0-255
  verdict: 'underexposed' | 'normal' | 'overexposed';
  confidence: number; // 0-1
  feedback: string;
}

/** 색온도(CCT) 추정 결과 */
export interface CCTResult {
  kelvin: number; // CCT 값 (Kelvin)
  verdict: 'too_warm' | 'warm' | 'neutral' | 'cool' | 'too_cool';
  chromaticity: Chromaticity;
  confidence: number; // 0-1
  feedback: string;
}

/** CIE-1 최종 출력 */
export interface CIE1Output {
  isAcceptable: boolean;
  overallScore: number; // 0-100
  confidence: number; // 0-1
  sharpness: SharpnessResult;
  resolution: ResolutionResult | null;
  exposure: ExposureResult;
  colorTemperature: CCTResult;
  primaryIssue: string | null;
  allIssues: string[];
  processingTime: number; // ms
}

// ============================================
// CIE-2: 얼굴 감지 타입
// ============================================

/** 얼굴 랜드마크 (468-point) */
export interface FaceLandmarks {
  points: Point3D[];
  confidence: number;
}

/** 감지된 얼굴 정보 */
export interface DetectedFace {
  landmarks: FaceLandmarks;
  boundingBox: BoundingBox;
  angle: EulerAngles;
  frontalityScore: number; // 0-100
  confidence: number;
}

/** 정면성 검증 결과 */
export interface FrontalityResult {
  score: number; // 0-100
  isValid: boolean;
  angleDeviations: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  feedback: string;
}

/** 얼굴 영역 이미지 데이터 */
export interface FaceRegion {
  imageData: RGBImageData;
  boundingBox: BoundingBox;
  landmarks: FaceLandmarks;
}

/** CIE-2 최종 출력 */
export interface CIE2Output {
  success: boolean;
  faceDetected: boolean;
  faceCount: number;
  selectedFace?: DetectedFace;
  faceRegion?: FaceRegion;
  validation: {
    isAngleValid: boolean;
    angleFeedback: string;
    frontalityResult: FrontalityResult;
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    confidence: number;
  };
}

// ============================================
// CIE-3: AWB 보정 타입
// ============================================

/** 피부 마스크 */
export interface SkinMask {
  mask: Uint8Array; // 0 or 255 per pixel
  width: number;
  height: number;
  skinPixelCount: number;
  skinRatio: number; // 0-1
}

/** AWB 게인 값 */
export interface AWBGains {
  r: number;
  g: number;
  b: number;
}

/** AWB 보정 결과 */
export interface AWBCorrectionResult {
  correctedImage: RGBImageData;
  gains: AWBGains;
  originalCCT: number;
  correctedCCT: number;
  method: 'gray_world' | 'von_kries' | 'skin_aware' | 'none';
  confidence: number;
}

/** CIE-3 최종 출력 */
export interface CIE3Output {
  success: boolean;
  correctionApplied: boolean;
  result: AWBCorrectionResult | null;
  skinDetection: {
    detected: boolean;
    coverage: number;
    mask: SkinMask | null;
  };
  metadata: {
    processingTime: number;
    methodUsed: string;
    confidence: number;
  };
}

// ============================================
// CIE-4: 조명 분석 타입
// ============================================

/** 6-Zone 정의 */
export type FaceZone =
  | 'forehead_left'
  | 'forehead_right'
  | 'cheek_left'
  | 'cheek_right'
  | 'chin_left'
  | 'chin_right';

/** Zone별 밝기 정보 (레거시 호환) */
export interface ZoneBrightness {
  zone: FaceZone;
  meanBrightness: number;
  stdDev: number;
  pixelCount: number;
}

/** Zone 분석 결과 (단순화) */
export interface ZoneResult {
  name: string;
  brightness: number;
  status: 'dark' | 'normal' | 'bright' | 'overexposed';
}

/** 6존 조명 분석 결과 */
export interface LightingZoneAnalysis {
  zones: ZoneResult[];
  uniformity: number; // 0-1
  leftRightBalance: number; // 0-1 (1이 완벽한 균형)
  verticalGradient: number; // -1 ~ 1 (음수: 위가 밝음, 양수: 아래가 밝음)
}

/** 그림자 분석 결과 */
export interface ShadowAnalysis {
  hasShadow: boolean;
  direction: 'left' | 'right' | 'top' | 'bottom' | 'none';
  intensity: number; // 0-1
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  darkAreaRatio: number; // 0-1
  overexposedRatio: number; // 0-1
  recommendation: string;
}

/** 균일성 분석 결과 (레거시 호환) */
export interface UniformityResult {
  score: number; // 0-100
  globalStdDev: number;
  zoneData: ZoneBrightness[];
  verdict: 'excellent' | 'good' | 'fair' | 'poor';
  feedback: string;
}

/** 그림자 감지 결과 (레거시 호환) */
export interface ShadowResult {
  detected: boolean;
  asymmetryRatio: number;
  shadowSide: 'left' | 'right' | 'none';
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  feedback: string;
}

/** 조명 품질 결과 (레거시 호환) */
export interface LightingQualityResult {
  overallScore: number;
  cctScore: number;
  uniformityScore: number;
  shadowScore: number;
  verdict: 'excellent' | 'good' | 'acceptable' | 'poor';
  recommendations: string[];
}

/** CIE-4 최종 출력 */
export interface CIE4Output {
  success: boolean;
  isSuitable: boolean;
  estimatedCCT: number;
  lightingType: 'warm' | 'neutral' | 'cool' | 'extreme';
  cctSuitability: number; // 0-100
  requiresCorrection: boolean;
  zoneAnalysis: LightingZoneAnalysis | null;
  shadowAnalysis: ShadowAnalysis | null;
  overallScore: number; // 0-100
  feedback: string[];
  metadata: {
    processingTime: number;
    hasFaceRegion: boolean;
    confidence: number;
  };
}

// ============================================
// 파이프라인 통합 타입
// ============================================

/** 파이프라인 단계 */
export type PipelineStage = 'cie1' | 'cie2' | 'cie3' | 'cie4';

/** 파이프라인 상태 */
export interface PipelineStatus {
  stage: PipelineStage;
  success: boolean;
  error?: string;
  duration: number;
}

/** 전체 파이프라인 결과 */
export interface CIEPipelineResult {
  success: boolean;
  stages: PipelineStatus[];
  cie1?: CIE1Output;
  cie2?: CIE2Output;
  cie3?: CIE3Output;
  cie4?: CIE4Output;
  totalDuration: number;
  finalImage?: RGBImageData;
}

// ============================================
// 설정 타입
// ============================================

/** CIE-1 설정 */
export interface CIE1Config {
  sharpness: {
    rejectThreshold: number;
    warnThreshold: number;
    optimalThreshold: number;
  };
  resolution: {
    minWidth: number;
    minHeight: number;
    recommendedWidth: number;
    recommendedHeight: number;
  };
  exposure: {
    minBrightness: number;
    maxBrightness: number;
  };
  cct: {
    minKelvin: number;
    maxKelvin: number;
    idealKelvin: number;
  };
}

/** CIE-2 설정 */
export interface CIE2Config {
  maxFaces: number;
  minConfidence: number;
  angleThresholds: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  minFrontalityScore: number;
}

/** CIE-3 설정 */
export interface CIE3Config {
  targetCCT: number;
  minSkinCoverage: number;
  skinDetection: {
    cbMin: number;
    cbMax: number;
    crMin: number;
    crMax: number;
  };
}

/** CIE-4 설정 */
export interface CIE4Config {
  minQualityScore: number; // 최소 적합 점수 (0-100)
  uniformityWeights: {
    cct: number;
    uniformity: number;
    shadow: number;
  };
  shadowThreshold: number;
  minZonePixels: number;
}

/** 전체 설정 */
export interface CIEConfig {
  cie1: CIE1Config;
  cie2: CIE2Config;
  cie3: CIE3Config;
  cie4: CIE4Config;
}
