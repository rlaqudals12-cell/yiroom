/**
 * Body 도메인 캡슐 엔진
 *
 * CapsuleEngine<BodyPlan> — 체형 기반 자세교정/관리 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { BodyPlan } from '../domain-types';
import {
  mapBodyShape7ToBodyType,
  normalizeToBodyShape7,
  BODY_TYPE_EXERCISE_PRIORITIES,
} from '@/lib/body';
import type { BodyType } from '@/lib/body';

const OPTIMAL_N: Record<number, number> = {
  1: 2, // 자세교정 + 스트레칭
  2: 3, // + 근력 운동
  3: 3, // 체형 관리는 3개면 충분
  4: 4, // + 생활습관
};

// 접근법 간 시너지 (함께 하면 효과 높은 조합)
const APPROACH_SYNERGIES: [string, string][] = [
  ['posture', 'stretching'],
  ['exercise', 'stretching'],
  ['posture', 'lifestyle'],
  ['exercise', 'lifestyle'],
];

export const bodyEngine: CapsuleEngine<BodyPlan> = {
  domainId: 'body',
  domainName: '체형관리',

  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<BodyPlan[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const bodyShape = profile.body?.shape ?? 'standard';

    // 체형 타입 매핑으로 운동 우선순위 결정
    const focusAreas = getBodyTypeFocusAreas(bodyShape);

    const categories: Array<BodyPlan['category']> = [
      'posture-correction',
      'stretching-routine',
      'strength-plan',
      'body-alignment',
      'lifestyle-habit',
    ];
    const approaches: Array<BodyPlan['approach']> = [
      'posture',
      'stretching',
      'exercise',
      'lifestyle',
    ];

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `body-placeholder-${i}`,
        name: `${bodyShape} 체형 ${categories[i % categories.length]} ${i + 1}`,
        category: categories[i % categories.length],
        targetAreas: focusAreas.length > 0 ? [focusAreas[i % focusAreas.length]] : ['core'],
        approach: approaches[i % approaches.length],
        durationWeeks: 4,
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 2;
  },

  checkCompatibility(items: BodyPlan[]): CompatibilityScore {
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

  getPairwiseScore(a: BodyPlan, b: BodyPlan): number {
    let score = 70;

    // 접근법 시너지 가점 (+15)
    for (const [a1, a2] of APPROACH_SYNERGIES) {
      if ((a.approach === a1 && b.approach === a2) || (a.approach === a2 && b.approach === a1)) {
        score += 15;
      }
    }

    // 다른 접근법이면 다양성 가점 (+5)
    if (a.approach !== b.approach) score += 5;

    // 같은 카테고리 감점 (-10)
    if (a.category === b.category) score -= 10;

    // 같은 타겟 부위 중복 감점 (-5)
    const overlap = a.targetAreas.filter((area) => b.targetAreas.includes(area));
    if (overlap.length > 0) score -= overlap.length * 5;

    return Math.max(0, Math.min(100, score));
  },

  personalize(items: BodyPlan[], profile: BeautyProfile): BodyPlan[] {
    if (!profile.body) return items;
    const { shape } = profile.body;

    // 체형 타입에서 집중 부위/회피 부위 추출
    const focusAreas = getBodyTypeFocusAreas(shape);
    const avoidAreas = getBodyTypeAvoidAreas(shape);

    return [...items].sort((a, b) => {
      // 집중 부위 포함 시 우선
      const aFocus = a.targetAreas.some((area) => focusAreas.includes(area)) ? 2 : 0;
      const bFocus = b.targetAreas.some((area) => focusAreas.includes(area)) ? 2 : 0;
      // 회피 부위 포함 시 후순위
      const aAvoid = a.targetAreas.some((area) => avoidAreas.includes(area)) ? -1 : 0;
      const bAvoid = b.targetAreas.some((area) => avoidAreas.includes(area)) ? -1 : 0;
      // 이름 매칭 가점
      const aName = a.name.toLowerCase().includes(shape.toLowerCase()) ? 1 : 0;
      const bName = b.name.toLowerCase().includes(shape.toLowerCase()) ? 1 : 0;
      return bFocus + bAvoid + bName - (aFocus + aAvoid + aName);
    });
  },

  shouldRotate(capsule: Capsule<BodyPlan>): boolean {
    if (!capsule.lastRotation) return false;
    const daysSince =
      (Date.now() - new Date(capsule.lastRotation).getTime()) / (1000 * 60 * 60 * 24);
    // 체형: 주기 = durationWeeks 기반 (기본 4주)
    const avgDuration =
      capsule.items.length > 0
        ? capsule.items.reduce((sum, ci) => sum + ((ci.item as BodyPlan).durationWeeks ?? 4), 0) /
          capsule.items.length
        : 4;
    return daysSince >= avgDuration * 7;
  },

  async rotate(capsule: Capsule<BodyPlan>, profile: BeautyProfile): Promise<BodyPlan[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.3));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  minimize(items: BodyPlan[]): BodyPlan[] {
    const seenApproaches = new Set<string>();
    return items.filter((item) => {
      if (seenApproaches.has(item.approach)) return false;
      seenApproaches.add(item.approach);
      return true;
    });
  },
};

function resolveBodyType(shape: string): BodyType | null {
  const shape7 = normalizeToBodyShape7(shape);
  if (!shape7) return null;
  return mapBodyShape7ToBodyType(shape7);
}

function getBodyTypeFocusAreas(shape: string): string[] {
  const bodyType = resolveBodyType(shape);
  if (!bodyType) return ['core']; // fallback
  const priorities = BODY_TYPE_EXERCISE_PRIORITIES[bodyType];
  return priorities?.focusAreas ?? ['core'];
}

function getBodyTypeAvoidAreas(shape: string): string[] {
  const bodyType = resolveBodyType(shape);
  if (!bodyType) return [];
  const priorities = BODY_TYPE_EXERCISE_PRIORITIES[bodyType];
  return priorities?.avoidOverloading ?? [];
}
