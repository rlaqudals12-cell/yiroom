/**
 * Skin 도메인 캡슐 엔진
 *
 * CapsuleEngine<SkinProduct> — 성분 호환성 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { SkinProduct } from '../domain-types';
import { SKIN_INGREDIENT_CONFLICTS, SKIN_INGREDIENT_SYNERGIES } from '../domain-types';

// 데일리 루틴 스텝 — 아침/저녁 실제 스킨케어 순서 (카테고리 중복 없음: minimize가 카테고리 dedup)
// 아침: 보습→자외선차단 (가벼운 준비) / 저녁: 클렌징→토너→세럼→아이크림 (세정+집중 케어)
// 이름은 "오늘의 루틴" 위젯에 그대로 노출되므로 행동 단위 한국어로.
const DAILY_STEPS: Array<{ category: SkinProduct['category']; name: string }> = [
  // 아침 (moisturizer/sunscreen → daily.ts resolveTimeOfDay에서 morning 매핑)
  { category: 'moisturizer', name: '수분 크림으로 아침 보습' },
  { category: 'sunscreen', name: '자외선 차단제 바르기' },
  // 저녁 (cleanser/toner/serum/eye-cream → evening 매핑)
  { category: 'cleanser', name: '메이크업 지우는 꼼꼼 클렌징' },
  { category: 'toner', name: '토너로 피부결 정리' },
  { category: 'serum', name: '수분 세럼 흡수시키기' },
  { category: 'eye-cream', name: '아이크림으로 눈가 마무리' },
];

// 개인화 레벨별 최적 N
const OPTIMAL_N: Record<number, number> = {
  1: 5, // 기본 5단계
  2: 6, // + 아이크림 or 마스크
  3: 7, // + 각질제거
  4: 8, // + 추가 세럼
};

export const skinEngine: CapsuleEngine<SkinProduct> = {
  domainId: 'skin',
  domainName: '스킨케어',

  // ==========================================================================
  // C1: Curation
  // ==========================================================================

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<SkinProduct[]> {
    // 실제 구현에서는 DB에서 제품 조회 후 필터링
    // 여기서는 엔진 인터페이스만 구현 (DB 조회는 capsule-repository에서)
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    return DAILY_STEPS.slice(0, maxItems).map((step, i) => ({
      id: `skin-placeholder-${i}`,
      name: step.name,
      brand: '',
      category: step.category,
      ingredients: [],
      skinTypes: profile.skin?.type ? [profile.skin.type] : [],
      concerns: profile.skin?.concerns ?? [],
    }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 5;
  },

  // ==========================================================================
  // C2: Compatibility — 성분 호환성
  // ==========================================================================

  checkCompatibility(items: SkinProduct[]): CompatibilityScore {
    if (items.length < 2) {
      return { overall: 100, layer1: 100, layer2: 100, layer3: 100 };
    }

    let totalPairwise = 0;
    let pairCount = 0;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        totalPairwise += this.getPairwiseScore(items[i], items[j]);
        pairCount++;
      }
    }

    const l1 = pairCount > 0 ? Math.round(totalPairwise / pairCount) : 100;

    return { overall: l1, layer1: l1, layer2: 0, layer3: 0 };
  },

  getPairwiseScore(a: SkinProduct, b: SkinProduct): number {
    let score = 70; // 기본 점수

    const aIngredients = a.ingredients.map((i) => i.toLowerCase());
    const bIngredients = b.ingredients.map((i) => i.toLowerCase());

    // 성분 충돌 감점 (-20 per conflict)
    for (const [ing1, ing2] of SKIN_INGREDIENT_CONFLICTS) {
      const hasConflict =
        (aIngredients.some((i) => i.includes(ing1)) &&
          bIngredients.some((i) => i.includes(ing2))) ||
        (aIngredients.some((i) => i.includes(ing2)) && bIngredients.some((i) => i.includes(ing1)));
      if (hasConflict) {
        score -= 20;
      }
    }

    // 성분 시너지 가점 (+10 per synergy)
    for (const [ing1, ing2] of SKIN_INGREDIENT_SYNERGIES) {
      const hasSynergy =
        (aIngredients.some((i) => i.includes(ing1)) &&
          bIngredients.some((i) => i.includes(ing2))) ||
        (aIngredients.some((i) => i.includes(ing2)) && bIngredients.some((i) => i.includes(ing1)));
      if (hasSynergy) {
        score += 10;
      }
    }

    // 같은 카테고리 감점 (중복) -15
    if (a.category === b.category) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  },

  // ==========================================================================
  // C3: Personalization
  // ==========================================================================

  personalize(items: SkinProduct[], profile: BeautyProfile): SkinProduct[] {
    if (!profile.skin) return items;

    const { type: skinType, concerns } = profile.skin;

    // 피부타입 일치도에 따라 정렬
    return [...items].sort((a, b) => {
      const aFit = calculateSkinFit(a, skinType, concerns);
      const bFit = calculateSkinFit(b, skinType, concerns);
      return bFit - aFit;
    });
  },

  // ==========================================================================
  // C4: Rotation
  // ==========================================================================

  shouldRotate(capsule: Capsule<SkinProduct>): boolean {
    if (!capsule.lastRotation) return false;

    const lastRotation = new Date(capsule.lastRotation);
    const now = new Date();
    const daysSince = (now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);

    // 스킨케어: 30일 주기 로테이션
    return daysSince >= 30;
  },

  async rotate(capsule: Capsule<SkinProduct>, profile: BeautyProfile): Promise<SkinProduct[]> {
    // 20-40% 교체 (최소 1개)
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.3));
    const curated = await this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
    return curated;
  },

  // ==========================================================================
  // C5: Minimalism
  // ==========================================================================

  minimize(items: SkinProduct[]): SkinProduct[] {
    // 같은 카테고리 중복 제거 (첫 번째만 유지)
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.category)) return false;
      seen.add(item.category);
      return true;
    });
  },
};

// =============================================================================
// 내부 유틸
// =============================================================================

function calculateSkinFit(product: SkinProduct, skinType: string, concerns: string[]): number {
  let fit = 50;

  // 피부 타입 일치
  if (product.skinTypes.some((t) => t.toLowerCase() === skinType.toLowerCase())) {
    fit += 30;
  }

  // 고민 일치 (각 +10, 최대 +20)
  const matchedConcerns = product.concerns.filter((c) =>
    concerns.some((uc) => uc.toLowerCase() === c.toLowerCase())
  );
  fit += Math.min(20, matchedConcerns.length * 10);

  return Math.min(100, fit);
}
