/**
 * 색상 변환 유틸리티
 *
 * @module lib/color-classification/color-utils
 * @description RGB ↔ XYZ ↔ Lab 변환
 * @see docs/principles/color-science.md
 */

import type { RGBColor, LabColor } from './types';

/** D65 표준광 기준 백색점 */
const D65_WHITE_POINT = {
  X: 95.047,
  Y: 100.0,
  Z: 108.883,
} as const;

/** XYZ 색공간 (내부 변환용) */
interface XYZColor {
  X: number;
  Y: number;
  Z: number;
}

/**
 * sRGB 감마 보정 해제 (선형화)
 */
function srgbToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Linear RGB → sRGB 감마 보정
 */
function linearToSrgb(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/**
 * RGB → XYZ 변환 (D65 기준)
 */
function rgbToXyz(rgb: RGBColor): XYZColor {
  const linearR = srgbToLinear(rgb.r);
  const linearG = srgbToLinear(rgb.g);
  const linearB = srgbToLinear(rgb.b);

  return {
    X: (linearR * 0.4124564 + linearG * 0.3575761 + linearB * 0.1804375) * 100,
    Y: (linearR * 0.2126729 + linearG * 0.7151522 + linearB * 0.072175) * 100,
    Z: (linearR * 0.0193339 + linearG * 0.119192 + linearB * 0.9503041) * 100,
  };
}

/**
 * XYZ → RGB 변환 (D65 기준)
 */
function xyzToRgb(xyz: XYZColor): RGBColor {
  const x = xyz.X / 100;
  const y = xyz.Y / 100;
  const z = xyz.Z / 100;

  const linearR = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const linearG = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const linearB = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return {
    r: Math.round(Math.max(0, Math.min(255, linearToSrgb(linearR) * 255))),
    g: Math.round(Math.max(0, Math.min(255, linearToSrgb(linearG) * 255))),
    b: Math.round(Math.max(0, Math.min(255, linearToSrgb(linearB) * 255))),
  };
}

/**
 * XYZ → Lab 변환 보조 함수
 */
function xyzToLabHelper(t: number): number {
  const delta = 6 / 29;
  const deltaCubed = delta * delta * delta;

  return t > deltaCubed ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

/**
 * Lab → XYZ 변환 보조 함수
 */
function labToXyzHelper(t: number): number {
  const delta = 6 / 29;

  return t > delta ? t * t * t : 3 * delta * delta * (t - 4 / 29);
}

/**
 * XYZ → Lab 변환 (D65 기준)
 */
function xyzToLab(xyz: XYZColor): LabColor {
  const xn = xyz.X / D65_WHITE_POINT.X;
  const yn = xyz.Y / D65_WHITE_POINT.Y;
  const zn = xyz.Z / D65_WHITE_POINT.Z;

  const fx = xyzToLabHelper(xn);
  const fy = xyzToLabHelper(yn);
  const fz = xyzToLabHelper(zn);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * Lab → XYZ 변환 (D65 기준)
 */
function labToXyz(lab: LabColor): XYZColor {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  return {
    X: D65_WHITE_POINT.X * labToXyzHelper(fx),
    Y: D65_WHITE_POINT.Y * labToXyzHelper(fy),
    Z: D65_WHITE_POINT.Z * labToXyzHelper(fz),
  };
}

/**
 * RGB → Lab 변환
 */
export function rgbToLab(rgb: RGBColor): LabColor {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * Lab → RGB 변환
 */
export function labToRgb(lab: LabColor): RGBColor {
  return xyzToRgb(labToXyz(lab));
}

/**
 * RGB → Hex 변환
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Hex → RGB 변환
 */
export function hexToRgb(hex: string): RGBColor {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

/**
 * Lab 색상 거리 계산 (CIE76 - 유클리드)
 */
export function labDistanceCIE76(lab1: LabColor, lab2: LabColor): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * RGB 색상 거리 계산
 */
export function rgbDistance(rgb1: RGBColor, rgb2: RGBColor): number {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Lab에서 Chroma (채도) 계산
 */
export function getChroma(lab: LabColor): number {
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b);
}

/**
 * Lab에서 Hue angle 계산 (도 단위)
 */
export function getHue(lab: LabColor): number {
  const hue = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  return hue < 0 ? hue + 360 : hue;
}
