/**
 * Nutrition 도메인 엔진 테스트
 * @see lib/capsule/domains/nutrition.ts
 */

import { describe, it, expect } from 'vitest';
import { nutritionEngine } from '@/lib/capsule/domains/nutrition';
import type { NutritionItem } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['N'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    nutrition: { deficiencies: ['비타민D 부족'], allergies: [], dietType: 'normal' },
    ...overrides,
  };
}

function createItem(overrides: Partial<NutritionItem> = {}): NutritionItem {
  return {
    id: `nutrition-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Supplement',
    category: 'supplement',
    nutrients: [{ name: 'multivitamin', amount: 100, unit: '%' }],
    dailyServings: 1,
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('NutritionEngine', () => {
  it('도메인 메타데이터가 올바르다', () => {
    expect(nutritionEngine.domainId).toBe('nutrition');
    expect(nutritionEngine.domainName).toBe('영양');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('레벨 1일 때 3을 반환한다', () => {
      expect(nutritionEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(3);
    });

    it('레벨 4일 때 6을 반환한다', () => {
      expect(nutritionEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(6);
    });

    it('정의되지 않은 레벨은 기본값 3을 반환한다', () => {
      expect(nutritionEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(3);
    });
  });

  describe('curate', () => {
    it('프로필 기반으로 아이템을 반환한다', async () => {
      const items = await nutritionEngine.curate(createProfile());
      expect(items.length).toBe(4); // level 2 → 4개
    });

    it('maxItems 옵션을 존중한다', async () => {
      const items = await nutritionEngine.curate(createProfile(), { maxItems: 2 });
      expect(items.length).toBe(2);
    });

    it('결핍 영양소가 아이템에 반영된다', async () => {
      const items = await nutritionEngine.curate(
        createProfile({
          nutrition: { deficiencies: ['철분 부족'], allergies: [], dietType: 'normal' },
        })
      );
      expect(items[0].nutrients[0].name).toBe('철분 부족');
    });

    it('결핍이 없으면 멀티비타민을 반환한다', async () => {
      const items = await nutritionEngine.curate(
        createProfile({ nutrition: { deficiencies: [], allergies: [], dietType: 'normal' } })
      );
      expect(items[0].nutrients[0].name).toBe('multivitamin');
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('기본 점수를 반환한다 (충돌/시너지 없는 경우)', () => {
      const a = createItem({ nutrients: [{ name: 'vitamin a', amount: 100, unit: '%' }] });
      const b = createItem({ nutrients: [{ name: 'vitamin b', amount: 100, unit: '%' }] });

      const score = nutritionEngine.getPairwiseScore(a, b);
      expect(score).toBe(70);
    });

    it('영양소 시너지 가점을 적용한다 (vitamin d + calcium)', () => {
      const a = createItem({ nutrients: [{ name: 'vitamin d', amount: 100, unit: '%' }] });
      const b = createItem({ nutrients: [{ name: 'calcium', amount: 100, unit: '%' }] });

      const score = nutritionEngine.getPairwiseScore(a, b);
      expect(score).toBe(82); // 70 + 12
    });

    it('영양소 충돌 감점을 적용한다 (calcium + iron)', () => {
      const a = createItem({ nutrients: [{ name: 'calcium', amount: 100, unit: '%' }] });
      const b = createItem({ nutrients: [{ name: 'iron', amount: 100, unit: '%' }] });

      const score = nutritionEngine.getPairwiseScore(a, b);
      expect(score).toBe(55); // 70 - 15
    });

    it('같은 영양소 중복 감점을 적용한다', () => {
      const a = createItem({ nutrients: [{ name: 'vitamin c', amount: 100, unit: '%' }] });
      const b = createItem({ nutrients: [{ name: 'vitamin c', amount: 50, unit: '%' }] });

      const score = nutritionEngine.getPairwiseScore(a, b);
      expect(score).toBe(60); // 70 - 10 (중복)
    });

    it('복합 상호작용을 계산한다 (시너지 + 충돌)', () => {
      const a = createItem({
        nutrients: [
          { name: 'vitamin d', amount: 100, unit: '%' },
          { name: 'calcium', amount: 100, unit: '%' },
        ],
      });
      const b = createItem({
        nutrients: [
          { name: 'iron', amount: 100, unit: '%' },
          { name: 'magnesium', amount: 100, unit: '%' },
        ],
      });

      const score = nutritionEngine.getPairwiseScore(a, b);
      // calcium+iron 충돌(-15), vitamin d+magnesium 시너지(+12)
      expect(score).toBe(67); // 70 - 15 + 12
    });

    it('점수를 0-100 범위로 클램핑한다', () => {
      const a = createItem({
        nutrients: [
          { name: 'calcium', amount: 100, unit: '%' },
          { name: 'zinc', amount: 100, unit: '%' },
        ],
      });
      const b = createItem({
        nutrients: [
          { name: 'iron', amount: 100, unit: '%' },
          { name: 'copper', amount: 100, unit: '%' },
        ],
      });

      const score = nutritionEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('아이템이 1개이면 100을 반환한다', () => {
      const result = nutritionEngine.checkCompatibility([createItem()]);
      expect(result.layer1).toBe(100);
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('결핍 영양소 매칭 아이템을 우선 정렬한다', () => {
      const profile = createProfile({
        nutrition: { deficiencies: ['비타민D 부족'], allergies: [], dietType: 'normal' },
      });

      const items = [
        createItem({ name: 'No match', nutrients: [{ name: 'zinc', amount: 100, unit: '%' }] }),
        createItem({ name: 'Match', nutrients: [{ name: 'vitamin d', amount: 100, unit: '%' }] }),
      ];

      const result = nutritionEngine.personalize(items, profile);
      expect(result[0].name).toBe('Match');
    });

    it('알레르기 성분이 포함된 아이템을 필터링한다', () => {
      const profile = createProfile({
        nutrition: { deficiencies: [], allergies: ['lactose'], dietType: 'normal' },
      });

      const items = [
        createItem({ name: 'Safe', nutrients: [{ name: 'vitamin c', amount: 100, unit: '%' }] }),
        createItem({
          name: 'Allergenic',
          nutrients: [{ name: 'lactose powder', amount: 50, unit: '%' }],
        }),
      ];

      const result = nutritionEngine.personalize(items, profile);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Safe');
    });

    it('nutrition 프로필이 없으면 원본을 그대로 반환한다', () => {
      const profile = createProfile({ nutrition: undefined });
      const items = [createItem({ name: 'A' }), createItem({ name: 'B' })];

      const result = nutritionEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('lastRotation이 없으면 false를 반환한다', () => {
      const capsule: Capsule<NutritionItem> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'nutrition',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: '',
      };
      expect(nutritionEngine.shouldRotate(capsule)).toBe(false);
    });

    it('60일 이후 true를 반환한다', () => {
      const sixtyOneDaysAgo = new Date();
      sixtyOneDaysAgo.setDate(sixtyOneDaysAgo.getDate() - 61);

      const capsule: Capsule<NutritionItem> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'nutrition',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: sixtyOneDaysAgo.toISOString(),
      };
      expect(nutritionEngine.shouldRotate(capsule)).toBe(true);
    });

    it('60일 이전에는 false를 반환한다', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const capsule: Capsule<NutritionItem> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'nutrition',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: thirtyDaysAgo.toISOString(),
      };
      expect(nutritionEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('같은 주요 영양소를 가진 아이템을 제거한다', () => {
      const items = [
        createItem({
          name: 'Vitamin D 1',
          nutrients: [{ name: 'vitamin d', amount: 100, unit: '%' }],
        }),
        createItem({
          name: 'Vitamin D 2',
          nutrients: [{ name: 'vitamin d', amount: 50, unit: '%' }],
        }),
        createItem({ name: 'Iron', nutrients: [{ name: 'iron', amount: 100, unit: '%' }] }),
      ];

      const result = nutritionEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Vitamin D 1');
      expect(result[1].name).toBe('Iron');
    });

    it('영양소가 없는 아이템은 유지한다', () => {
      const items = [
        createItem({ nutrients: [] }),
        createItem({ nutrients: [{ name: 'vitamin c', amount: 100, unit: '%' }] }),
      ];
      expect(nutritionEngine.minimize(items).length).toBe(2);
    });
  });
});
