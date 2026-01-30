/**
 * 체형 비율 계산 타입 정의
 *
 * @description P2 준수: docs/principles/body-mechanics.md 원리 문서 기반
 * @module lib/body
 */

/**
 * 성별 타입
 */
export type Gender = 'male' | 'female';

/**
 * 연령대 타입 (Size Korea 8차 조사 기준)
 */
export type AgeGroup = '20s' | '30s' | '40s' | '50s';

/**
 * 체형 비율 입력값
 * @description 허리, 엉덩이, 어깨, 키 측정값 (cm 단위)
 */
export interface BodyMeasurements {
  waist: number;   // 허리 둘레 (cm)
  hip: number;     // 엉덩이 둘레 (cm)
  shoulder: number; // 어깨 너비 (cm 또는 mm, 함수별 명시)
  height: number;  // 신장 (cm)
}

/**
 * 체형 비율 계산 결과
 * @description WHR, SHR, WHtR 비율값
 */
export interface BodyRatios {
  whr: number;   // Waist-to-Hip Ratio
  shr: number;   // Shoulder-to-Hip Ratio
  whtr: number;  // Waist-to-Height Ratio
}

/**
 * WHR 건강 상태 분류
 * @description WHO 기준
 */
export type WHRHealthStatus = 'normal' | 'risk';

/**
 * WHtR 건강 상태 분류
 * @description NICE 2022 기준
 */
export type WHtRHealthStatus = 'underweight' | 'normal' | 'caution' | 'risk';

/**
 * SHR 체형 분류
 * @description 어깨-엉덩이 비율 기반
 */
export type SHRBodyShape = 'invertedTriangle' | 'balanced' | 'pear';

/**
 * 7-Type 체형 분류 (과일형)
 * @description docs/principles/body-mechanics.md 섹션 5.2, 5.3 기반
 */
export type BodyShape7 =
  | 'hourglass'        // 모래시계형
  | 'pear'             // 배형
  | 'invertedTriangle' // 역삼각형
  | 'apple'            // 사과형
  | 'rectangle'        // 직사각형
  | 'trapezoid'        // 사다리꼴 (남성)
  | 'oval';            // 타원형 (남성)

/**
 * 체형 분류 결과
 */
export interface BodyTypeResult {
  type: BodyShape7;
  confidence: number;   // 0-1 신뢰도
  koreanName: string;   // 한국어 이름
}

/**
 * WHR 분류 결과
 */
export interface WHRClassification {
  value: number;
  status: WHRHealthStatus;
  threshold: number;    // 성별 기준값
  description: string;  // 한국어 설명
}

/**
 * WHtR 분류 결과
 */
export interface WHtRClassification {
  value: number;
  status: WHtRHealthStatus;
  description: string;
}

/**
 * SHR 분류 결과
 */
export interface SHRClassification {
  value: number;
  shape: SHRBodyShape;
  description: string;
}

/**
 * 한국인 표준 데이터 (Size Korea 8차 조사)
 * @description docs/principles/body-mechanics.md 섹션 6.1
 */
export interface KoreanStandard {
  height: number;    // cm
  shoulder: number;  // mm
  waist: number;     // cm
  hip: number;       // cm
}

/**
 * 정규화 결과
 */
export interface NormalizedResult {
  zScore: number;
  percentile: number;  // 0-100
}

// ============================================
// MediaPipe Pose 33 랜드마크 타입
// @description docs/principles/body-mechanics.md 섹션 1 기반
// ============================================

/**
 * MediaPipe 랜드마크 인덱스 타입 (0-32)
 */
export type LandmarkIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
  21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32;

/**
 * 2D 좌표
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * 3D 좌표
 */
export interface Point3D extends Point2D {
  z: number;
}

/**
 * MediaPipe Pose 랜드마크
 * @description 원리 문서 섹션 1.3
 */
export interface PoseLandmark extends Point3D {
  visibility?: number;  // 가시성 (0.0 ~ 1.0)
  presence?: number;    // 존재 확신도 (0.0 ~ 1.0)
}

/**
 * 랜드마크 기반 측정값 (정규화된 좌표 기준)
 * @description 픽셀 또는 정규화 좌표 단위
 */
export interface LandmarkMeasurements {
  shoulderWidth: number;      // 어깨 너비
  hipWidth: number;           // 엉덩이 너비
  waistWidth: number;         // 허리 너비 (추정)
  waistPosition: Point2D;     // 허리 위치 좌표
  upperBodyLength: number;    // 상체 길이
  lowerBodyLength: number;    // 하체 길이
  totalHeight: number;        // 전체 높이
}

/**
 * 체형 비율 (랜드마크 기반)
 */
export interface BodyProportions {
  shr: number;                    // 어깨-엉덩이 비율
  upperLowerRatio: number;        // 상체-하체 비율
  legRatio: number;               // 다리-전체 높이 비율
  estimatedWaistHipRatio: number; // 추정 WHR (2D 기반)
  measurements: LandmarkMeasurements;
}

/**
 * 픽셀 -> 실제 치수 변환 설정
 */
export interface PixelToRealConfig {
  referenceType: 'height' | 'head';
  // 신장 기반 변환 시
  heightCm?: number;
  totalHeightPixels?: number;
  // 머리 크기 기반 변환 시
  headSizePixels?: number;
  headSizeCm?: number;  // 기본값: 22cm
}

/**
 * 실제 치수 (cm 단위)
 */
export interface RealMeasurementsCm {
  shoulderWidthCm: number;
  hipWidthCm: number;
  waistWidthCm: number;
  upperBodyLengthCm: number;
  lowerBodyLengthCm: number;
  totalHeightCm: number;
}

// ============================================
// 자세 분석 타입 (C-2)
// @description docs/principles/body-mechanics.md 섹션 4 기반
// ============================================

/**
 * 자세 측정 메트릭
 * @description 원리 문서 섹션 4.3 - 자세 점수 알고리즘 입력값
 */
export interface PostureMetrics {
  /** 두개척추각 (Craniovertebral Angle), 단위: 도 */
  cva: number;
  /** 흉추 후만각 (Thoracic Kyphosis), 단위: 도 */
  thoracicKyphosis: number;
  /** 골반 기울기 (Pelvic Tilt), 단위: 도 */
  pelvicTilt: number;
  /** 척추 대칭성 (Spine Symmetry), 범위: 0-1 */
  spineSymmetry: number;
}

/**
 * 자세 등급
 * @description 종합 점수 기반 등급
 */
export type PostureLevel = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * 자세 점수 결과
 * @description 자세 분석 종합 결과
 */
export interface PostureScoreResult {
  /** 종합 자세 점수 (0-100) */
  totalScore: number;
  /** 각 항목별 점수 */
  componentScores: {
    cva: number;
    kyphosis: number;
    pelvicTilt: number;
    spineSymmetry: number;
  };
  /** 자세 등급 */
  level: PostureLevel;
  /** 개선 권장사항 */
  recommendations: string[];
}

/**
 * CVA 심각도 등급
 * @description 원리 문서 섹션 4.2 - CVA 기준
 */
export type CVASeverity = 'normal' | 'mild' | 'moderate' | 'severe';

/**
 * Cobb 각도 심각도 등급
 * @description 원리 문서 섹션 4.2 - 측만증 기준
 */
export type CobbSeverity = 'normal' | 'mild' | 'moderate' | 'severe';
