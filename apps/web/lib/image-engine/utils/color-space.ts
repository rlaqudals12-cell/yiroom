/**
 * 색공간 변환 유틸리티
 *
 * @module lib/image-engine/utils/color-space
 * @description sRGB ↔ XYZ ↔ LMS, RGB ↔ YCbCr 변환
 * @see docs/principles/image-processing.md
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */

import type { RGB, RGBNormalized, XYZ, Chromaticity, LMS, YCbCr } from '../types';
import {
  SRGB_TO_XYZ_MATRIX,
  XYZ_TO_SRGB_MATRIX,
  BRADFORD_MATRIX,
  BRADFORD_INVERSE_MATRIX,
  D65_XYZ,
} from '../constants';
import { multiplyMatrixVector } from './matrix';

// ============================================
// sRGB ↔ Linear RGB (감마 보정)
// ============================================

/**
 * sRGB 감마 해제 (역감마 변환)
 * 비선형 sRGB → 선형 RGB
 *
 * @param value - sRGB 값 (0-255)
 * @returns 선형 RGB 값 (0-1)
 */
export function srgbToLinear(value: number): number {
  const v = value / 255;
  if (v <= 0.04045) {
    return v / 12.92;
  }
  return Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * sRGB 감마 적용
 * 선형 RGB → 비선형 sRGB
 *
 * @param value - 선형 RGB 값 (0-1)
 * @returns sRGB 값 (0-255)
 */
export function linearToSrgb(value: number): number {
  let v: number;
  if (value <= 0.0031308) {
    v = value * 12.92;
  } else {
    v = 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }
  return Math.round(Math.max(0, Math.min(255, v * 255)));
}

/**
 * RGB (0-255) → 정규화된 RGB (0-1)
 */
export function normalizeRGB(rgb: RGB): RGBNormalized {
  return {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  };
}

/**
 * 정규화된 RGB (0-1) → RGB (0-255)
 */
export function denormalizeRGB(rgb: RGBNormalized): RGB {
  return {
    r: Math.round(Math.max(0, Math.min(255, rgb.r * 255))),
    g: Math.round(Math.max(0, Math.min(255, rgb.g * 255))),
    b: Math.round(Math.max(0, Math.min(255, rgb.b * 255))),
  };
}

// ============================================
// sRGB ↔ XYZ
// ============================================

/**
 * sRGB → XYZ 변환
 * (D65 표준 광원 기준)
 *
 * @param rgb - sRGB 값 (0-255)
 * @returns XYZ 색공간 값
 */
export function rgbToXYZ(rgb: RGB): XYZ {
  // 1. sRGB → 선형 RGB
  const linearR = srgbToLinear(rgb.r);
  const linearG = srgbToLinear(rgb.g);
  const linearB = srgbToLinear(rgb.b);

  // 2. 행렬 변환
  const [x, y, z] = multiplyMatrixVector(SRGB_TO_XYZ_MATRIX, [
    linearR,
    linearG,
    linearB,
  ]);

  return { x: x * 100, y: y * 100, z: z * 100 };
}

/**
 * XYZ → sRGB 변환
 * (D65 표준 광원 기준)
 *
 * @param xyz - XYZ 색공간 값
 * @returns sRGB 값 (0-255)
 */
export function xyzToRGB(xyz: XYZ): RGB {
  // 1. 정규화
  const x = xyz.x / 100;
  const y = xyz.y / 100;
  const z = xyz.z / 100;

  // 2. 행렬 변환
  const [linearR, linearG, linearB] = multiplyMatrixVector(XYZ_TO_SRGB_MATRIX, [
    x,
    y,
    z,
  ]);

  // 3. 선형 RGB → sRGB
  return {
    r: linearToSrgb(linearR),
    g: linearToSrgb(linearG),
    b: linearToSrgb(linearB),
  };
}

// ============================================
// XYZ → 색도 좌표
// ============================================

/**
 * XYZ → xy 색도 좌표 변환
 *
 * @param xyz - XYZ 색공간 값
 * @returns xy 색도 좌표
 */
export function xyzToChromaticity(xyz: XYZ): Chromaticity {
  const sum = xyz.x + xyz.y + xyz.z;
  if (sum === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: xyz.x / sum,
    y: xyz.y / sum,
  };
}

/**
 * RGB → xy 색도 좌표 변환
 *
 * @param rgb - sRGB 값 (0-255)
 * @returns xy 색도 좌표
 */
export function rgbToChromaticity(rgb: RGB): Chromaticity {
  const xyz = rgbToXYZ(rgb);
  return xyzToChromaticity(xyz);
}

// ============================================
// XYZ ↔ LMS (원추세포 응답)
// ============================================

/**
 * XYZ → LMS 변환 (Bradford 행렬)
 *
 * @param xyz - XYZ 색공간 값
 * @returns LMS 원추세포 응답
 */
export function xyzToLMS(xyz: XYZ): LMS {
  const [l, m, s] = multiplyMatrixVector(BRADFORD_MATRIX, [
    xyz.x / 100,
    xyz.y / 100,
    xyz.z / 100,
  ]);
  return { l, m, s };
}

/**
 * LMS → XYZ 변환 (Bradford 역행렬)
 *
 * @param lms - LMS 원추세포 응답
 * @returns XYZ 색공간 값
 */
export function lmsToXYZ(lms: LMS): XYZ {
  const [x, y, z] = multiplyMatrixVector(BRADFORD_INVERSE_MATRIX, [
    lms.l,
    lms.m,
    lms.s,
  ]);
  return { x: x * 100, y: y * 100, z: z * 100 };
}

// ============================================
// Von Kries 색순응
// ============================================

/**
 * Von Kries 색순응 변환
 * 소스 광원에서 타겟 광원(D65)으로 색상 조정
 *
 * @param rgb - 원본 sRGB 값
 * @param sourceWhiteXYZ - 소스 광원의 XYZ 값
 * @returns 색순응 적용된 sRGB 값
 */
export function vonKriesAdaptation(rgb: RGB, sourceWhiteXYZ: XYZ): RGB {
  // 1. 소스 LMS
  const sourceLMS = xyzToLMS(sourceWhiteXYZ);

  // 2. 타겟 LMS (D65)
  const targetLMS = xyzToLMS({
    x: D65_XYZ.x,
    y: D65_XYZ.y,
    z: D65_XYZ.z,
  });

  // 3. 스케일 계산
  const scale = {
    l: targetLMS.l / sourceLMS.l,
    m: targetLMS.m / sourceLMS.m,
    s: targetLMS.s / sourceLMS.s,
  };

  // 4. 원본 → XYZ → LMS
  const originalXYZ = rgbToXYZ(rgb);
  const originalLMS = xyzToLMS(originalXYZ);

  // 5. 스케일 적용
  const adaptedLMS: LMS = {
    l: originalLMS.l * scale.l,
    m: originalLMS.m * scale.m,
    s: originalLMS.s * scale.s,
  };

  // 6. LMS → XYZ → RGB
  const adaptedXYZ = lmsToXYZ(adaptedLMS);
  return xyzToRGB(adaptedXYZ);
}

// ============================================
// RGB ↔ YCbCr (피부 감지용)
// ============================================

/**
 * RGB → YCbCr 변환
 * (ITU-R BT.601 기준)
 *
 * @param rgb - sRGB 값 (0-255)
 * @returns YCbCr 값
 */
export function rgbToYCbCr(rgb: RGB): YCbCr {
  const { r, g, b } = rgb;

  // Y = 0.299R + 0.587G + 0.114B
  const y = 0.299 * r + 0.587 * g + 0.114 * b;

  // Cb = 128 - 0.168736R - 0.331264G + 0.5B
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

  // Cr = 128 + 0.5R - 0.418688G - 0.081312B
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  return { y, cb, cr };
}

/**
 * YCbCr → RGB 변환
 * (ITU-R BT.601 기준)
 *
 * @param ycbcr - YCbCr 값
 * @returns sRGB 값 (0-255)
 */
export function ycbcrToRGB(ycbcr: YCbCr): RGB {
  const { y, cb, cr } = ycbcr;

  const r = y + 1.402 * (cr - 128);
  const g = y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128);
  const b = y + 1.772 * (cb - 128);

  return {
    r: Math.round(Math.max(0, Math.min(255, r))),
    g: Math.round(Math.max(0, Math.min(255, g))),
    b: Math.round(Math.max(0, Math.min(255, b))),
  };
}

// ============================================
// CCT 추정 (McCamy 공식)
// ============================================

/**
 * McCamy 공식을 사용한 CCT 추정
 *
 * n = (x - 0.3320) / (0.1858 - y)
 * CCT = 449n³ + 3525n² + 6823.3n + 5520.33
 *
 * @param chromaticity - xy 색도 좌표
 * @returns 색온도 (Kelvin)
 */
export function estimateCCT(chromaticity: Chromaticity): number {
  const { x, y } = chromaticity;

  // McCamy 공식
  const xe = 0.332;
  const ye = 0.1858;

  const n = (x - xe) / (ye - y);

  // 다항식 계산
  const cct = 449 * Math.pow(n, 3) + 3525 * Math.pow(n, 2) + 6823.3 * n + 5520.33;

  // 유효 범위 제한 (1000K ~ 25000K)
  return Math.max(1000, Math.min(25000, cct));
}

/**
 * RGB 이미지의 평균 색온도 추정
 *
 * @param avgRGB - 이미지의 평균 RGB 값
 * @returns 색온도 (Kelvin)
 */
export function estimateCCTFromRGB(avgRGB: RGB): number {
  const chromaticity = rgbToChromaticity(avgRGB);
  return estimateCCT(chromaticity);
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 두 색상의 Delta E (색차) 계산 (간이 방식)
 * 정밀한 계산이 필요하면 CIEDE2000 사용
 *
 * @param rgb1 - 첫 번째 RGB
 * @param rgb2 - 두 번째 RGB
 * @returns 색차 값
 */
export function calculateColorDifference(rgb1: RGB, rgb2: RGB): number {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * RGB 배열의 평균 계산
 *
 * @param rgbValues - RGB 값 배열
 * @returns 평균 RGB
 */
export function calculateAverageRGB(rgbValues: RGB[]): RGB {
  if (rgbValues.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (const rgb of rgbValues) {
    sumR += rgb.r;
    sumG += rgb.g;
    sumB += rgb.b;
  }

  const count = rgbValues.length;
  return {
    r: Math.round(sumR / count),
    g: Math.round(sumG / count),
    b: Math.round(sumB / count),
  };
}
