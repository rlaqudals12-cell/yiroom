/**
 * 쇼핑 컴패니언 갭 분석 테스트
 * @see lib/capsule/shopping.ts
 */

import { describe, it, expect, vi } from 'vitest';

// registry mock — getDomain이 엔진 객체를 반환하도록
vi.mock('@/lib/capsule/registry', () => ({
  getDomain: vi.fn((domainId: string) => {
    // getOptimalN만 필요
    return {
      getOptimalN: () => {
        const map: Record<string, number> = {
          'personal-color': 3,
          skin: 6,
          body: 3,
          workout: 4,
          nutrition: 4,
          hair: 3,
          makeup: 4,
          oral: 3,
          fashion: 10,
        };
        return map[domainId] ?? 3;
      },
    };
  }),
}));

import { analyzeGap } from '@/lib/capsule/shopping';
import type { DomainCapsuleStatus } from '@/lib/capsule/shopping';
import type { BeautyProfile } from '@/types/capsule';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(overrides: Partial<BeautyProfile> = {}): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: [],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    ...overrides,
  };
}

function createStatus(overrides: Partial<DomainCapsuleStatus> = {}): DomainCapsuleStatus {
  return {
    domainId: 'skin',
    domainName: '피부',
    itemCount: 5,
    optimalN: 6,
    ccs: 85,
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('analyzeGap', () => {
  describe('미생성 도메인 감지', () => {
    it('분석 미완료 모듈을 missing 갭으로 식별한다', () => {
      const profile = createProfile({ completedModules: [] });
      const result = analyzeGap(profile, []);

      expect(result.gaps.length).toBe(9); // 전체 9개 모듈
      expect(result.gaps.every((g) => g.gapType === 'missing')).toBe(true);
      expect(result.overallCompleteness).toBe(0);
      expect(result.completeDomains).toBe(0);
      expect(result.totalDomains).toBe(9);
    });

    it('일부 모듈만 완료한 경우 나머지를 missing으로 식별한다', () => {
      const profile = createProfile({ completedModules: ['PC', 'S'] });
      const statuses = [
        createStatus({
          domainId: 'personal-color',
          domainName: '퍼스널컬러',
          itemCount: 3,
          optimalN: 3,
          ccs: 90,
        }),
        createStatus({ domainId: 'skin', domainName: '피부', itemCount: 6, optimalN: 6, ccs: 85 }),
      ];

      const result = analyzeGap(profile, statuses);

      const missingGaps = result.gaps.filter((g) => g.gapType === 'missing');
      expect(missingGaps.length).toBe(7); // 9 - 2
      expect(result.completeDomains).toBe(2);
    });
  });

  describe('아이템 부족 감지', () => {
    it('캡슐 미생성 상태를 under 갭으로 식별한다', () => {
      const profile = createProfile({ completedModules: ['S'] });
      // skin 분석은 완료했지만 캡슐은 미생성
      const result = analyzeGap(profile, []);

      const skinGap = result.gaps.find((g) => g.moduleCode === 'S');
      expect(skinGap).toBeDefined();
      expect(skinGap?.gapType).toBe('under');
      expect(skinGap?.currentCount).toBe(0);
    });

    it('아이템 수가 optimalN보다 적으면 under 갭을 생성한다', () => {
      const profile = createProfile({ completedModules: ['S'] });
      const statuses = [createStatus({ domainId: 'skin', itemCount: 3, optimalN: 6, ccs: 85 })];

      const result = analyzeGap(profile, statuses);

      const skinGap = result.gaps.find((g) => g.moduleCode === 'S');
      expect(skinGap?.gapType).toBe('under');
      expect(skinGap?.currentCount).toBe(3);
      expect(skinGap?.optimalCount).toBe(6);
      expect(skinGap?.reason).toContain('3개');
    });
  });

  describe('저호환도 감지', () => {
    it('CCS 70 미만이면 low-score 갭을 생성한다', () => {
      const profile = createProfile({ completedModules: ['S'] });
      const statuses = [createStatus({ domainId: 'skin', itemCount: 6, optimalN: 6, ccs: 55 })];

      const result = analyzeGap(profile, statuses);

      const skinGap = result.gaps.find((g) => g.moduleCode === 'S');
      expect(skinGap?.gapType).toBe('low-score');
      expect(skinGap?.reason).toContain('55점');
    });
  });

  describe('완전한 도메인', () => {
    it('아이템 충분 + CCS 70 이상이면 갭을 생성하지 않는다', () => {
      const profile = createProfile({ completedModules: ['S'] });
      const statuses = [createStatus({ domainId: 'skin', itemCount: 6, optimalN: 6, ccs: 90 })];

      const result = analyzeGap(profile, statuses);

      const skinGap = result.gaps.find((g) => g.moduleCode === 'S');
      expect(skinGap).toBeUndefined();
      expect(result.completeDomains).toBe(1);
    });

    it('모든 모듈이 완전하면 completeness가 100이다', () => {
      const profile = createProfile({
        completedModules: ['PC', 'S', 'C', 'W', 'N', 'H', 'M', 'OH', 'Fashion'],
      });
      const statuses = [
        createStatus({ domainId: 'personal-color', itemCount: 3, optimalN: 3, ccs: 90 }),
        createStatus({ domainId: 'skin', itemCount: 6, optimalN: 6, ccs: 85 }),
        createStatus({ domainId: 'body', itemCount: 3, optimalN: 3, ccs: 80 }),
        createStatus({ domainId: 'workout', itemCount: 4, optimalN: 4, ccs: 75 }),
        createStatus({ domainId: 'nutrition', itemCount: 4, optimalN: 4, ccs: 82 }),
        createStatus({ domainId: 'hair', itemCount: 3, optimalN: 3, ccs: 88 }),
        createStatus({ domainId: 'makeup', itemCount: 4, optimalN: 4, ccs: 78 }),
        createStatus({ domainId: 'oral', itemCount: 3, optimalN: 3, ccs: 70 }),
        createStatus({ domainId: 'fashion', itemCount: 10, optimalN: 10, ccs: 92 }),
      ];

      const result = analyzeGap(profile, statuses);
      expect(result.gaps.length).toBe(0);
      expect(result.overallCompleteness).toBe(100);
      expect(result.completeDomains).toBe(9);
    });
  });

  describe('우선순위 정렬', () => {
    it('missing → under → low-score 순서로 정렬한다', () => {
      const profile = createProfile({ completedModules: ['S', 'W'] });
      const statuses = [
        createStatus({ domainId: 'skin', itemCount: 6, optimalN: 6, ccs: 50 }), // low-score
        createStatus({ domainId: 'workout', itemCount: 2, optimalN: 4, ccs: 85 }), // under
      ];

      const result = analyzeGap(profile, statuses);

      // missing 갭이 먼저, under가 중간, low-score가 마지막
      const gapTypes = result.gaps.map((g) => g.gapType);
      const missingIdx = gapTypes.indexOf('missing');
      const underIdx = gapTypes.indexOf('under');
      const lowIdx = gapTypes.indexOf('low-score');

      expect(missingIdx).toBeLessThan(underIdx);
      expect(underIdx).toBeLessThan(lowIdx);
    });
  });

  describe('canReuse 플래그', () => {
    it('Fashion 모듈은 canReuse가 true이다', () => {
      const profile = createProfile({ completedModules: ['Fashion'] });
      const statuses = [createStatus({ domainId: 'fashion', itemCount: 3, optimalN: 10, ccs: 85 })];

      const result = analyzeGap(profile, statuses);
      const fashionGap = result.gaps.find((g) => g.moduleCode === 'Fashion');
      expect(fashionGap?.canReuse).toBe(true);
    });

    it('다른 모듈은 canReuse가 false이다', () => {
      const profile = createProfile({ completedModules: ['S'] });
      const statuses = [createStatus({ domainId: 'skin', itemCount: 3, optimalN: 6, ccs: 85 })];

      const result = analyzeGap(profile, statuses);
      const skinGap = result.gaps.find((g) => g.moduleCode === 'S');
      expect(skinGap?.canReuse).toBe(false);
    });
  });

  describe('엣지 케이스', () => {
    it('빈 capsuleStatuses에도 정상 동작한다', () => {
      const profile = createProfile({ completedModules: ['PC', 'S'] });
      const result = analyzeGap(profile, []);

      expect(result.gaps.length).toBe(9);
      expect(result.overallCompleteness).toBe(0);
    });

    it('CCS가 정확히 70이면 갭을 생성하지 않는다', () => {
      const profile = createProfile({ completedModules: ['S'] });
      const statuses = [createStatus({ domainId: 'skin', itemCount: 6, optimalN: 6, ccs: 70 })];

      const result = analyzeGap(profile, statuses);
      const skinGap = result.gaps.find((g) => g.moduleCode === 'S');
      expect(skinGap).toBeUndefined();
    });

    it('CCS가 69이면 low-score 갭을 생성한다', () => {
      const profile = createProfile({ completedModules: ['S'] });
      const statuses = [createStatus({ domainId: 'skin', itemCount: 6, optimalN: 6, ccs: 69 })];

      const result = analyzeGap(profile, statuses);
      const skinGap = result.gaps.find((g) => g.moduleCode === 'S');
      expect(skinGap?.gapType).toBe('low-score');
    });
  });
});
