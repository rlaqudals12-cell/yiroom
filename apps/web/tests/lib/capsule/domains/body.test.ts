/**
 * Body 도메인 엔진 테스트
 * @see lib/capsule/domains/body.ts
 */

import { describe, it, expect } from 'vitest';
import { bodyEngine } from '@/lib/capsule/domains/body';
import type { BodyPlan } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['C'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    body: { shape: 'hourglass', measurements: { shoulder: 40, waist: 28, hip: 38 } },
    ...overrides,
  };
}

function createPlan(overrides: Partial<BodyPlan> = {}): BodyPlan {
  return {
    id: `body-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Plan',
    category: 'posture-correction',
    targetAreas: ['core'],
    approach: 'posture',
    durationWeeks: 4,
    ...overrides,
  };
}

function createCapsule(overrides: Partial<Capsule<BodyPlan>> = {}): Capsule<BodyPlan> {
  return {
    id: 'c1',
    userId: 'u1',
    domainId: 'body',
    items: [],
    ccs: 70,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRotation: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('BodyEngine', () => {
  it('도메인 메타데이터가 올바르다', () => {
    expect(bodyEngine.domainId).toBe('body');
    expect(bodyEngine.domainName).toBe('체형관리');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('레벨 1일 때 2를 반환한다', () => {
      expect(bodyEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(2);
    });

    it('레벨 2일 때 3을 반환한다', () => {
      expect(bodyEngine.getOptimalN(createProfile({ personalizationLevel: 2 }))).toBe(3);
    });

    it('레벨 3일 때 3을 반환한다', () => {
      expect(bodyEngine.getOptimalN(createProfile({ personalizationLevel: 3 }))).toBe(3);
    });

    it('레벨 4일 때 4를 반환한다', () => {
      expect(bodyEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(4);
    });

    it('정의되지 않은 레벨은 기본값 2를 반환한다', () => {
      expect(bodyEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(2);
    });
  });

  describe('curate', () => {
    it('프로필 기반으로 아이템을 반환한다', async () => {
      const items = await bodyEngine.curate(createProfile());
      expect(items.length).toBe(3); // level 2 → 3개
    });

    it('maxItems 옵션을 존중한다', async () => {
      const items = await bodyEngine.curate(createProfile(), { maxItems: 2 });
      expect(items.length).toBe(2);
    });

    it('아이템 이름은 한국어 루틴명이고 체형은 targetAreas에 반영된다', async () => {
      // 'pear' 같은 영문 체형 코드는 사용자 노출 이름에서 제거 (2026-07-04)
      // — 체형 개인화는 이름이 아니라 focusAreas 기반 targetAreas로 검증
      const items = await bodyEngine.curate(
        createProfile({ body: { shape: 'pear', measurements: {} } })
      );
      expect(items[0].name).toBe('체형 맞춤 자세 교정');
      expect(items[0].name).not.toContain('pear');
      expect(items[0].targetAreas.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('접근법 시너지가 있으면 가점을 준다', () => {
      const a = createPlan({ approach: 'posture', category: 'posture-correction' });
      const b = createPlan({ approach: 'stretching', category: 'stretching-routine' });

      const score = bodyEngine.getPairwiseScore(a, b);
      // 70(기본) + 15(시너지) + 5(다른 접근법) - 5(core 중복) = 85
      expect(score).toBeGreaterThan(80);
    });

    it('같은 카테고리이면 감점한다', () => {
      const a = createPlan({ approach: 'posture', category: 'posture-correction' });
      const b = createPlan({ approach: 'stretching', category: 'posture-correction' });

      const scoreSame = bodyEngine.getPairwiseScore(a, b);

      const c = createPlan({ approach: 'posture', category: 'posture-correction' });
      const d = createPlan({ approach: 'stretching', category: 'stretching-routine' });

      const scoreDiff = bodyEngine.getPairwiseScore(c, d);

      expect(scoreDiff).toBeGreaterThan(scoreSame);
    });

    it('타겟 부위 중복이 많으면 감점한다', () => {
      const a = createPlan({ targetAreas: ['core', 'back', 'shoulders'], approach: 'exercise' });
      const b = createPlan({ targetAreas: ['core', 'back', 'shoulders'], approach: 'stretching' });

      const score = bodyEngine.getPairwiseScore(a, b);
      // 70 + 12(exercise+stretching 시너지) + 5(다른 접근법) - 15(3 overlap * 5) = 72
      expect(score).toBeLessThan(80);
    });

    it('점수가 0-100 범위로 클램핑된다', () => {
      const a = createPlan({
        approach: 'posture',
        targetAreas: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      });
      const b = createPlan({
        approach: 'posture',
        category: 'posture-correction',
        targetAreas: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      });

      const score = bodyEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('아이템이 1개이면 100을 반환한다', () => {
      const result = bodyEngine.checkCompatibility([createPlan()]);
      expect(result.layer1).toBe(100);
    });

    it('여러 아이템의 평균 pairwise 점수를 계산한다', () => {
      const items = [
        createPlan({ approach: 'posture', category: 'posture-correction' }),
        createPlan({ approach: 'stretching', category: 'stretching-routine' }),
      ];
      const result = bodyEngine.checkCompatibility(items);
      expect(result.layer1).toBeGreaterThan(0);
      expect(result.layer1).toBeLessThanOrEqual(100);
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('체형이 이름에 포함된 아이템을 우선 정렬한다', () => {
      const profile = createProfile({
        body: { shape: 'hourglass', measurements: {} },
      });

      const items = [
        createPlan({ name: 'General plan' }),
        createPlan({ name: 'Hourglass 체형 교정' }),
      ];

      const result = bodyEngine.personalize(items, profile);
      expect(result[0].name).toContain('Hourglass');
    });

    it('body 프로필이 없으면 원본을 그대로 반환한다', () => {
      const profile = createProfile({ body: undefined });
      const items = [createPlan({ name: 'A' }), createPlan({ name: 'B' })];

      const result = bodyEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });

    it('V형(invertedTriangle) → avoidOverloading upper 부위가 후순위로 밀린다', () => {
      // V형(상체 우세)은 upper 회피, lower/core 집중
      const profile = createProfile({
        body: { shape: 'invertedTriangle', measurements: {} },
      });

      const items = [
        createPlan({ id: 'upper', name: 'Upper focus', targetAreas: ['upper'] }),
        createPlan({ id: 'lower', name: 'Lower focus', targetAreas: ['lower'] }),
        createPlan({ id: 'core', name: 'Core focus', targetAreas: ['core'] }),
      ];

      const result = bodyEngine.personalize(items, profile);

      // lower/core 집중 아이템이 upper보다 앞에 와야 함
      const upperIdx = result.findIndex((i) => i.id === 'upper');
      const lowerIdx = result.findIndex((i) => i.id === 'lower');
      expect(lowerIdx).toBeLessThan(upperIdx);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('lastRotation이 없으면 false를 반환한다', () => {
      const capsule = createCapsule({ lastRotation: '' });
      expect(bodyEngine.shouldRotate(capsule)).toBe(false);
    });

    it('durationWeeks 기반 주기 이후 true를 반환한다', () => {
      const fiveWeeksAgo = new Date();
      fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35);

      const capsule = createCapsule({
        lastRotation: fiveWeeksAgo.toISOString(),
        items: [
          {
            id: 'i1',
            capsuleId: 'c1',
            item: createPlan({ durationWeeks: 4 }),
            profileFitScore: 0,
            usageCount: 0,
            lastUsed: null,
            addedAt: new Date().toISOString(),
          },
        ],
      });

      expect(bodyEngine.shouldRotate(capsule)).toBe(true);
    });

    it('주기 이전에는 false를 반환한다', () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const capsule = createCapsule({
        lastRotation: oneWeekAgo.toISOString(),
        items: [
          {
            id: 'i1',
            capsuleId: 'c1',
            item: createPlan({ durationWeeks: 4 }),
            profileFitScore: 0,
            usageCount: 0,
            lastUsed: null,
            addedAt: new Date().toISOString(),
          },
        ],
      });

      expect(bodyEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('중복 접근법을 제거한다', () => {
      const items = [
        createPlan({ name: 'Posture 1', approach: 'posture' }),
        createPlan({ name: 'Posture 2', approach: 'posture' }),
        createPlan({ name: 'Exercise 1', approach: 'exercise' }),
      ];

      const result = bodyEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Posture 1');
      expect(result[1].name).toBe('Exercise 1');
    });

    it('고유 접근법만 있으면 모두 유지한다', () => {
      const items = [
        createPlan({ approach: 'posture' }),
        createPlan({ approach: 'exercise' }),
        createPlan({ approach: 'stretching' }),
      ];

      expect(bodyEngine.minimize(items).length).toBe(3);
    });
  });
});
