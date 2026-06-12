/**
 * 배색(Color Harmony) 알고리즘
 *
 * @module lib/color/harmony
 * @description 색채학 배색 이론(보색/유사색/삼각/톤온톤)을 LCh 공간에서 구현.
 * 기준색의 L\*(명도)·C\*(채도)는 보존하고 h°(색상각)만 회전시켜 조화색을 도출한다.
 * 이는 "예쁜 색 하드코딩" 대신 진단된 퍼스널컬러를 토대로 배색을 계산하기 위함.
 *
 * @see docs/principles/color-science.md §8 배색 이론
 * @see lib/color/conversions.ts (hexToLab, labToRgb, rgbToHex, calculateChroma, calculateHue 재사용)
 */

import type { LabColor } from './types';
import { hexToLab, labToRgb, rgbToHex, calculateChroma, calculateHue } from './conversions';

/** 배색 유형 */
export type HarmonyType =
  | 'complementary' // 보색 (h°+180)
  | 'analogous' // 유사색 (h°±spread)
  | 'triadic' // 삼각 배색 (h°+120, +240)
  | 'split-complementary' // 분할 보색 (h°+150, +210)
  | 'ton-on-ton'; // 톤온톤 (같은 h°, L\* 변화)

/**
 * LCh(L\*, C\*, h°) → Lab 역변환.
 * a\* = C\*·cos(h), b\* = C\*·sin(h). 명도 L\*는 그대로.
 */
function lchToLab(L: number, chroma: number, hueDeg: number): LabColor {
  const hueRad = (hueDeg * Math.PI) / 180;
  return {
    L,
    a: chroma * Math.cos(hueRad),
    b: chroma * Math.sin(hueRad),
  };
}

/** 기준 hex에서 L\*, C\*, h° 추출 */
function toLch(hex: string): { L: number; chroma: number; hue: number } {
  const lab = hexToLab(hex);
  return { L: lab.L, chroma: calculateChroma(lab), hue: calculateHue(lab) };
}

/** 명도(L)·채도(C) 보존, 색상각(h)만 delta만큼 회전시킨 hex 반환 */
function rotateHue(hex: string, deltaDeg: number): string {
  const { L, chroma, hue } = toLch(hex);
  const newHue = (((hue + deltaDeg) % 360) + 360) % 360;
  return rgbToHex(labToRgb(lchToLab(L, chroma, newHue)));
}

/**
 * 보색 — 색상환 반대편(h°+180). 가장 강한 대비. 포인트 컬러에 적합.
 */
export function complementary(baseHex: string): string {
  return rotateHue(baseHex, 180);
}

/**
 * 유사색 — 기준색 양옆(h°±spread). 조화롭고 안정적. 기본 코디 색에 적합.
 * @param spread 색상각 간격(도). 기본 30°.
 */
export function analogous(baseHex: string, spread = 30): string[] {
  return [rotateHue(baseHex, -spread), rotateHue(baseHex, spread)];
}

/**
 * 삼각 배색 — 색상환 3등분(h°+120, +240). 활기차고 균형. 악센트 조합에 적합.
 */
export function triadic(baseHex: string): string[] {
  return [rotateHue(baseHex, 120), rotateHue(baseHex, 240)];
}

/**
 * 분할 보색 — 보색의 양옆(h°+150, +210). 보색보다 부드러운 대비.
 */
export function splitComplementary(baseHex: string): string[] {
  return [rotateHue(baseHex, 150), rotateHue(baseHex, 210)];
}

/**
 * 톤온톤 — 같은 색상(h°)에서 명도(L\*)만 단계적으로 변화. 깊이감 있는 단색 조합.
 * @param steps 생성할 단계 수(기본 3). 명도를 균등 분포.
 */
export function tonOnTone(baseHex: string, steps = 3): string[] {
  const { chroma, hue } = toLch(baseHex);
  // 명도 30~85 범위를 steps 단계로 분할 (너무 어둡거나 흰색에 가깝지 않게)
  const min = 30;
  const max = 85;
  const result: string[] = [];
  for (let i = 0; i < steps; i++) {
    const L = steps === 1 ? (min + max) / 2 : min + ((max - min) * i) / (steps - 1);
    result.push(rgbToHex(labToRgb(lchToLab(L, chroma, hue))));
  }
  return result;
}

/** 배색 분석 결과 */
export interface HarmonyResult {
  base: string;
  /** L\*, C\*, h° (디버깅/표시용) */
  lch: { L: number; chroma: number; hue: number };
  complementary: string;
  analogous: string[];
  triadic: string[];
  splitComplementary: string[];
  tonOnTone: string[];
}

/**
 * 기준 hex 색상에 대한 전체 배색 분석.
 * 퍼스널컬러 대표색 → 배색 팔레트 생성에 사용.
 */
export function analyzeHarmony(baseHex: string): HarmonyResult {
  return {
    base: baseHex,
    lch: toLch(baseHex),
    complementary: complementary(baseHex),
    analogous: analogous(baseHex),
    triadic: triadic(baseHex),
    splitComplementary: splitComplementary(baseHex),
    tonOnTone: tonOnTone(baseHex),
  };
}
