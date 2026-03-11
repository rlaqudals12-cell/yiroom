/**
 * VITA 3D-Master 29색 데이터베이스 테스트
 *
 * @module tests/lib/oral-health/internal/vita-3d-master
 * @description VITA 3D-Master 29색 참조값 및 매칭 로직 검증
 */

import { describe, it, expect } from 'vitest';
import {
  VITA_3D_MASTER_DATABASE,
  VITA_3D_VALUE_GROUPS,
  get3DShadeReference,
  findBest3DShadeMatch,
} from '@/lib/oral-health/internal/vita-database';
import type { LabColor } from '@/types/oral-health';

describe('lib/oral-health/internal/vita-3d-master', () => {
  describe('VITA_3D_MASTER_DATABASE', () => {
    it('29개 항목이 존재한다 (26 자연색 + 3 블리치)', () => {
      expect(VITA_3D_MASTER_DATABASE).toHaveLength(29);
    });

    it('모든 항목의 Lab L* 값이 유효 범위(0-100)에 있다', () => {
      for (const entry of VITA_3D_MASTER_DATABASE) {
        expect(entry.lab.L).toBeGreaterThanOrEqual(0);
        expect(entry.lab.L).toBeLessThanOrEqual(100);
        expect(entry.shade).toBeDefined();
        expect(entry.lab.a).toBeDefined();
        expect(entry.lab.b).toBeDefined();
      }
    });

    it('명도 그룹 0-5가 모두 포함되어 있다', () => {
      const valueGroups = new Set(VITA_3D_MASTER_DATABASE.map((s) => s.valueGroup));

      expect(valueGroups.has(0)).toBe(true);
      expect(valueGroups.has(1)).toBe(true);
      expect(valueGroups.has(2)).toBe(true);
      expect(valueGroups.has(3)).toBe(true);
      expect(valueGroups.has(4)).toBe(true);
      expect(valueGroups.has(5)).toBe(true);
      expect(valueGroups.size).toBe(6);
    });

    it('모든 채도 유형(L, M, R)이 포함되어 있다', () => {
      const chromaTypes = new Set(VITA_3D_MASTER_DATABASE.map((s) => s.chroma));

      expect(chromaTypes.has('L')).toBe(true);
      expect(chromaTypes.has('M')).toBe(true);
      expect(chromaTypes.has('R')).toBe(true);
    });

    it('모든 항목에 classicalEquivalent가 존재한다', () => {
      for (const entry of VITA_3D_MASTER_DATABASE) {
        expect(entry.classicalEquivalent).toBeDefined();
        expect(typeof entry.classicalEquivalent).toBe('string');
        expect(entry.classicalEquivalent!.length).toBeGreaterThan(0);
      }
    });

    it('brightnessRank가 1부터 29까지 고유하고 순차적이다', () => {
      const ranks = VITA_3D_MASTER_DATABASE.map((s) => s.brightnessRank).sort((a, b) => a - b);

      for (let i = 0; i < 29; i++) {
        expect(ranks[i]).toBe(i + 1);
      }
    });
  });

  describe('VITA_3D_VALUE_GROUPS', () => {
    it('6개 그룹(0-5)이 모두 존재한다', () => {
      const groupKeys = Object.keys(VITA_3D_VALUE_GROUPS).map(Number);

      expect(groupKeys).toHaveLength(6);
      expect(groupKeys).toContain(0);
      expect(groupKeys).toContain(1);
      expect(groupKeys).toContain(2);
      expect(groupKeys).toContain(3);
      expect(groupKeys).toContain(4);
      expect(groupKeys).toContain(5);
    });

    it('Value Group 2에 7개 셰이드가 있다', () => {
      expect(VITA_3D_VALUE_GROUPS[2]).toHaveLength(7);
    });

    it('Value Group 0에 Bleached 3개가 있다', () => {
      expect(VITA_3D_VALUE_GROUPS[0]).toHaveLength(3);
      for (const shade of VITA_3D_VALUE_GROUPS[0]) {
        expect(shade).toMatch(/^0M/);
      }
    });

    it('Value Group 1에 2개 셰이드가 있다', () => {
      expect(VITA_3D_VALUE_GROUPS[1]).toHaveLength(2);
    });

    it('Value Group 5에 3개 셰이드가 있다', () => {
      expect(VITA_3D_VALUE_GROUPS[5]).toHaveLength(3);
    });
  });

  describe('get3DShadeReference', () => {
    it('유효한 셰이드(2M2)에 대해 참조값을 반환한다', () => {
      // Arrange
      const shade = '2M2' as const;

      // Act
      const ref = get3DShadeReference(shade);

      // Assert
      expect(ref).toBeDefined();
      expect(ref!.shade).toBe('2M2');
      expect(ref!.valueGroup).toBe(2);
      expect(ref!.chroma).toBe('M');
      expect(ref!.lab).toBeDefined();
      expect(ref!.classicalEquivalent).toBe('A2');
    });

    it('유효하지 않은 셰이드에 대해 undefined를 반환한다', () => {
      // Arrange & Act
      const ref = get3DShadeReference('9Z9' as never);

      // Assert
      expect(ref).toBeUndefined();
    });

    it('Bleached 셰이드(0M1)에 대해 참조값을 반환한다', () => {
      const ref = get3DShadeReference('0M1');

      expect(ref).toBeDefined();
      expect(ref!.valueGroup).toBe(0);
      expect(ref!.chroma).toBe('M');
    });

    it('1M1 셰이드의 Lab 값이 정확하다', () => {
      const ref = get3DShadeReference('1M1');

      expect(ref).toBeDefined();
      expect(ref!.lab.L).toBe(71);
      expect(ref!.lab.a).toBe(1.5);
      expect(ref!.lab.b).toBe(15);
    });
  });

  describe('findBest3DShadeMatch', () => {
    it('1M1 Lab 값에 대해 정확히 매칭한다', () => {
      // Arrange
      const measuredLab: LabColor = { L: 71, a: 1.5, b: 15 };

      // Act
      const result = findBest3DShadeMatch(measuredLab);

      // Assert
      expect(result.shade).toBe('1M1');
      expect(result.deltaE).toBe(0);
    });

    it('excludeBleached=true일 때 Bleached 셰이드를 제외한다', () => {
      // Arrange - 0M1에 가까운 Lab 값
      const measuredLab: LabColor = { L: 74, a: 0, b: 10 };

      // Act
      const result = findBest3DShadeMatch(measuredLab, true);

      // Assert
      expect(result.shade).not.toMatch(/^0M/);
    });

    it('excludeBleached=false일 때 Bleached 셰이드를 포함한다', () => {
      // Arrange - 0M1 정확한 Lab 값
      const measuredLab: LabColor = { L: 74, a: 0, b: 10 };

      // Act
      const result = findBest3DShadeMatch(measuredLab, false);

      // Assert
      expect(result.shade).toBe('0M1');
    });

    it('classicalEquivalent를 반환한다', () => {
      // Arrange
      const measuredLab: LabColor = { L: 67, a: 2.5, b: 19 };

      // Act
      const result = findBest3DShadeMatch(measuredLab);

      // Assert
      expect(result.classicalEquivalent).toBeDefined();
      expect(typeof result.classicalEquivalent).toBe('string');
    });

    it('대안 매칭이 deltaE 순으로 정렬되어 있다', () => {
      // Arrange
      const measuredLab: LabColor = { L: 65, a: 2, b: 17 };

      // Act
      const result = findBest3DShadeMatch(measuredLab);

      // Assert
      expect(result.alternativeMatches.length).toBeGreaterThan(0);
      expect(result.alternativeMatches.length).toBeLessThanOrEqual(3);

      for (let i = 1; i < result.alternativeMatches.length; i++) {
        expect(result.alternativeMatches[i].deltaE).toBeGreaterThanOrEqual(
          result.alternativeMatches[i - 1].deltaE
        );
      }
    });

    it('대안 매칭의 deltaE가 최선 매칭보다 크거나 같다', () => {
      // Arrange
      const measuredLab: LabColor = { L: 60, a: 3, b: 20 };

      // Act
      const result = findBest3DShadeMatch(measuredLab);

      // Assert
      for (const alt of result.alternativeMatches) {
        expect(alt.deltaE).toBeGreaterThanOrEqual(result.deltaE);
      }
    });

    it('reference 객체가 매칭된 셰이드 정보를 포함한다', () => {
      // Arrange
      const measuredLab: LabColor = { L: 67, a: 2.5, b: 19 };

      // Act
      const result = findBest3DShadeMatch(measuredLab);

      // Assert
      expect(result.reference).toBeDefined();
      expect(result.reference.shade).toBe(result.shade);
      expect(result.reference.lab).toBeDefined();
      expect(result.reference.valueGroup).toBeDefined();
      expect(result.reference.chroma).toBeDefined();
    });
  });
});
