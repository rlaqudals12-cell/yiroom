/**
 * Hair 도메인 캡슐 엔진
 *
 * CapsuleEngine<HairProduct> — 모발/두피 타입 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { HairProduct } from '../domain-types';
import { HAIR_INGREDIENT_SYNERGIES, HAIR_INGREDIENT_CONFLICTS } from '../domain-types';

const OPTIMAL_N: Record<number, number> = {
  1: 2, // 샴푸 + 컨디셔너
  2: 3, // + 트리트먼트
  3: 4, // + 두피케어
  4: 5, // + 스타일링
};

export const hairEngine: CapsuleEngine<HairProduct> = {
  domainId: 'hair',
  domainName: '헤어',

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<HairProduct[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const hairType = profile.hair?.type ?? 'normal';
    const scalpType = profile.hair?.scalp ?? 'normal';

    const categories: Array<HairProduct['category']> = [
      'shampoo',
      'conditioner',
      'treatment',
      'scalp-care',
      'styling',
      'hair-oil',
    ];

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `hair-placeholder-${i}`,
        name: `Hair Product ${i + 1}`,
        category: categories[i % categories.length],
        ingredients: [],
        hairTypes: [hairType],
        scalpTypes: [scalpType],
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 2;
  },

  checkCompatibility(items: HairProduct[]): CompatibilityScore {
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

  getPairwiseScore(a: HairProduct, b: HairProduct): number {
    let score = 70;

    const aIngr = a.ingredients.map((i) => i.toLowerCase());
    const bIngr = b.ingredients.map((i) => i.toLowerCase());

    // 성분 시너지 가점 (+12)
    for (const [i1, i2] of HAIR_INGREDIENT_SYNERGIES) {
      const hasSynergy =
        (aIngr.some((i) => i.includes(i1)) && bIngr.some((i) => i.includes(i2))) ||
        (aIngr.some((i) => i.includes(i2)) && bIngr.some((i) => i.includes(i1)));
      if (hasSynergy) score += 12;
    }

    // 성분 충돌 감점 (-15)
    for (const [i1, i2] of HAIR_INGREDIENT_CONFLICTS) {
      const hasConflict =
        (aIngr.some((i) => i.includes(i1)) && bIngr.some((i) => i.includes(i2))) ||
        (aIngr.some((i) => i.includes(i2)) && bIngr.some((i) => i.includes(i1)));
      if (hasConflict) score -= 15;
    }

    // 같은 카테고리 감점 (-10)
    if (a.category === b.category) score -= 10;

    return Math.max(0, Math.min(100, score));
  },

  personalize(items: HairProduct[], profile: BeautyProfile): HairProduct[] {
    if (!profile.hair) return items;
    const { concerns } = profile.hair;

    return [...items].sort((a, b) => {
      const aFit = a.hairTypes.some((t) => t === profile.hair?.type) ? 10 : 0;
      const bFit = b.hairTypes.some((t) => t === profile.hair?.type) ? 10 : 0;
      const aConcern = concerns.some((c) =>
        a.ingredients.some((i) => i.toLowerCase().includes(c.toLowerCase()))
      )
        ? 5
        : 0;
      const bConcern = concerns.some((c) =>
        b.ingredients.some((i) => i.toLowerCase().includes(c.toLowerCase()))
      )
        ? 5
        : 0;
      return bFit + bConcern - (aFit + aConcern);
    });
  },

  shouldRotate(capsule: Capsule<HairProduct>): boolean {
    if (!capsule.lastRotation) return false;
    const daysSince =
      (Date.now() - new Date(capsule.lastRotation).getTime()) / (1000 * 60 * 60 * 24);
    // 헤어: 45일 주기
    return daysSince >= 45;
  },

  async rotate(capsule: Capsule<HairProduct>, profile: BeautyProfile): Promise<HairProduct[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.2));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  minimize(items: HairProduct[]): HairProduct[] {
    const seenCategories = new Set<string>();
    return items.filter((item) => {
      if (seenCategories.has(item.category)) return false;
      seenCategories.add(item.category);
      return true;
    });
  },
};
