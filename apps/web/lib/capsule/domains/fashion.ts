/**
 * Fashion 도메인 캡슐 엔진
 *
 * CapsuleEngine<FashionItem> — 색상 조화 + 실루엣 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { FashionItem } from '../domain-types';
import { COLOR_HARMONY_GROUPS, SILHOUETTE_HARMONY } from '../domain-types';

// 개인화 레벨별 최적 N (캡슐 워드로브)
const OPTIMAL_N: Record<number, number> = {
  1: 10, // 기본 캡슐 10피스
  2: 12, // + 시즌 아이템
  3: 15, // + 상황별 분리
  4: 15, // 최대 15피스
};

export const fashionEngine: CapsuleEngine<FashionItem> = {
  domainId: 'fashion',
  domainName: '패션',

  // ==========================================================================
  // C1: Curation
  // ==========================================================================

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<FashionItem[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const seasonHex = profile.personalColor?.palette?.[0] ?? '#808080';

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `fashion-placeholder-${i}`,
        name: `Item ${i + 1}`,
        category: ['top', 'bottom', 'outer', 'shoes', 'accessory'][
          i % 5
        ] as FashionItem['category'],
        color: { name: 'default', hex: seasonHex },
        tags: [],
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 10;
  },

  // ==========================================================================
  // C2: Compatibility — 색상 조화 + 실루엣
  // ==========================================================================

  checkCompatibility(items: FashionItem[]): CompatibilityScore {
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

  getPairwiseScore(a: FashionItem, b: FashionItem): number {
    let score = 60; // 기본 점수

    // 1) 색상 조화 평가 (+0~30)
    score += getColorHarmonyScore(a.color.hex, b.color.hex);

    // 2) 실루엣 조화 평가 (+0~15)
    if (a.silhouette && b.silhouette) {
      score += getSilhouetteScore(a.silhouette, b.silhouette);
    }

    // 3) 카테고리 다양성 보너스 (+5)
    if (a.category !== b.category) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  },

  // ==========================================================================
  // C3: Personalization — 퍼스널컬러 기반
  // ==========================================================================

  personalize(items: FashionItem[], profile: BeautyProfile): FashionItem[] {
    if (!profile.personalColor) return items;

    const { season, palette } = profile.personalColor;

    return [...items].sort((a, b) => {
      const aFit = calculateFashionFit(a, season, palette);
      const bFit = calculateFashionFit(b, season, palette);
      return bFit - aFit;
    });
  },

  // ==========================================================================
  // C4: Rotation — 계절 기반
  // ==========================================================================

  shouldRotate(capsule: Capsule<FashionItem>): boolean {
    if (!capsule.lastRotation) return false;

    const lastRotation = new Date(capsule.lastRotation);
    const now = new Date();
    const daysSince = (now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);

    // 패션: 90일 주기 (시즌 변경)
    return daysSince >= 90;
  },

  async rotate(capsule: Capsule<FashionItem>, profile: BeautyProfile): Promise<FashionItem[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.3));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  // ==========================================================================
  // C5: Minimalism — 캡슐 워드로브 원칙
  // ==========================================================================

  minimize(items: FashionItem[]): FashionItem[] {
    // 필수 카테고리 우선 보장 (상의, 하의, 아우터, 신발)
    const essential = ['top', 'bottom', 'outer', 'shoes'];
    const essentialItems: FashionItem[] = [];
    const extras: FashionItem[] = [];

    for (const item of items) {
      if (
        essential.includes(item.category) &&
        !essentialItems.some((e) => e.category === item.category)
      ) {
        essentialItems.push(item);
      } else {
        extras.push(item);
      }
    }

    return [...essentialItems, ...extras];
  },
};

// =============================================================================
// 내부 유틸
// =============================================================================

/**
 * 색상 조화 점수 (0-30)
 * 같은 조화 그룹이면 높은 점수, 무채색은 보너스
 */
function getColorHarmonyScore(hex1: string, hex2: string): number {
  const h1 = hex1.toLowerCase();
  const h2 = hex2.toLowerCase();

  // 무채색은 모든 색과 조화
  const neutrals = COLOR_HARMONY_GROUPS.neutral.map((c) => c.toLowerCase());
  if (neutrals.includes(h1) || neutrals.includes(h2)) {
    return 25;
  }

  // 같은 조화 그룹 찾기
  for (const group of Object.values(COLOR_HARMONY_GROUPS)) {
    const lowerGroup = group.map((c) => c.toLowerCase());
    if (lowerGroup.includes(h1) && lowerGroup.includes(h2)) {
      return 30;
    }
  }

  // 다른 그룹 (보색 가능) → 기본 점수
  return 10;
}

/**
 * 실루엣 조화 점수 (0-15)
 */
function getSilhouetteScore(s1: string, s2: string): number {
  const lower1 = s1.toLowerCase();
  const lower2 = s2.toLowerCase();

  const harmonious = SILHOUETTE_HARMONY[lower1];
  if (harmonious?.includes(lower2)) {
    return 15;
  }

  // 같은 실루엣 (유니폼 룩) → 중간
  if (lower1 === lower2) {
    return 8;
  }

  return 0;
}

/**
 * 패션 적합도 계산 (퍼스널컬러 시즌 + 팔레트 매칭)
 */
function calculateFashionFit(item: FashionItem, season: string, palette: string[]): number {
  let fit = 50;

  // 색상 시즌 매칭
  if (item.color.season?.toLowerCase() === season.toLowerCase()) {
    fit += 30;
  }

  // 팔레트 내 색상 매칭
  if (palette.some((p) => p.toLowerCase() === item.color.hex.toLowerCase())) {
    fit += 20;
  }

  return Math.min(100, fit);
}
