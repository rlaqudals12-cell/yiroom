/**
 * VTO 제품 매처 서비스
 *
 * Virtual Try-On에서 선택한 색상과 유사한 실제 제품을 매칭.
 * CIE Lab 색공간 기반 Delta-E(CIE76) 거리 계산으로 색상 유사도 측정.
 *
 * 근거: docs/principles/color-science.md
 *   - sRGB → XYZ → Lab 변환은 국제조명위원회(CIE) 표준
 *   - Delta-E < 2.3은 사람이 구분 불가능한 색차(JND)
 *
 * @module lib/virtual-try-on
 */

import type { RgbaColor } from './types';
import type { PersonalColorSeason } from './season-presets';
import { getCosmeticProducts } from '@/lib/products/repositories/cosmetic';
import type { CosmeticProduct, MakeupSubcategory } from '@/types/product';

// ================================================
// 공개 타입
// ================================================

/** VTO에서 사용하는 메이크업 타입 (hair-color → hair로 단순화) */
export type VTOMakeupType = 'lip' | 'blush' | 'eyeshadow' | 'foundation' | 'hair';

/** Lab 색공간 좌표 */
export interface LabColor {
  L: number; // 명도 (0-100)
  a: number; // 녹-적 축 (-128 ~ +127)
  b: number; // 청-황 축 (-128 ~ +127)
}

/** 매칭된 제품 정보 */
export interface VTOMatchedProduct {
  productId: string;
  name: string;
  brand: string;
  imageUrl?: string;
  matchScore: number; // 0-100
  colorDeltaE: number;
  price?: number;
  affiliateUrl?: string;
}

// ================================================
// 색상 변환 (sRGB → CIE Lab)
// ================================================

/**
 * sRGB 감마 보정 해제 (inverse companding)
 *
 * sRGB는 비선형 감마 곡선을 사용하므로
 * 물리적 색차 계산 전 선형화 필요
 */
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  // sRGB 표준 감마 역변환: 임계값 0.04045 기준 분기
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * RGB → CIE Lab 변환
 *
 * sRGB 감마 보정 → 선형 RGB → XYZ (D65) → Lab
 * D65 기준백: X=95.047, Y=100.000, Z=108.883
 *
 * @param r - 적색 (0-255)
 * @param g - 녹색 (0-255)
 * @param b - 청색 (0-255)
 * @returns Lab 색공간 좌표
 */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // 1단계: sRGB 감마 보정 해제
  const linearR = srgbToLinear(r);
  const linearG = srgbToLinear(g);
  const linearB = srgbToLinear(b);

  // 2단계: 선형 RGB → XYZ (sRGB → D65 매트릭스)
  let x = linearR * 0.4124564 + linearG * 0.3575761 + linearB * 0.1804375;
  let y = linearR * 0.2126729 + linearG * 0.7151522 + linearB * 0.072175;
  let z = linearR * 0.0193339 + linearG * 0.119192 + linearB * 0.9503041;

  // 3단계: D65 기준백으로 정규화
  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  // 4단계: XYZ → Lab (CIE 표준 비선형 변환)
  // 임계값 ε = (6/29)³ ≈ 0.008856, κ = (29/6)² / 3 ≈ 7.787
  const epsilon = 0.008856;
  const kappa = 7.787037;

  const fx = x > epsilon ? Math.cbrt(x) : kappa * x + 16 / 116;
  const fy = y > epsilon ? Math.cbrt(y) : kappa * y + 16 / 116;
  const fz = z > epsilon ? Math.cbrt(z) : kappa * z + 16 / 116;

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { L, a, b: bVal };
}

// ================================================
// Delta-E 계산
// ================================================

/**
 * CIE76 색차(Delta-E) 계산
 *
 * 유클리드 거리 기반. 간단하고 계산 비용 낮음.
 * Delta-E < 2.3: 사람이 구분 불가 (JND)
 * Delta-E < 5: 눈에 띄지만 유사
 * Delta-E < 10: 같은 계열
 * Delta-E > 20: 확연히 다른 색
 *
 * @returns 색차 값 (0 이상, 낮을수록 유사)
 */
export function calculateDeltaE(lab1: LabColor, lab2: LabColor): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ================================================
// MakeupType → 카테고리 매핑
// ================================================

/** VTO 메이크업 타입 → 화장품 서브카테고리 매핑 */
const MAKEUP_TYPE_TO_SUBCATEGORY: Record<VTOMakeupType, MakeupSubcategory[]> = {
  lip: ['lip', 'lip-gloss', 'lip-liner'],
  blush: ['blush'],
  eyeshadow: ['eyeshadow'],
  foundation: ['foundation', 'cushion'],
  hair: [], // 헤어는 별도 카테고리 (shampoo/hair-treatment 아닌 hair_color 개념)
};

// ================================================
// 제품 대표 색상 추정
// ================================================

/**
 * 제품명에서 대표 색상 RGB를 추정
 *
 * 화장품 DB에 color_hex 컬럼이 없으므로
 * 제품명/브랜드에 포함된 색상 키워드로 근사치 도출.
 * 정확한 매칭은 아니지만 필터링 용도로 충분.
 */
const COLOR_KEYWORD_MAP: Record<string, { r: number; g: number; b: number }> = {
  // 립 계열
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
  // 아이섀도/블러셔 계열
  브라운: { r: 139, g: 90, b: 43 },
  골드: { r: 212, g: 175, b: 55 },
  테라코타: { r: 204, g: 119, b: 34 },
  모카: { r: 130, g: 90, b: 60 },
  올리브: { r: 128, g: 128, b: 0 },
  라벤더: { r: 180, g: 130, b: 200 },
  스모키: { r: 80, g: 80, b: 80 },
  // 파운데이션/헤어 계열
  아이보리: { r: 255, g: 245, b: 230 },
  베이지: { r: 210, g: 180, b: 140 },
};

/**
 * 제품명에서 색상 RGB 추출 (키워드 매칭)
 * 여러 키워드 매칭 시 첫 번째 반환
 */
function extractProductColor(productName: string): { r: number; g: number; b: number } | null {
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

/**
 * 색상 유사도 점수 (0-40)
 *
 * Delta-E 기반 역비례 점수.
 * Delta-E 0 → 40점, Delta-E 50+ → 0점
 */
function colorSimilarityScore(deltaE: number): number {
  // Delta-E 50 이상이면 유사도 0
  const MAX_DELTA_E = 50;
  if (deltaE >= MAX_DELTA_E) return 0;
  // 선형 역비례
  return Math.round((1 - deltaE / MAX_DELTA_E) * 40);
}

/**
 * 시즌 보정 점수
 *
 * 제품의 personalColorSeasons에 사용자 시즌이 포함되면 +15
 */
function seasonBonusScore(product: CosmeticProduct, season?: PersonalColorSeason): number {
  if (!season || !product.personalColorSeasons) return 0;
  // season-presets.ts는 소문자('spring'), product type은 대문자('Spring')
  const seasonCapitalized = (season.charAt(0).toUpperCase() + season.slice(1)) as
    | 'Spring'
    | 'Summer'
    | 'Autumn'
    | 'Winter';
  return product.personalColorSeasons.includes(seasonCapitalized) ? 15 : 0;
}

/**
 * 인기도 점수 (0-15)
 *
 * 리뷰 수 + 평점 기반
 */
function popularityScore(product: CosmeticProduct): number {
  let score = 0;
  const reviewCount = product.reviewCount ?? 0;
  const rating = product.rating ?? 0;

  // 리뷰 수 기반 (0-8)
  if (reviewCount >= 5000) score += 8;
  else if (reviewCount >= 1000) score += 6;
  else if (reviewCount >= 100) score += 3;

  // 평점 기반 (0-7)
  if (rating >= 4.5) score += 7;
  else if (rating >= 4.0) score += 5;
  else if (rating >= 3.5) score += 3;

  return Math.min(15, score);
}

// ================================================
// 공개 API
// ================================================

/**
 * VTO 색상 기반 제품 매칭
 *
 * 매칭 점수 구성:
 * - 기본 점수: 30
 * - 색상 유사도: 0-40 (Delta-E 기반)
 * - 시즌 보정: +15 (퍼스널컬러 시즌 일치 시)
 * - 인기도: 0-15 (리뷰 수 + 평점)
 * → 최대 100점
 *
 * @param makeupType - 메이크업 유형 (lip, blush, eyeshadow, foundation, hair)
 * @param color - VTO에서 선택한 RGBA 색상
 * @param season - 사용자 퍼스널컬러 시즌 (선택)
 * @param limit - 반환할 최대 제품 수 (기본 5)
 * @returns 매칭 점수 내림차순 정렬된 제품 목록
 */
export async function matchProductsByColor(
  makeupType: VTOMakeupType,
  color: RgbaColor,
  season?: PersonalColorSeason,
  limit = 5
): Promise<VTOMatchedProduct[]> {
  // 1. 해당 카테고리 제품 조회
  const products = await fetchProductsByMakeupType(makeupType);

  if (products.length === 0) return [];

  // 2. 입력 색상을 Lab으로 변환
  const targetLab = rgbToLab(color.r, color.g, color.b);

  // 3. 각 제품의 매칭 점수 계산
  const BASE_SCORE = 30;
  const scored: VTOMatchedProduct[] = [];

  for (const product of products) {
    const productColor = extractProductColor(product.name);
    let deltaE = 50; // 색상 추출 실패 시 기본값 (유사도 0)

    if (productColor) {
      const productLab = rgbToLab(productColor.r, productColor.g, productColor.b);
      deltaE = calculateDeltaE(targetLab, productLab);
    }

    const score = Math.min(
      100,
      BASE_SCORE +
        colorSimilarityScore(deltaE) +
        seasonBonusScore(product, season) +
        popularityScore(product)
    );

    scored.push({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      matchScore: score,
      colorDeltaE: Math.round(deltaE * 100) / 100,
      price: product.priceKrw,
      affiliateUrl: product.affiliateUrl ?? product.purchaseUrl,
    });
  }

  // 4. 점수 내림차순 정렬 → 상위 N개 반환
  scored.sort((a, b) => b.matchScore - a.matchScore || a.colorDeltaE - b.colorDeltaE);
  return scored.slice(0, limit);
}

// ================================================
// 내부 헬퍼
// ================================================

/**
 * VTO 메이크업 타입에 맞는 제품 조회
 */
async function fetchProductsByMakeupType(makeupType: VTOMakeupType): Promise<CosmeticProduct[]> {
  if (makeupType === 'hair') {
    // 헤어 컬러 제품은 현재 DB에 별도 카테고리 없으므로 빈 배열
    // 향후 hair_color 카테고리 추가 시 여기에 쿼리 추가
    return [];
  }

  const subcategories = MAKEUP_TYPE_TO_SUBCATEGORY[makeupType];
  if (!subcategories || subcategories.length === 0) return [];

  // makeup 카테고리에서 해당 서브카테고리 제품 조회
  // getCosmeticProducts는 단일 subcategory만 지원하므로 첫 번째로 조회 후 나머지 병합
  const results: CosmeticProduct[] = [];

  for (const sub of subcategories) {
    const products = await getCosmeticProducts({ category: 'makeup', subcategory: sub }, 30);
    results.push(...products);
  }

  return results;
}
