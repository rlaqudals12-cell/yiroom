/**
 * VITA 셰이드 데이터베이스 테스트
 *
 * @module tests/lib/oral-health/internal/vita-database
 * @description VITA Classical 16색 참조값 및 매칭 로직 검증
 */

import { describe, it, expect } from 'vitest';
import {
  VITA_SHADE_DATABASE,
  VITA_BRIGHTNESS_ORDER,
  VITA_SERIES_GROUPS,
  VITA_SERIES_CHARACTERISTICS,
  getShadeReference,
  findBestShadeMatch,
  calculateShadeSteps,
  interpretBrightness,
  interpretYellowness,
} from '@/lib/oral-health/internal/vita-database';
import type { LabColor, VitaShade } from '@/types/oral-health';

describe('lib/oral-health/internal/vita-database', () => {
  describe('VITA_SHADE_DATABASE', () => {
    it('should have 19 shades (16 classical + 3 bleached)', () => {
      expect(VITA_SHADE_DATABASE).toHaveLength(19);
    });

    it('should have valid Lab values for all shades', () => {
      for (const shade of VITA_SHADE_DATABASE) {
        expect(shade.lab.L).toBeGreaterThanOrEqual(0);
        expect(shade.lab.L).toBeLessThanOrEqual(100);
        expect(shade.shade).toBeDefined();
        expect(shade.series).toMatch(/^[ABCD]$/);
      }
    });

    it('should have B1 as brightnessRank 1 (brightest natural shade)', () => {
      const b1 = VITA_SHADE_DATABASE.find((s) => s.shade === 'B1');

      expect(b1).toBeDefined();
      expect(b1?.brightnessRank).toBe(1);
    });

    it('should have bleached shades with brightnessRank 0', () => {
      const bleached = VITA_SHADE_DATABASE.filter((s) => s.shade.startsWith('0M'));

      expect(bleached).toHaveLength(3);
      for (const shade of bleached) {
        expect(shade.brightnessRank).toBe(0);
      }
    });
  });

  describe('VITA_BRIGHTNESS_ORDER', () => {
    it('should have correct number of shades', () => {
      expect(VITA_BRIGHTNESS_ORDER).toHaveLength(19);
    });

    it('should start with bleached shades', () => {
      expect(VITA_BRIGHTNESS_ORDER[0]).toBe('0M1');
      expect(VITA_BRIGHTNESS_ORDER[1]).toBe('0M2');
      expect(VITA_BRIGHTNESS_ORDER[2]).toBe('0M3');
    });

    it('should have B1 as brightest natural shade', () => {
      expect(VITA_BRIGHTNESS_ORDER[3]).toBe('B1');
    });

    it('should end with darkest shades', () => {
      const lastShade = VITA_BRIGHTNESS_ORDER[VITA_BRIGHTNESS_ORDER.length - 1];
      expect(lastShade).toBe('C4');
    });
  });

  describe('VITA_SERIES_GROUPS', () => {
    it('should have 4 series (A, B, C, D)', () => {
      expect(Object.keys(VITA_SERIES_GROUPS)).toHaveLength(4);
    });

    it('should have A series with 5 shades', () => {
      expect(VITA_SERIES_GROUPS.A).toHaveLength(5);
      expect(VITA_SERIES_GROUPS.A).toContain('A1');
      expect(VITA_SERIES_GROUPS.A).toContain('A3.5');
    });

    it('should have B series with 4 shades', () => {
      expect(VITA_SERIES_GROUPS.B).toHaveLength(4);
    });

    it('should have C series with 4 shades', () => {
      expect(VITA_SERIES_GROUPS.C).toHaveLength(4);
    });

    it('should have D series with 3 shades', () => {
      expect(VITA_SERIES_GROUPS.D).toHaveLength(3);
    });
  });

  describe('VITA_SERIES_CHARACTERISTICS', () => {
    it('should have warm undertone for A series', () => {
      expect(VITA_SERIES_CHARACTERISTICS.A.undertone).toBe('warm');
    });

    it('should have warm undertone for B series', () => {
      expect(VITA_SERIES_CHARACTERISTICS.B.undertone).toBe('warm');
    });

    it('should have cool undertone for C series', () => {
      expect(VITA_SERIES_CHARACTERISTICS.C.undertone).toBe('cool');
    });

    it('should have neutral undertone for D series', () => {
      expect(VITA_SERIES_CHARACTERISTICS.D.undertone).toBe('neutral');
    });
  });

  describe('getShadeReference', () => {
    it('should return reference for valid shade', () => {
      const ref = getShadeReference('A2');

      expect(ref).toBeDefined();
      expect(ref?.shade).toBe('A2');
      expect(ref?.series).toBe('A');
      expect(ref?.lab).toBeDefined();
    });

    it('should return undefined for invalid shade', () => {
      const ref = getShadeReference('X9' as VitaShade);

      expect(ref).toBeUndefined();
    });

    it('should return correct Lab values for B1', () => {
      const ref = getShadeReference('B1');

      expect(ref?.lab.L).toBe(71);
      expect(ref?.lab.a).toBe(1.5);
      expect(ref?.lab.b).toBe(15);
    });
  });

  describe('findBestShadeMatch', () => {
    it('should find exact match for B1 Lab values', () => {
      const measuredLab: LabColor = { L: 71, a: 1.5, b: 15 };
      const result = findBestShadeMatch(measuredLab);

      expect(result.shade).toBe('B1');
      expect(result.deltaE).toBe(0);
    });

    it('should find close match for similar Lab values', () => {
      // 값이 A2에 가까움
      const measuredLab: LabColor = { L: 67, a: 2.5, b: 19 };
      const result = findBestShadeMatch(measuredLab);

      expect(result.shade).toBe('A2');
      expect(result.deltaE).toBeLessThan(1);
    });

    it('should return alternative matches sorted by deltaE', () => {
      const measuredLab: LabColor = { L: 68, a: 2, b: 17 };
      const result = findBestShadeMatch(measuredLab);

      expect(result.alternativeMatches).toHaveLength(3);

      // 대안들은 deltaE 순으로 정렬되어야 함
      for (let i = 1; i < result.alternativeMatches.length; i++) {
        expect(result.alternativeMatches[i].deltaE).toBeGreaterThanOrEqual(
          result.alternativeMatches[i - 1].deltaE
        );
      }
    });

    it('should exclude bleached shades when excludeBleached is true', () => {
      // 0M1에 가까운 값이지만 자연 셰이드만 매칭
      const measuredLab: LabColor = { L: 74, a: 0, b: 10 };
      const result = findBestShadeMatch(measuredLab, true);

      expect(result.shade).not.toMatch(/^0M/);
    });

    it('should include bleached shades when excludeBleached is false', () => {
      // 0M1과 완전 일치
      const measuredLab: LabColor = { L: 74, a: 0, b: 10 };
      const result = findBestShadeMatch(measuredLab, false);

      expect(result.shade).toBe('0M1');
    });
  });

  describe('calculateShadeSteps', () => {
    it('should return 0 for same shade', () => {
      const steps = calculateShadeSteps('A2', 'A2');

      expect(steps).toBe(0);
    });

    it('should return positive when second shade is brighter', () => {
      // A3 → A1 (더 밝음)
      const steps = calculateShadeSteps('A3', 'A1');

      expect(steps).toBeGreaterThan(0);
    });

    it('should return negative when second shade is darker', () => {
      // A1 → A3 (더 어두움)
      const steps = calculateShadeSteps('A1', 'A3');

      expect(steps).toBeLessThan(0);
    });

    it('should calculate correct steps between B1 and A4', () => {
      // B1 (rank 1) → A4 (rank 15)
      const steps = calculateShadeSteps('A4', 'B1');

      expect(steps).toBeGreaterThan(10);
    });

    it('should return 0 for invalid shades', () => {
      const steps = calculateShadeSteps('X1' as VitaShade, 'A1');

      expect(steps).toBe(0);
    });
  });

  describe('interpretBrightness', () => {
    it('should return very_bright for B1', () => {
      const result = interpretBrightness('B1');

      expect(result.level).toBe('very_bright');
    });

    it('should return bright for A2', () => {
      const result = interpretBrightness('A2');

      expect(result.level).toBe('bright');
    });

    it('should return medium for A3', () => {
      const result = interpretBrightness('A3');

      expect(result.level).toBe('medium');
    });

    it('should return dark for B4', () => {
      const result = interpretBrightness('B4');

      expect(result.level).toBe('dark');
    });

    it('should return very_dark for C4', () => {
      const result = interpretBrightness('C4');

      expect(result.level).toBe('very_dark');
    });

    it('should return very_bright for bleached shades', () => {
      const result = interpretBrightness('0M1');

      expect(result.level).toBe('very_bright');
      expect(result.description).toContain('미백');
    });

    it('should return medium for invalid shade', () => {
      const result = interpretBrightness('X9' as VitaShade);

      expect(result.level).toBe('medium');
      expect(result.description).toBe('정보 없음');
    });
  });

  describe('interpretYellowness', () => {
    it('should return minimal for low b* value', () => {
      const result = interpretYellowness({ L: 70, a: 0, b: 10 });

      expect(result.level).toBe('minimal');
    });

    it('should return mild for moderate b* value', () => {
      const result = interpretYellowness({ L: 70, a: 0, b: 14 });

      expect(result.level).toBe('mild');
    });

    it('should return moderate for higher b* value', () => {
      const result = interpretYellowness({ L: 70, a: 0, b: 18 });

      expect(result.level).toBe('moderate');
    });

    it('should return significant for high b* value', () => {
      const result = interpretYellowness({ L: 70, a: 0, b: 25 });

      expect(result.level).toBe('significant');
    });

    it('should handle boundary at b=12', () => {
      const result = interpretYellowness({ L: 70, a: 0, b: 12 });

      expect(result.level).toBe('minimal');
    });

    it('should handle boundary at b=16', () => {
      const result = interpretYellowness({ L: 70, a: 0, b: 16 });

      expect(result.level).toBe('mild');
    });

    it('should handle boundary at b=20', () => {
      const result = interpretYellowness({ L: 70, a: 0, b: 20 });

      expect(result.level).toBe('moderate');
    });
  });
});
