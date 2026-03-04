/**
 * Nutrition 도메인 캡슐 엔진
 *
 * CapsuleEngine<NutritionItem> — 영양소 균형 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { NutritionItem } from '../domain-types';
import { NUTRIENT_SYNERGIES, NUTRIENT_CONFLICTS, DEFICIENCY_NUTRIENTS } from '../domain-types';

// 개인화 레벨별 최적 N
const OPTIMAL_N: Record<number, number> = {
  1: 3, // 기본 보충제 3개
  2: 4, // + 맞춤 보충제
  3: 5, // + 기능성 식품
  4: 6, // + 식단 계획
};

export const nutritionEngine: CapsuleEngine<NutritionItem> = {
  domainId: 'nutrition',
  domainName: '영양',

  // ==========================================================================
  // C1: Curation
  // ==========================================================================

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<NutritionItem[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const deficiencies = profile.nutrition?.deficiencies ?? [];

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `nutrition-placeholder-${i}`,
        name: `Supplement ${i + 1}`,
        category: 'supplement' as const,
        nutrients:
          deficiencies.length > 0
            ? [
                {
                  name: deficiencies[i % deficiencies.length] ?? 'vitamin d',
                  amount: 100,
                  unit: '%',
                },
              ]
            : [{ name: 'multivitamin', amount: 100, unit: '%' }],
        dailyServings: 1,
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 3;
  },

  // ==========================================================================
  // C2: Compatibility — 영양소 상호작용
  // ==========================================================================

  checkCompatibility(items: NutritionItem[]): CompatibilityScore {
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

  getPairwiseScore(a: NutritionItem, b: NutritionItem): number {
    let score = 70; // 기본 점수

    const aNutrients = a.nutrients.map((n) => n.name.toLowerCase());
    const bNutrients = b.nutrients.map((n) => n.name.toLowerCase());

    // 영양소 충돌 감점 (-15 per conflict)
    for (const [n1, n2] of NUTRIENT_CONFLICTS) {
      const hasConflict =
        (aNutrients.some((n) => n.includes(n1)) && bNutrients.some((n) => n.includes(n2))) ||
        (aNutrients.some((n) => n.includes(n2)) && bNutrients.some((n) => n.includes(n1)));
      if (hasConflict) {
        score -= 15;
      }
    }

    // 영양소 시너지 가점 (+12 per synergy)
    for (const [n1, n2] of NUTRIENT_SYNERGIES) {
      const hasSynergy =
        (aNutrients.some((n) => n.includes(n1)) && bNutrients.some((n) => n.includes(n2))) ||
        (aNutrients.some((n) => n.includes(n2)) && bNutrients.some((n) => n.includes(n1)));
      if (hasSynergy) {
        score += 12;
      }
    }

    // 같은 영양소 중복 감점 (-10)
    const overlap = aNutrients.filter((n) => bNutrients.some((bn) => bn === n));
    if (overlap.length > 0) {
      score -= overlap.length * 10;
    }

    return Math.max(0, Math.min(100, score));
  },

  // ==========================================================================
  // C3: Personalization — 결핍 영양소 우선
  // ==========================================================================

  personalize(items: NutritionItem[], profile: BeautyProfile): NutritionItem[] {
    if (!profile.nutrition) return items;

    const { deficiencies, allergies } = profile.nutrition;

    // 알레르기 필터링
    let filtered = items;
    if (allergies.length > 0) {
      filtered = items.filter(
        (item) =>
          !item.nutrients.some((n) =>
            allergies.some((a) => n.name.toLowerCase().includes(a.toLowerCase()))
          )
      );
    }

    // 결핍 영양소 매칭 정렬
    return [...filtered].sort((a, b) => {
      const aFit = calculateNutritionFit(a, deficiencies);
      const bFit = calculateNutritionFit(b, deficiencies);
      return bFit - aFit;
    });
  },

  // ==========================================================================
  // C4: Rotation — 건강 상태 변화 기반
  // ==========================================================================

  shouldRotate(capsule: Capsule<NutritionItem>): boolean {
    if (!capsule.lastRotation) return false;

    const lastRotation = new Date(capsule.lastRotation);
    const now = new Date();
    const daysSince = (now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);

    // 영양: 60일 주기
    return daysSince >= 60;
  },

  async rotate(capsule: Capsule<NutritionItem>, profile: BeautyProfile): Promise<NutritionItem[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.2));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  // ==========================================================================
  // C5: Minimalism — 중복 영양소 제거
  // ==========================================================================

  minimize(items: NutritionItem[]): NutritionItem[] {
    // 핵심 영양소 중복 제거 (같은 주요 영양소를 가진 아이템)
    const primaryNutrients = new Set<string>();
    return items.filter((item) => {
      const primary = item.nutrients[0]?.name.toLowerCase();
      if (!primary) return true;
      if (primaryNutrients.has(primary)) return false;
      primaryNutrients.add(primary);
      return true;
    });
  },
};

// =============================================================================
// 내부 유틸
// =============================================================================

/**
 * 영양 적합도 계산 (결핍 영양소 매칭)
 */
function calculateNutritionFit(item: NutritionItem, deficiencies: string[]): number {
  let fit = 50;

  for (const deficiency of deficiencies) {
    // 결핍 → 권장 영양소 매핑
    const recommended = DEFICIENCY_NUTRIENTS[deficiency];
    if (!recommended) continue;

    // 아이템의 영양소가 권장에 포함되면 가점
    const matched = item.nutrients.some((n) =>
      recommended.some((r) => n.name.toLowerCase().includes(r))
    );
    if (matched) {
      fit += 20;
    }
  }

  return Math.min(100, fit);
}
