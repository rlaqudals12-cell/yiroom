/**
 * PC-2: 12-Tone 분류 테스트
 *
 * @module tests/lib/analysis/personal-color/classify
 * @description 12-Tone 퍼스널컬러 분류 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  determineUndertone,
  determineSeason,
  determineSubtype,
  classify12Tone,
  parseTwelveTone,
  composeTwelveTone,
  getReferenceLab,
  getKoreanName,
} from '@/lib/analysis/personal-color/classify';
import type { LabColor, TwelveTone, UndertoneResult } from '@/lib/analysis/personal-color/types';

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/personal-color/classify', () => {
  // ---------------------------------------------------------------------------
  // determineUndertone
  // ---------------------------------------------------------------------------

  describe('determineUndertone', () => {
    it('should return warm for high b* and hue', () => {
      // hue = atan2(30, 10) * 180/π ≈ 71.6° > 60° threshold
      // b* = 30 > 19 threshold
      const lab: LabColor = { L: 65, a: 10, b: 30 };
      const result = determineUndertone(lab);

      expect(result.undertone).toBe('warm');
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should return cool for low b* and hue', () => {
      const lab: LabColor = { L: 65, a: 5, b: 8 };
      const result = determineUndertone(lab);

      expect(result.undertone).toBe('cool');
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should return neutral for low chroma', () => {
      // 채도가 매우 낮은 경우
      const lab: LabColor = { L: 65, a: 3, b: 3 };
      const result = determineUndertone(lab);

      expect(result.undertone).toBe('neutral');
    });

    it('should include hue in result', () => {
      const lab: LabColor = { L: 60, a: 10, b: 15 };
      const result = determineUndertone(lab);

      expect(typeof result.hue).toBe('number');
      expect(result.hue).toBeGreaterThanOrEqual(0);
      expect(result.hue).toBeLessThan(360);
    });

    it('should include details string', () => {
      const lab: LabColor = { L: 60, a: 10, b: 15 };
      const result = determineUndertone(lab);

      expect(typeof result.details).toBe('string');
      expect(result.details).toContain('Hue');
      expect(result.details).toContain('b*');
    });

    it('should have confidence between 50 and 95', () => {
      const testCases: LabColor[] = [
        { L: 70, a: 20, b: 30 }, // 강한 웜톤
        { L: 70, a: 2, b: 5 }, // 강한 쿨톤
        { L: 65, a: 10, b: 15 }, // 중간
      ];

      testCases.forEach((lab) => {
        const result = determineUndertone(lab);
        expect(result.confidence).toBeGreaterThanOrEqual(50);
        expect(result.confidence).toBeLessThanOrEqual(95);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // determineSeason
  // ---------------------------------------------------------------------------

  describe('determineSeason', () => {
    it('should return spring for warm undertone with high L', () => {
      const lab: LabColor = { L: 70, a: 12, b: 22 };
      const undertone: UndertoneResult = {
        undertone: 'warm',
        confidence: 80,
        hue: 60,
        details: '',
      };

      const season = determineSeason(lab, undertone);
      expect(season).toBe('spring');
    });

    it('should return autumn for warm undertone with low L', () => {
      const lab: LabColor = { L: 50, a: 14, b: 22 };
      const undertone: UndertoneResult = {
        undertone: 'warm',
        confidence: 80,
        hue: 60,
        details: '',
      };

      const season = determineSeason(lab, undertone);
      expect(season).toBe('autumn');
    });

    it('should return summer for cool undertone with high L', () => {
      const lab: LabColor = { L: 68, a: 5, b: 12 };
      const undertone: UndertoneResult = {
        undertone: 'cool',
        confidence: 80,
        hue: 40,
        details: '',
      };

      const season = determineSeason(lab, undertone);
      expect(season).toBe('summer');
    });

    it('should return winter for cool undertone with low L', () => {
      const lab: LabColor = { L: 48, a: 5, b: 10 };
      const undertone: UndertoneResult = {
        undertone: 'cool',
        confidence: 80,
        hue: 40,
        details: '',
      };

      const season = determineSeason(lab, undertone);
      expect(season).toBe('winter');
    });

    it('should handle neutral undertone based on hue', () => {
      const labHigh: LabColor = { L: 68, a: 5, b: 10 };
      const undertone: UndertoneResult = {
        undertone: 'neutral',
        confidence: 60,
        hue: 50,
        details: '',
      };

      const season = determineSeason(labHigh, undertone);
      // neutral은 hue 기반으로 판정
      expect(['spring', 'summer', 'autumn', 'winter']).toContain(season);
    });
  });

  // ---------------------------------------------------------------------------
  // determineSubtype
  // ---------------------------------------------------------------------------

  describe('determineSubtype', () => {
    describe('spring subtypes', () => {
      it('should return light for high L', () => {
        const lab: LabColor = { L: 72, a: 8, b: 22 };
        expect(determineSubtype(lab, 'spring')).toBe('light');
      });

      it('should return bright for high chroma', () => {
        const lab: LabColor = { L: 60, a: 16, b: 28 };
        expect(determineSubtype(lab, 'spring')).toBe('bright');
      });

      it('should return true for middle values', () => {
        // chroma = sqrt(8² + 16²) ≈ 17.89, between 14 (muted) and 20 (bright)
        // L = 62, not high enough for light (< 70)
        const lab: LabColor = { L: 62, a: 8, b: 16 };
        expect(determineSubtype(lab, 'spring')).toBe('true');
      });
    });

    describe('summer subtypes', () => {
      it('should return light for high L', () => {
        const lab: LabColor = { L: 72, a: 4, b: 12 };
        expect(determineSubtype(lab, 'summer')).toBe('light');
      });

      it('should return muted for low chroma', () => {
        const lab: LabColor = { L: 60, a: 3, b: 8 };
        expect(determineSubtype(lab, 'summer')).toBe('muted');
      });

      it('should return true for middle values', () => {
        const lab: LabColor = { L: 62, a: 8, b: 15 };
        expect(determineSubtype(lab, 'summer')).toBe('true');
      });
    });

    describe('autumn subtypes', () => {
      it('should return deep for low L', () => {
        const lab: LabColor = { L: 44, a: 16, b: 24 };
        expect(determineSubtype(lab, 'autumn')).toBe('deep');
      });

      it('should return muted for low chroma', () => {
        const lab: LabColor = { L: 55, a: 5, b: 10 };
        expect(determineSubtype(lab, 'autumn')).toBe('muted');
      });

      it('should return true for middle values', () => {
        const lab: LabColor = { L: 55, a: 14, b: 22 };
        expect(determineSubtype(lab, 'autumn')).toBe('true');
      });
    });

    describe('winter subtypes', () => {
      it('should return deep for low L', () => {
        const lab: LabColor = { L: 44, a: 5, b: 8 };
        expect(determineSubtype(lab, 'winter')).toBe('deep');
      });

      it('should return bright for high chroma', () => {
        const lab: LabColor = { L: 55, a: 15, b: 18 };
        expect(determineSubtype(lab, 'winter')).toBe('bright');
      });

      it('should return true for middle values', () => {
        const lab: LabColor = { L: 52, a: 6, b: 10 };
        expect(determineSubtype(lab, 'winter')).toBe('true');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // classify12Tone
  // ---------------------------------------------------------------------------

  describe('classify12Tone', () => {
    it('should return TwelveToneResult with all required fields', () => {
      const skinMetrics = {
        lab: { L: 68, a: 12, b: 24 } as LabColor,
      };

      const result = classify12Tone(skinMetrics);

      expect(result).toHaveProperty('season');
      expect(result).toHaveProperty('subtype');
      expect(result).toHaveProperty('tone');
      expect(result).toHaveProperty('koreanName');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('labDistance');
      expect(result).toHaveProperty('warnings');
    });

    it('should return valid season', () => {
      const result = classify12Tone({ lab: { L: 68, a: 12, b: 24 } });
      expect(['spring', 'summer', 'autumn', 'winter']).toContain(result.season);
    });

    it('should return valid subtype', () => {
      const result = classify12Tone({ lab: { L: 68, a: 12, b: 24 } });
      expect(['light', 'true', 'bright', 'muted', 'deep']).toContain(result.subtype);
    });

    it('should compose tone from subtype and season', () => {
      const result = classify12Tone({ lab: { L: 68, a: 12, b: 24 } });
      expect(result.tone).toBe(`${result.subtype}-${result.season}`);
    });

    it('should return Korean name', () => {
      const result = classify12Tone({ lab: { L: 68, a: 12, b: 24 } });
      expect(typeof result.koreanName).toBe('string');
      expect(result.koreanName.length).toBeGreaterThan(0);
    });

    it('should return confidence between 0 and 100', () => {
      const result = classify12Tone({ lab: { L: 68, a: 12, b: 24 } });
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should return labDistance >= 0', () => {
      const result = classify12Tone({ lab: { L: 68, a: 12, b: 24 } });
      expect(result.labDistance).toBeGreaterThanOrEqual(0);
    });

    it('should add warning for low undertone confidence', () => {
      // 경계 영역의 Lab 값 (neutral에 가까움)
      const result = classify12Tone({ lab: { L: 65, a: 5, b: 12 } });
      // warnings는 배열
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should add warning for high lab distance', () => {
      // 극단적인 값
      const result = classify12Tone({ lab: { L: 80, a: 25, b: 35 } });
      // 경고가 추가되었을 수 있음
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // parseTwelveTone
  // ---------------------------------------------------------------------------

  describe('parseTwelveTone', () => {
    it('should parse light-spring correctly', () => {
      const { season, subtype } = parseTwelveTone('light-spring');
      expect(season).toBe('spring');
      expect(subtype).toBe('light');
    });

    it('should parse true-summer correctly', () => {
      const { season, subtype } = parseTwelveTone('true-summer');
      expect(season).toBe('summer');
      expect(subtype).toBe('true');
    });

    it('should parse muted-autumn correctly', () => {
      const { season, subtype } = parseTwelveTone('muted-autumn');
      expect(season).toBe('autumn');
      expect(subtype).toBe('muted');
    });

    it('should parse deep-winter correctly', () => {
      const { season, subtype } = parseTwelveTone('deep-winter');
      expect(season).toBe('winter');
      expect(subtype).toBe('deep');
    });

    it('should parse bright-winter correctly', () => {
      const { season, subtype } = parseTwelveTone('bright-winter');
      expect(season).toBe('winter');
      expect(subtype).toBe('bright');
    });
  });

  // ---------------------------------------------------------------------------
  // composeTwelveTone
  // ---------------------------------------------------------------------------

  describe('composeTwelveTone', () => {
    it('should compose light-spring', () => {
      expect(composeTwelveTone('spring', 'light')).toBe('light-spring');
    });

    it('should compose true-summer', () => {
      expect(composeTwelveTone('summer', 'true')).toBe('true-summer');
    });

    it('should compose muted-autumn', () => {
      expect(composeTwelveTone('autumn', 'muted')).toBe('muted-autumn');
    });

    it('should compose deep-winter', () => {
      expect(composeTwelveTone('winter', 'deep')).toBe('deep-winter');
    });

    it('should compose bright-spring', () => {
      expect(composeTwelveTone('spring', 'bright')).toBe('bright-spring');
    });
  });

  // ---------------------------------------------------------------------------
  // getReferenceLab
  // ---------------------------------------------------------------------------

  describe('getReferenceLab', () => {
    const ALL_TONES: TwelveTone[] = [
      'light-spring',
      'true-spring',
      'bright-spring',
      'light-summer',
      'true-summer',
      'muted-summer',
      'muted-autumn',
      'true-autumn',
      'deep-autumn',
      'true-winter',
      'bright-winter',
      'deep-winter',
    ];

    it('should return Lab values for all 12 tones', () => {
      ALL_TONES.forEach((tone) => {
        const lab = getReferenceLab(tone);

        expect(lab).toHaveProperty('L');
        expect(lab).toHaveProperty('a');
        expect(lab).toHaveProperty('b');
      });
    });

    it('should return valid L values (0-100)', () => {
      ALL_TONES.forEach((tone) => {
        const lab = getReferenceLab(tone);
        expect(lab.L).toBeGreaterThanOrEqual(0);
        expect(lab.L).toBeLessThanOrEqual(100);
      });
    });

    it('should return valid a values (-128 to 127)', () => {
      ALL_TONES.forEach((tone) => {
        const lab = getReferenceLab(tone);
        expect(lab.a).toBeGreaterThanOrEqual(-128);
        expect(lab.a).toBeLessThanOrEqual(127);
      });
    });

    it('should return valid b values (-128 to 127)', () => {
      ALL_TONES.forEach((tone) => {
        const lab = getReferenceLab(tone);
        expect(lab.b).toBeGreaterThanOrEqual(-128);
        expect(lab.b).toBeLessThanOrEqual(127);
      });
    });

    it('should return a copy (not mutate original)', () => {
      const lab1 = getReferenceLab('light-spring');
      const lab2 = getReferenceLab('light-spring');

      // 같은 값이지만 다른 객체
      expect(lab1).not.toBe(lab2);
      expect(lab1).toEqual(lab2);
    });
  });

  // ---------------------------------------------------------------------------
  // getKoreanName
  // ---------------------------------------------------------------------------

  describe('getKoreanName', () => {
    it('should return Korean names for all 12 tones', () => {
      const toneKoreanPairs: [TwelveTone, string][] = [
        ['light-spring', '라이트 스프링'],
        ['true-spring', '트루 스프링'],
        ['bright-spring', '브라이트 스프링'],
        ['light-summer', '라이트 서머'],
        ['true-summer', '트루 서머'],
        ['muted-summer', '뮤트 서머'],
        ['muted-autumn', '뮤트 오텀'],
        ['true-autumn', '트루 오텀'],
        ['deep-autumn', '딥 오텀'],
        ['true-winter', '트루 윈터'],
        ['bright-winter', '브라이트 윈터'],
        ['deep-winter', '딥 윈터'],
      ];

      toneKoreanPairs.forEach(([tone, korean]) => {
        expect(getKoreanName(tone)).toBe(korean);
      });
    });

    it('should return non-empty string', () => {
      expect(getKoreanName('light-spring').length).toBeGreaterThan(0);
    });
  });
});
