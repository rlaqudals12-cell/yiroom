/**
 * Fashion 도메인 엔진 테스트
 * @see lib/capsule/domains/fashion.ts
 */

import { describe, it, expect } from 'vitest';
import { fashionEngine } from '@/lib/capsule/domains/fashion';
import type { FashionItem } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['PC', 'Fashion'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    personalColor: {
      season: 'spring',
      subType: 'light',
      palette: ['#FFD700', '#FF6347', '#DAA520'],
    },
    ...overrides,
  };
}

function createItem(overrides: Partial<FashionItem> = {}): FashionItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Item',
    category: 'top',
    color: { name: 'black', hex: '#000000' },
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('FashionEngine', () => {
  it('should have correct domain metadata', () => {
    expect(fashionEngine.domainId).toBe('fashion');
    expect(fashionEngine.domainName).toBe('패션');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('should return 10 for level 1', () => {
      expect(fashionEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(10);
    });

    it('should return 15 for level 4', () => {
      expect(fashionEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(15);
    });
  });

  describe('curate', () => {
    it('should return items matching optimal N', async () => {
      const profile = createProfile({ personalizationLevel: 1 });
      const items = await fashionEngine.curate(profile);
      expect(items.length).toBe(10);
    });

    it('should respect maxItems option', async () => {
      const items = await fashionEngine.curate(createProfile(), { maxItems: 5 });
      expect(items.length).toBe(5);
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('should give high score for neutral colors', () => {
      const a = createItem({ color: { name: 'black', hex: '#000000' } });
      const b = createItem({ color: { name: 'red', hex: '#FF6347' }, category: 'bottom' });

      const score = fashionEngine.getPairwiseScore(a, b);
      // 무채색(black) + 다른 카테고리 = 60 + 25 + 5 = 90
      expect(score).toBeGreaterThan(70);
    });

    it('should give high score for same color group', () => {
      const a = createItem({
        color: { name: 'gold', hex: '#FFD700' },
        category: 'top',
      });
      const b = createItem({
        color: { name: 'tomato', hex: '#FF6347' },
        category: 'bottom',
      });

      const score = fashionEngine.getPairwiseScore(a, b);
      // warm group + different category
      expect(score).toBeGreaterThanOrEqual(60);
    });

    it('should bonus different categories', () => {
      const a = createItem({ category: 'top' });
      const b = createItem({ category: 'bottom' });

      const scoreA = fashionEngine.getPairwiseScore(a, b);

      const c = createItem({ category: 'top' });
      const d = createItem({ category: 'top' });

      const scoreB = fashionEngine.getPairwiseScore(c, d);

      expect(scoreA).toBeGreaterThan(scoreB);
    });

    it('should evaluate silhouette harmony', () => {
      const a = createItem({ silhouette: 'oversized', category: 'top' });
      const b = createItem({ silhouette: 'slim', category: 'bottom' });

      const score = fashionEngine.getPairwiseScore(a, b);
      // oversized + slim = 좋은 조합
      expect(score).toBeGreaterThan(60);
    });

    it('should handle items without silhouette', () => {
      const a = createItem({ category: 'shoes' });
      const b = createItem({ category: 'bag' });

      const score = fashionEngine.getPairwiseScore(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkCompatibility', () => {
    it('should return 100 for single item', () => {
      const result = fashionEngine.checkCompatibility([createItem()]);
      expect(result.layer1).toBe(100);
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('should prioritize items matching personal color season', () => {
      const profile = createProfile({
        personalColor: { season: 'spring', subType: 'light', palette: ['#FFD700'] },
      });

      const items = [
        createItem({
          name: 'Cool item',
          color: { name: 'blue', hex: '#4169E1', season: 'winter' },
        }),
        createItem({
          name: 'Warm item',
          color: { name: 'gold', hex: '#FFD700', season: 'spring' },
        }),
      ];

      const result = fashionEngine.personalize(items, profile);
      expect(result[0].name).toBe('Warm item');
    });

    it('should prioritize palette-matching colors', () => {
      const profile = createProfile({
        personalColor: { season: 'autumn', subType: 'dark', palette: ['#CD853F'] },
      });

      const items = [
        createItem({ name: 'No match', color: { name: 'gray', hex: '#808080' } }),
        createItem({ name: 'Palette match', color: { name: 'peru', hex: '#CD853F' } }),
      ];

      const result = fashionEngine.personalize(items, profile);
      expect(result[0].name).toBe('Palette match');
    });

    it('should return unchanged if no personal color', () => {
      const profile = createProfile({ personalColor: undefined });
      const items = [createItem({ name: 'A' }), createItem({ name: 'B' })];

      const result = fashionEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('should return false before 90 days', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const capsule: Capsule<FashionItem> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'fashion',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: tenDaysAgo.toISOString(),
      };

      expect(fashionEngine.shouldRotate(capsule)).toBe(false);
    });

    it('should return true after 90 days', () => {
      const ninetyOneDaysAgo = new Date();
      ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);

      const capsule: Capsule<FashionItem> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'fashion',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: ninetyOneDaysAgo.toISOString(),
      };

      expect(fashionEngine.shouldRotate(capsule)).toBe(true);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('should prioritize essential categories', () => {
      const items = [
        createItem({ name: 'Acc', category: 'accessory' }),
        createItem({ name: 'Top', category: 'top' }),
        createItem({ name: 'Bottom', category: 'bottom' }),
        createItem({ name: 'Outer', category: 'outer' }),
        createItem({ name: 'Shoes', category: 'shoes' }),
      ];

      const result = fashionEngine.minimize(items);
      // Essential categories first: top, bottom, outer, shoes → then accessory
      expect(result[0].name).toBe('Top');
      expect(result[result.length - 1].name).toBe('Acc');
    });

    it('should keep all items (no duplicate removal for fashion)', () => {
      const items = [
        createItem({ name: 'Top 1', category: 'top' }),
        createItem({ name: 'Top 2', category: 'top' }),
        createItem({ name: 'Bottom', category: 'bottom' }),
      ];

      const result = fashionEngine.minimize(items);
      // 패션에서는 같은 카테고리 중복 허용 (첫 번째만 essential로 분류)
      expect(result.length).toBe(3);
    });
  });
});
