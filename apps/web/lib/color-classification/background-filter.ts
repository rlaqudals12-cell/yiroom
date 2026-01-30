/**
 * 배경 색상 필터링
 *
 * @module lib/color-classification/background-filter
 * @description 흰색/검정색/회색 배경 제거
 * @see docs/adr/ADR-034-product-color-classification.md
 */

import type { RGBColor, ColorCluster, BackgroundFilterOptions } from './types';

/** 기본 배경 필터링 옵션 */
const DEFAULT_BACKGROUND_OPTIONS: Required<BackgroundFilterOptions> = {
  whiteThreshold: 240,
  blackThreshold: 15,
  grayRange: 10,
};

/**
 * 흰색 여부 판단
 */
function isWhite(rgb: RGBColor, threshold: number): boolean {
  return rgb.r >= threshold && rgb.g >= threshold && rgb.b >= threshold;
}

/**
 * 검정색 여부 판단
 */
function isBlack(rgb: RGBColor, threshold: number): boolean {
  return rgb.r <= threshold && rgb.g <= threshold && rgb.b <= threshold;
}

/**
 * 회색 여부 판단 (R, G, B 차이가 작음)
 */
function isGray(rgb: RGBColor, range: number): boolean {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  return max - min <= range;
}

/**
 * 배경색 여부 판단
 */
export function isBackgroundColor(
  rgb: RGBColor,
  options: BackgroundFilterOptions = {}
): boolean {
  const { whiteThreshold, blackThreshold, grayRange } = {
    ...DEFAULT_BACKGROUND_OPTIONS,
    ...options,
  };

  // 흰색
  if (isWhite(rgb, whiteThreshold)) {
    return true;
  }

  // 검정색
  if (isBlack(rgb, blackThreshold)) {
    return true;
  }

  // 회색 (중간 밝기이면서 채도 낮음)
  const avgBrightness = (rgb.r + rgb.g + rgb.b) / 3;
  if (avgBrightness > 60 && avgBrightness < 200 && isGray(rgb, grayRange)) {
    return true;
  }

  return false;
}

/**
 * 픽셀 배열에서 배경색 필터링
 *
 * @param pixels - RGB 픽셀 배열
 * @param options - 필터링 옵션
 * @returns 필터링된 픽셀 배열
 */
export function filterBackgroundColors(
  pixels: RGBColor[],
  options: BackgroundFilterOptions = {}
): RGBColor[] {
  return pixels.filter((pixel) => !isBackgroundColor(pixel, options));
}

/**
 * 클러스터에서 배경색 제외
 *
 * @param clusters - 색상 클러스터 배열
 * @param options - 필터링 옵션
 * @returns 배경색이 아닌 클러스터 배열
 */
export function filterBackgroundClusters(
  clusters: ColorCluster[],
  options: BackgroundFilterOptions = {}
): ColorCluster[] {
  return clusters.filter((cluster) => !isBackgroundColor(cluster.centroid, options));
}

/**
 * 필터링 후 비율 재계산
 *
 * @param clusters - 필터링된 클러스터 배열
 * @returns 비율이 재계산된 클러스터 배열
 */
export function recalculatePercentages(clusters: ColorCluster[]): ColorCluster[] {
  const totalCount = clusters.reduce((sum, c) => sum + c.count, 0);

  if (totalCount === 0) {
    return clusters;
  }

  return clusters.map((cluster) => ({
    ...cluster,
    percentage: (cluster.count / totalCount) * 100,
  }));
}

/**
 * 배경색 비율 계산 (디버깅/분석용)
 *
 * @param pixels - RGB 픽셀 배열
 * @param options - 필터링 옵션
 * @returns 배경색 비율 (0-100)
 */
export function calculateBackgroundRatio(
  pixels: RGBColor[],
  options: BackgroundFilterOptions = {}
): number {
  if (pixels.length === 0) {
    return 0;
  }

  const backgroundCount = pixels.filter((pixel) =>
    isBackgroundColor(pixel, options)
  ).length;

  return (backgroundCount / pixels.length) * 100;
}
