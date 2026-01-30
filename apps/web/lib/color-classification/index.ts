/**
 * 상품 색상 자동 분류 시스템
 *
 * @module lib/color-classification
 * @description K-means 클러스터링 + Lab 색공간 기반 상품 색상 분류
 * @see docs/adr/ADR-034-product-color-classification.md
 * @see docs/principles/color-science.md
 *
 * @example
 * import { classifyProductColor } from '@/lib/color-classification';
 *
 * const result = await classifyProductColor(imageUrl);
 * console.log(result.tone); // 'warm' | 'cool' | 'neutral'
 * console.log(result.seasonMatch.spring); // 0-100
 */

// 타입 내보내기
export type {
  RGBColor,
  LabColor,
  Tone,
  Season,
  ExtractedColor,
  ColorCluster,
  SeasonMatchScores,
  ColorClassificationResult,
  KMeansOptions,
  ColorExtractionOptions,
  BackgroundFilterOptions,
} from './types';

export { SEASON_LAB_RANGES, TONE_THRESHOLDS } from './types';

// 색상 변환 유틸리티
export {
  rgbToLab,
  labToRgb,
  rgbToHex,
  hexToRgb,
  labDistanceCIE76,
  rgbDistance,
  getChroma,
  getHue,
} from './color-utils';

// K-means 클러스터링
export {
  kMeansClustering,
  extractPixelsFromImageData,
  loadImagePixels,
} from './extract-colors';

// 배경 필터링
export {
  isBackgroundColor,
  filterBackgroundColors,
  filterBackgroundClusters,
  recalculatePercentages,
  calculateBackgroundRatio,
} from './background-filter';

// 톤 분류
export {
  classifyTone,
  classifyToneWithConfidence,
  calculateWarmRatio,
  getToneDescription,
  getToneRecommendation,
} from './tone-classifier';

// 시즌 매칭
export {
  calculateSeasonMatch,
  getBestSeasonMatch,
  calculateUserSeasonMatch,
  getMatchGrade,
  getSeasonDescription,
  getSeasonCompatibility,
  SEASON_COMPATIBILITY,
} from './season-matcher';

import type {
  RGBColor,
  ColorClassificationResult,
  ColorExtractionOptions,
  ExtractedColor,
} from './types';
import { rgbToLab, rgbToHex } from './color-utils';
import { kMeansClustering, loadImagePixels } from './extract-colors';
import {
  filterBackgroundColors,
  filterBackgroundClusters,
  recalculatePercentages,
} from './background-filter';
import { classifyToneWithConfidence } from './tone-classifier';
import { calculateSeasonMatch } from './season-matcher';

/** 기본 색상 추출 옵션 */
const DEFAULT_EXTRACTION_OPTIONS: Required<ColorExtractionOptions> = {
  maxSize: 256,
  filterBackground: true,
  kMeans: {
    k: 5,
    iterations: 10,
    convergenceThreshold: 1,
  },
};

/**
 * 상품 이미지에서 색상 추출 및 분류
 *
 * @param imageUrl - 이미지 URL
 * @param options - 추출 옵션
 * @returns 색상 분류 결과
 *
 * @example
 * const result = await classifyProductColor('https://example.com/product.jpg');
 *
 * if (result.seasonMatch.spring >= 80) {
 *   console.log('봄 타입에게 추천!');
 * }
 */
export async function classifyProductColor(
  imageUrl: string,
  options: ColorExtractionOptions = {}
): Promise<ColorClassificationResult> {
  const opts = {
    ...DEFAULT_EXTRACTION_OPTIONS,
    ...options,
    kMeans: {
      ...DEFAULT_EXTRACTION_OPTIONS.kMeans,
      ...options.kMeans,
    },
  };

  // 1. 이미지 로드 및 픽셀 추출
  let pixels = await loadImagePixels(imageUrl, opts.maxSize);

  // 2. 배경색 필터링
  if (opts.filterBackground) {
    pixels = filterBackgroundColors(pixels);
  }

  // 픽셀이 없으면 기본값 반환
  if (pixels.length === 0) {
    return createDefaultResult();
  }

  // 3. K-means 클러스터링
  let clusters = kMeansClustering(pixels, opts.kMeans);

  // 4. 배경색 클러스터 제외 및 비율 재계산
  if (opts.filterBackground) {
    clusters = filterBackgroundClusters(clusters);
    clusters = recalculatePercentages(clusters);
  }

  if (clusters.length === 0) {
    return createDefaultResult();
  }

  // 5. 비율 순으로 정렬
  clusters.sort((a, b) => b.percentage - a.percentage);

  // 6. 대표색 선택
  const dominantCluster = clusters[0];

  // 7. RGB → Lab 변환
  const dominantLab = rgbToLab(dominantCluster.centroid);

  // 8. 톤 분류
  const { tone, confidence: toneConfidence } = classifyToneWithConfidence(dominantLab);

  // 9. 시즌 매칭
  const seasonMatch = calculateSeasonMatch(dominantLab);

  // 10. 팔레트 생성
  const palette: ExtractedColor[] = clusters.slice(0, 5).map((cluster) => {
    const lab = rgbToLab(cluster.centroid);
    return {
      rgb: cluster.centroid,
      lab,
      percentage: cluster.percentage,
      hex: rgbToHex(cluster.centroid),
    };
  });

  // 11. 신뢰도 계산
  const confidence = calculateOverallConfidence(palette, toneConfidence);

  return {
    dominantColor: {
      rgb: dominantCluster.centroid,
      lab: dominantLab,
      percentage: dominantCluster.percentage,
      hex: rgbToHex(dominantCluster.centroid),
    },
    palette,
    tone,
    seasonMatch,
    confidence,
  };
}

/**
 * 픽셀 배열에서 직접 색상 분류 (Canvas 데이터용)
 *
 * @param pixels - RGB 픽셀 배열
 * @param options - 추출 옵션
 * @returns 색상 분류 결과
 */
export function classifyFromPixels(
  pixels: RGBColor[],
  options: ColorExtractionOptions = {}
): ColorClassificationResult {
  const opts = {
    ...DEFAULT_EXTRACTION_OPTIONS,
    ...options,
    kMeans: {
      ...DEFAULT_EXTRACTION_OPTIONS.kMeans,
      ...options.kMeans,
    },
  };

  // 배경색 필터링
  let filteredPixels = pixels;
  if (opts.filterBackground) {
    filteredPixels = filterBackgroundColors(pixels);
  }

  if (filteredPixels.length === 0) {
    return createDefaultResult();
  }

  // K-means 클러스터링
  let clusters = kMeansClustering(filteredPixels, opts.kMeans);

  if (opts.filterBackground) {
    clusters = filterBackgroundClusters(clusters);
    clusters = recalculatePercentages(clusters);
  }

  if (clusters.length === 0) {
    return createDefaultResult();
  }

  clusters.sort((a, b) => b.percentage - a.percentage);

  const dominantCluster = clusters[0];
  const dominantLab = rgbToLab(dominantCluster.centroid);
  const { tone, confidence: toneConfidence } = classifyToneWithConfidence(dominantLab);
  const seasonMatch = calculateSeasonMatch(dominantLab);

  const palette: ExtractedColor[] = clusters.slice(0, 5).map((cluster) => {
    const lab = rgbToLab(cluster.centroid);
    return {
      rgb: cluster.centroid,
      lab,
      percentage: cluster.percentage,
      hex: rgbToHex(cluster.centroid),
    };
  });

  const confidence = calculateOverallConfidence(palette, toneConfidence);

  return {
    dominantColor: {
      rgb: dominantCluster.centroid,
      lab: dominantLab,
      percentage: dominantCluster.percentage,
      hex: rgbToHex(dominantCluster.centroid),
    },
    palette,
    tone,
    seasonMatch,
    confidence,
  };
}

/**
 * 전체 신뢰도 계산
 */
function calculateOverallConfidence(
  palette: ExtractedColor[],
  toneConfidence: number
): number {
  // 대표색 비율이 높을수록 신뢰도 높음
  const dominantRatio = palette[0]?.percentage ?? 0;
  const ratioScore = Math.min(100, dominantRatio * 2);

  // 팔레트 다양성 (너무 다양하면 신뢰도 낮음)
  const diversityPenalty = palette.length > 3 ? (palette.length - 3) * 5 : 0;

  // 톤 분류 신뢰도 가중치
  const finalConfidence = Math.round(
    ratioScore * 0.4 + toneConfidence * 0.6 - diversityPenalty
  );

  return Math.max(0, Math.min(100, finalConfidence));
}

/**
 * 기본 결과 생성 (픽셀 없을 때)
 */
function createDefaultResult(): ColorClassificationResult {
  return {
    dominantColor: {
      rgb: { r: 128, g: 128, b: 128 },
      lab: { L: 53.59, a: 0, b: 0 },
      percentage: 100,
      hex: '#808080',
    },
    palette: [],
    tone: 'neutral',
    seasonMatch: {
      spring: 50,
      summer: 50,
      autumn: 50,
      winter: 50,
    },
    confidence: 0,
  };
}
