/**
 * RGB → Lab 색공간 변환 (SSOT 위임)
 *
 * 모든 색공간 변환 구현은 lib/color/ 통합 모듈에 위치.
 * 이 파일은 하위 호환을 위한 re-export 래퍼.
 *
 * @module lib/oral-health/internal/lab-converter
 * @deprecated 직접 @/lib/color 에서 import 권장
 * @see lib/color/conversions.ts
 */

import type { LabColor, RGBColor } from '@/lib/color';
import { rgbToLab as _rgbToLab, labToRgb, labToHex } from '@/lib/color';

// re-export: 기존 import 경로와의 하위 호환
export { labToRgb, labToHex };

/**
 * RGB → Lab 변환
 *
 * @param rgb - RGB 색상 (0-255)
 * @returns Lab 색상
 *
 * @example
 * const lab = rgbToLab({ r: 255, g: 255, b: 255 });
 * // { L: 100, a: 0, b: 0 } (순수 흰색)
 */
export function rgbToLab(rgb: RGBColor): LabColor {
  return _rgbToLab(rgb);
}

/**
 * 이미지 픽셀에서 평균 Lab 값 계산
 *
 * 이 함수는 lib/color에 없는 고유 함수이므로 로컬에 유지
 */
export function calculateAverageLabFromPixels(pixels: RGBColor[]): LabColor {
  if (pixels.length === 0) {
    return { L: 0, a: 0, b: 0 };
  }

  let sumL = 0;
  let sumA = 0;
  let sumB = 0;

  for (const pixel of pixels) {
    const lab = rgbToLab(pixel);
    sumL += lab.L;
    sumA += lab.a;
    sumB += lab.b;
  }

  const count = pixels.length;
  return {
    L: sumL / count,
    a: sumA / count,
    b: sumB / count,
  };
}
