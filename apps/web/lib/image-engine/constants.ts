/**
 * Core Image Engine 상수 정의
 *
 * @module lib/image-engine/constants
 * @description CIE-1~4 모듈에서 공유하는 상수값
 * @see docs/principles/image-processing.md
 */

import type { CIEConfig } from './types';

// ============================================
// 물리 상수
// ============================================

/** D65 표준 광원 색도 좌표 */
export const D65_WHITE_POINT = {
  x: 0.31271,
  y: 0.32902,
  z: 0.35827,
} as const;

/** D65 XYZ 값 */
export const D65_XYZ = {
  x: 95.047,
  y: 100.0,
  z: 108.883,
} as const;

/** D65 색온도 (Kelvin) */
export const D65_CCT = 6500;

/** CCT 임계값 (Kelvin) */
export const CCT_THRESHOLDS = {
  warmMax: 4500, // 이 이하면 따뜻한 조명
  coolMin: 7000, // 이 이상이면 차가운 조명
  neutralMin: 5500, // 중립 범위 시작
  neutralMax: 6500, // 중립 범위 끝
  acceptable: {
    min: 4000, // 허용 범위 최소
    max: 7500, // 허용 범위 최대
  },
} as const;

// ============================================
// 색공간 변환 행렬
// ============================================

/**
 * sRGB → XYZ 변환 행렬 (D65 기준)
 * @see http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
 */
export const SRGB_TO_XYZ_MATRIX = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
] as const;

/** XYZ → sRGB 변환 행렬 (D65 기준) */
export const XYZ_TO_SRGB_MATRIX = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
] as const;

/**
 * Bradford 색순응 변환 행렬
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */
export const BRADFORD_MATRIX = [
  [0.8951, 0.2664, -0.1614],
  [-0.7502, 1.7135, 0.0367],
  [0.0389, -0.0685, 1.0296],
] as const;

/** Bradford 역행렬 */
export const BRADFORD_INVERSE_MATRIX = [
  [0.9869929, -0.1470543, 0.1599627],
  [0.4323053, 0.5183603, 0.0492912],
  [-0.0085287, 0.0400428, 0.9684867],
] as const;

// ============================================
// 그레이스케일 변환 가중치
// ============================================

/**
 * ITU-R BT.601 그레이스케일 가중치
 * Y = 0.299R + 0.587G + 0.114B
 */
export const GRAYSCALE_WEIGHTS = {
  r: 0.299,
  g: 0.587,
  b: 0.114,
} as const;

/**
 * ITU-R BT.709 그레이스케일 가중치 (HD 비디오)
 * Y = 0.2126R + 0.7152G + 0.0722B
 */
export const GRAYSCALE_WEIGHTS_BT709 = {
  r: 0.2126,
  g: 0.7152,
  b: 0.0722,
} as const;

// ============================================
// Laplacian 커널 (선명도 측정)
// ============================================

/**
 * 3x3 Laplacian 커널
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 */
export const LAPLACIAN_KERNEL_3X3 = [
  [0, 1, 0],
  [1, -4, 1],
  [0, 1, 0],
] as const;

/** 5x5 확장 Laplacian 커널 (더 정밀한 측정) */
export const LAPLACIAN_KERNEL_5X5 = [
  [0, 0, -1, 0, 0],
  [0, -1, -2, -1, 0],
  [-1, -2, 16, -2, -1],
  [0, -1, -2, -1, 0],
  [0, 0, -1, 0, 0],
] as const;

// ============================================
// McCamy CCT 공식 계수
// ============================================

/**
 * McCamy 공식 계수
 * n = (x - xe) / (ye - y)
 * CCT = An³ + Bn² + Cn + D
 *
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 */
export const MCCAMY_COEFFICIENTS = {
  xe: 0.332,
  ye: 0.1858,
  A: 449,
  B: 3525,
  C: 6823.3,
  D: 5520.33,
} as const;

// ============================================
// 피부 감지 임계값 (YCbCr)
// ============================================

/**
 * YCbCr 피부 감지 범위
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */
export const SKIN_DETECTION_YCBCR = {
  cbMin: 77,
  cbMax: 127,
  crMin: 133,
  crMax: 173,
} as const;

// ============================================
// 얼굴 각도 임계값
// ============================================

/**
 * 정면성 판정 각도 임계값 (도)
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 */
export const FACE_ANGLE_THRESHOLDS = {
  pitch: 10, // 상하 ±10°
  yaw: 15, // 좌우 ±15°
  roll: 20, // 기울기 ±20°
} as const;

/**
 * 정면성 점수 가중치
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 */
export const FRONTALITY_WEIGHTS = {
  yaw: 0.5, // 50%
  pitch: 0.3, // 30%
  roll: 0.2, // 20%
} as const;

// ============================================
// MediaPipe 랜드마크 인덱스
// ============================================

/**
 * 주요 얼굴 랜드마크 인덱스 (468-point 모델)
 * @see https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
 */
export const FACE_LANDMARK_INDICES = {
  // 얼굴 윤곽
  noseTip: 1,
  noseBase: 168,
  leftEyeInner: 133,
  leftEyeOuter: 33,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  leftEarTragion: 234,
  rightEarTragion: 454,
  mouthLeft: 61,
  mouthRight: 291,
  chin: 152,

  // 6-Zone 분석용 (CIE-4)
  foreheadCenter: 10,
  foreheadLeft: 67,
  foreheadRight: 297,
  cheekLeft: 50,
  cheekRight: 280,
  chinLeft: 172,
  chinRight: 397,

  // 각도 계산용 (3점 기준)
  forehead: 10,
  leftCheek: 234,
  rightCheek: 454,
} as const;

// ============================================
// 기본 설정값
// ============================================

/** 기본 CIE 설정 */
export const DEFAULT_CIE_CONFIG: CIEConfig = {
  cie1: {
    sharpness: {
      rejectThreshold: 80, // 80 미만 거부
      warnThreshold: 120, // 80-120 경고
      optimalThreshold: 500, // 500 이상 최적
    },
    resolution: {
      minWidth: 640,
      minHeight: 480,
      recommendedWidth: 1280,
      recommendedHeight: 960,
    },
    exposure: {
      minBrightness: 80, // 80 미만 저노출
      maxBrightness: 190, // 190 초과 과노출
    },
    cct: {
      minKelvin: 4000, // 4000K 미만 너무 따뜻
      maxKelvin: 7500, // 7500K 초과 너무 차가움
      idealKelvin: 6500, // D65 기준
    },
  },
  cie2: {
    maxFaces: 5,
    minConfidence: 0.5,
    angleThresholds: {
      pitch: 10,
      yaw: 15,
      roll: 20,
    },
    minFrontalityScore: 70,
  },
  cie3: {
    targetCCT: 6500, // D65
    minSkinCoverage: 0.05, // 최소 5% 피부 영역
    skinDetection: {
      cbMin: 77,
      cbMax: 127,
      crMin: 133,
      crMax: 173,
    },
  },
  cie4: {
    minQualityScore: 50, // 최소 적합 점수
    uniformityWeights: {
      cct: 0.4,
      uniformity: 0.35,
      shadow: 0.25,
    },
    shadowThreshold: 0.15, // 15% 비대칭 시 그림자 감지
    minZonePixels: 100,
  },
};

// ============================================
// 점수 범위 및 등급
// ============================================

/** 선명도 등급 기준 */
export const SHARPNESS_GRADES = {
  rejected: { min: 0, max: 80 },
  warning: { min: 80, max: 120 },
  acceptable: { min: 120, max: 500 },
  optimal: { min: 500, max: Infinity },
} as const;

/** 균일성 등급 기준 */
export const UNIFORMITY_GRADES = {
  excellent: { min: 85, max: 100 },
  good: { min: 70, max: 85 },
  fair: { min: 50, max: 70 },
  poor: { min: 0, max: 50 },
} as const;

/** CCT 범위 (Kelvin) */
export const CCT_RANGES = {
  tooWarm: { min: 0, max: 4000 },
  warm: { min: 4000, max: 5500 },
  neutral: { min: 5500, max: 6500 },
  cool: { min: 6500, max: 7500 },
  tooCool: { min: 7500, max: Infinity },
} as const;

// ============================================
// 피드백 메시지
// ============================================

/** 한국어 피드백 메시지 */
export const FEEDBACK_MESSAGES = {
  sharpness: {
    rejected: '이미지가 너무 흐립니다. 초점을 맞추고 다시 촬영해주세요.',
    warning: '이미지가 다소 흐립니다. 가능하다면 더 선명한 이미지를 사용해주세요.',
    acceptable: '이미지 선명도가 적절합니다.',
    optimal: '이미지 선명도가 매우 좋습니다.',
  },
  exposure: {
    underexposed: '이미지가 너무 어둡습니다. 조명을 밝게 하고 다시 촬영해주세요.',
    normal: '노출이 적절합니다.',
    overexposed: '이미지가 너무 밝습니다. 조명을 줄이고 다시 촬영해주세요.',
  },
  cct: {
    tooWarm: '조명이 너무 따뜻합니다. 자연광 또는 주광색 조명을 사용해주세요.',
    warm: '조명이 약간 따뜻합니다.',
    neutral: '조명 색온도가 적절합니다.',
    cool: '조명이 약간 차갑습니다.',
    tooCool: '조명이 너무 차갑습니다. 따뜻한 조명을 추가해주세요.',
  },
  face: {
    notDetected: '얼굴을 감지할 수 없습니다. 얼굴이 잘 보이도록 촬영해주세요.',
    multipleFaces: '여러 얼굴이 감지되었습니다. 가장 크고 정면인 얼굴을 선택합니다.',
    angleWarning: '얼굴 각도가 너무 기울어졌습니다. 정면을 바라보고 촬영해주세요.',
    lowConfidence: '얼굴 감지 신뢰도가 낮습니다. 조명을 개선하고 다시 시도해주세요.',
  },
  shadow: {
    none: '그림자가 감지되지 않았습니다.',
    mild: '약간의 그림자가 있습니다.',
    moderate: '한쪽에 그림자가 있습니다. 균일한 조명을 사용해주세요.',
    severe: '심한 그림자가 감지되었습니다. 조명 위치를 조정해주세요.',
  },
  resolution: {
    tooSmall: '이미지 해상도가 너무 낮습니다. 최소 640x480 이상의 이미지를 사용해주세요.',
    acceptable: '이미지 해상도가 적절합니다.',
  },
} as const;

// ============================================
// 타임아웃 및 재시도
// ============================================

/** 처리 타임아웃 (ms) */
export const PROCESSING_TIMEOUT = {
  cie1: 1000, // 이미지 품질 검증
  cie2: 2000, // 얼굴 감지
  cie3: 1500, // AWB 보정
  cie4: 1000, // 조명 분석
  total: 5000, // 전체 파이프라인
} as const;

/** 최대 재시도 횟수 */
export const MAX_RETRIES = 2;
