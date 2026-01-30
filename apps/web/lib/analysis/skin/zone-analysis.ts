/**
 * T-zone / U-zone 피부 분석 모듈
 *
 * @module lib/analysis/skin/zone-analysis
 * @description T-zone(이마+코)과 U-zone(볼+턱) 분리 분석
 * @see {@link docs/principles/skin-physiology.md} 존 정의 및 피지선 밀도
 */

import type { LabColor } from '@/lib/shared/integration-types';

/**
 * 얼굴 영역 좌표
 */
export interface FaceRegion {
  /** 이마 영역 */
  forehead: BoundingBox;
  /** 코 영역 */
  nose: BoundingBox;
  /** 왼쪽 볼 영역 */
  leftCheek: BoundingBox;
  /** 오른쪽 볼 영역 */
  rightCheek: BoundingBox;
  /** 턱 영역 */
  chin: BoundingBox;
}

/**
 * 영역 경계 상자
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 존 분석 결과
 */
export interface ZoneAnalysis {
  /** 존 타입 */
  zoneType: 'T-zone' | 'U-zone';
  /** 평균 피지량 (0-255 스케일) */
  avgSebum: number;
  /** 평균 수분량 (0-100) */
  avgHydration: number;
  /** 평균 Lab 색상값 */
  avgLabColor: LabColor;
  /** 피부 상태 분류 */
  skinCondition: ZoneSkinCondition;
  /** 분석된 픽셀 수 */
  sampleCount: number;
}

/**
 * 존별 피부 상태
 */
export type ZoneSkinCondition = 'dry' | 'normal' | 'oily';

/**
 * 통합 피부 분석 결과
 */
export interface SkinAnalysis {
  /** T-zone 분석 결과 */
  tZone: ZoneAnalysis;
  /** U-zone 분석 결과 */
  uZone: ZoneAnalysis;
  /** 전체 피부 타입 */
  overallSkinType: OverallSkinType;
  /** 피부 타입 판정 근거 */
  skinTypeRationale: string;
}

/**
 * 전체 피부 타입 (5가지)
 */
export type OverallSkinType =
  | 'dry'
  | 'normal'
  | 'oily'
  | 'combination'
  | 'sensitive';

/**
 * 피지량 임계값 (docs/principles/skin-physiology.md)
 */
export const SEBUM_THRESHOLDS = {
  T_ZONE: {
    DRY: 70,
    NORMAL: 150,
  },
  U_ZONE: {
    DRY: 30,
    NORMAL: 70,
  },
} as const;

/**
 * ImageData에서 특정 영역의 픽셀 데이터 추출
 */
function extractRegionPixels(
  imageData: ImageData,
  box: BoundingBox
): Uint8ClampedArray {
  const { width: imgWidth, data } = imageData;
  const { x, y, width, height } = box;

  const regionSize = width * height * 4;
  const pixels = new Uint8ClampedArray(regionSize);

  let pixelIndex = 0;
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      const srcIndex = (row * imgWidth + col) * 4;
      pixels[pixelIndex++] = data[srcIndex];
      pixels[pixelIndex++] = data[srcIndex + 1];
      pixels[pixelIndex++] = data[srcIndex + 2];
      pixels[pixelIndex++] = data[srcIndex + 3];
    }
  }

  return pixels;
}

/**
 * RGB를 Lab 색공간으로 변환
 */
function rgbToLab(r: number, g: number, b: number): LabColor {
  // sRGB to linear RGB
  let rLinear = r / 255;
  let gLinear = g / 255;
  let bLinear = b / 255;

  rLinear = rLinear > 0.04045
    ? Math.pow((rLinear + 0.055) / 1.055, 2.4)
    : rLinear / 12.92;
  gLinear = gLinear > 0.04045
    ? Math.pow((gLinear + 0.055) / 1.055, 2.4)
    : gLinear / 12.92;
  bLinear = bLinear > 0.04045
    ? Math.pow((bLinear + 0.055) / 1.055, 2.4)
    : bLinear / 12.92;

  // Linear RGB to XYZ (D65)
  const xVal = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
  const yVal = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750;
  const zVal = rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041;

  // XYZ to Lab (D65 reference white)
  const xRef = 0.95047;
  const yRef = 1.00000;
  const zRef = 1.08883;

  let xRatio = xVal / xRef;
  let yRatio = yVal / yRef;
  let zRatio = zVal / zRef;

  const epsilon = 0.008856;
  const kappa = 903.3;

  xRatio = xRatio > epsilon
    ? Math.pow(xRatio, 1/3)
    : (kappa * xRatio + 16) / 116;
  yRatio = yRatio > epsilon
    ? Math.pow(yRatio, 1/3)
    : (kappa * yRatio + 16) / 116;
  zRatio = zRatio > epsilon
    ? Math.pow(zRatio, 1/3)
    : (kappa * zRatio + 16) / 116;

  const L = 116 * yRatio - 16;
  const a = 500 * (xRatio - yRatio);
  const labB = 200 * (yRatio - zRatio);

  return { L, a, b: labB };
}

/**
 * 픽셀 데이터에서 평균 Lab 색상 계산
 */
function calculateAverageLabColor(pixels: Uint8ClampedArray): LabColor {
  let totalL = 0;
  let totalA = 0;
  let totalB = 0;
  let count = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const bVal = pixels[i + 2];

    const lab = rgbToLab(r, g, bVal);
    totalL += lab.L;
    totalA += lab.a;
    totalB += lab.b;
    count++;
  }

  return {
    L: totalL / count,
    a: totalA / count,
    b: totalB / count,
  };
}

/**
 * 피부 밝기 기반 피지량 추정
 */
function estimateSebumFromLuminance(labL: number): number {
  return Math.round((labL / 100) * 200);
}

/**
 * 색상 기반 수분량 추정
 */
function estimateHydrationFromColor(labL: number, labB: number): number {
  const lFactor = Math.min(labL / 60, 1);
  const bFactor = Math.max(0, Math.min((labB + 10) / 30, 1));
  return Math.round(lFactor * bFactor * 100);
}

/**
 * 피지량으로 존 피부 상태 분류
 */
function classifyZoneCondition(
  sebum: number,
  zoneType: 'T-zone' | 'U-zone'
): ZoneSkinCondition {
  const thresholds = zoneType === 'T-zone'
    ? SEBUM_THRESHOLDS.T_ZONE
    : SEBUM_THRESHOLDS.U_ZONE;

  if (sebum < thresholds.DRY) {
    return 'dry';
  }
  if (sebum <= thresholds.NORMAL) {
    return 'normal';
  }
  return 'oily';
}

/**
 * T-zone (이마 + 코) 분석
 *
 * @param imageData - 전체 얼굴 이미지 데이터
 * @param faceRegion - 얼굴 영역 좌표
 * @returns T-zone 분석 결과
 *
 * @see docs/principles/skin-physiology.md#t-zone
 */
export function analyzeTZone(
  imageData: ImageData,
  faceRegion: FaceRegion
): ZoneAnalysis {
  const foreheadPixels = extractRegionPixels(imageData, faceRegion.forehead);
  const nosePixels = extractRegionPixels(imageData, faceRegion.nose);

  const combinedPixels = new Uint8ClampedArray(
    foreheadPixels.length + nosePixels.length
  );
  combinedPixels.set(foreheadPixels, 0);
  combinedPixels.set(nosePixels, foreheadPixels.length);

  const avgLabColor = calculateAverageLabColor(combinedPixels);
  const avgSebum = estimateSebumFromLuminance(avgLabColor.L);
  const avgHydration = estimateHydrationFromColor(avgLabColor.L, avgLabColor.b);
  const skinCondition = classifyZoneCondition(avgSebum, 'T-zone');

  return {
    zoneType: 'T-zone',
    avgSebum,
    avgHydration,
    avgLabColor,
    skinCondition,
    sampleCount: combinedPixels.length / 4,
  };
}

/**
 * U-zone (볼 + 턱) 분석
 *
 * @param imageData - 전체 얼굴 이미지 데이터
 * @param faceRegion - 얼굴 영역 좌표
 * @returns U-zone 분석 결과
 *
 * @see docs/principles/skin-physiology.md#u-zone
 */
export function analyzeUZone(
  imageData: ImageData,
  faceRegion: FaceRegion
): ZoneAnalysis {
  const leftCheekPixels = extractRegionPixels(imageData, faceRegion.leftCheek);
  const rightCheekPixels = extractRegionPixels(imageData, faceRegion.rightCheek);
  const chinPixels = extractRegionPixels(imageData, faceRegion.chin);

  const totalLength = leftCheekPixels.length + rightCheekPixels.length + chinPixels.length;
  const combinedPixels = new Uint8ClampedArray(totalLength);
  combinedPixels.set(leftCheekPixels, 0);
  combinedPixels.set(rightCheekPixels, leftCheekPixels.length);
  combinedPixels.set(chinPixels, leftCheekPixels.length + rightCheekPixels.length);

  const avgLabColor = calculateAverageLabColor(combinedPixels);
  const avgSebum = estimateSebumFromLuminance(avgLabColor.L);
  const avgHydration = estimateHydrationFromColor(avgLabColor.L, avgLabColor.b);
  const skinCondition = classifyZoneCondition(avgSebum, 'U-zone');

  return {
    zoneType: 'U-zone',
    avgSebum,
    avgHydration,
    avgLabColor,
    skinCondition,
    sampleCount: combinedPixels.length / 4,
  };
}

/**
 * T-zone과 U-zone 분석 결과를 통합하여 전체 피부 타입 결정
 *
 * 피부 타입 결정 로직 (docs/principles/skin-physiology.md):
 * - 건성: T-zone 건조 + U-zone 건조
 * - 지성: T-zone 유분 + U-zone 유분
 * - 복합성: T-zone 유분 + U-zone 건조/정상
 * - 중성: T-zone 정상 + U-zone 정상
 *
 * @param tZone - T-zone 분석 결과
 * @param uZone - U-zone 분석 결과
 * @returns 통합 피부 분석 결과
 */
export function combineZoneAnalysis(
  tZone: ZoneAnalysis,
  uZone: ZoneAnalysis
): SkinAnalysis {
  const tCondition = tZone.skinCondition;
  const uCondition = uZone.skinCondition;

  let overallSkinType: OverallSkinType;
  let skinTypeRationale: string;

  if (tCondition === 'dry' && uCondition === 'dry') {
    overallSkinType = 'dry';
    skinTypeRationale = 'T-zone과 U-zone 모두 건조하여 건성으로 분류';
  } else if (tCondition === 'oily' && uCondition === 'oily') {
    overallSkinType = 'oily';
    skinTypeRationale = 'T-zone과 U-zone 모두 유분이 많아 지성으로 분류';
  } else if (tCondition === 'oily' && (uCondition === 'dry' || uCondition === 'normal')) {
    overallSkinType = 'combination';
    skinTypeRationale = 'T-zone은 유분이 많고 U-zone은 ' + (uCondition === 'dry' ? '건조' : '정상') + '하여 복합성으로 분류';
  } else if (tCondition === 'normal' && uCondition === 'normal') {
    overallSkinType = 'normal';
    skinTypeRationale = 'T-zone과 U-zone 모두 정상 범위로 중성으로 분류';
  } else {
    overallSkinType = 'combination';
    skinTypeRationale = 'T-zone: ' + tCondition + ', U-zone: ' + uCondition + ' 조합으로 복합성으로 분류';
  }

  return {
    tZone,
    uZone,
    overallSkinType,
    skinTypeRationale,
  };
}
