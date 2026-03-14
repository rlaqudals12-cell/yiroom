/**
 * Oral Health 도메인 엔진 테스트
 * @see lib/capsule/domains/oral.ts
 */

import { describe, it, expect } from 'vitest';
import { oralEngine } from '@/lib/capsule/domains/oral';
import type { OralProduct } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['OH'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    oral: { conditions: ['잇몸염증'], goals: ['미백'], scores: {} },
    ...overrides,
  };
}

function createProduct(overrides: Partial<OralProduct> = {}): OralProduct {
  return {
    id: `oral-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Oral Product',
    category: 'toothpaste',
    ingredients: [],
    targetConditions: [],
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('OralEngine', () => {
  it('도메인 메타데이터가 올바르다', () => {
    expect(oralEngine.domainId).toBe('oral');
    expect(oralEngine.domainName).toBe('구강건강');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('레벨 1일 때 2를 반환한다', () => {
      expect(oralEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(2);
    });

    it('레벨 3일 때 4를 반환한다', () => {
      expect(oralEngine.getOptimalN(createProfile({ personalizationLevel: 3 }))).toBe(4);
    });

    it('레벨 4일 때 4를 반환한다 (상한)', () => {
      expect(oralEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(4);
    });
  });

  describe('curate', () => {
    it('프로필 기반으로 아이템을 반환한다', async () => {
      const items = await oralEngine.curate(createProfile());
      expect(items.length).toBe(3); // level 2 → 3개
    });

    it('maxItems 옵션을 존중한다', async () => {
      const items = await oralEngine.curate(createProfile(), { maxItems: 1 });
      expect(items.length).toBe(1);
    });

    it('구강 상태가 targetConditions에 반영된다', async () => {
      const items = await oralEngine.curate(
        createProfile({ oral: { conditions: ['cavity'], goals: [], scores: {} } })
      );
      expect(items[0].targetConditions).toContain('cavity');
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('기본 점수를 반환한다 (충돌/시너지 없는 경우)', () => {
      const a = createProduct({ category: 'toothpaste', ingredients: ['water'] });
      const b = createProduct({ category: 'floss', ingredients: ['nylon'] });

      const score = oralEngine.getPairwiseScore(a, b);
      expect(score).toBe(75); // 기본 점수
    });

    it('성분 시너지 가점을 적용한다 (fluoride + calcium)', () => {
      const a = createProduct({ category: 'toothpaste', ingredients: ['fluoride'] });
      const b = createProduct({ category: 'mouthwash', ingredients: ['calcium'] });

      const score = oralEngine.getPairwiseScore(a, b);
      expect(score).toBe(87); // 75 + 12
    });

    it('성분 충돌 감점을 적용한다 (hydrogen peroxide + chlorhexidine)', () => {
      const a = createProduct({ category: 'whitening', ingredients: ['hydrogen peroxide'] });
      const b = createProduct({ category: 'mouthwash', ingredients: ['chlorhexidine'] });

      const score = oralEngine.getPairwiseScore(a, b);
      expect(score).toBe(60); // 75 - 15
    });

    it('같은 카테고리이면 감점한다', () => {
      const a = createProduct({ category: 'toothpaste', ingredients: ['water'] });
      const b = createProduct({ category: 'toothpaste', ingredients: ['mint'] });

      const score = oralEngine.getPairwiseScore(a, b);
      expect(score).toBe(65); // 75 - 10
    });

    it('점수를 0-100 범위로 클램핑한다', () => {
      const a = createProduct({
        category: 'toothpaste',
        ingredients: ['hydrogen peroxide', 'baking soda'],
      });
      const b = createProduct({
        category: 'toothpaste',
        ingredients: ['chlorhexidine', 'fluoride'],
      });

      const score = oralEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('아이템이 1개이면 100을 반환한다', () => {
      const result = oralEngine.checkCompatibility([createProduct()]);
      expect(result.layer1).toBe(100);
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('구강 상태 매칭 아이템을 우선 정렬한다', () => {
      const profile = createProfile({
        oral: { conditions: ['잇몸염증'], goals: ['미백'], scores: {} },
      });

      const items = [
        createProduct({ name: 'No match', targetConditions: ['충치'] }),
        createProduct({ name: 'Condition match', targetConditions: ['잇몸염증'] }),
      ];

      const result = oralEngine.personalize(items, profile);
      expect(result[0].name).toBe('Condition match');
    });

    it('목표 매칭도 고려한다', () => {
      const profile = createProfile({
        oral: { conditions: [], goals: ['미백'], scores: {} },
      });

      const items = [
        createProduct({ name: 'No match', targetConditions: ['충치'] }),
        createProduct({ name: 'Goal match', targetConditions: ['미백'] }),
      ];

      const result = oralEngine.personalize(items, profile);
      expect(result[0].name).toBe('Goal match');
    });

    it('oral 프로필이 없으면 원본을 그대로 반환한다', () => {
      const profile = createProfile({ oral: undefined });
      const items = [createProduct({ name: 'A' }), createProduct({ name: 'B' })];

      const result = oralEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('lastRotation이 없으면 false를 반환한다', () => {
      const capsule: Capsule<OralProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'oral',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: '',
      };
      expect(oralEngine.shouldRotate(capsule)).toBe(false);
    });

    it('90일 이후 true를 반환한다', () => {
      const ninetyOneDaysAgo = new Date();
      ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);

      const capsule: Capsule<OralProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'oral',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: ninetyOneDaysAgo.toISOString(),
      };
      expect(oralEngine.shouldRotate(capsule)).toBe(true);
    });

    it('90일 이전에는 false를 반환한다', () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

      const capsule: Capsule<OralProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'oral',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: fortyDaysAgo.toISOString(),
      };
      expect(oralEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('중복 카테고리를 제거한다', () => {
      const items = [
        createProduct({ name: 'Paste 1', category: 'toothpaste' }),
        createProduct({ name: 'Paste 2', category: 'toothpaste' }),
        createProduct({ name: 'Floss', category: 'floss' }),
      ];

      const result = oralEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Paste 1');
      expect(result[1].name).toBe('Floss');
    });

    it('고유 카테고리만 있으면 모두 유지한다', () => {
      const items = [
        createProduct({ category: 'toothpaste' }),
        createProduct({ category: 'floss' }),
        createProduct({ category: 'mouthwash' }),
      ];
      expect(oralEngine.minimize(items).length).toBe(3);
    });
  });
});
