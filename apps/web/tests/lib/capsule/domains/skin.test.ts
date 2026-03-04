/**
 * Skin 도메인 엔진 테스트
 * @see lib/capsule/domains/skin.ts
 */

import { describe, it, expect } from 'vitest';
import { skinEngine } from '@/lib/capsule/domains/skin';
import type { SkinProduct } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['S'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    skin: { type: 'combination', concerns: ['acne', 'dryness'], scores: {} },
    ...overrides,
  };
}

function createProduct(overrides: Partial<SkinProduct> = {}): SkinProduct {
  return {
    id: `product-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Product',
    brand: 'TestBrand',
    category: 'serum',
    ingredients: [],
    skinTypes: [],
    concerns: [],
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('SkinEngine', () => {
  it('should have correct domain metadata', () => {
    expect(skinEngine.domainId).toBe('skin');
    expect(skinEngine.domainName).toBe('스킨케어');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('curate', () => {
    it('should return items based on profile', async () => {
      const items = await skinEngine.curate(createProfile());
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(10);
    });

    it('should respect maxItems option', async () => {
      const items = await skinEngine.curate(createProfile(), { maxItems: 3 });
      expect(items.length).toBe(3);
    });
  });

  describe('getOptimalN', () => {
    it('should return 5 for level 1', () => {
      expect(skinEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(5);
    });

    it('should return 6 for level 2', () => {
      expect(skinEngine.getOptimalN(createProfile({ personalizationLevel: 2 }))).toBe(6);
    });

    it('should return 7 for level 3', () => {
      expect(skinEngine.getOptimalN(createProfile({ personalizationLevel: 3 }))).toBe(7);
    });

    it('should return 8 for level 4', () => {
      expect(skinEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(8);
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('should return base score for neutral products', () => {
      // 다른 카테고리로 설정해야 same-category 감점(-15) 없음
      const a = createProduct({ category: 'cleanser', ingredients: ['water', 'glycerin'] });
      const b = createProduct({ category: 'toner', ingredients: ['water', 'aloe vera'] });

      const score = skinEngine.getPairwiseScore(a, b);
      expect(score).toBe(70); // 기본 점수 (충돌/시너지 없음)
    });

    it('should penalize ingredient conflicts', () => {
      const a = createProduct({ category: 'serum', ingredients: ['retinol', 'peptide'] });
      const b = createProduct({ category: 'moisturizer', ingredients: ['aha', 'glycerin'] });

      const score = skinEngine.getPairwiseScore(a, b);
      expect(score).toBe(50); // 70 - 20 (retinol+aha 충돌)
    });

    it('should bonus ingredient synergies', () => {
      const a = createProduct({ category: 'toner', ingredients: ['hyaluronic acid'] });
      const b = createProduct({ category: 'serum', ingredients: ['niacinamide'] });

      const score = skinEngine.getPairwiseScore(a, b);
      expect(score).toBe(80); // 70 + 10 (HA+niacinamide 시너지)
    });

    it('should penalize same category', () => {
      const a = createProduct({ category: 'serum', ingredients: ['water'] });
      const b = createProduct({ category: 'serum', ingredients: ['glycerin'] });

      const score = skinEngine.getPairwiseScore(a, b);
      expect(score).toBe(55); // 70 - 15 (same category)
    });

    it('should detect retinol + vitamin c conflict', () => {
      // retinol+vitamin c는 충돌 목록에 있음 (SKIN_INGREDIENT_CONFLICTS)
      const a = createProduct({ category: 'serum', ingredients: ['retinol'] });
      const b = createProduct({ category: 'moisturizer', ingredients: ['vitamin c'] });

      const score = skinEngine.getPairwiseScore(a, b);
      expect(score).toBe(50); // 70 - 20 (retinol+vitamin c 충돌)
    });

    it('should detect multiple conflicts/synergies', () => {
      const a = createProduct({ category: 'serum', ingredients: ['retinol', 'hyaluronic acid'] });
      const b = createProduct({ category: 'moisturizer', ingredients: ['aha', 'niacinamide'] });

      const score = skinEngine.getPairwiseScore(a, b);
      // retinol+aha conflict (-20), HA+niacinamide synergy (+10)
      expect(score).toBe(60); // 70 - 20 + 10
    });

    it('should clamp score to 0-100', () => {
      // 많은 충돌 시 0 아래로 안 감
      const a = createProduct({ category: 'serum', ingredients: ['retinol', 'benzoyl peroxide'] });
      const b = createProduct({ category: 'serum', ingredients: ['aha', 'bha', 'vitamin c'] });

      const score = skinEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('should return 100 for single item', () => {
      const result = skinEngine.checkCompatibility([createProduct()]);
      expect(result.layer1).toBe(100);
    });

    it('should calculate average pairwise scores', () => {
      const items = [
        createProduct({ category: 'toner', ingredients: ['hyaluronic acid'] }),
        createProduct({ category: 'serum', ingredients: ['niacinamide'] }),
      ];

      const result = skinEngine.checkCompatibility(items);
      expect(result.layer1).toBe(80); // 70 + 10 (HA+niacinamide 시너지)
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('should sort by skin type match', () => {
      const profile = createProfile({ skin: { type: 'oily', concerns: [], scores: {} } });

      const items = [
        createProduct({ name: 'No match', skinTypes: ['dry'] }),
        createProduct({ name: 'Match', skinTypes: ['oily'] }),
      ];

      const result = skinEngine.personalize(items, profile);
      expect(result[0].name).toBe('Match');
    });

    it('should consider concern matching', () => {
      const profile = createProfile({
        skin: { type: 'normal', concerns: ['acne'], scores: {} },
      });

      const items = [
        createProduct({ name: 'No concern', skinTypes: [], concerns: [] }),
        createProduct({ name: 'Acne match', skinTypes: [], concerns: ['acne'] }),
      ];

      const result = skinEngine.personalize(items, profile);
      expect(result[0].name).toBe('Acne match');
    });

    it('should return items unchanged if no skin profile', () => {
      const profile = createProfile({ skin: undefined });
      const items = [createProduct({ name: 'A' }), createProduct({ name: 'B' })];

      const result = skinEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('should return false if no last rotation', () => {
      const capsule: Capsule<SkinProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'skin',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: '',
      };

      expect(skinEngine.shouldRotate(capsule)).toBe(false);
    });

    it('should return true after 30 days', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const capsule: Capsule<SkinProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'skin',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: thirtyOneDaysAgo.toISOString(),
      };

      expect(skinEngine.shouldRotate(capsule)).toBe(true);
    });

    it('should return false before 30 days', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const capsule: Capsule<SkinProduct> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'skin',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: tenDaysAgo.toISOString(),
      };

      expect(skinEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('should remove duplicate categories', () => {
      const items = [
        createProduct({ name: 'Serum 1', category: 'serum' }),
        createProduct({ name: 'Serum 2', category: 'serum' }),
        createProduct({ name: 'Moisturizer', category: 'moisturizer' }),
      ];

      const result = skinEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Serum 1');
      expect(result[1].name).toBe('Moisturizer');
    });

    it('should keep all items with unique categories', () => {
      const items = [
        createProduct({ category: 'cleanser' }),
        createProduct({ category: 'toner' }),
        createProduct({ category: 'serum' }),
      ];

      expect(skinEngine.minimize(items).length).toBe(3);
    });
  });
});
