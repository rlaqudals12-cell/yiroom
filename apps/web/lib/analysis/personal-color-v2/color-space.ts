/**
 * PC-2 색공간 변환 유틸리티
 * RGB ↔ XYZ ↔ Lab 변환
 *
 * @description Lab 색공간 기반 색상 분석
 * @see docs/principles/color-science.md
 */

import type { RGBColor, XYZColor, LabColor } from './types';

/** D65 표준광 기준 백색점 */
const D65_WHITE_POINT = {
  X: 95.047,
  Y: 100.0,
  Z: 108.883,
} as const;

/**
 * sRGB 감마 보정 해제 (선형화)
 * sRGB → Linear RGB
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
export function rgbToXyz(rgb: RGBColor): XYZColor {
  // sRGB → Linear RGB
  const linearR = srgbToLinear(rgb.r);
  const linearG = srgbToLinear(rgb.g);
  const linearB = srgbToLinear(rgb.b);

  // Linear RGB → XYZ (sRGB 매트릭스, D65)
  return {
    X: (linearR * 0.4124564 + linearG * 0.3575761 + linearB * 0.1804375) * 100,
    Y: (linearR * 0.2126729 + linearG * 0.7151522 + linearB * 0.0721750) * 100,
    Z: (linearR * 0.0193339 + linearG * 0.1191920 + linearB * 0.9503041) * 100,
  };
}

/**
 * XYZ → RGB 변환 (D65 기준)
 */
export function xyzToRgb(xyz: XYZColor): RGBColor {
  const x = xyz.X / 100;
  const y = xyz.Y / 100;
  const z = xyz.Z / 100;

  // XYZ → Linear RGB (역행렬)
  const linearR = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const linearG = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  const linearB = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  // Linear RGB → sRGB
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

  return t > deltaCubed
    ? Math.cbrt(t)
    : t / (3 * delta * delta) + 4 / 29;
}

/**
 * Lab → XYZ 변환 보조 함수
 */
function labToXyzHelper(t: number): number {
  const delta = 6 / 29;

  return t > delta
    ? t * t * t
    : 3 * delta * delta * (t - 4 / 29);
}

/**
 * XYZ → Lab 변환 (D65 기준)
 */
export function xyzToLab(xyz: XYZColor): LabColor {
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
export function labToXyz(lab: LabColor): XYZColor {
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
 * RGB → Lab 변환 (단축 함수)
 */
export function rgbToLab(rgb: RGBColor): LabColor {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * Lab → RGB 변환 (단축 함수)
 */
export function labToRgb(lab: LabColor): RGBColor {
  return xyzToRgb(labToXyz(lab));
}

/**
 * Lab 색상 거리 계산 (CIE76 - 유클리드)
 * 간단하지만 지각적으로 덜 정확
 */
export function labDistanceCIE76(lab1: LabColor, lab2: LabColor): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Lab 색상 거리 계산 (CIEDE2000)
 * 지각적으로 더 정확한 색차 공식
 */
export function labDistanceCIEDE2000(lab1: LabColor, lab2: LabColor): number {
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const L1 = lab1.L;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.L;
  const a2 = lab2.a;
  const b2 = lab2.b;

  // Chroma 계산
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab = (C1 + C2) / 2;

  // G 계산
  const Cab7 = Math.pow(Cab, 7);
  const G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + Math.pow(25, 7))));

  // a' 계산
  const a1Prime = a1 * (1 + G);
  const a2Prime = a2 * (1 + G);

  // C' 계산
  const C1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
  const C2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);

  // h' 계산
  const h1Prime = Math.atan2(b1, a1Prime) * (180 / Math.PI);
  const h2Prime = Math.atan2(b2, a2Prime) * (180 / Math.PI);

  const h1PrimeNorm = h1Prime < 0 ? h1Prime + 360 : h1Prime;
  const h2PrimeNorm = h2Prime < 0 ? h2Prime + 360 : h2Prime;

  // ΔL', ΔC', ΔH' 계산
  const dLPrime = L2 - L1;
  const dCPrime = C2Prime - C1Prime;

  let dhPrime: number;
  if (C1Prime * C2Prime === 0) {
    dhPrime = 0;
  } else if (Math.abs(h2PrimeNorm - h1PrimeNorm) <= 180) {
    dhPrime = h2PrimeNorm - h1PrimeNorm;
  } else if (h2PrimeNorm - h1PrimeNorm > 180) {
    dhPrime = h2PrimeNorm - h1PrimeNorm - 360;
  } else {
    dhPrime = h2PrimeNorm - h1PrimeNorm + 360;
  }

  const dHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((dhPrime / 2) * (Math.PI / 180));

  // 평균값 계산
  const LPrimeAvg = (L1 + L2) / 2;
  const CPrimeAvg = (C1Prime + C2Prime) / 2;

  let HPrimeAvg: number;
  if (C1Prime * C2Prime === 0) {
    HPrimeAvg = h1PrimeNorm + h2PrimeNorm;
  } else if (Math.abs(h1PrimeNorm - h2PrimeNorm) <= 180) {
    HPrimeAvg = (h1PrimeNorm + h2PrimeNorm) / 2;
  } else if (h1PrimeNorm + h2PrimeNorm < 360) {
    HPrimeAvg = (h1PrimeNorm + h2PrimeNorm + 360) / 2;
  } else {
    HPrimeAvg = (h1PrimeNorm + h2PrimeNorm - 360) / 2;
  }

  // T 계산
  const T =
    1 -
    0.17 * Math.cos(((HPrimeAvg - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * HPrimeAvg * Math.PI) / 180) +
    0.32 * Math.cos(((3 * HPrimeAvg + 6) * Math.PI) / 180) -
    0.20 * Math.cos(((4 * HPrimeAvg - 63) * Math.PI) / 180);

  // SL, SC, SH 계산
  const LPrimeAvg50 = (LPrimeAvg - 50) * (LPrimeAvg - 50);
  const SL = 1 + (0.015 * LPrimeAvg50) / Math.sqrt(20 + LPrimeAvg50);
  const SC = 1 + 0.045 * CPrimeAvg;
  const SH = 1 + 0.015 * CPrimeAvg * T;

  // RT 계산
  const dTheta = 30 * Math.exp(-Math.pow((HPrimeAvg - 275) / 25, 2));
  const CPrimeAvg7 = Math.pow(CPrimeAvg, 7);
  const RC = 2 * Math.sqrt(CPrimeAvg7 / (CPrimeAvg7 + Math.pow(25, 7)));
  const RT = -RC * Math.sin((2 * dTheta * Math.PI) / 180);

  // 최종 색차 계산
  const dE = Math.sqrt(
    Math.pow(dLPrime / (kL * SL), 2) +
    Math.pow(dCPrime / (kC * SC), 2) +
    Math.pow(dHPrime / (kH * SH), 2) +
    RT * (dCPrime / (kC * SC)) * (dHPrime / (kH * SH))
  );

  return dE;
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

/**
 * Hex 문자열 → RGB 변환
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
 * RGB → Hex 문자열 변환
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Hex → Lab 변환 (단축 함수)
 */
export function hexToLab(hex: string): LabColor {
  return rgbToLab(hexToRgb(hex));
}

/**
 * Lab → Hex 변환 (단축 함수)
 */
export function labToHex(lab: LabColor): string {
  return rgbToHex(labToRgb(lab));
}
