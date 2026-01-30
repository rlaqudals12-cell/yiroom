/**
 * CIE-4: 6존 조명 분석기
 *
 * @module lib/image-engine/cie-4/zone-analyzer
 * @description 얼굴을 6개 영역으로 분할하여 조명 균일성 분석
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 */

import type { RGBImageData, NormalizedRect, LightingZoneAnalysis } from '../types';

/**
 * 6존 정의 (얼굴 기준 상대 위치)
 *
 * ```
 * ┌─────┬─────┐
 * │  1  │  2  │  이마 좌/우
 * ├─────┼─────┤
 * │  3  │  4  │  볼 좌/우
 * ├─────┼─────┤
 * │  5  │  6  │  턱 좌/우
 * └─────┴─────┘
 * ```
 */
export const FACE_ZONES = [
  { name: 'forehead_left', xRatio: 0, yRatio: 0, widthRatio: 0.5, heightRatio: 0.33 },
  { name: 'forehead_right', xRatio: 0.5, yRatio: 0, widthRatio: 0.5, heightRatio: 0.33 },
  { name: 'cheek_left', xRatio: 0, yRatio: 0.33, widthRatio: 0.5, heightRatio: 0.34 },
  { name: 'cheek_right', xRatio: 0.5, yRatio: 0.33, widthRatio: 0.5, heightRatio: 0.34 },
  { name: 'chin_left', xRatio: 0, yRatio: 0.67, widthRatio: 0.5, heightRatio: 0.33 },
  { name: 'chin_right', xRatio: 0.5, yRatio: 0.67, widthRatio: 0.5, heightRatio: 0.33 },
] as const;

export type ZoneName = typeof FACE_ZONES[number]['name'];

/**
 * 영역의 평균 밝기 계산
 *
 * @param imageData - RGB 이미지 데이터
 * @param region - 분석할 영역 (픽셀 좌표)
 * @returns 평균 밝기 (0-255)
 */
export function calculateZoneBrightness(
  imageData: RGBImageData,
  region: { x: number; y: number; width: number; height: number }
): number {
  const { data, width, channels } = imageData;

  const x1 = Math.max(0, Math.floor(region.x));
  const y1 = Math.max(0, Math.floor(region.y));
  const x2 = Math.min(imageData.width, Math.floor(region.x + region.width));
  const y2 = Math.min(imageData.height, Math.floor(region.y + region.height));

  let sum = 0;
  let count = 0;

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const idx = (y * width + x) * channels;
      // BT.601 가중 평균
      const brightness = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      sum += brightness;
      count++;
    }
  }

  return count > 0 ? sum / count : 128;
}

/**
 * 6존 밝기 분석
 *
 * @param imageData - RGB 이미지 데이터
 * @param faceRegion - 얼굴 영역 (정규화 좌표, 0-1 범위)
 * @returns 6존 밝기 배열
 */
export function analyzeZoneBrightness(
  imageData: RGBImageData,
  faceRegion: NormalizedRect
): number[] {
  const { width, height } = imageData;

  // 입력값 범위 검증 및 클램핑 (0-1)
  const clampedRegion = {
    x: Math.max(0, Math.min(1, faceRegion.x)),
    y: Math.max(0, Math.min(1, faceRegion.y)),
    width: Math.max(0, Math.min(1 - Math.max(0, faceRegion.x), faceRegion.width)),
    height: Math.max(0, Math.min(1 - Math.max(0, faceRegion.y), faceRegion.height)),
  };

  // 유효하지 않은 영역인 경우 기본값 반환
  if (clampedRegion.width <= 0 || clampedRegion.height <= 0) {
    return FACE_ZONES.map(() => 128); // 중간 밝기 기본값
  }

  // 얼굴 영역을 픽셀 좌표로 변환
  const faceX = clampedRegion.x * width;
  const faceY = clampedRegion.y * height;
  const faceW = clampedRegion.width * width;
  const faceH = clampedRegion.height * height;

  return FACE_ZONES.map((zone) => {
    const pixelRegion = {
      x: faceX + zone.xRatio * faceW,
      y: faceY + zone.yRatio * faceH,
      width: zone.widthRatio * faceW,
      height: zone.heightRatio * faceH,
    };

    return calculateZoneBrightness(imageData, pixelRegion);
  });
}

/**
 * 조명 균일성 계산
 *
 * 균일성 = 1 - (표준편차 / 평균)
 * 1에 가까울수록 균일
 *
 * @param zoneBrightness - 6존 밝기 배열
 * @returns 균일성 (0-1)
 */
export function calculateUniformity(zoneBrightness: number[]): number {
  const n = zoneBrightness.length;
  if (n === 0) return 1;

  const mean = zoneBrightness.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 1;

  const variance =
    zoneBrightness.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // CV (변동계수) 기반 균일성
  const cv = stdDev / mean;
  return Math.max(0, Math.min(1, 1 - cv));
}

/**
 * 좌우 비대칭 계산
 *
 * @param zoneBrightness - 6존 밝기 배열
 * @returns 비대칭 정도 (0-1, 0이 완벽한 대칭)
 */
export function calculateLeftRightAsymmetry(zoneBrightness: number[]): number {
  if (zoneBrightness.length !== 6) return 0;

  const leftZones = [zoneBrightness[0], zoneBrightness[2], zoneBrightness[4]];
  const rightZones = [zoneBrightness[1], zoneBrightness[3], zoneBrightness[5]];

  const leftAvg = leftZones.reduce((a, b) => a + b, 0) / 3;
  const rightAvg = rightZones.reduce((a, b) => a + b, 0) / 3;

  const maxBrightness = Math.max(leftAvg, rightAvg);
  if (maxBrightness === 0) return 0;

  return Math.abs(leftAvg - rightAvg) / maxBrightness;
}

/**
 * 상하 그라디언트 계산 (위에서 아래로 밝기 변화)
 *
 * @param zoneBrightness - 6존 밝기 배열
 * @returns 그라디언트 방향 (-1: 위가 밝음, 1: 아래가 밝음)
 */
export function calculateVerticalGradient(zoneBrightness: number[]): number {
  if (zoneBrightness.length !== 6) return 0;

  const topAvg = (zoneBrightness[0] + zoneBrightness[1]) / 2;
  const bottomAvg = (zoneBrightness[4] + zoneBrightness[5]) / 2;

  const maxVal = Math.max(topAvg, bottomAvg);
  if (maxVal === 0) return 0;

  return (bottomAvg - topAvg) / maxVal;
}

/**
 * 종합 6존 분석
 *
 * @param imageData - RGB 이미지 데이터
 * @param faceRegion - 얼굴 영역
 * @returns 조명 존 분석 결과
 */
export function performZoneAnalysis(
  imageData: RGBImageData,
  faceRegion: NormalizedRect
): LightingZoneAnalysis {
  const zoneBrightness = analyzeZoneBrightness(imageData, faceRegion);

  const uniformity = calculateUniformity(zoneBrightness);
  const leftRightBalance = 1 - calculateLeftRightAsymmetry(zoneBrightness);
  const verticalGradient = calculateVerticalGradient(zoneBrightness);

  // 존별 결과
  const zones = FACE_ZONES.map((zone, i) => ({
    name: zone.name,
    brightness: Math.round(zoneBrightness[i]),
    status: classifyBrightness(zoneBrightness[i]),
  }));

  return {
    zones,
    uniformity,
    leftRightBalance,
    verticalGradient,
  };
}

/**
 * 밝기 상태 분류
 *
 * @param brightness - 밝기 (0-255)
 * @returns 상태
 */
function classifyBrightness(
  brightness: number
): 'dark' | 'normal' | 'bright' | 'overexposed' {
  if (brightness < 60) return 'dark';
  if (brightness < 180) return 'normal';
  if (brightness < 230) return 'bright';
  return 'overexposed';
}

/**
 * 균일성 점수 계산 (0-100)
 *
 * @param uniformity - 균일성 (0-1)
 * @returns 점수 (0-100)
 */
export function uniformityToScore(uniformity: number): number {
  // 0.8 이상이면 좋은 균일성
  if (uniformity >= 0.9) return 100;
  if (uniformity >= 0.8) return 80 + (uniformity - 0.8) * 200;
  if (uniformity >= 0.6) return 50 + (uniformity - 0.6) * 150;
  return Math.round(uniformity * 83);
}
