/**
 * 제품 매칭 알고리즘 모듈
 *
 * 사용자 프로필 기반 제품 매칭 점수 계산
 *
 * @module lib/product-recommendations
 */

import type { Season } from '../color-classification';

// ─── 타입 ────────────────────────────────────────────

export interface UserProfile {
  season?: Season;
  skinType?: string;
  concerns?: string[];
  allergens?: string[];
}

export interface MatchResult {
  productId: string;
  score: number;
  reasons: MatchReason[];
}

export interface MatchReason {
  category: 'color' | 'skin' | 'concern' | 'ingredient';
  label: string;
  score: number;
}

interface ProductMatchInput {
  id: string;
  colorTone?: string;
  skinTypes?: string[];
  concerns?: string[];
  ingredients?: string[];
}

// ─── 매칭 가중치 ────────────────────────────────────

const WEIGHTS = {
  color: 25,     // 퍼스널컬러 매칭 (25점)
  skin: 30,      // 피부타입 매칭 (30점)
  concern: 25,   // 고민 해결 (25점)
  ingredient: 20, // 성분 안전성 (20점)
} as const;

// ─── 시즌-톤 매핑 ───────────────────────────────────

const SEASON_TONE_MAP: Record<Season, string> = {
  spring: 'warm',
  summer: 'cool',
  autumn: 'warm',
  winter: 'cool',
};

// ─── 매칭 로직 ──────────────────────────────────────

/**
 * 퍼스널컬러 매칭 점수 (0-25)
 */
function calculateColorScore(
  product: ProductMatchInput,
  profile: UserProfile
): MatchReason | null {
  if (!profile.season || !product.colorTone) return null;

  const userTone = SEASON_TONE_MAP[profile.season];
  const match = product.colorTone === userTone;
  const score = match ? WEIGHTS.color : Math.round(WEIGHTS.color * 0.4);

  return {
    category: 'color',
    label: match
      ? `${profile.season} 시즌에 어울리는 톤`
      : '톤이 다르지만 활용 가능',
    score,
  };
}

/**
 * 피부타입 매칭 점수 (0-30)
 */
function calculateSkinScore(
  product: ProductMatchInput,
  profile: UserProfile
): MatchReason | null {
  if (!profile.skinType || !product.skinTypes?.length) return null;

  const match = product.skinTypes.includes(profile.skinType);
  const score = match ? WEIGHTS.skin : Math.round(WEIGHTS.skin * 0.3);

  return {
    category: 'skin',
    label: match
      ? `${profile.skinType} 피부에 적합`
      : '다른 피부타입 대상 제품',
    score,
  };
}

/**
 * 고민 해결 매칭 점수 (0-25)
 */
function calculateConcernScore(
  product: ProductMatchInput,
  profile: UserProfile
): MatchReason | null {
  if (!profile.concerns?.length || !product.concerns?.length) return null;

  const matches = profile.concerns.filter((c) =>
    product.concerns!.includes(c)
  );
  const ratio = matches.length / profile.concerns.length;
  const score = Math.round(WEIGHTS.concern * ratio);

  return {
    category: 'concern',
    label:
      matches.length > 0
        ? `${matches.join(', ')} 개선에 도움`
        : '해당 고민과 무관',
    score,
  };
}

/**
 * 성분 안전성 점수 (0-20)
 */
function calculateIngredientScore(
  product: ProductMatchInput,
  profile: UserProfile
): MatchReason | null {
  if (!profile.allergens?.length || !product.ingredients?.length) {
    return { category: 'ingredient', label: '성분 정보 확인 불가', score: Math.round(WEIGHTS.ingredient * 0.5) };
  }

  const hasAllergen = product.ingredients.some((ing) =>
    profile.allergens!.some((a) => ing.toLowerCase().includes(a.toLowerCase()))
  );

  return {
    category: 'ingredient',
    label: hasAllergen ? '주의 성분 포함' : '알러지 유발 성분 없음',
    score: hasAllergen ? 0 : WEIGHTS.ingredient,
  };
}

// ─── 공개 API ───────────────────────────────────────

/**
 * 제품 매칭 점수 계산 (0-100)
 */
export function calculateMatchScore(
  product: ProductMatchInput,
  profile: UserProfile
): MatchResult {
  const reasons: MatchReason[] = [];

  const colorScore = calculateColorScore(product, profile);
  const skinScore = calculateSkinScore(product, profile);
  const concernScore = calculateConcernScore(product, profile);
  const ingredientScore = calculateIngredientScore(product, profile);

  if (colorScore) reasons.push(colorScore);
  if (skinScore) reasons.push(skinScore);
  if (concernScore) reasons.push(concernScore);
  if (ingredientScore) reasons.push(ingredientScore);

  const score = reasons.reduce((sum, r) => sum + r.score, 0);

  return {
    productId: product.id,
    score: Math.min(100, score),
    reasons,
  };
}

/**
 * 매칭 등급 라벨
 */
export function getMatchGrade(score: number): string {
  if (score >= 85) return '최고 추천';
  if (score >= 70) return '추천';
  if (score >= 50) return '보통';
  if (score >= 30) return '낮음';
  return '비추천';
}

/**
 * 매칭 점수순 정렬
 */
export function sortByMatchScore(
  products: ProductMatchInput[],
  profile: UserProfile
): MatchResult[] {
  return products
    .map((p) => calculateMatchScore(p, profile))
    .sort((a, b) => b.score - a.score);
}
