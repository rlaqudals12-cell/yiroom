/**
 * Personal Color 도메인 엔진 테스트
 * @see lib/capsule/domains/personal-color.ts
 */

import { describe, it, expect } from 'vitest';
import { personalColorEngine } from '@/lib/capsule/domains/personal-color';
import type { PCPalette } from '@/lib/capsule/domain-types';
import type { BeautyProfile, Capsule } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['PC'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    personalColor: { season: 'spring', subType: 'light', palette: ['#FFD700', '#FF6347'] },
    ...overrides,
  };
}

function createPalette(overrides: Partial<PCPalette> = {}): PCPalette {
  return {
    id: `pc-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Palette',
    category: 'clothing',
    colors: ['#FFD700'],
    season: 'spring',
    seasonFit: 90,
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('PersonalColorEngine', () => {
  it('도메인 메타데이터가 올바르다', () => {
    expect(personalColorEngine.domainId).toBe('personal-color');
    expect(personalColorEngine.domainName).toBe('퍼스널컬러');
  });

  // =========================================================================
  // C1: Curation
  // =========================================================================

  describe('getOptimalN', () => {
    it('레벨 1일 때 2를 반환한다', () => {
      expect(personalColorEngine.getOptimalN(createProfile({ personalizationLevel: 1 }))).toBe(2);
    });

    it('레벨 3일 때 4를 반환한다', () => {
      expect(personalColorEngine.getOptimalN(createProfile({ personalizationLevel: 3 }))).toBe(4);
    });

    it('레벨 4일 때 4를 반환한다 (상한)', () => {
      expect(personalColorEngine.getOptimalN(createProfile({ personalizationLevel: 4 }))).toBe(4);
    });
  });

  describe('curate', () => {
    it('프로필 기반으로 아이템을 반환한다', async () => {
      const items = await personalColorEngine.curate(createProfile());
      expect(items.length).toBe(3); // level 2 → 3개
    });

    it('maxItems 옵션을 존중한다', async () => {
      const items = await personalColorEngine.curate(createProfile(), { maxItems: 1 });
      expect(items.length).toBe(1);
    });

    it('시즌이 아이템에 반영된다', async () => {
      const items = await personalColorEngine.curate(createProfile());
      expect(items[0].season).toBe('spring');
    });

    it('팔레트 색상이 아이템에 포함된다', async () => {
      const items = await personalColorEngine.curate(createProfile());
      expect(items[0].colors).toContain('#FFD700');
    });
  });

  // =========================================================================
  // C2: Compatibility
  // =========================================================================

  describe('getPairwiseScore', () => {
    it('같은 시즌이면 높은 점수를 반환한다', () => {
      const a = createPalette({ season: 'spring', category: 'clothing' });
      const b = createPalette({ season: 'spring', category: 'makeup' });

      const score = personalColorEngine.getPairwiseScore(a, b);
      // harmony(100) + categoryBonus(10) = 110 → clamped to 100
      expect(score).toBe(100);
    });

    it('대비되는 시즌은 낮은 점수를 반환한다', () => {
      const a = createPalette({ season: 'spring', category: 'clothing' });
      const b = createPalette({ season: 'winter', category: 'makeup' });

      const score = personalColorEngine.getPairwiseScore(a, b);
      // harmony(30) + categoryBonus(10) = 40
      expect(score).toBe(40);
    });

    it('같은 카테고리이면 감점한다', () => {
      const a = createPalette({ season: 'spring', category: 'clothing' });
      const b = createPalette({ season: 'spring', category: 'clothing' });

      const score = personalColorEngine.getPairwiseScore(a, b);
      // harmony(100) + categoryBonus(-5) = 95
      expect(score).toBe(95);
    });

    it('인접 시즌은 중간 점수를 반환한다', () => {
      const a = createPalette({ season: 'spring', category: 'clothing' });
      const b = createPalette({ season: 'autumn', category: 'makeup' });

      const score = personalColorEngine.getPairwiseScore(a, b);
      // harmony(60) + categoryBonus(10) = 70
      expect(score).toBe(70);
    });
  });

  describe('checkCompatibility', () => {
    it('아이템이 1개이면 100을 반환한다', () => {
      const result = personalColorEngine.checkCompatibility([createPalette()]);
      expect(result.layer1).toBe(100);
    });

    it('여러 아이템의 평균 점수를 계산한다', () => {
      const items = [
        createPalette({ season: 'spring', category: 'clothing' }),
        createPalette({ season: 'spring', category: 'makeup' }),
      ];
      const result = personalColorEngine.checkCompatibility(items);
      expect(result.layer1).toBe(100); // 같은 시즌 + 다른 카테고리
    });
  });

  // =========================================================================
  // C3: Personalization
  // =========================================================================

  describe('personalize', () => {
    it('seasonFit이 높은 아이템을 우선 정렬한다', () => {
      const profile = createProfile();

      const items = [
        createPalette({ name: 'Low fit', seasonFit: 50 }),
        createPalette({ name: 'High fit', seasonFit: 95 }),
      ];

      const result = personalColorEngine.personalize(items, profile);
      expect(result[0].name).toBe('High fit');
    });

    it('퍼스널컬러가 없으면 원본을 그대로 반환한다', () => {
      const profile = createProfile({ personalColor: undefined });
      const items = [createPalette({ name: 'A' }), createPalette({ name: 'B' })];

      const result = personalColorEngine.personalize(items, profile);
      expect(result.length).toBe(2);
    });
  });

  // =========================================================================
  // C4: Rotation
  // =========================================================================

  describe('shouldRotate', () => {
    it('lastRotation이 없으면 false를 반환한다', () => {
      const capsule: Capsule<PCPalette> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'personal-color',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: '',
      };
      expect(personalColorEngine.shouldRotate(capsule)).toBe(false);
    });

    it('180일 이후 true를 반환한다', () => {
      const oneEightyOneDaysAgo = new Date();
      oneEightyOneDaysAgo.setDate(oneEightyOneDaysAgo.getDate() - 181);

      const capsule: Capsule<PCPalette> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'personal-color',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: oneEightyOneDaysAgo.toISOString(),
      };
      expect(personalColorEngine.shouldRotate(capsule)).toBe(true);
    });

    it('180일 이전에는 false를 반환한다', () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const capsule: Capsule<PCPalette> = {
        id: 'c1',
        userId: 'u1',
        domainId: 'personal-color',
        items: [],
        ccs: 70,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRotation: ninetyDaysAgo.toISOString(),
      };
      expect(personalColorEngine.shouldRotate(capsule)).toBe(false);
    });
  });

  // =========================================================================
  // C5: Minimalism
  // =========================================================================

  describe('minimize', () => {
    it('중복 카테고리를 제거한다', () => {
      const items = [
        createPalette({ name: 'Clothing 1', category: 'clothing' }),
        createPalette({ name: 'Clothing 2', category: 'clothing' }),
        createPalette({ name: 'Makeup', category: 'makeup' }),
      ];

      const result = personalColorEngine.minimize(items);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Clothing 1');
      expect(result[1].name).toBe('Makeup');
    });

    it('고유 카테고리만 있으면 모두 유지한다', () => {
      const items = [
        createPalette({ category: 'clothing' }),
        createPalette({ category: 'makeup' }),
        createPalette({ category: 'accessory' }),
      ];
      expect(personalColorEngine.minimize(items).length).toBe(3);
    });
  });
});
