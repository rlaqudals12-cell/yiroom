/**
 * K-means 클러스터링 기반 색상 추출
 *
 * @module lib/color-classification/extract-colors
 * @description 이미지에서 대표 색상 추출
 * @see docs/adr/ADR-034-product-color-classification.md
 */

import type { RGBColor, ColorCluster, KMeansOptions } from './types';
import { rgbDistance } from './color-utils';

/** 기본 K-means 옵션 */
const DEFAULT_KMEANS_OPTIONS: Required<KMeansOptions> = {
  k: 5,
  iterations: 10,
  convergenceThreshold: 1,
};

/**
 * K-means++ 초기화
 * 더 나은 초기 중심점 선택
 */
function initializeCentroidsKMeansPlusPlus(pixels: RGBColor[], k: number): RGBColor[] {
  if (pixels.length === 0) {
    return [];
  }

  const centroids: RGBColor[] = [];

  // 첫 번째 중심점: 무작위 선택
  const firstIndex = Math.floor(Math.random() * pixels.length);
  centroids.push({ ...pixels[firstIndex] });

  // 나머지 중심점: 거리 기반 확률적 선택
  for (let i = 1; i < k; i++) {
    const distances: number[] = pixels.map((pixel) => {
      // 가장 가까운 기존 중심점과의 거리
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = rgbDistance(pixel, centroid);
        if (dist < minDist) {
          minDist = dist;
        }
      }
      return minDist * minDist; // 거리 제곱
    });

    // 거리에 비례한 확률로 선택
    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let randomValue = Math.random() * totalDist;

    for (let j = 0; j < pixels.length; j++) {
      randomValue -= distances[j];
      if (randomValue <= 0) {
        centroids.push({ ...pixels[j] });
        break;
      }
    }

    // fallback: 마지막 픽셀 선택
    if (centroids.length === i) {
      centroids.push({ ...pixels[pixels.length - 1] });
    }
  }

  return centroids;
}

/**
 * 픽셀을 가장 가까운 클러스터에 할당
 */
function assignPixelsToClusters(
  pixels: RGBColor[],
  centroids: RGBColor[]
): number[] {
  return pixels.map((pixel) => {
    let minDist = Infinity;
    let closestCluster = 0;

    for (let i = 0; i < centroids.length; i++) {
      const dist = rgbDistance(pixel, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        closestCluster = i;
      }
    }

    return closestCluster;
  });
}

/**
 * 클러스터 중심점 업데이트
 */
function updateCentroids(
  pixels: RGBColor[],
  assignments: number[],
  k: number
): RGBColor[] {
  const sums: { r: number; g: number; b: number; count: number }[] = Array(k)
    .fill(null)
    .map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

  for (let i = 0; i < pixels.length; i++) {
    const cluster = assignments[i];
    sums[cluster].r += pixels[i].r;
    sums[cluster].g += pixels[i].g;
    sums[cluster].b += pixels[i].b;
    sums[cluster].count += 1;
  }

  return sums.map((sum) => {
    if (sum.count === 0) {
      // 빈 클러스터: 랜덤 픽셀로 재초기화
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      return { ...randomPixel };
    }
    return {
      r: Math.round(sum.r / sum.count),
      g: Math.round(sum.g / sum.count),
      b: Math.round(sum.b / sum.count),
    };
  });
}

/**
 * 중심점 수렴 확인
 */
function hasConverged(
  oldCentroids: RGBColor[],
  newCentroids: RGBColor[],
  threshold: number
): boolean {
  for (let i = 0; i < oldCentroids.length; i++) {
    if (rgbDistance(oldCentroids[i], newCentroids[i]) > threshold) {
      return false;
    }
  }
  return true;
}

/**
 * K-means 클러스터링 수행
 *
 * @param pixels - RGB 픽셀 배열
 * @param options - K-means 옵션
 * @returns 색상 클러스터 배열
 */
export function kMeansClustering(
  pixels: RGBColor[],
  options: KMeansOptions = {}
): ColorCluster[] {
  const { k, iterations, convergenceThreshold } = {
    ...DEFAULT_KMEANS_OPTIONS,
    ...options,
  };

  if (pixels.length === 0) {
    return [];
  }

  if (pixels.length <= k) {
    // 픽셀 수가 k 이하면 각 픽셀이 하나의 클러스터
    return pixels.map((pixel, index) => ({
      centroid: { ...pixel },
      count: 1,
      percentage: 100 / pixels.length,
    }));
  }

  // K-means++ 초기화
  let centroids = initializeCentroidsKMeansPlusPlus(pixels, k);
  let assignments: number[] = [];

  // 반복 수행
  for (let iter = 0; iter < iterations; iter++) {
    // 픽셀 할당
    assignments = assignPixelsToClusters(pixels, centroids);

    // 중심점 업데이트
    const newCentroids = updateCentroids(pixels, assignments, k);

    // 수렴 확인
    if (hasConverged(centroids, newCentroids, convergenceThreshold)) {
      centroids = newCentroids;
      break;
    }

    centroids = newCentroids;
  }

  // 클러스터 통계 계산
  const clusterCounts = new Array(k).fill(0);
  for (const assignment of assignments) {
    clusterCounts[assignment]++;
  }

  const totalPixels = pixels.length;

  return centroids.map((centroid, index) => ({
    centroid,
    count: clusterCounts[index],
    percentage: (clusterCounts[index] / totalPixels) * 100,
  }));
}

/**
 * 이미지 데이터에서 픽셀 배열 추출
 *
 * @param imageData - Canvas ImageData
 * @param sampleRate - 샘플링 비율 (1 = 모든 픽셀, 2 = 2픽셀마다 1개)
 * @returns RGB 픽셀 배열
 */
export function extractPixelsFromImageData(
  imageData: ImageData,
  sampleRate: number = 1
): RGBColor[] {
  const pixels: RGBColor[] = [];
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // 투명 픽셀 제외
    if (a > 128) {
      pixels.push({ r, g, b });
    }
  }

  return pixels;
}

/**
 * URL에서 이미지 로드 및 픽셀 추출 (브라우저 환경)
 *
 * @param imageUrl - 이미지 URL
 * @param maxSize - 최대 크기 (성능 최적화)
 * @returns RGB 픽셀 배열
 */
export async function loadImagePixels(
  imageUrl: string,
  maxSize: number = 256
): Promise<RGBColor[]> {
  // 브라우저 환경 확인
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('loadImagePixels requires browser environment');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = (): void => {
      // 리사이즈 계산
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      // Canvas에 그리기
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // 픽셀 데이터 추출
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = extractPixelsFromImageData(imageData, 1);

      resolve(pixels);
    };

    img.onerror = (): void => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}
