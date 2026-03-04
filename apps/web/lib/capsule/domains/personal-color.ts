/**
 * Personal Color 도메인 캡슐 엔진
 *
 * CapsuleEngine<PCPalette> — 시즌 적합도 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { PCPalette } from '../domain-types';

const OPTIMAL_N: Record<number, number> = {
  1: 2, // 의류 + 메이크업 팔레트
  2: 3, // + 액세서리
  3: 4, // + 헤어컬러
  4: 4, // 정보 제공 도메인, 4개 이상 불필요
};

// 시즌 간 조화도 (0-100)
const SEASON_HARMONY: Record<string, Record<string, number>> = {
  spring: { spring: 100, autumn: 60, summer: 40, winter: 30 },
  summer: { summer: 100, winter: 60, spring: 40, autumn: 30 },
  autumn: { autumn: 100, spring: 60, winter: 40, summer: 30 },
  winter: { winter: 100, summer: 60, autumn: 40, spring: 30 },
};

export const personalColorEngine: CapsuleEngine<PCPalette> = {
  domainId: 'personal-color',
  domainName: '퍼스널컬러',

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<PCPalette[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const season = profile.personalColor?.season ?? 'spring';
    const palette = profile.personalColor?.palette ?? [];

    const categories: Array<PCPalette['category']> = [
      'clothing',
      'makeup',
      'accessory',
      'hair-color',
    ];

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `pc-placeholder-${i}`,
        name: `${season} ${categories[i % categories.length]} 팔레트`,
        category: categories[i % categories.length],
        colors: palette.length > 0 ? palette.slice(0, 5) : ['#FFFFFF'],
        season,
        seasonFit: 90,
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 2;
  },

  checkCompatibility(items: PCPalette[]): CompatibilityScore {
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

  getPairwiseScore(a: PCPalette, b: PCPalette): number {
    // 같은 시즌이면 높은 점수
    const harmony = SEASON_HARMONY[a.season]?.[b.season] ?? 50;

    // 카테고리 다양성 가점
    const categoryBonus = a.category !== b.category ? 10 : -5;

    return Math.max(0, Math.min(100, harmony + categoryBonus));
  },

  personalize(items: PCPalette[], profile: BeautyProfile): PCPalette[] {
    const season = profile.personalColor?.season;
    if (!season) return items;

    // 사용자 시즌에 가장 적합한 순서로 정렬
    return [...items].sort((a, b) => b.seasonFit - a.seasonFit);
  },

  shouldRotate(capsule: Capsule<PCPalette>): boolean {
    if (!capsule.lastRotation) return false;
    const daysSince =
      (Date.now() - new Date(capsule.lastRotation).getTime()) / (1000 * 60 * 60 * 24);
    // 퍼스널컬러: 180일 주기 (계절 기반)
    return daysSince >= 180;
  },

  async rotate(capsule: Capsule<PCPalette>, profile: BeautyProfile): Promise<PCPalette[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.2));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  minimize(items: PCPalette[]): PCPalette[] {
    // 카테고리별 1개만 유지
    const seenCategories = new Set<string>();
    return items.filter((item) => {
      if (seenCategories.has(item.category)) return false;
      seenCategories.add(item.category);
      return true;
    });
  },
};
