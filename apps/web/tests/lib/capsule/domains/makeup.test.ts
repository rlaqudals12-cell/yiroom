/**
 * Makeup 도메인 엔진 테스트
 * @see lib/capsule/domains/makeup.ts
 */

import { describe, it, expect } from 'vitest';
import { makeupEngine } from '@/lib/capsule/domains/makeup';
import type { MakeupProduct } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['M'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    personalColor: { season: 'spring', subType: 'light', palette: ['#FFD700'] },
    ...overrides,
  };
}

function createProduct(overrides: Partial<MakeupProduct> = {}): MakeupProduct {
  return {
    id: `makeup-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Makeup',
    category: 'lip',
    finish: 'satin',
    seasonMatch: [],
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('MakeupEngine', () => {
  it('도메인 메타데이터가 올바르다', () => {
    expect(makeupEngine.domainId).toBe('makeup');
    expect(makeupEngine.domainName).toBe('메이크업');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('레벨 1일 때 3을 반환한다', () => {
      expect(makeupEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(3);
    });

    it('레벨 4일 때 6을 반환한다', () => {
      expect(makeupEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(6);
    });

    it('정의되지 않은 레벨은 기본값 3을 반환한다', () => {
      expect(makeupEngine.getOptimalN(createProfile({ personalizationLevel: 99 as number }))).toBe(
        3
      );
    });
  });

  describe('curate', () => {
    it('프로필 기반으로 아이템을 반환한다', async () => {
      const items = await makeupEngine.curate(createProfile());
      expect(items.length).toBe(4); // level 2 → 4개
    });

    it('maxItems 옵션을 존중한다', async () => {
      const items = await makeupEngine.curate(createProfile(), { maxItems: 2 });
      expect(items.length).toBe(2);
    });

    it('퍼스널컬러 시즌이 seasonMatch에 반영된다', async () => {
      const items = await makeupEngine.curate(createProfile());
      expect(items[0].seasonMatch).toContain('spring');
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('기본 점수를 반환한다 (마감 조화 없는 경우)', () => {
      const a = createProduct({ category: 'lip', finish: undefined });
      const b = createProduct({ category: 'eye', finish: undefined });

      const score = makeupEngine.getPairwiseScore(a, b);
      expect(score).toBe(75); // 기본 점수
    });

    it('마감 조화 가점을 적용한다 (matte + shimmer)', () => {
      const a = createProduct({ category: 'lip', finish: 'matte' });
      const b = createProduct({ category: 'eye', finish: 'shimmer' });

      const score = makeupEngine.getPairwiseScore(a, b);
      expect(score).toBe(85); // 75 + 10 (조화)
    });

    it('같은 마감 반복 시 감점한다 (satin 제외)', () => {
      const a = createProduct({ category: 'lip', finish: 'matte' });
      const b = createProduct({ category: 'eye', finish: 'matte' });

      const score = makeupEngine.getPairwiseScore(a, b);
      expect(score).toBe(70); // 75 - 5 (같은 마감)
    });

    it('satin 마감 반복은 감점하지 않는다', () => {
      const a = createProduct({ category: 'lip', finish: 'satin' });
      const b = createProduct({ category: 'eye', finish: 'satin' });

      const score = makeupEngine.getPairwiseScore(a, b);
      // satin + satin: 조화 목록에 satin이 있으므로 +10
      expect(score).toBeGreaterThanOrEqual(75);
    });

    it('같은 카테고리이면 감점한다', () => {
      const a = createProduct({ category: 'lip' });
      const b = createProduct({ category: 'lip' });

      const scoreSame = makeupEngine.getPairwiseScore(a, b);

      const c = createProduct({ category: 'lip' });
      const d = createProduct({ category: 'eye' });

      const scoreDiff = makeupEngine.getPairwiseScore(c, d);

      expect(scoreDiff).toBeGreaterThan(scoreSame);
    });

    it('시즌 매칭 가점을 적용한다', () => {
      const a = createProduct({ category: 'lip', seasonMatch: ['spring'], finish: undefined });
      const b = createProduct({ category: 'eye', seasonMatch: ['spring'], finish: undefined });

      const score = makeupEngine.getPairwiseScore(a, b);
      expect(score).toBe(83); // 75 + 8
    });

    it('점수를 0-100 범위로 클램핑한다', () => {
      const a = createProduct({ category: 'lip', finish: 'matte', seasonMatch: ['spring'] });
      const b = createProduct({ category: 'lip', finish: 'dewy', seasonMatch: ['winter'] });

      const score = makeupEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('아이템이 1개이면 100을 반환한다', () => {
      const result = makeupEngine.checkCompatibility([createProduct()]);
      expect(result.layer1).toBe(100);
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('퍼스널컬러 시즌 매칭 아이템을 우선 정렬한다', () => {
      const profile = createProfile({
        personalColor: { season: 'spring', subType: 'light', palette: [] },
      });

      const items = [
        createProduct({ name: 'Winter match', seasonMatch: ['winter'] }),
        createProduct({ name: 'Spring match', seasonMatch: ['spring'] }),
      ];

      const result = makeupEngine.personalize(items, profile);
      expect(result[0].name).toBe('Spring match');
    });

    it('퍼스널컬러가 없으면 원본을 그대로 반환한다', () => {
      const profile = createProfile({ personalColor: undefined });
      const items = [createProduct({ name: 'A' }), createProduct({ name: 'B' })];

      const result = makeupEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('lastRotation이 없으면 false를 반환한다', () => {
      const capsule: Capsule<MakeupProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'makeup',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: '',
      };
      expect(makeupEngine.shouldRotate(capsule)).toBe(false);
    });

    it('90일 이후 true를 반환한다', () => {
      const ninetyOneDaysAgo = new Date();
      ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);

      const capsule: Capsule<MakeupProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'makeup',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: ninetyOneDaysAgo.toISOString(),
      };
      expect(makeupEngine.shouldRotate(capsule)).toBe(true);
    });

    it('90일 이전에는 false를 반환한다', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const capsule: Capsule<MakeupProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'makeup',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: thirtyDaysAgo.toISOString(),
      };
      expect(makeupEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('중복 카테고리를 제거한다', () => {
      const items = [
        createProduct({ name: 'Lip 1', category: 'lip' }),
        createProduct({ name: 'Lip 2', category: 'lip' }),
        createProduct({ name: 'Eye', category: 'eye' }),
      ];

      const result = makeupEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Lip 1');
      expect(result[1].name).toBe('Eye');
    });

    it('고유 카테고리만 있으면 모두 유지한다', () => {
      const items = [
        createProduct({ category: 'lip' }),
        createProduct({ category: 'eye' }),
        createProduct({ category: 'base' }),
      ];
      expect(makeupEngine.minimize(items).length).toBe(3);
    });
  });
});
