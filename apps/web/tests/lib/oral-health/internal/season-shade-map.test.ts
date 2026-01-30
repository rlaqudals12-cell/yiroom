/**
 * 시즌별 셰이드 매핑 테스트
 *
 * @module tests/lib/oral-health/internal/season-shade-map
 * @description 퍼스널컬러 시즌과 치아 셰이드 조화 검증
 */

import { describe, it, expect } from 'vitest';
import {
  SEASON_SHADE_RECOMMENDATIONS,
  isOverWhitening,
  recommendTargetShade,
  getWhiteningMethodsForSeason,
} from '@/lib/oral-health/internal/season-shade-map';
import type { PersonalColorSeason, VitaShade } from '@/types/oral-health';

describe('lib/oral-health/internal/season-shade-map', () => {
  describe('SEASON_SHADE_RECOMMENDATIONS', () => {
    const seasons: PersonalColorSeason[] = ['spring', 'summer', 'autumn', 'winter'];

    it('should have config for all four seasons', () => {
      for (const season of seasons) {
        expect(SEASON_SHADE_RECOMMENDATIONS[season]).toBeDefined();
      }
    });

    it('should have recommended shades for each season', () => {
      for (const season of seasons) {
        const config = SEASON_SHADE_RECOMMENDATIONS[season];
        expect(config.recommendedShades.length).toBeGreaterThan(0);
      }
    });

    it('should have maxBrightShade for each season', () => {
      for (const season of seasons) {
        const config = SEASON_SHADE_RECOMMENDATIONS[season];
        expect(config.maxBrightShade).toBeDefined();
      }
    });

    it('should have preferred series for each season', () => {
      for (const season of seasons) {
        const config = SEASON_SHADE_RECOMMENDATIONS[season];
        expect(config.preferredSeries.length).toBeGreaterThan(0);
      }
    });

    it('should have warm undertone series (A, B) for spring', () => {
      const config = SEASON_SHADE_RECOMMENDATIONS.spring;
      expect(config.preferredSeries).toContain('A');
      expect(config.preferredSeries).toContain('B');
    });

    it('should have cool undertone series (B, C) for summer', () => {
      const config = SEASON_SHADE_RECOMMENDATIONS.summer;
      expect(config.preferredSeries).toContain('B');
      expect(config.preferredSeries).toContain('C');
    });

    it('should avoid cool shades (C series) for autumn', () => {
      const config = SEASON_SHADE_RECOMMENDATIONS.autumn;
      expect(config.avoidShades.some((s) => s.startsWith('C'))).toBe(true);
    });

    it('should avoid dark warm shades for winter', () => {
      const config = SEASON_SHADE_RECOMMENDATIONS.winter;
      expect(config.avoidShades).toContain('A4');
    });

    it('should have harmony description for each season', () => {
      for (const season of seasons) {
        const config = SEASON_SHADE_RECOMMENDATIONS[season];
        expect(config.harmony.length).toBeGreaterThan(10);
      }
    });

    it('should have whitening notes for each season', () => {
      for (const season of seasons) {
        const config = SEASON_SHADE_RECOMMENDATIONS[season];
        expect(config.whiteningNotes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('isOverWhitening', () => {
    it('should flag 0M1 for spring (warm tone)', () => {
      const result = isOverWhitening('0M1', 'spring');

      expect(result.isOver).toBe(true);
      expect(result.reason).toContain('웜톤');
    });

    it('should flag 0M1 for autumn (warm tone)', () => {
      const result = isOverWhitening('0M1', 'autumn');

      expect(result.isOver).toBe(true);
    });

    it('should allow 0M1 for summer (cool tone)', () => {
      const result = isOverWhitening('0M1', 'summer');

      expect(result.isOver).toBe(false);
    });

    it('should allow 0M1 for winter (high contrast)', () => {
      const result = isOverWhitening('0M1', 'winter');

      expect(result.isOver).toBe(false);
    });

    it('should flag bleached shades for autumn', () => {
      const bleachedShades: VitaShade[] = ['0M1', '0M2', '0M3'];

      for (const shade of bleachedShades) {
        const result = isOverWhitening(shade, 'autumn');
        expect(result.isOver).toBe(true);
      }
    });

    it('should not flag natural shades as over whitening', () => {
      const result = isOverWhitening('A2', 'spring');

      expect(result.isOver).toBe(false);
    });

    it('should provide reason when shade is in avoidShades', () => {
      // C1 is in autumn's avoidShades
      const result = isOverWhitening('C1', 'autumn');

      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('권장하지 않는');
    });
  });

  describe('recommendTargetShade', () => {
    it('should recommend B1 or brighter for summer with dramatic level', () => {
      const result = recommendTargetShade('A3', 'summer', 'dramatic');

      expect(['0M1', '0M2', '0M3', 'B1', 'C1']).toContain(result.targetShade);
    });

    it('should recommend conservative shade for autumn', () => {
      const result = recommendTargetShade('A3', 'autumn', 'moderate');

      // Autumn은 0M 셰이드를 피해야 함
      expect(result.targetShade).not.toMatch(/^0M/);
    });

    it('should calculate correct shade steps', () => {
      const result = recommendTargetShade('A3', 'spring', 'subtle');

      expect(result.shadeSteps).toBeGreaterThanOrEqual(0);
    });

    it('should return realistic flag', () => {
      const subtleResult = recommendTargetShade('A2', 'spring', 'subtle');
      const dramaticResult = recommendTargetShade('A4', 'winter', 'dramatic');

      expect(subtleResult.isRealistic).toBe(true);
      // 8단계 이상은 비현실적
      if (dramaticResult.shadeSteps > 8) {
        expect(dramaticResult.isRealistic).toBe(false);
      }
    });

    it('should include warning for over whitening', () => {
      const result = recommendTargetShade('A1', 'autumn', 'dramatic');

      // 가을에 과도한 미백 시도 시 경고
      if (result.targetShade.startsWith('0M')) {
        expect(result.warning).toBeDefined();
      }
    });

    it('should return warning for invalid current shade', () => {
      const result = recommendTargetShade('X9' as VitaShade, 'spring', 'subtle');

      expect(result.isRealistic).toBe(false);
      expect(result.warning).toContain('식별할 수 없');
    });

    it('should respect maxBrightShade for season', () => {
      // Autumn maxBrightShade is A1
      const result = recommendTargetShade('A3', 'autumn', 'dramatic');
      const brightnessOrder = [
        '0M1',
        '0M2',
        '0M3',
        'B1',
        'A1',
        'B2',
        'D2',
        'A2',
        'C1',
        'C2',
        'D4',
        'A3',
        'D3',
        'B3',
        'A3.5',
        'B4',
        'C3',
        'A4',
        'C4',
      ];

      const targetIdx = brightnessOrder.indexOf(result.targetShade);
      const maxIdx = brightnessOrder.indexOf('A1'); // autumn's max

      // 타겟이 최대 밝기보다 밝지 않아야 함 (또는 같음)
      expect(targetIdx).toBeGreaterThanOrEqual(maxIdx);
    });

    describe('shade steps by desired level', () => {
      it('should recommend ~2 steps for subtle level', () => {
        const result = recommendTargetShade('A3', 'summer', 'subtle');

        expect(result.shadeSteps).toBeLessThanOrEqual(3);
      });

      it('should recommend ~4 steps for moderate level', () => {
        const result = recommendTargetShade('A3', 'summer', 'moderate');

        expect(result.shadeSteps).toBeLessThanOrEqual(5);
      });

      it('should recommend ~6 steps for dramatic level', () => {
        const result = recommendTargetShade('A4', 'winter', 'dramatic');

        expect(result.shadeSteps).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('getWhiteningMethodsForSeason', () => {
    it('should return whitening_toothpaste for 1-2 steps', () => {
      const methods = getWhiteningMethodsForSeason('spring', 2);

      expect(methods.some((m) => m.method === 'whitening_toothpaste')).toBe(true);
    });

    it('should return whitening_strips for 2-4 steps', () => {
      const methods = getWhiteningMethodsForSeason('summer', 3);

      expect(methods.some((m) => m.method === 'whitening_strips')).toBe(true);
    });

    it('should return home_bleaching for 3-6 steps', () => {
      const methods = getWhiteningMethodsForSeason('winter', 4);

      expect(methods.some((m) => m.method === 'home_bleaching')).toBe(true);
    });

    it('should return in_office_bleaching for 4+ steps', () => {
      const methods = getWhiteningMethodsForSeason('summer', 5);

      expect(methods.some((m) => m.method === 'in_office_bleaching')).toBe(true);
    });

    it('should sort methods by suitability', () => {
      const methods = getWhiteningMethodsForSeason('spring', 3);

      for (let i = 1; i < methods.length; i++) {
        expect(methods[i].suitability).toBeLessThanOrEqual(methods[i - 1].suitability);
      }
    });

    it('should reduce in_office suitability for autumn', () => {
      const autumnMethods = getWhiteningMethodsForSeason('autumn', 5);
      const summerMethods = getWhiteningMethodsForSeason('summer', 5);

      const autumnInOffice = autumnMethods.find((m) => m.method === 'in_office_bleaching');
      const summerInOffice = summerMethods.find((m) => m.method === 'in_office_bleaching');

      if (autumnInOffice && summerInOffice) {
        expect(autumnInOffice.suitability).toBeLessThan(summerInOffice.suitability);
      }
    });

    it('should include effectiveness level', () => {
      const methods = getWhiteningMethodsForSeason('spring', 4);

      for (const method of methods) {
        expect(['low', 'medium', 'high']).toContain(method.effectiveness);
      }
    });

    it('should include duration estimate', () => {
      const methods = getWhiteningMethodsForSeason('spring', 4);

      for (const method of methods) {
        expect(method.duration.length).toBeGreaterThan(0);
      }
    });

    it('should include notes for each method', () => {
      const methods = getWhiteningMethodsForSeason('spring', 4);

      for (const method of methods) {
        expect(method.notes.length).toBeGreaterThan(0);
      }
    });

    it('should add caution note for autumn with in_office_bleaching', () => {
      const methods = getWhiteningMethodsForSeason('autumn', 5);
      const inOffice = methods.find((m) => m.method === 'in_office_bleaching');

      expect(inOffice?.notes).toContain('웜톤');
    });
  });
});
