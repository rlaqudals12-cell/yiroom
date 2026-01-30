/**
 * PC-2: Lab 색공간 유틸리티
 *
 * @module lib/analysis/personal-color-v2/lab-utils
 * @description RGB -> Lab 변환, Lab 거리 계산 (CIE76, CIEDE2000)
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 * @see docs/principles/color-science.md
 */

import type { LabColor, RGBColor, XYZColor } from './types';

// ============================================
// D65 백색점 상수 (CIE 1931)
// ============================================

/** D65 표준 조명 백색점 */
const D65_WHITE: XYZColor = {
  X: 0.95047,
  Y: 1.0,
  Z: 1.08883,
} as const;

/** Lab 변환 상수 (CIE 표준) */
const LAB_CONSTANTS = {
  /** epsilon = 216/24389 */
  epsilon: 216 / 24389,
  /** kappa = 24389/27 */
  kappa: 24389 / 27,
} as const;

// ============================================
// sRGB -> Linear RGB 변환
// ============================================

/**
 * sRGB 감마 보정 해제 (sRGB -> Linear RGB)
 *
 * @param c - sRGB 채널 값 (0-255)
 * @returns Linear RGB 값 (0-1)
 */
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Linear RGB -> sRGB 감마 적용
 *
 * @param c - Linear RGB 값 (0-1)
 * @returns sRGB 채널 값 (0-255)
 */
function linearToSrgb(c: number): number {
  const srgb =
    c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, srgb * 255)));
}

// ============================================
// RGB <-> Lab 변환
// ============================================

/**
 * RGB를 Lab 색공간으로 변환
 *
 * 변환 파이프라인: RGB -> Linear RGB -> XYZ -> Lab
 *
 * @param r - Red 채널 (0-255)
 * @param g - Green 채널 (0-255)
 * @param b - Blue 채널 (0-255)
 * @returns Lab 색상값
 *
 * @example
 * rgbToLab(245, 220, 200) // { L: 89.2, a: 5.1, b: 12.3 }
 */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // 입력 검증 및 클램핑
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  r = clamp(r);
  g = clamp(g);
  b = clamp(b);

  // 1. sRGB -> Linear RGB
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // 2. Linear RGB -> XYZ (D65 기준 행렬)
  const X = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  const Y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
  const Z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

  // 3. XYZ -> Lab
  const { epsilon, kappa } = LAB_CONSTANTS;

  const xr = X / D65_WHITE.X;
  const yr = Y / D65_WHITE.Y;
  const zr = Z / D65_WHITE.Z;

  // f 함수 적용
  const f = (t: number): number =>
    t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116;

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * Lab을 RGB 색공간으로 변환
 *
 * @param lab - Lab 색상값
 * @returns RGB 색상값
 */
export function labToRgb(lab: LabColor): RGBColor {
  const { epsilon, kappa } = LAB_CONSTANTS;

  // 1. Lab -> XYZ
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const fInv = (t: number): number => {
    const t3 = t * t * t;
    return t3 > epsilon ? t3 : (116 * t - 16) / kappa;
  };

  const X = D65_WHITE.X * fInv(fx);
  const Y = D65_WHITE.Y * fInv(fy);
  const Z = D65_WHITE.Z * fInv(fz);

  // 2. XYZ -> Linear RGB (역행렬)
  const rLin = X * 3.2404542 + Y * -1.5371385 + Z * -0.4985314;
  const gLin = X * -0.9692660 + Y * 1.8760108 + Z * 0.0415560;
  const bLin = X * 0.0556434 + Y * -0.2040259 + Z * 1.0572252;

  // 3. Linear RGB -> sRGB
  return {
    r: linearToSrgb(rLin),
    g: linearToSrgb(gLin),
    b: linearToSrgb(bLin),
  };
}

/**
 * HEX 색상 코드를 Lab으로 변환
 *
 * @param hex - HEX 색상 코드 (예: "#FF5733" 또는 "FF5733")
 * @returns Lab 색상값
 */
export function hexToLab(hex: string): LabColor {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return rgbToLab(r, g, b);
}

/**
 * Lab을 HEX 색상 코드로 변환
 *
 * @param lab - Lab 색상값
 * @returns HEX 색상 코드 (예: "#FF5733")
 */
export function labToHex(lab: LabColor): string {
  const rgb = labToRgb(lab);
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// ============================================
// Lab 파생 지표 계산
// ============================================

/**
 * Lab 색상의 Chroma(채도) 계산
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
 * Lab 색상의 Hue Angle(색상각) 계산
 *
 * h = atan2(b*, a*) x (180/pi)
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
  // b*가 0인 경우 처리
  if (lab.b === 0) {
    return lab.L > 50 ? 90 : -90;
  }
  return Math.atan2(lab.L - 50, lab.b) * (180 / Math.PI);
}

// ============================================
// 색차 계산
// ============================================

/**
 * CIE76 색차 계산 (유클리드 거리)
 *
 * deltaE = sqrt[(L1-L2)^2 + (a1-a2)^2 + (b1-b2)^2]
 *
 * | deltaE | 해석 |
 * |--------|------|
 * | < 1 | 구별 불가 |
 * | 1-2 | 미세한 차이 |
 * | 2-3.5 | 인지 가능 |
 * | 3.5-5 | 명확한 차이 |
 * | > 5 | 다른 색상 |
 *
 * @param lab1 - 첫 번째 Lab 색상
 * @param lab2 - 두 번째 Lab 색상
 * @returns 색차 (deltaE)
 */
export function calculateLabDistance(lab1: LabColor, lab2: LabColor): number {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 + (lab1.a - lab2.a) ** 2 + (lab1.b - lab2.b) ** 2
  );
}

/**
 * CIEDE2000 색차 계산
 *
 * CIE 2000 표준에 따른 색차 계산
 * 인간 시각 특성을 반영하여 더 정확한 색차 측정
 *
 * @param lab1 - 첫 번째 Lab 색상
 * @param lab2 - 두 번째 Lab 색상
 * @param options - 가중치 옵션
 * @returns 색차 (deltaE00)
 *
 * @see CIE 142-2001
 */
export function calculateCIEDE2000(
  lab1: LabColor,
  lab2: LabColor,
  options: { kL?: number; kC?: number; kH?: number } = {}
): number {
  const kL = options.kL ?? 1;
  const kC = options.kC ?? 1;
  const kH = options.kH ?? 1;

  // 1. 평균 명도
  const L_bar = (lab1.L + lab2.L) / 2;

  // 2. 채도 계산
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const C_bar = (C1 + C2) / 2;

  // 3. a' 조정 (회색 근처 문제 해결)
  const G = 0.5 * (1 - Math.sqrt(C_bar ** 7 / (C_bar ** 7 + 25 ** 7)));
  const a1_prime = lab1.a * (1 + G);
  const a2_prime = lab2.a * (1 + G);

  // 4. 조정된 채도
  const C1_prime = Math.sqrt(a1_prime ** 2 + lab1.b ** 2);
  const C2_prime = Math.sqrt(a2_prime ** 2 + lab2.b ** 2);
  const C_bar_prime = (C1_prime + C2_prime) / 2;

  // 5. 색상각 계산
  const h1_prime_rad = Math.atan2(lab1.b, a1_prime);
  const h2_prime_rad = Math.atan2(lab2.b, a2_prime);
  let h1 = (h1_prime_rad * 180) / Math.PI;
  let h2 = (h2_prime_rad * 180) / Math.PI;
  if (h1 < 0) h1 += 360;
  if (h2 < 0) h2 += 360;

  // 6. 평균 색상각
  let H_bar_prime: number;
  if (Math.abs(h1 - h2) > 180) {
    H_bar_prime = (h1 + h2 + 360) / 2;
  } else {
    H_bar_prime = (h1 + h2) / 2;
  }

  // 7. T 계산
  const T =
    1 -
    0.17 * Math.cos(((H_bar_prime - 30) * Math.PI) / 180) +
    0.24 * Math.cos(((2 * H_bar_prime) * Math.PI) / 180) +
    0.32 * Math.cos(((3 * H_bar_prime + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * H_bar_prime - 63) * Math.PI) / 180);

  // 8. 델타 값들
  const delta_L_prime = lab2.L - lab1.L;
  const delta_C_prime = C2_prime - C1_prime;

  let delta_h_prime: number;
  if (C1_prime * C2_prime === 0) {
    delta_h_prime = 0;
  } else if (Math.abs(h2 - h1) <= 180) {
    delta_h_prime = h2 - h1;
  } else if (h2 - h1 > 180) {
    delta_h_prime = h2 - h1 - 360;
  } else {
    delta_h_prime = h2 - h1 + 360;
  }

  const delta_H_prime =
    2 *
    Math.sqrt(C1_prime * C2_prime) *
    Math.sin((delta_h_prime / 2) * (Math.PI / 180));

  // 9. SL, SC, SH 계산
  const SL =
    1 + (0.015 * (L_bar - 50) ** 2) / Math.sqrt(20 + (L_bar - 50) ** 2);
  const SC = 1 + 0.045 * C_bar_prime;
  const SH = 1 + 0.015 * C_bar_prime * T;

  // 10. RT (회전 항) 계산 - 청색 영역 보정
  const delta_theta = 30 * Math.exp(-(((H_bar_prime - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(C_bar_prime ** 7 / (C_bar_prime ** 7 + 25 ** 7));
  const RT = -RC * Math.sin((2 * delta_theta * Math.PI) / 180);

  // 11. 최종 CIEDE2000 계산
  const deltaE = Math.sqrt(
    (delta_L_prime / (kL * SL)) ** 2 +
      (delta_C_prime / (kC * SC)) ** 2 +
      (delta_H_prime / (kH * SH)) ** 2 +
      RT * (delta_C_prime / (kC * SC)) * (delta_H_prime / (kH * SH))
  );

  return deltaE;
}
