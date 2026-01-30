/**
 * RGB → Lab 색공간 변환
 *
 * @module lib/oral-health/internal/lab-converter
 * @description sRGB → XYZ → Lab 변환 (D65 조명)
 * @see docs/principles/oral-health.md
 */

import type { LabColor, RGBColor } from '@/types/oral-health';

/**
 * D65 표준 조명 참조값
 */
const D65_REFERENCE = {
  xn: 0.95047,
  yn: 1.00000,
  zn: 1.08883,
} as const;

/**
 * sRGB → XYZ 변환 행렬
 */
const RGB_TO_XYZ_MATRIX = {
  rx: 0.4124564, ry: 0.3575761, rz: 0.1804375,
  gx: 0.2126729, gy: 0.7151522, gz: 0.0721750,
  bx: 0.0193339, by: 0.1191920, bz: 0.9503041,
} as const;

/**
 * sRGB 감마 보정 역변환 (linear RGB)
 */
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Lab 함수 (CIE 표준)
 */
function labF(t: number): number {
  const delta = 6 / 29;
  const delta3 = Math.pow(delta, 3);
  return t > delta3
    ? Math.pow(t, 1 / 3)
    : t / (3 * delta * delta) + 4 / 29;
}

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
  // Step 1: sRGB → Linear RGB
  const rLin = srgbToLinear(rgb.r);
  const gLin = srgbToLinear(rgb.g);
  const bLin = srgbToLinear(rgb.b);

  // Step 2: Linear RGB → XYZ
  const x = RGB_TO_XYZ_MATRIX.rx * rLin + RGB_TO_XYZ_MATRIX.ry * gLin + RGB_TO_XYZ_MATRIX.rz * bLin;
  const y = RGB_TO_XYZ_MATRIX.gx * rLin + RGB_TO_XYZ_MATRIX.gy * gLin + RGB_TO_XYZ_MATRIX.gz * bLin;
  const z = RGB_TO_XYZ_MATRIX.bx * rLin + RGB_TO_XYZ_MATRIX.by * gLin + RGB_TO_XYZ_MATRIX.bz * bLin;

  // Step 3: XYZ → Lab
  const fx = labF(x / D65_REFERENCE.xn);
  const fy = labF(y / D65_REFERENCE.yn);
  const fz = labF(z / D65_REFERENCE.zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
}

/**
 * Lab → RGB 역변환 (근사값)
 * 주의: 색공간 범위 벗어날 수 있음, 클리핑 적용
 */
export function labToRgb(lab: LabColor): RGBColor {
  // Lab → XYZ
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const delta = 6 / 29;
  const delta3 = Math.pow(delta, 3);

  const xr = fx * fx * fx > delta3 ? fx * fx * fx : (fx - 4 / 29) * 3 * delta * delta;
  const yr = lab.L > 8 ? fy * fy * fy : lab.L / 903.3;
  const zr = fz * fz * fz > delta3 ? fz * fz * fz : (fz - 4 / 29) * 3 * delta * delta;

  const x = xr * D65_REFERENCE.xn;
  const y = yr * D65_REFERENCE.yn;
  const z = zr * D65_REFERENCE.zn;

  // XYZ → Linear RGB
  const rLin = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gLin = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const bLin = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  // Linear RGB → sRGB
  const linearToSrgb = (c: number): number => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(linearToSrgb(rLin) * 255),
    g: Math.round(linearToSrgb(gLin) * 255),
    b: Math.round(linearToSrgb(bLin) * 255),
  };
}

/**
 * Lab 색상을 CSS 색상 문자열로 변환
 */
export function labToHex(lab: LabColor): string {
  const rgb = labToRgb(lab);
  const toHex = (c: number) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * 이미지 픽셀에서 평균 Lab 값 계산
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
