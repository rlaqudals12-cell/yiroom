/**
 * 로테이션 엔진 테스트
 * @see lib/capsule/rotation.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findDomainsNeedingRotation } from '@/lib/capsule/rotation';
import { _clearRegistry, registerDomain } from '@/lib/capsule/registry';
import type { Capsule, CapsuleItem } from '@/types/capsule';

// =============================================================================
// Mock 엔진
// =============================================================================

function createMockEngine(
  domainId: string,
  shouldRotateValue: boolean
): ReturnType<typeof vi.fn> & {
  domainId: string;
  domainName: string;
  shouldRotate: ReturnType<typeof vi.fn>;
} {
  return {
    domainId,
    domainName: `${domainId} 테스트`,
    curate: vi.fn(),
    getOptimalN: vi.fn().mockReturnValue(5),
    checkCompatibility: vi.fn().mockReturnValue({ overall: 80, layer1: 80, layer2: 0, layer3: 0 }),
    getPairwiseScore: vi.fn().mockReturnValue(80),
    personalize: vi.fn((items: unknown[]) => items),
    shouldRotate: vi.fn().mockReturnValue(shouldRotateValue),
    rotate: vi.fn().mockResolvedValue([]),
    minimize: vi.fn((items: unknown[]) => items),
  } as unknown as ReturnType<typeof vi.fn> & {
    domainId: string;
    domainName: string;
    shouldRotate: ReturnType<typeof vi.fn>;
  };
}

function createCapsule(domainId: string, lastRotationDaysAgo: number): Capsule<unknown> {
  const lastRotation = new Date();
  lastRotation.setDate(lastRotation.getDate() - lastRotationDaysAgo);

  return {
    id: `capsule-${domainId}`,
    userId: 'user_test',
    domainId,
    items: [createItem('item-1'), createItem('item-2')],
    ccs: 75,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRotation: lastRotation.toISOString(),
  };
}

function createItem(id: string): CapsuleItem<unknown> {
  return {
    id,
    capsuleId: 'capsule-1',
    item: { name: 'test' },
    profileFitScore: 70,
    usageCount: 3,
    lastUsed: null,
    addedAt: new Date().toISOString(),
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('Rotation Engine', () => {
  beforeEach(() => {
    _clearRegistry();
    vi.clearAllMocks();
  });

  // =========================================================================
  // findDomainsNeedingRotation
  // =========================================================================

  describe('findDomainsNeedingRotation', () => {
    it('should return empty for no capsules', () => {
      expect(findDomainsNeedingRotation([])).toEqual([]);
    });

    it('should return domains that need rotation', () => {
      const skinEngine = createMockEngine('skin', true);
      const fashionEngine = createMockEngine('fashion', false);
      registerDomain(skinEngine as unknown as Parameters<typeof registerDomain>[0]);
      registerDomain(fashionEngine as unknown as Parameters<typeof registerDomain>[0]);

      const capsules = [createCapsule('skin', 31), createCapsule('fashion', 10)];

      const result = findDomainsNeedingRotation(capsules);
      expect(result).toEqual(['skin']);
    });

    it('should return multiple domains', () => {
      const skinEngine = createMockEngine('skin', true);
      const fashionEngine = createMockEngine('fashion', true);
      registerDomain(skinEngine as unknown as Parameters<typeof registerDomain>[0]);
      registerDomain(fashionEngine as unknown as Parameters<typeof registerDomain>[0]);

      const capsules = [createCapsule('skin', 31), createCapsule('fashion', 91)];

      const result = findDomainsNeedingRotation(capsules);
      expect(result).toEqual(['skin', 'fashion']);
    });

    it('should skip unregistered domains', () => {
      const capsules = [createCapsule('unknown-domain', 100)];

      const result = findDomainsNeedingRotation(capsules);
      expect(result).toEqual([]);
    });

    it('should return empty when no domains need rotation', () => {
      const skinEngine = createMockEngine('skin', false);
      registerDomain(skinEngine as unknown as Parameters<typeof registerDomain>[0]);

      const capsules = [createCapsule('skin', 5)];

      const result = findDomainsNeedingRotation(capsules);
      expect(result).toEqual([]);
    });
  });
});
