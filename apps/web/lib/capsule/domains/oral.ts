/**
 * Oral Health 도메인 캡슐 엔진
 *
 * CapsuleEngine<OralProduct> — 구강 상태 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { OralProduct } from '../domain-types';
import { ORAL_INGREDIENT_SYNERGIES, ORAL_INGREDIENT_CONFLICTS } from '../domain-types';

const OPTIMAL_N: Record<number, number> = {
  1: 2, // 치약 + 칫솔/치실
  2: 3, // + 구강세정제
  3: 4, // + 잇몸케어
  4: 4, // 구강: 4개 이상 불필요
};

export const oralEngine: CapsuleEngine<OralProduct> = {
  domainId: 'oral',
  domainName: '구강건강',

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<OralProduct[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const conditions = profile.oral?.conditions ?? [];

    const categories: Array<OralProduct['category']> = [
      'toothpaste',
      'floss',
      'mouthwash',
      'gum-care',
      'whitening',
      'tongue-cleaner',
    ];

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `oral-placeholder-${i}`,
        name: `Oral Product ${i + 1}`,
        category: categories[i % categories.length],
        ingredients: [],
        targetConditions: conditions.length > 0 ? [conditions[i % conditions.length]] : [],
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 2;
  },

  checkCompatibility(items: OralProduct[]): CompatibilityScore {
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

  getPairwiseScore(a: OralProduct, b: OralProduct): number {
    let score = 75;

    const aIngr = a.ingredients.map((i) => i.toLowerCase());
    const bIngr = b.ingredients.map((i) => i.toLowerCase());

    // 성분 시너지 가점 (+12)
    for (const [i1, i2] of ORAL_INGREDIENT_SYNERGIES) {
      const hasSynergy =
        (aIngr.some((i) => i.includes(i1)) && bIngr.some((i) => i.includes(i2))) ||
        (aIngr.some((i) => i.includes(i2)) && bIngr.some((i) => i.includes(i1)));
      if (hasSynergy) score += 12;
    }

    // 성분 충돌 감점 (-15)
    for (const [i1, i2] of ORAL_INGREDIENT_CONFLICTS) {
      const hasConflict =
        (aIngr.some((i) => i.includes(i1)) && bIngr.some((i) => i.includes(i2))) ||
        (aIngr.some((i) => i.includes(i2)) && bIngr.some((i) => i.includes(i1)));
      if (hasConflict) score -= 15;
    }

    // 같은 카테고리 감점 (-10)
    if (a.category === b.category) score -= 10;

    return Math.max(0, Math.min(100, score));
  },

  personalize(items: OralProduct[], profile: BeautyProfile): OralProduct[] {
    if (!profile.oral) return items;
    const { conditions, goals } = profile.oral;

    return [...items].sort((a, b) => {
      const aFit = a.targetConditions.filter(
        (c) => conditions.includes(c) || goals.includes(c)
      ).length;
      const bFit = b.targetConditions.filter(
        (c) => conditions.includes(c) || goals.includes(c)
      ).length;
      return bFit - aFit;
    });
  },

  shouldRotate(capsule: Capsule<OralProduct>): boolean {
    if (!capsule.lastRotation) return false;
    const daysSince =
      (Date.now() - new Date(capsule.lastRotation).getTime()) / (1000 * 60 * 60 * 24);
    // 구강: 90일 주기
    return daysSince >= 90;
  },

  async rotate(capsule: Capsule<OralProduct>, profile: BeautyProfile): Promise<OralProduct[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.2));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  minimize(items: OralProduct[]): OralProduct[] {
    const seenCategories = new Set<string>();
    return items.filter((item) => {
      if (seenCategories.has(item.category)) return false;
      seenCategories.add(item.category);
      return true;
    });
  },
};
