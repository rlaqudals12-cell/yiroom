/**
 * 그레이스케일 변환 유틸리티
 *
 * @module lib/image-engine/utils/grayscale
 * @description ITU-R BT.601/BT.709 기반 그레이스케일 변환
 * @see docs/principles/image-processing.md
 */

import type { RGBImageData, GrayscaleImageData } from '../types';
import { GRAYSCALE_WEIGHTS, GRAYSCALE_WEIGHTS_BT709 } from '../constants';

/**
 * RGB 이미지를 그레이스케일로 변환 (BT.601)
 *
 * Y = 0.299R + 0.587G + 0.114B
 *
 * @param imageData - RGB 이미지 데이터
 * @returns 그레이스케일 이미지 데이터
 */
export function toGrayscale(imageData: RGBImageData): GrayscaleImageData {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;
  const grayData = new Uint8Array(pixelCount);

  const { r: wr, g: wg, b: wb } = GRAYSCALE_WEIGHTS;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    // ITU-R BT.601 공식
    grayData[i] = Math.round(wr * r + wg * g + wb * b);
  }

  return {
    data: grayData,
    width,
    height,
  };
}

/**
 * RGB 이미지를 그레이스케일로 변환 (BT.709 - HD 비디오용)
 *
 * Y = 0.2126R + 0.7152G + 0.0722B
 *
 * @param imageData - RGB 이미지 데이터
 * @returns 그레이스케일 이미지 데이터
 */
export function toGrayscaleBT709(imageData: RGBImageData): GrayscaleImageData {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;
  const grayData = new Uint8Array(pixelCount);

  const { r: wr, g: wg, b: wb } = GRAYSCALE_WEIGHTS_BT709;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    // ITU-R BT.709 공식
    grayData[i] = Math.round(wr * r + wg * g + wb * b);
  }

  return {
    data: grayData,
    width,
    height,
  };
}

/**
 * 그레이스케일 이미지의 평균 밝기 계산
 *
 * @param grayData - 그레이스케일 이미지 데이터
 * @returns 평균 밝기 (0-255)
 */
export function calculateMeanBrightness(grayData: GrayscaleImageData): number {
  const { data } = grayData;
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }

  return sum / data.length;
}

/**
 * 그레이스케일 이미지의 표준편차 계산
 *
 * @param grayData - 그레이스케일 이미지 데이터
 * @param mean - 미리 계산된 평균값 (옵션)
 * @returns 표준편차
 */
export function calculateStdDev(
  grayData: GrayscaleImageData,
  mean?: number
): number {
  const { data } = grayData;
  const avgBrightness = mean ?? calculateMeanBrightness(grayData);

  let sumSquaredDiff = 0;
  for (let i = 0; i < data.length; i++) {
    const diff = data[i] - avgBrightness;
    sumSquaredDiff += diff * diff;
  }

  return Math.sqrt(sumSquaredDiff / data.length);
}

/**
 * 그레이스케일 히스토그램 생성
 *
 * @param grayData - 그레이스케일 이미지 데이터
 * @returns 256개 bin의 히스토그램
 */
export function calculateHistogram(grayData: GrayscaleImageData): number[] {
  const histogram = new Array(256).fill(0);
  const { data } = grayData;

  for (let i = 0; i < data.length; i++) {
    histogram[data[i]]++;
  }

  return histogram;
}

/**
 * 히스토그램 정규화 (0-1 범위)
 *
 * @param histogram - 256개 bin의 히스토그램
 * @param pixelCount - 총 픽셀 수
 * @returns 정규화된 히스토그램
 */
export function normalizeHistogram(
  histogram: number[],
  pixelCount: number
): number[] {
  return histogram.map((count) => count / pixelCount);
}

/**
 * 특정 영역의 그레이스케일 추출
 *
 * @param grayData - 전체 그레이스케일 이미지
 * @param x - 시작 x 좌표
 * @param y - 시작 y 좌표
 * @param regionWidth - 영역 너비
 * @param regionHeight - 영역 높이
 * @returns 영역의 그레이스케일 데이터
 */
export function extractRegion(
  grayData: GrayscaleImageData,
  x: number,
  y: number,
  regionWidth: number,
  regionHeight: number
): GrayscaleImageData {
  const { data, width, height } = grayData;

  // 경계 체크
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(width, startX + Math.floor(regionWidth));
  const endY = Math.min(height, startY + Math.floor(regionHeight));

  const actualWidth = endX - startX;
  const actualHeight = endY - startY;
  const regionData = new Uint8Array(actualWidth * actualHeight);

  let idx = 0;
  for (let row = startY; row < endY; row++) {
    for (let col = startX; col < endX; col++) {
      regionData[idx++] = data[row * width + col];
    }
  }

  return {
    data: regionData,
    width: actualWidth,
    height: actualHeight,
  };
}

/**
 * ImageData (Canvas API)에서 RGBImageData로 변환
 *
 * @param imageData - Canvas ImageData
 * @returns RGBImageData
 */
export function fromCanvasImageData(imageData: ImageData): RGBImageData {
  return {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height,
    channels: 4, // Canvas ImageData는 항상 RGBA
  };
}

/**
 * Base64 이미지 데이터에서 RGBImageData 추출
 * (브라우저 환경에서만 동작)
 *
 * @param base64 - Base64 인코딩된 이미지
 * @returns RGBImageData를 반환하는 Promise
 */
export async function fromBase64(base64: string): Promise<RGBImageData> {
  // 브라우저 환경 체크
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('fromBase64 requires browser environment');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      resolve(fromCanvasImageData(imageData));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = base64;
  });
}
