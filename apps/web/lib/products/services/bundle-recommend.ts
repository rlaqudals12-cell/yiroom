/**
 * 제품 번들 추천
 * @description 시너지 기반 보완 제품 + 루틴 번들 제안
 */

import {
  extractIngredientKeywords,
  analyzeInteraction,
  inferRoutineStep,
} from '@/lib/inventory/product-synergy';
import type { RoutineStep } from '@/lib/inventory/product-synergy';

// ============================================
// 타입
// ============================================

export interface BundleProduct {
  name: string;
  tags?: string[];
}

export interface BundleRecommendation {
  /** 번들 유형 */
  type: 'synergy' | 'routine_gap' | 'conflict_alternative';
  /** 추천 이유 */
  reason: string;
  /** 추천 대상 제품 이름 */
  suggestedProductName: string;
  /** 관련 기존 제품 이름 */
  relatedProductName: string;
}

export interface ConflictWarning {
  /** 충돌 제품 A */
  productA: string;
  /** 충돌 제품 B */
  productB: string;
  /** 설명 */
  description: string;
  /** 조언 */
  advice: string;
}

export interface BundleAnalysis {
  /** 시너지 추천 */
  recommendations: BundleRecommendation[];
  /** 충돌 경고 */
  conflicts: ConflictWarning[];
  /** 루틴 갭 (빠진 단계) */
  missingSteps: RoutineStep[];
}

// ============================================
// 시너지 기반 보완 제품 제안
// ============================================

/** 성분별 시너지 파트너 추천 */
const SYNERGY_SUGGESTIONS: Record<
  string,
  { partner: string; productType: string; reason: string }
> = {
  비타민c: {
    partner: '비타민e',
    productType: '비타민E 세럼/오일',
    reason: '비타민C+E 조합은 항산화 효과가 4배 높아져요.',
  },
  'vitamin c': {
    partner: 'vitamin e',
    productType: '비타민E 세럼/오일',
    reason: '비타민C+E 조합은 항산화 효과가 4배 높아져요.',
  },
  히알루론산: {
    partner: '세라마이드',
    productType: '세라마이드 크림',
    reason: '히알루론산이 수분을 끌어당기고 세라마이드가 잠가줘요.',
  },
  'hyaluronic acid': {
    partner: 'ceramide',
    productType: '세라마이드 크림',
    reason: '히알루론산이 수분을 끌어당기고 세라마이드가 잠가줘요.',
  },
  나이아신아마이드: {
    partner: '히알루론산',
    productType: '히알루론산 토너/세럼',
    reason: '나이아신아마이드+히알루론산은 피부 장벽 강화에 시너지를 내요.',
  },
  niacinamide: {
    partner: 'hyaluronic acid',
    productType: '히알루론산 토너/세럼',
    reason: '나이아신아마이드+히알루론산은 피부 장벽 강화에 시너지를 내요.',
  },
  레티놀: {
    partner: '세라마이드',
    productType: '세라마이드/스쿠알란 보습제',
    reason: '레티놀 사용 시 세라마이드가 자극을 줄여줘요.',
  },
  retinol: {
    partner: 'ceramide',
    productType: '세라마이드/스쿠알란 보습제',
    reason: '레티놀 사용 시 세라마이드가 자극을 줄여줘요.',
  },
};

/**
 * 보유 제품에서 시너지 파트너가 빠진 성분 찾기
 */
export function findSynergyGaps(products: BundleProduct[]): BundleRecommendation[] {
  const recommendations: BundleRecommendation[] = [];

  // 전체 보유 성분 수집
  const allIngredients = new Set<string>();
  const productIngredientMap = new Map<string, string[]>();

  for (const product of products) {
    const ingredients = extractIngredientKeywords(product.name, product.tags);
    productIngredientMap.set(product.name, ingredients);
    for (const ing of ingredients) {
      allIngredients.add(ing);
    }
  }

  // 각 성분의 시너지 파트너 확인
  for (const [productName, ingredients] of productIngredientMap) {
    for (const ingredient of ingredients) {
      const suggestion = SYNERGY_SUGGESTIONS[ingredient];
      if (!suggestion) continue;

      // 파트너 성분이 이미 보유 중인지 확인
      if (!allIngredients.has(suggestion.partner)) {
        // 중복 추천 방지
        const alreadyRecommended = recommendations.some(
          (r) => r.suggestedProductName === suggestion.productType
        );
        if (!alreadyRecommended) {
          recommendations.push({
            type: 'synergy',
            reason: suggestion.reason,
            suggestedProductName: suggestion.productType,
            relatedProductName: productName,
          });
        }
      }
    }
  }

  return recommendations;
}

// ============================================
// 루틴 갭 분석
// ============================================

const ALL_ROUTINE_STEPS: RoutineStep[] = [
  'cleansing',
  'toner',
  'essence',
  'serum',
  'cream',
  'sunscreen',
];

/**
 * 보유 제품의 루틴 단계에서 빠진 것 찾기
 */
export function findRoutineGaps(products: BundleProduct[]): RoutineStep[] {
  const coveredSteps = new Set<RoutineStep>();

  for (const product of products) {
    const step = inferRoutineStep(product.name);
    if (step) coveredSteps.add(step);
  }

  return ALL_ROUTINE_STEPS.filter((step) => !coveredSteps.has(step));
}

const STEP_NAMES: Record<RoutineStep, string> = {
  cleansing: '클렌저',
  toner: '토너',
  essence: '에센스',
  serum: '세럼',
  cream: '크림',
  sunscreen: '선크림',
};

/**
 * 루틴 갭에 대한 추천 생성
 */
function generateRoutineGapRecommendations(missingSteps: RoutineStep[]): BundleRecommendation[] {
  return missingSteps.map((step) => ({
    type: 'routine_gap' as const,
    reason: `스킨케어 루틴에서 ${STEP_NAMES[step]} 단계가 빠져 있어요.`,
    suggestedProductName: STEP_NAMES[step],
    relatedProductName: '현재 루틴',
  }));
}

// ============================================
// 충돌 감지
// ============================================

/**
 * 보유 제품 간 충돌 감지
 */
export function findConflicts(products: BundleProduct[]): ConflictWarning[] {
  const conflicts: ConflictWarning[] = [];

  for (let i = 0; i < products.length; i++) {
    const ingA = extractIngredientKeywords(products[i].name, products[i].tags);
    if (ingA.length === 0) continue;

    for (let j = i + 1; j < products.length; j++) {
      const ingB = extractIngredientKeywords(products[j].name, products[j].tags);
      if (ingB.length === 0) continue;

      const interactions = analyzeInteraction(ingA, ingB);
      for (const interaction of interactions) {
        if (interaction.type === 'conflict') {
          conflicts.push({
            productA: products[i].name,
            productB: products[j].name,
            description: interaction.description,
            advice: interaction.advice,
          });
        }
      }
    }
  }

  return conflicts;
}

// ============================================
// 통합 분석
// ============================================

/**
 * 제품 번들 통합 분석
 * @param products - 보유 제품 목록
 * @returns 시너지 추천, 충돌 경고, 루틴 갭
 */
export function analyzeBundleOpportunities(products: BundleProduct[]): BundleAnalysis {
  const synergyRecommendations = findSynergyGaps(products);
  const conflicts = findConflicts(products);
  const missingSteps = findRoutineGaps(products);
  const routineRecommendations = generateRoutineGapRecommendations(missingSteps);

  return {
    recommendations: [...synergyRecommendations, ...routineRecommendations],
    conflicts,
    missingSteps,
  };
}
