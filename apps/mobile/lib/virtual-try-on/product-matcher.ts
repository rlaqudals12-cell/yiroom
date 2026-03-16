/**
 * VTO 제품 매처 서비스 (모바일)
 *
 * VTO에서 선택한 색상과 유사한 실제 제품을 매칭.
 * CIE Lab 색공간 기반 Delta-E(CIE76) 거리 계산으로 색상 유사도 측정.
 *
 * 근거: docs/principles/color-science.md
 */

import type { RgbaColor } from './types';
import type { PersonalColorSeason } from './season-presets';

// ================================================
// 공개 타입
// ================================================

/** VTO 메이크업 타입 */
export type VTOMakeupType = 'lip' | 'blush' | 'eyeshadow' | 'foundation' | 'hair';

/** Lab 색공간 좌표 */
export interface LabColor {
  L: number;
  a: number;
  b: number;
}

/** 매칭된 제품 정보 */
export interface VTOMatchedProduct {
  productId: string;
  name: string;
  brand: string;
  imageUrl?: string;
  matchScore: number;
  colorDeltaE: number;
  price?: number;
  affiliateUrl?: string;
}

// ================================================
// 색상 변환 (sRGB → CIE Lab)
// ================================================

/** sRGB 감마 보정 해제 */
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/** RGB → CIE Lab 변환 */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  const linearR = srgbToLinear(r);
  const linearG = srgbToLinear(g);
  const linearB = srgbToLinear(b);

  let x = linearR * 0.4124564 + linearG * 0.3575761 + linearB * 0.1804375;
  let y = linearR * 0.2126729 + linearG * 0.7151522 + linearB * 0.072175;
  let z = linearR * 0.0193339 + linearG * 0.119192 + linearB * 0.9503041;

  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  const epsilon = 0.008856;
  const kappa = 7.787037;

  const fx = x > epsilon ? Math.cbrt(x) : kappa * x + 16 / 116;
  const fy = y > epsilon ? Math.cbrt(y) : kappa * y + 16 / 116;
  const fz = z > epsilon ? Math.cbrt(z) : kappa * z + 16 / 116;

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

// ================================================
// Delta-E 계산
// ================================================

/**
 * CIE76 색차(Delta-E) 계산
 * Delta-E < 2.3: 사람이 구분 불가 (JND)
 */
export function calculateDeltaE(lab1: LabColor, lab2: LabColor): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ================================================
// 제품명 색상 추출
// ================================================

/** 제품명 → 색상 RGB 키워드 매핑 */
const COLOR_KEYWORD_MAP: Record<string, { r: number; g: number; b: number }> = {
  코랄: { r: 255, g: 127, b: 80 },
  피치: { r: 255, g: 180, b: 140 },
  로즈: { r: 220, g: 90, b: 100 },
  레드: { r: 210, g: 40, b: 40 },
  와인: { r: 140, g: 30, b: 50 },
  베리: { r: 160, g: 40, b: 90 },
  누드: { r: 210, g: 150, b: 140 },
  오렌지: { r: 230, g: 100, b: 50 },
  브릭: { r: 180, g: 70, b: 50 },
  플럼: { r: 130, g: 50, b: 80 },
  핑크: { r: 255, g: 150, b: 170 },
  푸치아: { r: 200, g: 50, b: 120 },
  버건디: { r: 128, g: 0, b: 32 },
  브라운: { r: 139, g: 90, b: 43 },
  골드: { r: 212, g: 175, b: 55 },
  테라코타: { r: 204, g: 119, b: 34 },
  모카: { r: 130, g: 90, b: 60 },
  라벤더: { r: 180, g: 130, b: 200 },
  스모키: { r: 80, g: 80, b: 80 },
  아이보리: { r: 255, g: 245, b: 230 },
  베이지: { r: 210, g: 180, b: 140 },
};

/** 제품명에서 색상 RGB 추출 */
export function extractProductColor(
  productName: string
): { r: number; g: number; b: number } | null {
  for (const [keyword, color] of Object.entries(COLOR_KEYWORD_MAP)) {
    if (productName.includes(keyword)) {
      return color;
    }
  }
  return null;
}

// ================================================
// 매칭 점수 계산
// ================================================

/** 색상 유사도 점수 (0-40) */
export function colorSimilarityScore(deltaE: number): number {
  const MAX_DELTA_E = 50;
  if (deltaE >= MAX_DELTA_E) return 0;
  return Math.round((1 - deltaE / MAX_DELTA_E) * 40);
}

/** 시즌 보정 점수 (+15) */
export function seasonBonusScore(
  productSeasons: string[] | undefined,
  season?: PersonalColorSeason
): number {
  if (!season || !productSeasons) return 0;
  const seasonCapitalized = season.charAt(0).toUpperCase() + season.slice(1);
  return productSeasons.includes(seasonCapitalized) ? 15 : 0;
}

/** 인기도 점수 (0-15) */
export function popularityScore(reviewCount: number, rating: number): number {
  let score = 0;
  if (reviewCount >= 5000) score += 8;
  else if (reviewCount >= 1000) score += 6;
  else if (reviewCount >= 100) score += 3;

  if (rating >= 4.5) score += 7;
  else if (rating >= 4.0) score += 5;
  else if (rating >= 3.5) score += 3;

  return Math.min(15, score);
}

/**
 * VTO 색상 기반 제품 매칭 점수 계산
 * 점수 구성: 기본 30 + 색상유사도 0-40 + 시즌보정 +15 + 인기도 0-15 = 최대 100
 */
export function calculateMatchScore(
  targetColor: RgbaColor,
  productName: string,
  productSeasons?: string[],
  reviewCount = 0,
  rating = 0,
  season?: PersonalColorSeason
): { matchScore: number; deltaE: number } {
  const BASE_SCORE = 30;
  const targetLab = rgbToLab(targetColor.r, targetColor.g, targetColor.b);

  const productColor = extractProductColor(productName);
  let deltaE = 50;

  if (productColor) {
    const productLab = rgbToLab(productColor.r, productColor.g, productColor.b);
    deltaE = calculateDeltaE(targetLab, productLab);
  }

  const score = Math.min(
    100,
    BASE_SCORE +
      colorSimilarityScore(deltaE) +
      seasonBonusScore(productSeasons, season) +
      popularityScore(reviewCount, rating)
  );

  return { matchScore: score, deltaE: Math.round(deltaE * 100) / 100 };
}
