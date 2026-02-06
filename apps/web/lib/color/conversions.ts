/**
 * 색공간 변환 통합 모듈
 *
 * RGB ↔ XYZ ↔ Lab 변환, HEX 변환, 파생 지표 계산
 * 7개 독립 구현을 CIE 15:2004 정밀 상수 기반으로 통합
 *
 * @module lib/color/conversions
 * @see docs/principles/color-science.md
 * @see docs/adr/ADR-066-ssot-consolidation-strategy.md
 */

import type { LabColor, RGBColor, XYZColor, LabDerivedMetrics } from './types';
import { D65_WHITE, LAB_CONSTANTS, SRGB_XYZ_MATRIX } from './types';

// =============================================================================
// sRGB 감마 변환
// =============================================================================

/**
 * sRGB 감마 보정 해제 (sRGB → Linear RGB)
 *
 * @param c - sRGB 채널 값 (0-255)
 * @returns Linear RGB 값 (0-1)
 */
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Linear RGB → sRGB 감마 적용
 *
 * @param c - Linear RGB 값 (0-1)
 * @returns sRGB 채널 값 (0-255)
 */
function linearToSrgb(c: number): number {
  const srgb = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, srgb * 255)));
}

// =============================================================================
// XYZ ↔ Lab 보조 함수
// =============================================================================

/** XYZ → Lab f 함수 (CIE 표준) */
function labF(t: number): number {
  const { epsilon, kappa } = LAB_CONSTANTS;
  return t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116;
}

/** Lab → XYZ 역함수 */
function labFInverse(t: number): number {
  const { epsilon, kappa } = LAB_CONSTANTS;
  const t3 = t * t * t;
  return t3 > epsilon ? t3 : (116 * t - 16) / kappa;
}

// =============================================================================
// RGB ↔ XYZ 변환
// =============================================================================

/**
 * RGB → XYZ 변환 (D65 기준, 정규화 스케일)
 *
 * XYZ 값은 D65 백색점 기준 정규화 (Y=1.0)
 *
 * @param r - Red 채널 (0-255)
 * @param g - Green 채널 (0-255)
 * @param b - Blue 채널 (0-255)
 * @returns XYZ 색상값
 */
export function rgbToXyz(r: number, g: number, b: number): XYZColor;
export function rgbToXyz(rgb: RGBColor): XYZColor;
export function rgbToXyz(rOrRgb: number | RGBColor, g?: number, b?: number): XYZColor {
  let rr: number, gg: number, bb: number;
  if (typeof rOrRgb === 'object') {
    rr = rOrRgb.r;
    gg = rOrRgb.g;
    bb = rOrRgb.b;
  } else {
    rr = rOrRgb;
    gg = g!;
    bb = b!;
  }

  const rLin = srgbToLinear(rr);
  const gLin = srgbToLinear(gg);
  const bLin = srgbToLinear(bb);

  const m = SRGB_XYZ_MATRIX.forward;
  return {
    X: rLin * m[0][0] + gLin * m[0][1] + bLin * m[0][2],
    Y: rLin * m[1][0] + gLin * m[1][1] + bLin * m[1][2],
    Z: rLin * m[2][0] + gLin * m[2][1] + bLin * m[2][2],
  };
}

/**
 * XYZ → RGB 변환 (D65 기준)
 *
 * @param xyz - XYZ 색상값 (정규화 스케일, Y=1.0)
 * @returns RGB 색상값 (0-255)
 */
export function xyzToRgb(xyz: XYZColor): RGBColor {
  const m = SRGB_XYZ_MATRIX.inverse;
  const rLin = xyz.X * m[0][0] + xyz.Y * m[0][1] + xyz.Z * m[0][2];
  const gLin = xyz.X * m[1][0] + xyz.Y * m[1][1] + xyz.Z * m[1][2];
  const bLin = xyz.X * m[2][0] + xyz.Y * m[2][1] + xyz.Z * m[2][2];

  return {
    r: linearToSrgb(rLin),
    g: linearToSrgb(gLin),
    b: linearToSrgb(bLin),
  };
}

// =============================================================================
// XYZ ↔ Lab 변환
// =============================================================================

/**
 * XYZ → Lab 변환 (D65 기준)
 *
 * @param xyz - XYZ 색상값 (정규화 스케일)
 * @returns Lab 색상값
 */
export function xyzToLab(xyz: XYZColor): LabColor {
  const fx = labF(xyz.X / D65_WHITE.X);
  const fy = labF(xyz.Y / D65_WHITE.Y);
  const fz = labF(xyz.Z / D65_WHITE.Z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * Lab → XYZ 변환 (D65 기준)
 *
 * @param lab - Lab 색상값
 * @returns XYZ 색상값 (정규화 스케일)
 */
export function labToXyz(lab: LabColor): XYZColor {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  return {
    X: D65_WHITE.X * labFInverse(fx),
    Y: D65_WHITE.Y * labFInverse(fy),
    Z: D65_WHITE.Z * labFInverse(fz),
  };
}

// =============================================================================
// RGB ↔ Lab 변환
// =============================================================================

/**
 * RGB → Lab 변환
 *
 * 변환 파이프라인: RGB → Linear RGB → XYZ → Lab
 *
 * @param r - Red 채널 (0-255)
 * @param g - Green 채널 (0-255)
 * @param b - Blue 채널 (0-255)
 * @returns Lab 색상값
 *
 * @example
 * rgbToLab(245, 220, 200) // { L: ~89.2, a: ~5.5, b: ~13.5 }
 * rgbToLab({ r: 245, g: 220, b: 200 }) // 동일
 */
export function rgbToLab(r: number, g: number, b: number): LabColor;
export function rgbToLab(rgb: RGBColor): LabColor;
export function rgbToLab(rOrRgb: number | RGBColor, g?: number, b?: number): LabColor {
  let rr: number, gg: number, bb: number;
  if (typeof rOrRgb === 'object') {
    rr = rOrRgb.r;
    gg = rOrRgb.g;
    bb = rOrRgb.b;
  } else {
    rr = rOrRgb;
    gg = g!;
    bb = b!;
  }

  // 입력 클램핑
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  rr = clamp(rr);
  gg = clamp(gg);
  bb = clamp(bb);

  return xyzToLab(rgbToXyz(rr, gg, bb));
}

/**
 * Lab → RGB 변환
 *
 * @param lab - Lab 색상값
 * @returns RGB 색상값 (0-255, gamut 클리핑 적용)
 */
export function labToRgb(lab: LabColor): RGBColor {
  return xyzToRgb(labToXyz(lab));
}

// =============================================================================
// HEX 변환
// =============================================================================

/**
 * HEX → RGB 변환
 *
 * @param hex - HEX 색상 코드 (예: "#FF5733" 또는 "FF5733")
 * @returns RGB 색상값
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
 * RGB → HEX 변환
 *
 * @param rgb - RGB 색상값
 * @returns HEX 색상 코드 (예: "#ff5733")
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * HEX → Lab 변환 (단축 함수)
 *
 * @param hex - HEX 색상 코드
 * @returns Lab 색상값
 */
export function hexToLab(hex: string): LabColor {
  const rgb = hexToRgb(hex);
  return rgbToLab(rgb.r, rgb.g, rgb.b);
}

/**
 * Lab → HEX 변환 (단축 함수)
 *
 * @param lab - Lab 색상값
 * @returns HEX 색상 코드 (대문자, 예: "#FF5733")
 */
export function labToHex(lab: LabColor): string {
  const rgb = labToRgb(lab);
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// =============================================================================
// Lab 파생 지표
// =============================================================================

/**
 * Lab 색상의 채도(Chroma) 계산
 *
 * C* = sqrt(a*^2 + b*^2)
 *
 * @param lab - Lab 색상값
 * @returns 채도 (0 이상)
 */
export function calculateChroma(lab: LabColor): number {
  return Math.sqrt(lab.a ** 2 + lab.b ** 2);
}

/**
 * Lab 색상의 색상각(Hue Angle) 계산
 *
 * h = atan2(b*, a*) x (180/pi), 0-360도 범위
 *
 * @param lab - Lab 색상값
 * @returns 색상각 (0-360도)
 */
export function calculateHue(lab: LabColor): number {
  let hue = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (hue < 0) {
    hue += 360;
  }
  return hue;
}

/**
 * Lab 색상에서 파생 지표(채도, 색상각) 계산
 *
 * @param lab - Lab 색상값
 * @returns 파생 지표 { chroma, hue }
 */
export function calculateDerivedMetrics(lab: LabColor): LabDerivedMetrics {
  return {
    chroma: calculateChroma(lab),
    hue: calculateHue(lab),
  };
}

/**
 * ITA (Individual Typology Angle) 계산
 *
 * 피부 밝기 분류에 사용되는 지표
 * ITA = arctan[(L* - 50) / b*] x (180/pi)
 *
 * | ITA | 분류 |
 * |-----|------|
 * | > 55 | Very Light |
 * | 41-55 | Light |
 * | 28-41 | Intermediate (한국인 대부분) |
 * | 10-28 | Tan |
 * | < 10 | Dark |
 *
 * @param lab - Lab 색상값
 * @returns ITA 각도 (도)
 */
export function calculateITA(lab: LabColor): number {
  if (lab.b === 0) {
    return lab.L > 50 ? 90 : -90;
  }
  return Math.atan2(lab.L - 50, lab.b) * (180 / Math.PI);
}
