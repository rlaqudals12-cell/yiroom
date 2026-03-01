/**
 * 패션/코디 추천 모듈
 *
 * 스타일 카테고리, 코디 조합, 사이즈 추천
 *
 * @module lib/fashion
 */

// ─── 타입 ────────────────────────────────────────────

export type StyleCategory =
  | 'casual'
  | 'street'
  | 'minimal'
  | 'classic'
  | 'romantic'
  | 'sporty'
  | 'bohemian'
  | 'preppy'
  | 'modern'
  | 'vintage';

export type FitType = 'slim' | 'regular' | 'relaxed';
export type HeightFit = 'short' | 'regular' | 'long' | 'petite';
export type BodyTypeCode = 'S' | 'W' | 'N';

export interface OutfitItem {
  category: 'outer' | 'top' | 'bottom' | 'shoes' | 'accessory';
  name: string;
  color: string;
  style: StyleCategory;
  season: string[];
}

export interface OutfitCombination {
  id: string;
  items: OutfitItem[];
  style: StyleCategory;
  occasion: string;
  score: number;
  reason: string;
}

export interface SizeRecommendation {
  top: string;
  bottom: string;
  outer: string;
  shoes: number;
  dress?: string;
  fit: FitType;
}

export interface StyleBest10 {
  rank: number;
  style: StyleCategory;
  label: string;
  description: string;
  compatibility: number;
  items: OutfitItem[];
}

// ─── 스타일 상수 ──────────────────────────────────────

export const STYLE_LABELS: Record<StyleCategory, string> = {
  casual: '캐주얼',
  street: '스트릿',
  minimal: '미니멀',
  classic: '클래식',
  romantic: '로맨틱',
  sporty: '스포티',
  bohemian: '보헤미안',
  preppy: '프레피',
  modern: '모던',
  vintage: '빈티지',
};

export const STYLE_DESCRIPTIONS: Record<StyleCategory, string> = {
  casual: '편안하고 자연스러운 일상 스타일',
  street: '자유롭고 트렌디한 거리 패션',
  minimal: '깔끔하고 절제된 디자인',
  classic: '시대를 초월하는 우아한 스타일',
  romantic: '여성스럽고 부드러운 분위기',
  sporty: '활동적이고 건강한 이미지',
  bohemian: '자유분방하고 예술적인 무드',
  preppy: '단정하고 학구적인 분위기',
  modern: '세련되고 도시적인 스타일',
  vintage: '레트로 감성의 클래식 무드',
};

// ─── 퍼스널컬러 × 스타일 매핑 ─────────────────────────

export const STYLE_BY_PERSONAL_COLOR: Record<string, StyleCategory[]> = {
  spring: ['casual', 'romantic', 'preppy', 'bohemian'],
  summer: ['minimal', 'romantic', 'classic', 'modern'],
  autumn: ['classic', 'bohemian', 'vintage', 'street'],
  winter: ['modern', 'minimal', 'street', 'classic'],
};

// ─── 체형 × 스타일 매핑 ───────────────────────────────

export const STYLE_BY_BODY_TYPE: Record<BodyTypeCode, StyleCategory[]> = {
  S: ['casual', 'minimal', 'classic', 'romantic'],
  W: ['street', 'sporty', 'casual', 'modern'],
  N: ['minimal', 'modern', 'classic', 'preppy'],
};

// ─── 추천 로직 ────────────────────────────────────────

/**
 * 스타일 호환성 점수 (0-100)
 */
export function calculateStyleCompatibility(
  style: StyleCategory,
  personalColor?: string | null,
  bodyType?: BodyTypeCode | null
): number {
  let score = 50; // 기본점수

  // 퍼스널컬러 매칭 (+25)
  if (personalColor) {
    const recommended = STYLE_BY_PERSONAL_COLOR[personalColor] ?? [];
    const index = recommended.indexOf(style);
    if (index === 0) score += 25;
    else if (index === 1) score += 20;
    else if (index >= 2) score += 15;
  }

  // 체형 매칭 (+25)
  if (bodyType) {
    const recommended = STYLE_BY_BODY_TYPE[bodyType] ?? [];
    const index = recommended.indexOf(style);
    if (index === 0) score += 25;
    else if (index === 1) score += 20;
    else if (index >= 2) score += 15;
  }

  return Math.min(100, score);
}

/**
 * 추천 스타일 목록 (호환성 순)
 */
export function getRecommendedStyles(
  personalColor?: string | null,
  bodyType?: BodyTypeCode | null
): { style: StyleCategory; label: string; compatibility: number }[] {
  const allStyles = Object.keys(STYLE_LABELS) as StyleCategory[];

  return allStyles
    .map((style) => ({
      style,
      label: STYLE_LABELS[style],
      compatibility: calculateStyleCompatibility(style, personalColor, bodyType),
    }))
    .sort((a, b) => b.compatibility - a.compatibility);
}

/**
 * 코디 조합 생성
 */
export function generateOutfitCombination(
  style: StyleCategory,
  season: string,
  occasion: string
): OutfitCombination {
  const palette = STYLE_COLOR_PALETTES[style] ?? ['#000000', '#ffffff', '#808080'];
  const items = generateItemsForStyle(style, season, palette);

  return {
    id: `outfit-${style}-${season}-${Date.now()}`,
    items,
    style,
    occasion,
    score: 75 + Math.floor(Math.random() * 20),
    reason: `${STYLE_LABELS[style]} 스타일에 ${season} 시즌 추천 조합`,
  };
}

// ─── 사이즈 추천 ──────────────────────────────────────

/**
 * 키에 따른 기장 추천
 */
export function determineHeightFit(heightCm: number, gender: 'male' | 'female'): HeightFit {
  if (gender === 'female') {
    if (heightCm < 155) return 'petite';
    if (heightCm < 162) return 'short';
    if (heightCm < 170) return 'regular';
    return 'long';
  }
  if (heightCm < 168) return 'short';
  if (heightCm < 178) return 'regular';
  return 'long';
}

/**
 * 사이즈 추천
 */
export function recommendSize(
  heightCm: number,
  weightKg: number,
  gender: 'male' | 'female'
): SizeRecommendation {
  // BMI 기반 간단 추천
  const bmi = weightKg / ((heightCm / 100) ** 2);

  let top: string;
  let bottom: string;
  let outer: string;
  let fit: FitType;

  if (gender === 'female') {
    if (bmi < 19) { top = 'XS'; bottom = 'XS'; outer = 'S'; fit = 'slim'; }
    else if (bmi < 21) { top = 'S'; bottom = 'S'; outer = 'S'; fit = 'slim'; }
    else if (bmi < 23) { top = 'M'; bottom = 'M'; outer = 'M'; fit = 'regular'; }
    else if (bmi < 26) { top = 'L'; bottom = 'L'; outer = 'L'; fit = 'regular'; }
    else { top = 'XL'; bottom = 'XL'; outer = 'XL'; fit = 'relaxed'; }
  } else {
    if (bmi < 20) { top = 'S'; bottom = '28'; outer = 'S'; fit = 'slim'; }
    else if (bmi < 23) { top = 'M'; bottom = '30'; outer = 'M'; fit = 'regular'; }
    else if (bmi < 26) { top = 'L'; bottom = '32'; outer = 'L'; fit = 'regular'; }
    else if (bmi < 29) { top = 'XL'; bottom = '34'; outer = 'XL'; fit = 'relaxed'; }
    else { top = 'XXL'; bottom = '36'; outer = 'XXL'; fit = 'relaxed'; }
  }

  // 신발 추정 (키 기반)
  const shoes = gender === 'female'
    ? Math.round(heightCm * 0.152)
    : Math.round(heightCm * 0.158);

  return { top, bottom, outer, shoes, fit };
}

// ─── 내부 유틸리티 ────────────────────────────────────

const STYLE_COLOR_PALETTES: Record<StyleCategory, string[]> = {
  casual: ['#4a90d9', '#ffffff', '#2c3e50', '#f5f5dc'],
  street: ['#000000', '#ffffff', '#ff4757', '#2ed573'],
  minimal: ['#000000', '#ffffff', '#c0c0c0', '#f5f5f5'],
  classic: ['#2c3e50', '#8b4513', '#f5f5dc', '#ffffff'],
  romantic: ['#ffb6c1', '#ffd700', '#ffffff', '#dda0dd'],
  sporty: ['#000000', '#ffffff', '#00bcd4', '#ff5722'],
  bohemian: ['#d2691e', '#daa520', '#f5deb3', '#8b4513'],
  preppy: ['#003366', '#cc0000', '#ffffff', '#f5f5dc'],
  modern: ['#333333', '#ffffff', '#808080', '#c0c0c0'],
  vintage: ['#8b4513', '#daa520', '#f5f5dc', '#696969'],
};

function generateItemsForStyle(
  style: StyleCategory,
  season: string,
  palette: string[]
): OutfitItem[] {
  const items: OutfitItem[] = [
    { category: 'top', name: `${STYLE_LABELS[style]} 상의`, color: palette[0], style, season: [season] },
    { category: 'bottom', name: `${STYLE_LABELS[style]} 하의`, color: palette[1], style, season: [season] },
    { category: 'shoes', name: `${STYLE_LABELS[style]} 신발`, color: palette[2], style, season: [season] },
  ];

  // 겨울/가을엔 아우터 추가
  if (season === 'winter' || season === 'autumn') {
    items.push({
      category: 'outer',
      name: `${STYLE_LABELS[style]} 아우터`,
      color: palette[3] ?? palette[0],
      style,
      season: [season],
    });
  }

  return items;
}
