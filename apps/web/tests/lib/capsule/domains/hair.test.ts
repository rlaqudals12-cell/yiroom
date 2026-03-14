/**
 * Hair 도메인 엔진 테스트
 * @see lib/capsule/domains/hair.ts
 */

import { describe, it, expect } from 'vitest';
import { hairEngine } from '@/lib/capsule/domains/hair';
import type { HairProduct } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['H'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    hair: { type: 'dry', scalp: 'normal', concerns: ['탈모', '건조'] },
    ...overrides,
  };
}

function createProduct(overrides: Partial<HairProduct> = {}): HairProduct {
  return {
    id: `hair-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Product',
    category: 'shampoo',
    ingredients: [],
    hairTypes: [],
    scalpTypes: [],
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('HairEngine', () => {
  it('도메인 메타데이터가 올바르다', () => {
    expect(hairEngine.domainId).toBe('hair');
    expect(hairEngine.domainName).toBe('헤어');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('레벨 1일 때 2를 반환한다', () => {
      expect(hairEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(2);
    });

    it('레벨 2일 때 3을 반환한다', () => {
      expect(hairEngine.getOptimalN(createProfile({ personalizationLevel: 2 }))).toBe(3);
    });

    it('레벨 3일 때 4를 반환한다', () => {
      expect(hairEngine.getOptimalN(createProfile({ personalizationLevel: 3 }))).toBe(4);
    });

    it('레벨 4일 때 5를 반환한다', () => {
      expect(hairEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(5);
    });
  });

  describe('curate', () => {
    it('프로필 기반으로 아이템을 반환한다', async () => {
      const items = await hairEngine.curate(createProfile());
      expect(items.length).toBe(3); // level 2 → 3개
    });

    it('maxItems 옵션을 존중한다', async () => {
      const items = await hairEngine.curate(createProfile(), { maxItems: 2 });
      expect(items.length).toBe(2);
    });

    it('모발 타입이 아이템에 반영된다', async () => {
      const items = await hairEngine.curate(
        createProfile({ hair: { type: 'oily', scalp: 'sensitive', concerns: [] } })
      );
      expect(items[0].hairTypes).toContain('oily');
      expect(items[0].scalpTypes).toContain('sensitive');
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('기본 점수를 반환한다 (충돌/시너지 없는 경우)', () => {
      const a = createProduct({ category: 'shampoo', ingredients: ['water'] });
      const b = createProduct({ category: 'conditioner', ingredients: ['glycerin'] });

      const score = hairEngine.getPairwiseScore(a, b);
      expect(score).toBe(70); // 기본 점수
    });

    it('성분 시너지 가점을 적용한다 (keratin + biotin)', () => {
      const a = createProduct({ category: 'shampoo', ingredients: ['keratin'] });
      const b = createProduct({ category: 'treatment', ingredients: ['biotin'] });

      const score = hairEngine.getPairwiseScore(a, b);
      expect(score).toBe(82); // 70 + 12 (시너지)
    });

    it('성분 충돌 감점을 적용한다 (sulfate + keratin)', () => {
      const a = createProduct({ category: 'shampoo', ingredients: ['sulfate'] });
      const b = createProduct({ category: 'treatment', ingredients: ['keratin'] });

      const score = hairEngine.getPairwiseScore(a, b);
      expect(score).toBe(55); // 70 - 15 (충돌)
    });

    it('같은 카테고리이면 감점한다', () => {
      const a = createProduct({ category: 'shampoo', ingredients: ['water'] });
      const b = createProduct({ category: 'shampoo', ingredients: ['glycerin'] });

      const score = hairEngine.getPairwiseScore(a, b);
      expect(score).toBe(60); // 70 - 10
    });

    it('점수를 0-100 범위로 클램핑한다', () => {
      const a = createProduct({
        category: 'shampoo',
        ingredients: ['sulfate', 'silicone', 'alcohol'],
      });
      const b = createProduct({
        category: 'shampoo',
        ingredients: ['keratin', 'tea tree', 'argan oil'],
      });

      const score = hairEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('아이템이 1개이면 100을 반환한다', () => {
      const result = hairEngine.checkCompatibility([createProduct()]);
      expect(result.layer1).toBe(100);
    });

    it('여러 아이템의 평균 점수를 계산한다', () => {
      const items = [
        createProduct({ category: 'shampoo', ingredients: ['keratin'] }),
        createProduct({ category: 'treatment', ingredients: ['biotin'] }),
      ];
      const result = hairEngine.checkCompatibility(items);
      expect(result.layer1).toBe(82); // 70 + 12
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('모발 타입 매칭 아이템을 우선 정렬한다', () => {
      const profile = createProfile({
        hair: { type: 'dry', scalp: 'normal', concerns: [] },
      });

      const items = [
        createProduct({ name: 'No match', hairTypes: ['oily'] }),
        createProduct({ name: 'Match', hairTypes: ['dry'] }),
      ];

      const result = hairEngine.personalize(items, profile);
      expect(result[0].name).toBe('Match');
    });

    it('고민 매칭 성분이 있으면 우선한다', () => {
      const profile = createProfile({
        hair: { type: 'normal', scalp: 'normal', concerns: ['탈모'] },
      });

      const items = [
        createProduct({ name: 'No concern', hairTypes: [], ingredients: ['water'] }),
        createProduct({ name: 'Concern match', hairTypes: [], ingredients: ['탈모 prevention'] }),
      ];

      const result = hairEngine.personalize(items, profile);
      expect(result[0].name).toBe('Concern match');
    });

    it('hair 프로필이 없으면 원본을 그대로 반환한다', () => {
      const profile = createProfile({ hair: undefined });
      const items = [createProduct({ name: 'A' }), createProduct({ name: 'B' })];

      const result = hairEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('lastRotation이 없으면 false를 반환한다', () => {
      const capsule: Capsule<HairProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'hair',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: '',
      };
      expect(hairEngine.shouldRotate(capsule)).toBe(false);
    });

    it('45일 이후 true를 반환한다', () => {
      const fortySixDaysAgo = new Date();
      fortySixDaysAgo.setDate(fortySixDaysAgo.getDate() - 46);

      const capsule: Capsule<HairProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'hair',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: fortySixDaysAgo.toISOString(),
      };
      expect(hairEngine.shouldRotate(capsule)).toBe(true);
    });

    it('45일 이전에는 false를 반환한다', () => {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      const capsule: Capsule<HairProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'hair',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: twentyDaysAgo.toISOString(),
      };
      expect(hairEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('중복 카테고리를 제거한다', () => {
      const items = [
        createProduct({ name: 'Shampoo 1', category: 'shampoo' }),
        createProduct({ name: 'Shampoo 2', category: 'shampoo' }),
        createProduct({ name: 'Conditioner', category: 'conditioner' }),
      ];

      const result = hairEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Shampoo 1');
    });

    it('고유 카테고리만 있으면 모두 유지한다', () => {
      const items = [
        createProduct({ category: 'shampoo' }),
        createProduct({ category: 'conditioner' }),
        createProduct({ category: 'treatment' }),
      ];
      expect(hairEngine.minimize(items).length).toBe(3);
    });
  });
});
