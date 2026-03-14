/**
 * Workout 도메인 엔진 테스트
 * @see lib/capsule/domains/workout.ts
 */

import { describe, it, expect } from 'vitest';
import { workoutEngine } from '@/lib/capsule/domains/workout';
import type { WorkoutPlan } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['W'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    workout: { fitnessLevel: 'intermediate', goals: ['muscle gain'], history: [] },
    ...overrides,
  };
}

function createPlan(overrides: Partial<WorkoutPlan> = {}): WorkoutPlan {
  return {
    id: `workout-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Workout',
    type: 'strength',
    met: 6,
    durationMinutes: 30,
    muscleGroups: ['core'],
    difficulty: 'intermediate',
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('WorkoutEngine', () => {
  it('도메인 메타데이터가 올바르다', () => {
    expect(workoutEngine.domainId).toBe('workout');
    expect(workoutEngine.domainName).toBe('운동');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('레벨 1일 때 3을 반환한다', () => {
      expect(workoutEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(3);
    });

    it('레벨 4일 때 6을 반환한다', () => {
      expect(workoutEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(6);
    });

    it('정의되지 않은 레벨은 기본값 3을 반환한다', () => {
      expect(workoutEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(3);
    });
  });

  describe('curate', () => {
    it('프로필 기반으로 아이템을 반환한다', async () => {
      const items = await workoutEngine.curate(createProfile());
      expect(items.length).toBe(4); // level 2 → 4개
    });

    it('maxItems 옵션을 존중한다', async () => {
      const items = await workoutEngine.curate(createProfile(), { maxItems: 2 });
      expect(items.length).toBe(2);
    });

    it('피트니스 레벨이 난이도에 반영된다', async () => {
      const advanced = await workoutEngine.curate(
        createProfile({ workout: { fitnessLevel: 'advanced', goals: [], history: [] } })
      );
      expect(advanced[0].difficulty).toBe('advanced');

      const beginner = await workoutEngine.curate(
        createProfile({ workout: { fitnessLevel: 'beginner', goals: [], history: [] } })
      );
      expect(beginner[0].difficulty).toBe('beginner');
    });

    it('목표가 이름에 포함된다', async () => {
      const items = await workoutEngine.curate(
        createProfile({
          workout: { fitnessLevel: 'beginner', goals: ['weight loss'], history: [] },
        })
      );
      expect(items[0].name).toContain('weight loss');
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('기본 점수를 반환한다 (시너지/충돌 없는 경우)', () => {
      const a = createPlan({ type: 'cardio', muscleGroups: ['legs'] });
      const b = createPlan({ type: 'flexibility', muscleGroups: ['arms'] });

      const score = workoutEngine.getPairwiseScore(a, b);
      // 70(기본) + 10(다른 타입) = 80
      expect(score).toBe(80);
    });

    it('근육 그룹 시너지 가점을 적용한다 (chest + triceps)', () => {
      const a = createPlan({ type: 'strength', muscleGroups: ['chest'] });
      const b = createPlan({ type: 'strength', muscleGroups: ['triceps'] });

      const score = workoutEngine.getPairwiseScore(a, b);
      // 70 + 12(시너지) + 0(같은 타입) = 82
      expect(score).toBe(82);
    });

    it('근육 그룹 충돌 감점을 적용한다 (chest + shoulders)', () => {
      const a = createPlan({ type: 'strength', muscleGroups: ['chest'] });
      const b = createPlan({ type: 'cardio', muscleGroups: ['shoulders'] });

      const score = workoutEngine.getPairwiseScore(a, b);
      // 70 - 15(충돌) + 10(다른 타입) = 65
      expect(score).toBe(65);
    });

    it('운동 타입 다양성 가점을 적용한다', () => {
      const a = createPlan({ type: 'cardio', muscleGroups: ['legs'] });
      const b = createPlan({ type: 'strength', muscleGroups: ['arms'] });

      const scoreA = workoutEngine.getPairwiseScore(a, b);

      const c = createPlan({ type: 'cardio', muscleGroups: ['legs'] });
      const d = createPlan({ type: 'cardio', muscleGroups: ['arms'] });

      const scoreB = workoutEngine.getPairwiseScore(c, d);

      expect(scoreA).toBeGreaterThan(scoreB);
    });

    it('같은 근육 그룹 연속 감점을 적용한다', () => {
      const a = createPlan({ type: 'strength', muscleGroups: ['core', 'back'] });
      const b = createPlan({ type: 'flexibility', muscleGroups: ['core', 'back'] });

      const score = workoutEngine.getPairwiseScore(a, b);
      // 70 + 12(core+back 시너지) + 10(다른 타입) - 20(2 overlap * 10) = 72
      expect(score).toBe(72);
    });

    it('점수를 0-100 범위로 클램핑한다', () => {
      const a = createPlan({ type: 'strength', muscleGroups: ['chest', 'biceps', 'forearms'] });
      const b = createPlan({
        type: 'strength',
        muscleGroups: ['shoulders', 'chest', 'biceps', 'forearms'],
      });

      const score = workoutEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('아이템이 1개이면 100을 반환한다', () => {
      const result = workoutEngine.checkCompatibility([createPlan()]);
      expect(result.layer1).toBe(100);
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('목표 매칭 아이템을 우선 정렬한다', () => {
      const profile = createProfile({
        workout: { fitnessLevel: 'beginner', goals: ['muscle gain'], history: [] },
      });

      const items = [
        createPlan({ name: 'Cardio blast' }),
        createPlan({ name: 'Muscle gain routine' }),
      ];

      const result = workoutEngine.personalize(items, profile);
      expect(result[0].name).toBe('Muscle gain routine');
    });

    it('workout 프로필이 없으면 원본을 그대로 반환한다', () => {
      const profile = createProfile({ workout: undefined });
      const items = [createPlan({ name: 'A' }), createPlan({ name: 'B' })];

      const result = workoutEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('lastRotation이 없으면 false를 반환한다', () => {
      const capsule: Capsule<WorkoutPlan> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'workout',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: '',
      };
      expect(workoutEngine.shouldRotate(capsule)).toBe(false);
    });

    it('28일 이후 true를 반환한다', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const capsule: Capsule<WorkoutPlan> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'workout',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: thirtyDaysAgo.toISOString(),
      };
      expect(workoutEngine.shouldRotate(capsule)).toBe(true);
    });

    it('28일 이전에는 false를 반환한다', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const capsule: Capsule<WorkoutPlan> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'workout',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: tenDaysAgo.toISOString(),
      };
      expect(workoutEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('중복 운동 타입을 제거한다', () => {
      const items = [
        createPlan({ name: 'Strength 1', type: 'strength' }),
        createPlan({ name: 'Strength 2', type: 'strength' }),
        createPlan({ name: 'Cardio', type: 'cardio' }),
      ];

      const result = workoutEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Strength 1');
      expect(result[1].name).toBe('Cardio');
    });

    it('고유 타입만 있으면 모두 유지한다', () => {
      const items = [
        createPlan({ type: 'strength' }),
        createPlan({ type: 'cardio' }),
        createPlan({ type: 'flexibility' }),
      ];
      expect(workoutEngine.minimize(items).length).toBe(3);
    });
  });
});
