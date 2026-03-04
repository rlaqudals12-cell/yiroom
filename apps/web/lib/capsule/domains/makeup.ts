/**
 * Makeup 도메인 캡슐 엔진
 *
 * CapsuleEngine<MakeupProduct> — 퍼스널컬러/마감 조화 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { MakeupProduct } from '../domain-types';
import { FINISH_HARMONY } from '../domain-types';

const OPTIMAL_N: Record<number, number> = {
  1: 3, // 베이스 + 립 + 아이
  2: 4, // + 치크
  3: 5, // + 브로우
  4: 6, // + 세팅
};

export const makeupEngine: CapsuleEngine<MakeupProduct> = {
  domainId: 'makeup',
  domainName: '메이크업',

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<MakeupProduct[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const season = profile.personalColor?.season;

    const categories: Array<MakeupProduct['category']> = [
      'base',
      'eye',
      'lip',
      'cheek',
      'brow',
      'setting',
    ];

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `makeup-placeholder-${i}`,
        name: `Makeup ${categories[i % categories.length]} ${i + 1}`,
        category: categories[i % categories.length],
        finish: 'satin' as const,
        seasonMatch: season ? [season] : [],
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 3;
  },

  checkCompatibility(items: MakeupProduct[]): CompatibilityScore {
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

  getPairwiseScore(a: MakeupProduct, b: MakeupProduct): number {
    let score = 75;

    // 마감 조화 체크
    if (a.finish && b.finish) {
      const harmonyList = FINISH_HARMONY[a.finish];
      if (harmonyList?.includes(b.finish)) {
        score += 10;
      } else if (a.finish === b.finish && a.finish !== 'satin') {
        // 같은 마감 반복 (satin 제외) — 단조로움 감점
        score -= 5;
      }
    }

    // 같은 카테고리 감점 (-15)
    if (a.category === b.category) score -= 15;

    // 시즌 매칭 가점 (+8)
    if (a.seasonMatch && b.seasonMatch) {
      const hasCommonSeason = a.seasonMatch.some((s) => b.seasonMatch?.includes(s));
      if (hasCommonSeason) score += 8;
    }

    return Math.max(0, Math.min(100, score));
  },

  personalize(items: MakeupProduct[], profile: BeautyProfile): MakeupProduct[] {
    const season = profile.personalColor?.season;
    if (!season) return items;

    // 퍼스널컬러 시즌 매칭 우선 정렬
    return [...items].sort((a, b) => {
      const aMatch = a.seasonMatch?.includes(season) ? 1 : 0;
      const bMatch = b.seasonMatch?.includes(season) ? 1 : 0;
      return bMatch - aMatch;
    });
  },

  shouldRotate(capsule: Capsule<MakeupProduct>): boolean {
    if (!capsule.lastRotation) return false;
    const daysSince =
      (Date.now() - new Date(capsule.lastRotation).getTime()) / (1000 * 60 * 60 * 24);
    // 메이크업: 90일 주기 (계절 변화)
    return daysSince >= 90;
  },

  async rotate(capsule: Capsule<MakeupProduct>, profile: BeautyProfile): Promise<MakeupProduct[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.3));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  minimize(items: MakeupProduct[]): MakeupProduct[] {
    const seenCategories = new Set<string>();
    return items.filter((item) => {
      if (seenCategories.has(item.category)) return false;
      seenCategories.add(item.category);
      return true;
    });
  },
};
