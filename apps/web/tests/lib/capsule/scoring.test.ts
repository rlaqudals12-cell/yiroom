/**
 * CCS 스코어링 테스트
 * @see lib/capsule/scoring.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCCS,
  intraDomainScore,
  crossDomainScore,
  profileFitScore,
  findLowScoreItems,
  calculateDomainCompatibility,
} from '@/lib/capsule/scoring';
import type { DomainItemGroup } from '@/lib/capsule/scoring';
import type { BeautyProfile, CapsuleItem, CrossDomainRule } from '@/types/capsule';
import { CCS_WEIGHTS } from '@/types/capsule';
import { _clearRegistry, registerDomain } from '@/lib/capsule/registry';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['S', 'PC'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    ...overrides,
  };
}

function createItem<T>(item: T, fitScore: number = 70): CapsuleItem<T> {
  return {
    id: `item-${Math.random().toString(36).slice(2, 8)}`,
    capsuleId: 'capsule-1',
    item,
    profileFitScore: fitScore,
    usageCount: 0,
    lastUsed: null,
    addedAt: new Date().toISOString(),
  };
}

function createCrossDomainRules(): CrossDomainRule[] {
  return [
    {
      id: '1',
      domain1: 'skin',
      domain2: 'nutrition',
      ruleName: '영양소→피부 시너지',
      factor: 95,
      ruleType: 'synergy',
      description: null,
    },
    {
      id: '2',
      domain1: 'fashion',
      domain2: 'personal_color',
      ruleName: '색상 조화도',
      factor: 90,
      ruleType: 'synergy',
      description: null,
    },
  ];
}

// Mock engine for testing
const mockEngine = {
  domainId: 'test-domain',
  domainName: '테스트',
  curate: vi.fn(),
  getOptimalN: vi.fn().mockReturnValue(5),
  checkCompatibility: vi.fn(),
  getPairwiseScore: vi.fn().mockReturnValue(80),
  personalize: vi.fn(),
  shouldRotate: vi.fn(),
  rotate: vi.fn(),
  minimize: vi.fn(),
};

// =============================================================================
// 테스트
// =============================================================================

describe('CCS Scoring', () => {
  beforeEach(() => {
    _clearRegistry();
    vi.clearAllMocks();
    // 기본 mock 반환값 리셋
    mockEngine.getPairwiseScore.mockReturnValue(80);
  });

  // =========================================================================
  // calculateCCS
  // =========================================================================

  describe('calculateCCS', () => {
    it('should calculate CCS with 3-layer weights', () => {
      registerDomain(mockEngine);

      const groups: DomainItemGroup[] = [
        {
          domainId: 'test-domain',
          items: [createItem({ name: 'A' }, 80), createItem({ name: 'B' }, 80)],
        },
      ];

      const result = calculateCCS(groups, createProfile(), []);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.grade).toBeDefined();
      expect(typeof result.meetsThreshold).toBe('boolean');
      expect(result.layers.l1).toBeDefined();
      expect(result.layers.l2).toBeDefined();
      expect(result.layers.l3).toBeDefined();
    });

    it('should return grade S for score >= 90', () => {
      registerDomain(mockEngine);
      mockEngine.getPairwiseScore.mockReturnValue(100);

      const groups: DomainItemGroup[] = [
        {
          domainId: 'test-domain',
          items: [createItem({ name: 'A' }, 95), createItem({ name: 'B' }, 95)],
        },
      ];

      const result = calculateCCS(groups, createProfile(), []);
      expect(result.layers.l3).toBe(95);
    });

    it('should clamp score to 0-100', () => {
      registerDomain(mockEngine);
      mockEngine.getPairwiseScore.mockReturnValue(0);

      const groups: DomainItemGroup[] = [
        {
          domainId: 'test-domain',
          items: [createItem({ name: 'A' }, 0), createItem({ name: 'B' }, 0)],
        },
      ];

      const result = calculateCCS(groups, createProfile(), []);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should use correct weights', () => {
      expect(CCS_WEIGHTS.L1_INTRA_DOMAIN).toBe(0.4);
      expect(CCS_WEIGHTS.L2_CROSS_DOMAIN).toBe(0.25);
      expect(CCS_WEIGHTS.L3_PROFILE_FIT).toBe(0.35);
      expect(
        CCS_WEIGHTS.L1_INTRA_DOMAIN + CCS_WEIGHTS.L2_CROSS_DOMAIN + CCS_WEIGHTS.L3_PROFILE_FIT
      ).toBe(1.0);
    });

    it('should report meetsThreshold correctly', () => {
      registerDomain(mockEngine);
      mockEngine.getPairwiseScore.mockReturnValue(90);

      const groups: DomainItemGroup[] = [
        {
          domainId: 'test-domain',
          items: [createItem({ name: 'A' }, 85), createItem({ name: 'B' }, 85)],
        },
      ];

      const result = calculateCCS(groups, createProfile(), []);
      // L1=90, L2=100(단일도메인), L3=85
      // score ≈ 90*0.4 + 100*0.25 + 85*0.35 = 36+25+29.75 = 90.75 → 91
      expect(result.meetsThreshold).toBe(true);
    });

    it('should handle empty groups', () => {
      const result = calculateCCS([], createProfile(), []);
      expect(result.score).toBe(100);
      expect(result.grade).toBe('S');
    });
  });

  // =========================================================================
  // intraDomainScore
  // =========================================================================

  describe('intraDomainScore', () => {
    it('should return 100 for empty groups', () => {
      expect(intraDomainScore([])).toBe(100);
    });

    it('should return 100 for single-item groups', () => {
      const groups: DomainItemGroup[] = [{ domainId: 'test', items: [createItem({ name: 'A' })] }];
      expect(intraDomainScore(groups)).toBe(100);
    });

    it('should use engine.getPairwiseScore for registered domains', () => {
      registerDomain(mockEngine);
      mockEngine.getPairwiseScore.mockReturnValue(85);

      const groups: DomainItemGroup[] = [
        {
          domainId: 'test-domain',
          items: [createItem({ name: 'A' }), createItem({ name: 'B' }), createItem({ name: 'C' })],
        },
      ];

      const score = intraDomainScore(groups);
      // 3 items → 3 pairs (3C2), all 85 → avg 85
      expect(score).toBe(85);
      expect(mockEngine.getPairwiseScore).toHaveBeenCalledTimes(3);
    });

    it('should return 80 for unregistered domain', () => {
      const groups: DomainItemGroup[] = [
        {
          domainId: 'unregistered',
          items: [createItem({ name: 'A' }), createItem({ name: 'B' })],
        },
      ];

      expect(intraDomainScore(groups)).toBe(80);
    });

    it('should average across multiple domains', () => {
      registerDomain(mockEngine);

      // 별도 vi.fn()으로 독립 mock 생성
      const anotherPairwise = vi.fn().mockReturnValue(60);
      const anotherEngine = {
        ...mockEngine,
        domainId: 'another',
        domainName: '다른',
        getPairwiseScore: anotherPairwise,
      };
      registerDomain(anotherEngine);
      mockEngine.getPairwiseScore.mockReturnValue(90);

      const groups: DomainItemGroup[] = [
        { domainId: 'test-domain', items: [createItem({ name: 'A' }), createItem({ name: 'B' })] },
        { domainId: 'another', items: [createItem({ name: 'C' }), createItem({ name: 'D' })] },
      ];

      const score = intraDomainScore(groups);
      // avg of 90 and 60 = 75
      expect(score).toBe(75);
    });
  });

  // =========================================================================
  // crossDomainScore
  // =========================================================================

  describe('crossDomainScore', () => {
    it('should return 100 for single domain', () => {
      const groups: DomainItemGroup[] = [{ domainId: 'skin', items: [createItem({ name: 'A' })] }];
      expect(crossDomainScore(groups, [])).toBe(100);
    });

    it('should use rule factor when rule exists', () => {
      const rules = createCrossDomainRules();
      const groups: DomainItemGroup[] = [
        { domainId: 'skin', items: [createItem({ name: 'A' })] },
        { domainId: 'nutrition', items: [createItem({ name: 'B' })] },
      ];

      const score = crossDomainScore(groups, rules);
      expect(score).toBe(95); // skin-nutrition rule factor
    });

    it('should find rules bidirectionally', () => {
      const rules = createCrossDomainRules();
      const groups: DomainItemGroup[] = [
        { domainId: 'nutrition', items: [createItem({ name: 'A' })] },
        { domainId: 'skin', items: [createItem({ name: 'B' })] },
      ];

      const score = crossDomainScore(groups, rules);
      expect(score).toBe(95); // 양방향 조회
    });

    it('should return 50 for domain pairs without rules', () => {
      const groups: DomainItemGroup[] = [
        { domainId: 'domainX', items: [createItem({ name: 'A' })] },
        { domainId: 'domainY', items: [createItem({ name: 'B' })] },
      ];

      expect(crossDomainScore(groups, [])).toBe(50);
    });

    it('should average scores across domain pairs', () => {
      const rules = createCrossDomainRules();
      const groups: DomainItemGroup[] = [
        { domainId: 'skin', items: [createItem({ name: 'A' })] },
        { domainId: 'nutrition', items: [createItem({ name: 'B' })] },
        { domainId: 'unknown', items: [createItem({ name: 'C' })] },
      ];

      const score = crossDomainScore(groups, rules);
      // 3 pairs: skin-nutrition=95, skin-unknown=50, nutrition-unknown=50
      // avg = (95+50+50)/3 = 65
      expect(score).toBe(65);
    });
  });

  // =========================================================================
  // profileFitScore
  // =========================================================================

  describe('profileFitScore', () => {
    it('should return 100 for empty groups', () => {
      expect(profileFitScore([], createProfile())).toBe(100);
    });

    it('should average profileFitScore across all items', () => {
      const groups: DomainItemGroup[] = [
        {
          domainId: 'test',
          items: [createItem({ name: 'A' }, 80), createItem({ name: 'B' }, 60)],
        },
      ];

      expect(profileFitScore(groups, createProfile())).toBe(70);
    });

    it('should flatten items across domains', () => {
      const groups: DomainItemGroup[] = [
        { domainId: 'skin', items: [createItem({ name: 'A' }, 90)] },
        { domainId: 'fashion', items: [createItem({ name: 'B' }, 70)] },
      ];

      expect(profileFitScore(groups, createProfile())).toBe(80);
    });
  });

  // =========================================================================
  // findLowScoreItems
  // =========================================================================

  describe('findLowScoreItems', () => {
    it('should find items below threshold', () => {
      const items = [
        createItem({ name: 'A' }, 80),
        createItem({ name: 'B' }, 50),
        createItem({ name: 'C' }, 90),
        createItem({ name: 'D' }, 30),
      ];

      const lowIndices = findLowScoreItems(items);
      // CCS_THRESHOLD = 70, so items B(50) and D(30) are below
      expect(lowIndices).toEqual([3, 1]); // sorted by score ascending
    });

    it('should use custom threshold', () => {
      const items = [createItem({ name: 'A' }, 80), createItem({ name: 'B' }, 85)];

      const lowIndices = findLowScoreItems(items, 90);
      expect(lowIndices).toEqual([0, 1]);
    });

    it('should return empty for all above threshold', () => {
      const items = [createItem({ name: 'A' }, 80), createItem({ name: 'B' }, 90)];

      expect(findLowScoreItems(items)).toEqual([]);
    });
  });

  // =========================================================================
  // calculateDomainCompatibility
  // =========================================================================

  describe('calculateDomainCompatibility', () => {
    it('should return CompatibilityScore structure', () => {
      const result = calculateDomainCompatibility(
        'skin',
        [createItem({ name: 'A' }, 75)],
        createProfile(),
        []
      );

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('layer1');
      expect(result).toHaveProperty('layer2');
      expect(result).toHaveProperty('layer3');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should clamp overall to 0-100', () => {
      const result = calculateDomainCompatibility(
        'domain',
        [createItem({ name: 'A' }, 100)],
        createProfile(),
        []
      );

      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.overall).toBeGreaterThanOrEqual(0);
    });
  });
});
