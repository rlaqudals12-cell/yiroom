/**
 * DomainRegistry 테스트
 *
 * @module tests/lib/capsule/registry
 * @description 캡슐 도메인 엔진 등록/조회/관리 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerDomain,
  getDomain,
  getAllDomains,
  hasDomain,
  getDomainCount,
  _clearRegistry,
} from '@/lib/capsule/registry';
import type { CapsuleEngine } from '@/lib/capsule/engine';
import type { CompatibilityScore } from '@/types/capsule';

// =============================================================================
// Mock Engine Factory
// =============================================================================

function createMockEngine(domainId: string, domainName: string): CapsuleEngine<unknown> {
  return {
    domainId,
    domainName,
    curate: async () => [],
    getOptimalN: () => 5,
    checkCompatibility: (): CompatibilityScore => ({
      overall: 80,
      layer1: 85,
      layer2: 75,
      layer3: 80,
    }),
    getPairwiseScore: () => 75,
    personalize: (items) => items,
    shouldRotate: () => false,
    rotate: async () => [],
    minimize: (items) => items,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('DomainRegistry', () => {
  beforeEach(() => {
    _clearRegistry();
  });

  describe('registerDomain', () => {
    it('should register a new domain engine', () => {
      const engine = createMockEngine('skin', '스킨케어');

      registerDomain(engine);

      expect(hasDomain('skin')).toBe(true);
      expect(getDomainCount()).toBe(1);
    });

    it('should throw when registering duplicate domainId', () => {
      const engine1 = createMockEngine('skin', '스킨케어');
      const engine2 = createMockEngine('skin', '스킨케어 v2');

      registerDomain(engine1);

      expect(() => registerDomain(engine2)).toThrow("도메인 'skin'는 이미 등록되었습니다.");
    });

    it('should register multiple different domains', () => {
      registerDomain(createMockEngine('skin', '스킨케어'));
      registerDomain(createMockEngine('fashion', '패션'));
      registerDomain(createMockEngine('nutrition', '영양'));

      expect(getDomainCount()).toBe(3);
    });
  });

  describe('getDomain', () => {
    it('should return registered engine by domainId', () => {
      const engine = createMockEngine('fashion', '패션');
      registerDomain(engine);

      const result = getDomain('fashion');

      expect(result).toBeDefined();
      expect(result?.domainId).toBe('fashion');
      expect(result?.domainName).toBe('패션');
    });

    it('should return undefined for unregistered domainId', () => {
      const result = getDomain('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getAllDomains', () => {
    it('should return empty array when no domains registered', () => {
      expect(getAllDomains()).toEqual([]);
    });

    it('should return all registered engines', () => {
      registerDomain(createMockEngine('skin', '스킨케어'));
      registerDomain(createMockEngine('fashion', '패션'));

      const all = getAllDomains();

      expect(all).toHaveLength(2);
      const ids = all.map((e) => e.domainId);
      expect(ids).toContain('skin');
      expect(ids).toContain('fashion');
    });
  });

  describe('hasDomain', () => {
    it('should return false for unregistered domain', () => {
      expect(hasDomain('unknown')).toBe(false);
    });

    it('should return true for registered domain', () => {
      registerDomain(createMockEngine('nutrition', '영양'));
      expect(hasDomain('nutrition')).toBe(true);
    });
  });

  describe('getDomainCount', () => {
    it('should return 0 for empty registry', () => {
      expect(getDomainCount()).toBe(0);
    });

    it('should reflect actual count', () => {
      registerDomain(createMockEngine('a', 'A'));
      registerDomain(createMockEngine('b', 'B'));
      registerDomain(createMockEngine('c', 'C'));

      expect(getDomainCount()).toBe(3);
    });
  });

  describe('_clearRegistry', () => {
    it('should remove all registered domains', () => {
      registerDomain(createMockEngine('skin', '스킨케어'));
      registerDomain(createMockEngine('fashion', '패션'));

      expect(getDomainCount()).toBe(2);

      _clearRegistry();

      expect(getDomainCount()).toBe(0);
      expect(getAllDomains()).toEqual([]);
    });
  });
});
