/**
 * Workout 도메인 캡슐 엔진
 *
 * CapsuleEngine<WorkoutPlan> — 근육 그룹 밸런스 기반 큐레이션
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type { CapsuleEngine } from '../engine';
import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from '../types';
import type { WorkoutPlan } from '../domain-types';
import { MUSCLE_GROUP_SYNERGIES, MUSCLE_GROUP_CONFLICTS } from '../domain-types';

const OPTIMAL_N: Record<number, number> = {
  1: 3, // 주 3회 기본 루틴
  2: 4, // + 유연성
  3: 5, // + HIIT
  4: 6, // + 밸런스/코어
};

export const workoutEngine: CapsuleEngine<WorkoutPlan> = {
  domainId: 'workout',
  domainName: '운동',

  // C1: Curation — 피트니스 레벨 기반
  async curate(profile: BeautyProfile, options?: CurateOptions): Promise<WorkoutPlan[]> {
    const maxItems = options?.maxItems ?? this.getOptimalN(profile);
    const fitnessLevel = profile.workout?.fitnessLevel ?? 'beginner';
    const goals = profile.workout?.goals ?? ['general fitness'];

    let difficulty: 'advanced' | 'intermediate' | 'beginner' = 'beginner';
    if (fitnessLevel === 'advanced') difficulty = 'advanced';
    else if (fitnessLevel === 'intermediate') difficulty = 'intermediate';

    const types: Array<WorkoutPlan['type']> = [
      'cardio',
      'strength',
      'flexibility',
      'balance',
      'hiit',
    ];

    return Array(maxItems)
      .fill(null)
      .map((_, i) => ({
        id: `workout-placeholder-${i}`,
        name: `${goals[0] ?? 'General'} Workout ${i + 1}`,
        type: types[i % types.length],
        met: { advanced: 8, intermediate: 6, beginner: 4 }[difficulty],
        durationMinutes: 30,
        muscleGroups: ['core'],
        difficulty,
      }));
  },

  getOptimalN(profile: BeautyProfile): number {
    return OPTIMAL_N[profile.personalizationLevel] ?? 3;
  },

  // C2: Compatibility — 근육 그룹 밸런스
  checkCompatibility(items: WorkoutPlan[]): CompatibilityScore {
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

  getPairwiseScore(a: WorkoutPlan, b: WorkoutPlan): number {
    let score = 70;

    const aGroups = a.muscleGroups.map((g) => g.toLowerCase());
    const bGroups = b.muscleGroups.map((g) => g.toLowerCase());

    // 근육 그룹 시너지 가점 (+12)
    for (const [g1, g2] of MUSCLE_GROUP_SYNERGIES) {
      const hasSynergy =
        (aGroups.includes(g1) && bGroups.includes(g2)) ||
        (aGroups.includes(g2) && bGroups.includes(g1));
      if (hasSynergy) score += 12;
    }

    // 근육 그룹 충돌 감점 (-15)
    for (const [g1, g2] of MUSCLE_GROUP_CONFLICTS) {
      const hasConflict =
        (aGroups.includes(g1) && bGroups.includes(g2)) ||
        (aGroups.includes(g2) && bGroups.includes(g1));
      if (hasConflict) score -= 15;
    }

    // 운동 타입 다양성 가점 (+10)
    if (a.type !== b.type) score += 10;

    // 같은 근육 그룹 연속 감점 (-10)
    const overlap = aGroups.filter((g) => bGroups.includes(g));
    if (overlap.length > 0) score -= overlap.length * 10;

    return Math.max(0, Math.min(100, score));
  },

  // C3: Personalization — 목표 기반 정렬
  personalize(items: WorkoutPlan[], profile: BeautyProfile): WorkoutPlan[] {
    if (!profile.workout) return items;
    const { goals } = profile.workout;

    return [...items].sort((a, b) => {
      const aFit = goals.some((g) => a.name.toLowerCase().includes(g.toLowerCase())) ? 1 : 0;
      const bFit = goals.some((g) => b.name.toLowerCase().includes(g.toLowerCase())) ? 1 : 0;
      return bFit - aFit;
    });
  },

  // C4: Rotation — 4주 주기
  shouldRotate(capsule: Capsule<WorkoutPlan>): boolean {
    if (!capsule.lastRotation) return false;
    const daysSince =
      (Date.now() - new Date(capsule.lastRotation).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 28;
  },

  async rotate(capsule: Capsule<WorkoutPlan>, profile: BeautyProfile): Promise<WorkoutPlan[]> {
    const rotateCount = Math.max(1, Math.round(capsule.items.length * 0.3));
    return this.curate(profile, { maxItems: rotateCount, preferNewItems: true });
  },

  // C5: Minimalism — 같은 운동 타입 중복 제거
  minimize(items: WorkoutPlan[]): WorkoutPlan[] {
    const seenTypes = new Set<string>();
    return items.filter((item) => {
      if (seenTypes.has(item.type)) return false;
      seenTypes.add(item.type);
      return true;
    });
  },
};
