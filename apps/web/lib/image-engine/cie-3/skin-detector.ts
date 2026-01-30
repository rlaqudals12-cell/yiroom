/**
 * CIE-3: 피부 감지 모듈
 *
 * @module lib/image-engine/cie-3/skin-detector
 * @description YCbCr 색공간 기반 피부 영역 감지
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */

import type { RGBImageData, SkinMask, RGB } from '../types';
import { rgbToYCbCr } from '../utils/color-space';
import { SKIN_DETECTION_YCBCR, DEFAULT_CIE_CONFIG } from '../constants';

/**
 * 피부 감지 설정 인터페이스
 */
export interface SkinDetectionConfig {
  cbMin: number;
  cbMax: number;
  crMin: number;
  crMax: number;
}

/**
 * 단일 픽셀이 피부인지 검사 (YCbCr 범위 기반)
 *
 * 피부 범위: Cb ∈ [77, 127], Cr ∈ [133, 173]
 *
 * @param rgb - RGB 값
 * @param config - 피부 감지 설정
 * @returns 피부 여부
 */
export function isSkinPixel(
  rgb: RGB,
  config: SkinDetectionConfig = SKIN_DETECTION_YCBCR
): boolean {
  const ycbcr = rgbToYCbCr(rgb);

  return (
    ycbcr.cb >= config.cbMin &&
    ycbcr.cb <= config.cbMax &&
    ycbcr.cr >= config.crMin &&
    ycbcr.cr <= config.crMax
  );
}

/**
 * 이미지에서 피부 마스크 생성
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - 피부 감지 설정
 * @returns 피부 마스크
 */
export function detectSkinMask(
  imageData: RGBImageData,
  config: SkinDetectionConfig = SKIN_DETECTION_YCBCR
): SkinMask {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;
  const mask = new Uint8Array(pixelCount);

  let skinPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    const rgb: RGB = {
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
    };

    if (isSkinPixel(rgb, config)) {
      mask[i] = 255;
      skinPixelCount++;
    } else {
      mask[i] = 0;
    }
  }

  return {
    mask,
    width,
    height,
    skinPixelCount,
    skinRatio: skinPixelCount / pixelCount,
  };
}

/**
 * 피부 영역의 평균 RGB 계산
 *
 * @param imageData - RGB 이미지 데이터
 * @param skinMask - 피부 마스크
 * @returns 피부 영역 평균 RGB 또는 null
 */
export function calculateSkinAverageRGB(
  imageData: RGBImageData,
  skinMask: SkinMask
): RGB | null {
  if (skinMask.skinPixelCount === 0) {
    return null;
  }

  const { data, channels } = imageData;
  const { mask, width, height } = skinMask;
  const pixelCount = width * height;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (mask[i] === 255) {
      const offset = i * channels;
      sumR += data[offset];
      sumG += data[offset + 1];
      sumB += data[offset + 2];
    }
  }

  return {
    r: Math.round(sumR / skinMask.skinPixelCount),
    g: Math.round(sumG / skinMask.skinPixelCount),
    b: Math.round(sumB / skinMask.skinPixelCount),
  };
}

/**
 * 비피부 영역의 평균 RGB 계산
 *
 * @param imageData - RGB 이미지 데이터
 * @param skinMask - 피부 마스크
 * @returns 비피부 영역 평균 RGB 또는 null
 */
export function calculateNonSkinAverageRGB(
  imageData: RGBImageData,
  skinMask: SkinMask
): RGB | null {
  const nonSkinCount = skinMask.width * skinMask.height - skinMask.skinPixelCount;

  if (nonSkinCount === 0) {
    return null;
  }

  const { data, channels } = imageData;
  const { mask, width, height } = skinMask;
  const pixelCount = width * height;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (mask[i] === 0) {
      const offset = i * channels;
      sumR += data[offset];
      sumG += data[offset + 1];
      sumB += data[offset + 2];
    }
  }

  return {
    r: Math.round(sumR / nonSkinCount),
    g: Math.round(sumG / nonSkinCount),
    b: Math.round(sumB / nonSkinCount),
  };
}

/**
 * 피부 감지가 충분한지 확인
 *
 * @param skinMask - 피부 마스크
 * @param minCoverage - 최소 커버리지 (0-1)
 * @returns 충분 여부
 */
export function hasSufficientSkinCoverage(
  skinMask: SkinMask,
  minCoverage = DEFAULT_CIE_CONFIG.cie3.minSkinCoverage
): boolean {
  return skinMask.skinRatio >= minCoverage;
}

/**
 * 피부 마스크 형태학적 정리 (노이즈 제거)
 *
 * 간단한 erosion + dilation
 *
 * @param skinMask - 원본 피부 마스크
 * @returns 정리된 피부 마스크
 */
export function cleanSkinMask(skinMask: SkinMask): SkinMask {
  const { mask, width, height } = skinMask;
  const tempMask = new Uint8Array(width * height);
  const cleanedMask = new Uint8Array(width * height);

  // Erosion (3x3 커널)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // 3x3 영역 모두 피부여야 유지
      let allSkin = true;
      for (let dy = -1; dy <= 1 && allSkin; dy++) {
        for (let dx = -1; dx <= 1 && allSkin; dx++) {
          if (mask[(y + dy) * width + (x + dx)] === 0) {
            allSkin = false;
          }
        }
      }

      tempMask[idx] = allSkin ? 255 : 0;
    }
  }

  // Dilation (3x3 커널)
  let newSkinCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // 3x3 영역 하나라도 피부면 확장
      let anySkin = false;
      for (let dy = -1; dy <= 1 && !anySkin; dy++) {
        for (let dx = -1; dx <= 1 && !anySkin; dx++) {
          if (tempMask[(y + dy) * width + (x + dx)] === 255) {
            anySkin = true;
          }
        }
      }

      cleanedMask[idx] = anySkin ? 255 : 0;
      if (anySkin) newSkinCount++;
    }
  }

  return {
    mask: cleanedMask,
    width,
    height,
    skinPixelCount: newSkinCount,
    skinRatio: newSkinCount / (width * height),
  };
}
