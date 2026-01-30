/**
 * CIE-3: AWB 알고리즘 모듈
 *
 * @module lib/image-engine/cie-3/awb-algorithms
 * @description Gray World, Von Kries, Skin-Aware AWB 알고리즘
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */

import type { RGBImageData, RGB, AWBGains, SkinMask } from '../types';
import { vonKriesAdaptation, rgbToXYZ } from '../utils/color-space';
import { calculateNonSkinAverageRGB } from './skin-detector';

/**
 * Gray World 알고리즘으로 게인 계산
 *
 * 가정: 평균 색상이 회색(128, 128, 128)이어야 함
 *
 * @param avgRGB - 이미지 평균 RGB
 * @returns AWB 게인
 */
export function calculateGrayWorldGains(avgRGB: RGB): AWBGains {
  const targetGray = 128;

  return {
    r: targetGray / Math.max(1, avgRGB.r),
    g: targetGray / Math.max(1, avgRGB.g),
    b: targetGray / Math.max(1, avgRGB.b),
  };
}

/**
 * Gray World 알고리즘으로 AWB 보정
 *
 * @param imageData - RGB 이미지 데이터
 * @param avgRGB - 이미지 평균 RGB (미리 계산된 값)
 * @returns 보정된 RGB 이미지 데이터
 */
export function applyGrayWorld(
  imageData: RGBImageData,
  avgRGB: RGB
): RGBImageData {
  const { data, width, height, channels } = imageData;
  const gains = calculateGrayWorldGains(avgRGB);
  const pixelCount = width * height;
  const correctedData = new Uint8Array(data.length);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;

    correctedData[offset] = Math.min(255, Math.round(data[offset] * gains.r));
    correctedData[offset + 1] = Math.min(255, Math.round(data[offset + 1] * gains.g));
    correctedData[offset + 2] = Math.min(255, Math.round(data[offset + 2] * gains.b));

    // Alpha 채널 복사 (있는 경우)
    if (channels === 4) {
      correctedData[offset + 3] = data[offset + 3];
    }
  }

  return {
    data: correctedData,
    width,
    height,
    channels,
  };
}

/**
 * Von Kries 색순응 알고리즘으로 AWB 보정
 *
 * @param imageData - RGB 이미지 데이터
 * @param sourceWhiteRGB - 소스 화이트 포인트 RGB
 * @returns 보정된 RGB 이미지 데이터
 */
export function applyVonKries(
  imageData: RGBImageData,
  sourceWhiteRGB: RGB
): RGBImageData {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;
  const correctedData = new Uint8Array(data.length);

  // 소스 화이트 포인트의 XYZ
  const sourceWhiteXYZ = rgbToXYZ(sourceWhiteRGB);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;

    const originalRGB: RGB = {
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
    };

    // Von Kries 색순응 적용
    const correctedRGB = vonKriesAdaptation(originalRGB, sourceWhiteXYZ);

    correctedData[offset] = correctedRGB.r;
    correctedData[offset + 1] = correctedRGB.g;
    correctedData[offset + 2] = correctedRGB.b;

    // Alpha 채널 복사
    if (channels === 4) {
      correctedData[offset + 3] = data[offset + 3];
    }
  }

  return {
    data: correctedData,
    width,
    height,
    channels,
  };
}

/**
 * 피부 인식 AWB (Skin-Aware)
 *
 * 비피부 영역의 평균을 화이트 포인트로 사용
 *
 * @param imageData - RGB 이미지 데이터
 * @param skinMask - 피부 마스크
 * @returns 보정된 RGB 이미지 데이터 또는 null (비피부 영역 부족 시)
 */
export function applySkinAwareAWB(
  imageData: RGBImageData,
  skinMask: SkinMask
): RGBImageData | null {
  // 비피부 영역의 평균 RGB
  const nonSkinAvgRGB = calculateNonSkinAverageRGB(imageData, skinMask);

  if (!nonSkinAvgRGB) {
    return null; // 비피부 영역이 없음
  }

  // 비피부 영역의 평균이 충분히 밝은지 확인
  const avgBrightness = (nonSkinAvgRGB.r + nonSkinAvgRGB.g + nonSkinAvgRGB.b) / 3;
  if (avgBrightness < 50) {
    return null; // 너무 어두움
  }

  // Gray World 적용 (비피부 영역 기준)
  return applyGrayWorld(imageData, nonSkinAvgRGB);
}

/**
 * 게인 값을 이미지에 적용
 *
 * @param imageData - RGB 이미지 데이터
 * @param gains - AWB 게인
 * @returns 보정된 RGB 이미지 데이터
 */
export function applyGains(imageData: RGBImageData, gains: AWBGains): RGBImageData {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;
  const correctedData = new Uint8Array(data.length);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;

    correctedData[offset] = Math.min(255, Math.round(data[offset] * gains.r));
    correctedData[offset + 1] = Math.min(255, Math.round(data[offset + 1] * gains.g));
    correctedData[offset + 2] = Math.min(255, Math.round(data[offset + 2] * gains.b));

    if (channels === 4) {
      correctedData[offset + 3] = data[offset + 3];
    }
  }

  return {
    data: correctedData,
    width,
    height,
    channels,
  };
}

/**
 * 보정 전후 게인 계산
 *
 * @param originalAvgRGB - 원본 평균 RGB
 * @param correctedAvgRGB - 보정 후 평균 RGB
 * @returns 적용된 게인
 */
export function calculateAppliedGains(
  originalAvgRGB: RGB,
  correctedAvgRGB: RGB
): AWBGains {
  return {
    r: correctedAvgRGB.r / Math.max(1, originalAvgRGB.r),
    g: correctedAvgRGB.g / Math.max(1, originalAvgRGB.g),
    b: correctedAvgRGB.b / Math.max(1, originalAvgRGB.b),
  };
}

/**
 * 게인이 유효한 범위인지 확인
 *
 * 극단적인 게인은 이미지를 손상시킬 수 있음
 * SDD-CIE-3 스펙 기준: 0.7 ~ 1.5 범위
 *
 * @param gains - AWB 게인
 * @param minGain - 최소 허용 게인 (기본값: 0.7)
 * @param maxGain - 최대 허용 게인 (기본값: 1.5)
 * @returns 유효 여부
 */
export function isValidGains(
  gains: AWBGains,
  minGain = 0.7,
  maxGain = 1.5
): boolean {
  return (
    gains.r >= minGain && gains.r <= maxGain &&
    gains.g >= minGain && gains.g <= maxGain &&
    gains.b >= minGain && gains.b <= maxGain
  );
}
