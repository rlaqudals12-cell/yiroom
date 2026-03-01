/**
 * 색공간 변환 모듈 (Color Module)
 *
 * CIE 15:2004 정밀 상수 기반 RGB ↔ XYZ ↔ Lab 변환
 *
 * @module lib/color
 * @see docs/principles/color-science.md
 *
 * @example
 * import { rgbToLab, hexToLab, calculateCIEDE2000 } from '@/lib/color';
 */

// ─── 타입 ────────────────────────────────────────────

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface LabColor {
  L: number;
  a: number;
  b: number;
}

export interface XYZColor {
  X: number;
  Y: number;
  Z: number;
}

export interface LabDerivedMetrics {
  chroma: number;
  hue: number;
}

export interface CIEDE2000Options {
  kL?: number;
  kC?: number;
  kH?: number;
}

// ─── 상수 ────────────────────────────────────────────

/** D65 표준 조명 백색점 (CIE 1931, 정규화) */
export const D65_WHITE = { X: 0.95047, Y: 1.0, Z: 1.08883 } as const;

/** Lab 변환 상수 (CIE 15:2004 정밀 분수) */
export const LAB_CONSTANTS = {
  epsilon: 216 / 24389,
  kappa: 24389 / 27,
} as const;

const SRGB_XYZ_MATRIX = {
  forward: [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.072175],
    [0.0193339, 0.119192, 0.9503041],
  ],
  inverse: [
    [3.2404542, -1.5371385, -0.4985314],
    [-0.969266, 1.8760108, 0.041556],
    [0.0556434, -0.2040259, 1.0572252],
  ],
} as const;

// ─── sRGB 감마 ───────────────────────────────────────

function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255)));
}

// ─── XYZ ↔ Lab 보조 함수 ────────────────────────────

function labF(t: number): number {
  const { epsilon, kappa } = LAB_CONSTANTS;
  return t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116;
}

function labFInverse(t: number): number {
  const { epsilon, kappa } = LAB_CONSTANTS;
  const t3 = t * t * t;
  return t3 > epsilon ? t3 : (116 * t - 16) / kappa;
}

// ─── RGB ↔ XYZ ──────────────────────────────────────

export function rgbToXyz(r: number, g: number, b: number): XYZColor {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  const m = SRGB_XYZ_MATRIX.forward;
  return {
    X: rLin * m[0][0] + gLin * m[0][1] + bLin * m[0][2],
    Y: rLin * m[1][0] + gLin * m[1][1] + bLin * m[1][2],
    Z: rLin * m[2][0] + gLin * m[2][1] + bLin * m[2][2],
  };
}

export function xyzToRgb(xyz: XYZColor): RGBColor {
  const m = SRGB_XYZ_MATRIX.inverse;
  return {
    r: linearToSrgb(xyz.X * m[0][0] + xyz.Y * m[0][1] + xyz.Z * m[0][2]),
    g: linearToSrgb(xyz.X * m[1][0] + xyz.Y * m[1][1] + xyz.Z * m[1][2]),
    b: linearToSrgb(xyz.X * m[2][0] + xyz.Y * m[2][1] + xyz.Z * m[2][2]),
  };
}

// ─── XYZ ↔ Lab ──────────────────────────────────────

export function xyzToLab(xyz: XYZColor): LabColor {
  const fx = labF(xyz.X / D65_WHITE.X);
  const fy = labF(xyz.Y / D65_WHITE.Y);
  const fz = labF(xyz.Z / D65_WHITE.Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

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

// ─── RGB ↔ Lab ──────────────────────────────────────

export function rgbToLab(r: number, g: number, b: number): LabColor {
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  return xyzToLab(rgbToXyz(clamp(r), clamp(g), clamp(b)));
}

export function labToRgb(lab: LabColor): RGBColor {
  return xyzToRgb(labToXyz(lab));
}

// ─── HEX 변환 ───────────────────────────────────────

export function hexToRgb(hex: string): RGBColor {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGBColor): string {
  const h = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
}

export function hexToLab(hex: string): LabColor {
  const rgb = hexToRgb(hex);
  return rgbToLab(rgb.r, rgb.g, rgb.b);
}

export function labToHex(lab: LabColor): string {
  return rgbToHex(labToRgb(lab)).toUpperCase();
}

// ─── Lab 파생 지표 ──────────────────────────────────

/** 채도 C* = sqrt(a*² + b*²) */
export function calculateChroma(lab: LabColor): number {
  return Math.sqrt(lab.a ** 2 + lab.b ** 2);
}

/** 색상각 h = atan2(b*, a*) (0-360°) */
export function calculateHue(lab: LabColor): number {
  let hue = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (hue < 0) hue += 360;
  return hue;
}

export function calculateDerivedMetrics(lab: LabColor): LabDerivedMetrics {
  return { chroma: calculateChroma(lab), hue: calculateHue(lab) };
}

/** ITA = arctan[(L* - 50) / b*] × (180/π) — 피부 밝기 분류 */
export function calculateITA(lab: LabColor): number {
  if (lab.b === 0) return lab.L > 50 ? 90 : -90;
  return Math.atan2(lab.L - 50, lab.b) * (180 / Math.PI);
}

// ─── CIE76 색차 ─────────────────────────────────────

export function calculateLabDistance(lab1: LabColor, lab2: LabColor): number {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 + (lab1.a - lab2.a) ** 2 + (lab1.b - lab2.b) ** 2
  );
}

// ─── CIEDE2000 색차 ─────────────────────────────────

export function calculateCIEDE2000(
  lab1: LabColor,
  lab2: LabColor,
  options: CIEDE2000Options = {}
): number {
  const kL = options.kL ?? 1;
  const kC = options.kC ?? 1;
  const kH = options.kH ?? 1;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const L_bar = (lab1.L + lab2.L) / 2;
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const C_bar = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(C_bar ** 7 / (C_bar ** 7 + 25 ** 7)));
  const a1p = lab1.a * (1 + G);
  const a2p = lab2.a * (1 + G);
  const C1p = Math.sqrt(a1p ** 2 + lab1.b ** 2);
  const C2p = Math.sqrt(a2p ** 2 + lab2.b ** 2);
  const Cbp = (C1p + C2p) / 2;

  let h1 = Math.atan2(lab1.b, a1p) * (180 / Math.PI);
  let h2 = Math.atan2(lab2.b, a2p) * (180 / Math.PI);
  if (h1 < 0) h1 += 360;
  if (h2 < 0) h2 += 360;

  let Hbp: number;
  if (C1p * C2p === 0) {
    Hbp = h1 + h2;
  } else if (Math.abs(h1 - h2) <= 180) {
    Hbp = (h1 + h2) / 2;
  } else if (h1 + h2 < 360) {
    Hbp = (h1 + h2 + 360) / 2;
  } else {
    Hbp = (h1 + h2 - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(toRad(Hbp - 30)) +
    0.24 * Math.cos(toRad(2 * Hbp)) +
    0.32 * Math.cos(toRad(3 * Hbp + 6)) -
    0.2 * Math.cos(toRad(4 * Hbp - 63));

  const dLp = lab2.L - lab1.L;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2 - h1) <= 180) {
    dhp = h2 - h1;
  } else if (h2 - h1 > 180) {
    dhp = h2 - h1 - 360;
  } else {
    dhp = h2 - h1 + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(toRad(dhp / 2));
  const SL = 1 + (0.015 * (L_bar - 50) ** 2) / Math.sqrt(20 + (L_bar - 50) ** 2);
  const SC = 1 + 0.045 * Cbp;
  const SH = 1 + 0.015 * Cbp * T;
  const dtheta = 30 * Math.exp(-(((Hbp - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const RT = -RC * Math.sin(toRad(2 * dtheta));

  return Math.sqrt(
    (dLp / (kL * SL)) ** 2 +
      (dCp / (kC * SC)) ** 2 +
      (dHp / (kH * SH)) ** 2 +
      RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );
}

// ─── RGB ↔ HSL ──────────────────────────────────────

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl(r: number, g: number, b: number): HSLColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return { h: h * 360, s, l };
}

export function hslToRgb(h: number, s: number, l: number): RGBColor {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

export function hexToHsl(hex: string): HSLColor {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

export function hslToHex(h: number, s: number, l: number): string {
  return rgbToHex(hslToRgb(h, s, l));
}
