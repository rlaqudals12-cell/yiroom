/**
 * PC-2: 12-Tone 서브타입 특성 테스트
 *
 * @module tests/lib/analysis/personal-color/characteristics
 * @description 12-Tone별 특성 정보 조회 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getSubtypeCharacteristics,
  getAllToneCharacteristics,
} from '@/lib/analysis/personal-color/characteristics';
import type { TwelveTone } from '@/lib/analysis/personal-color/types';

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/personal-color/characteristics', () => {
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

  // ---------------------------------------------------------------------------
  // getSubtypeCharacteristics
  // ---------------------------------------------------------------------------

  describe('getSubtypeCharacteristics', () => {
    it('should return characteristics for all 12 tones', () => {
      ALL_TONES.forEach((tone) => {
        const characteristics = getSubtypeCharacteristics(tone);

        expect(characteristics).toBeDefined();
        expect(characteristics.tone).toBe(tone);
      });
    });

    it('should include Korean name', () => {
      const characteristics = getSubtypeCharacteristics('light-spring');

      expect(characteristics.koreanName).toBe('라이트 스프링');
    });

    it('should include display name', () => {
      const characteristics = getSubtypeCharacteristics('true-summer');

      expect(characteristics.displayName).toBe('True Summer');
    });

    it('should include description in Korean', () => {
      const characteristics = getSubtypeCharacteristics('deep-autumn');

      expect(characteristics.description).toBeDefined();
      expect(typeof characteristics.description).toBe('string');
      expect(characteristics.description.length).toBeGreaterThan(10);
    });

    it('should include keywords array', () => {
      const characteristics = getSubtypeCharacteristics('bright-winter');

      expect(characteristics.keywords).toBeDefined();
      expect(Array.isArray(characteristics.keywords)).toBe(true);
      expect(characteristics.keywords.length).toBeGreaterThan(0);

      // 키워드가 문자열인지 확인
      characteristics.keywords.forEach((keyword) => {
        expect(typeof keyword).toBe('string');
      });
    });

    it('should have correct season property', () => {
      // Spring
      expect(getSubtypeCharacteristics('light-spring').season).toBe('spring');
      expect(getSubtypeCharacteristics('true-spring').season).toBe('spring');
      expect(getSubtypeCharacteristics('bright-spring').season).toBe('spring');

      // Summer
      expect(getSubtypeCharacteristics('light-summer').season).toBe('summer');
      expect(getSubtypeCharacteristics('true-summer').season).toBe('summer');
      expect(getSubtypeCharacteristics('muted-summer').season).toBe('summer');

      // Autumn
      expect(getSubtypeCharacteristics('muted-autumn').season).toBe('autumn');
      expect(getSubtypeCharacteristics('true-autumn').season).toBe('autumn');
      expect(getSubtypeCharacteristics('deep-autumn').season).toBe('autumn');

      // Winter
      expect(getSubtypeCharacteristics('true-winter').season).toBe('winter');
      expect(getSubtypeCharacteristics('bright-winter').season).toBe('winter');
      expect(getSubtypeCharacteristics('deep-winter').season).toBe('winter');
    });

    it('should have correct subtype property', () => {
      expect(getSubtypeCharacteristics('light-spring').subtype).toBe('light');
      expect(getSubtypeCharacteristics('true-spring').subtype).toBe('true');
      expect(getSubtypeCharacteristics('bright-spring').subtype).toBe('bright');
      expect(getSubtypeCharacteristics('muted-summer').subtype).toBe('muted');
      expect(getSubtypeCharacteristics('deep-autumn').subtype).toBe('deep');
    });

    it('should include Lab range for classification', () => {
      const characteristics = getSubtypeCharacteristics('true-autumn');

      expect(characteristics.labRange).toBeDefined();
      expect(characteristics.labRange.L).toBeDefined();
      expect(characteristics.labRange.a).toBeDefined();
      expect(characteristics.labRange.b).toBeDefined();

      // L 범위 검증
      expect(characteristics.labRange.L.min).toBeLessThan(characteristics.labRange.L.max);
      // a 범위 검증
      expect(characteristics.labRange.a.min).toBeLessThan(characteristics.labRange.a.max);
      // b 범위 검증
      expect(characteristics.labRange.b.min).toBeLessThan(characteristics.labRange.b.max);
    });

    it('should include reference Lab values', () => {
      const characteristics = getSubtypeCharacteristics('muted-summer');

      expect(characteristics.referenceLab).toBeDefined();
      expect(typeof characteristics.referenceLab.L).toBe('number');
      expect(typeof characteristics.referenceLab.a).toBe('number');
      expect(typeof characteristics.referenceLab.b).toBe('number');
    });

    it('should return a copy (not mutate original)', () => {
      const char1 = getSubtypeCharacteristics('light-summer');
      const char2 = getSubtypeCharacteristics('light-summer');

      // 동일한 값이지만 다른 객체
      expect(char1).not.toBe(char2);
      expect(char1).toEqual(char2);
    });
  });

  // ---------------------------------------------------------------------------
  // getAllToneCharacteristics
  // ---------------------------------------------------------------------------

  describe('getAllToneCharacteristics', () => {
    it('should return array of 12 characteristics', () => {
      const allChars = getAllToneCharacteristics();

      expect(Array.isArray(allChars)).toBe(true);
      expect(allChars.length).toBe(12);
    });

    it('should include all 12 tones', () => {
      const allChars = getAllToneCharacteristics();
      const tones = allChars.map((c) => c.tone);

      ALL_TONES.forEach((tone) => {
        expect(tones).toContain(tone);
      });
    });

    it('should have 3 spring tones', () => {
      const allChars = getAllToneCharacteristics();
      const springChars = allChars.filter((c) => c.season === 'spring');

      expect(springChars.length).toBe(3);
    });

    it('should have 3 summer tones', () => {
      const allChars = getAllToneCharacteristics();
      const summerChars = allChars.filter((c) => c.season === 'summer');

      expect(summerChars.length).toBe(3);
    });

    it('should have 3 autumn tones', () => {
      const allChars = getAllToneCharacteristics();
      const autumnChars = allChars.filter((c) => c.season === 'autumn');

      expect(autumnChars.length).toBe(3);
    });

    it('should have 3 winter tones', () => {
      const allChars = getAllToneCharacteristics();
      const winterChars = allChars.filter((c) => c.season === 'winter');

      expect(winterChars.length).toBe(3);
    });

    it('should have unique tones', () => {
      const allChars = getAllToneCharacteristics();
      const tones = allChars.map((c) => c.tone);
      const uniqueTones = new Set(tones);

      expect(uniqueTones.size).toBe(12);
    });

    it('should have valid Lab ranges for all tones', () => {
      const allChars = getAllToneCharacteristics();

      allChars.forEach((char) => {
        // L 범위: 0-100
        expect(char.labRange.L.min).toBeGreaterThanOrEqual(0);
        expect(char.labRange.L.max).toBeLessThanOrEqual(100);

        // a 범위: -128 ~ 127
        expect(char.labRange.a.min).toBeGreaterThanOrEqual(-128);
        expect(char.labRange.a.max).toBeLessThanOrEqual(127);

        // b 범위: -128 ~ 127
        expect(char.labRange.b.min).toBeGreaterThanOrEqual(-128);
        expect(char.labRange.b.max).toBeLessThanOrEqual(127);
      });
    });
  });
});
