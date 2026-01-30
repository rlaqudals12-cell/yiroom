/**
 * CIE-4: CCT (상관 색온도) 분석기
 *
 * @module lib/image-engine/cie-4/cct-analyzer
 * @description 얼굴 영역에서 조명의 색온도 추정
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 */

import type { RGBImageData, RGB, NormalizedRect } from '../types';
import { estimateCCTFromRGB } from '../utils/color-space';
import { D65_CCT, CCT_THRESHOLDS } from '../constants';

/**
 * 얼굴 영역의 평균 RGB 계산
 *
 * @param imageData - RGB 이미지 데이터
 * @param region - 얼굴 영역 (정규화 좌표)
 * @returns 평균 RGB
 */
export function calculateRegionAverageRGB(
  imageData: RGBImageData,
  region: NormalizedRect
): RGB {
  const { data, width, height, channels } = imageData;

  // 정규화 좌표 → 픽셀 좌표
  const x1 = Math.floor(region.x * width);
  const y1 = Math.floor(region.y * height);
  const x2 = Math.floor((region.x + region.width) * width);
  const y2 = Math.floor((region.y + region.height) * height);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const idx = (y * width + x) * channels;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      count++;
    }
  }

  if (count === 0) {
    return { r: 128, g: 128, b: 128 };
  }

  return {
    r: Math.round(sumR / count),
    g: Math.round(sumG / count),
    b: Math.round(sumB / count),
  };
}

/**
 * 이미지 전체의 평균 RGB 계산
 *
 * @param imageData - RGB 이미지 데이터
 * @returns 평균 RGB
 */
function calculateImageAverageRGB(imageData: RGBImageData): RGB {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    sumR += data[offset];
    sumG += data[offset + 1];
    sumB += data[offset + 2];
  }

  return {
    r: Math.round(sumR / pixelCount),
    g: Math.round(sumG / pixelCount),
    b: Math.round(sumB / pixelCount),
  };
}

/**
 * 이마 영역에서 CCT 추정 (가장 신뢰도 높음)
 *
 * 이마: 피부색 영향 적고, 조명 직접 반사
 *
 * @param imageData - RGB 이미지 데이터
 * @param foreheadRegion - 이마 영역
 * @returns CCT (Kelvin)
 */
export function estimateCCTFromForehead(
  imageData: RGBImageData,
  foreheadRegion: NormalizedRect
): number {
  const avgRGB = calculateRegionAverageRGB(imageData, foreheadRegion);
  return estimateCCTFromRGB(avgRGB);
}

/**
 * 전체 얼굴 영역에서 CCT 추정
 *
 * @param imageData - RGB 이미지 데이터
 * @param faceRegion - 얼굴 영역
 * @returns CCT (Kelvin)
 */
export function estimateCCTFromFace(
  imageData: RGBImageData,
  faceRegion: NormalizedRect
): number {
  const avgRGB = calculateRegionAverageRGB(imageData, faceRegion);
  return estimateCCTFromRGB(avgRGB);
}

/**
 * 이미지 전체에서 CCT 추정 (얼굴 없을 때)
 *
 * @param imageData - RGB 이미지 데이터
 * @returns CCT (Kelvin)
 */
export function estimateCCTFromImage(imageData: RGBImageData): number {
  const avgRGB = calculateImageAverageRGB(imageData);
  return estimateCCTFromRGB(avgRGB);
}

/**
 * CCT 품질 분류
 *
 * @param cct - 색온도 (Kelvin)
 * @returns 조명 타입 분류
 */
export function classifyLightingType(
  cct: number
): 'warm' | 'neutral' | 'cool' | 'extreme' {
  if (cct < CCT_THRESHOLDS.warmMax) {
    return 'warm';
  }
  if (cct > CCT_THRESHOLDS.coolMin) {
    return 'cool';
  }
  if (cct >= CCT_THRESHOLDS.neutralMin && cct <= CCT_THRESHOLDS.neutralMax) {
    return 'neutral';
  }

  // 너무 극단적인 값
  if (cct < 2500 || cct > 10000) {
    return 'extreme';
  }

  // warm과 neutral 사이, 또는 neutral과 cool 사이
  return cct < D65_CCT ? 'warm' : 'cool';
}

/**
 * CCT 적합성 평가
 *
 * @param cct - 색온도 (Kelvin)
 * @returns 적합성 점수 (0-100)
 */
export function evaluateCCTSuitability(cct: number): number {
  // 이상적 범위: 5500K ~ 6500K (자연광)
  const idealMin = 5500;
  const idealMax = 6500;
  const idealCenter = D65_CCT;

  if (cct >= idealMin && cct <= idealMax) {
    // 이상적 범위 내: 80-100점
    const distanceFromCenter = Math.abs(cct - idealCenter);
    const maxDistance = (idealMax - idealMin) / 2;
    return Math.round(100 - (distanceFromCenter / maxDistance) * 20);
  }

  // 허용 범위: 4000K ~ 7500K
  const acceptableMin = CCT_THRESHOLDS.acceptable.min;
  const acceptableMax = CCT_THRESHOLDS.acceptable.max;

  if (cct >= acceptableMin && cct <= acceptableMax) {
    // 허용 범위 내: 50-80점
    if (cct < idealMin) {
      const distance = idealMin - cct;
      const maxDist = idealMin - acceptableMin;
      return Math.round(80 - (distance / maxDist) * 30);
    } else {
      const distance = cct - idealMax;
      const maxDist = acceptableMax - idealMax;
      return Math.round(80 - (distance / maxDist) * 30);
    }
  }

  // 허용 범위 밖: 0-50점
  if (cct < acceptableMin) {
    const distance = acceptableMin - cct;
    return Math.max(0, Math.round(50 - distance / 50));
  } else {
    const distance = cct - acceptableMax;
    return Math.max(0, Math.round(50 - distance / 100));
  }
}

/**
 * CCT 보정 필요 여부 판단
 *
 * @param cct - 색온도 (Kelvin)
 * @returns 보정 필요 여부
 */
export function needsCCTCorrection(cct: number): boolean {
  const { acceptable } = CCT_THRESHOLDS;
  return cct < acceptable.min || cct > acceptable.max;
}
