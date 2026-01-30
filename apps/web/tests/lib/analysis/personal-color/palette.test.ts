/**
 * PC-2: 12-Tone 색상 팔레트 테스트
 *
 * @module tests/lib/analysis/personal-color/palette
 * @description 12-Tone별 팔레트 생성 및 색상 호환성 계산 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateTonePalette,
  getToneCompatibility,
  getAllTonePalettes,
} from '@/lib/analysis/personal-color/palette';
import type { LabColor, TwelveTone } from '@/lib/analysis/personal-color/types';

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/personal-color/palette', () => {
  // ---------------------------------------------------------------------------
  // generateTonePalette
  // ---------------------------------------------------------------------------

  describe('generateTonePalette', () => {
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

    it('should generate palette for all 12 tones', () => {
      ALL_TONES.forEach((tone) => {
        const palette = generateTonePalette(tone);

        expect(palette).toBeDefined();
        expect(palette.tone).toBe(tone);
      });
    });

    it('should include bestColors array', () => {
      const palette = generateTonePalette('light-spring');

      expect(palette.bestColors).toBeDefined();
      expect(Array.isArray(palette.bestColors)).toBe(true);
      expect(palette.bestColors.length).toBeGreaterThan(0);
    });

    it('should include worstColors array', () => {
      const palette = generateTonePalette('light-spring');

      expect(palette.worstColors).toBeDefined();
      expect(Array.isArray(palette.worstColors)).toBe(true);
      expect(palette.worstColors.length).toBeGreaterThan(0);
    });

    it('should include makeup colors (lip, eye, blush)', () => {
      const palette = generateTonePalette('true-summer');

      expect(palette.lipColors).toBeDefined();
      expect(palette.eyeColors).toBeDefined();
      expect(palette.blushColors).toBeDefined();

      expect(palette.lipColors!.length).toBeGreaterThan(0);
      expect(palette.eyeColors!.length).toBeGreaterThan(0);
      expect(palette.blushColors!.length).toBeGreaterThan(0);
    });

    it('should have valid hex colors', () => {
      const palette = generateTonePalette('bright-winter');

      palette.bestColors.forEach((color) => {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.name).toBeDefined();
        expect(typeof color.name).toBe('string');
      });
    });

    it('should return a copy (not mutate original)', () => {
      const palette1 = generateTonePalette('true-autumn');
      const palette2 = generateTonePalette('true-autumn');

      // 동일한 값이지만 다른 객체
      expect(palette1).not.toBe(palette2);
      expect(palette1).toEqual(palette2);
    });
  });

  // ---------------------------------------------------------------------------
  // getToneCompatibility
  // ---------------------------------------------------------------------------

  describe('getToneCompatibility', () => {
    it('should return high score for matching color', () => {
      // light-spring의 bestColor 중 하나: 파파야휩 #FFEFD5
      // Lab 값 (대략): L=96, a=2, b=10
      const matchingLab: LabColor = { L: 96, a: 2, b: 10 };

      const result = getToneCompatibility('light-spring', matchingLab);

      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.grade).not.toBe('avoid');
    });

    it('should return low score for conflicting color', () => {
      // light-spring의 worstColor: 블랙 #000000
      // 블랙의 Lab 값: L=0, a=0, b=0
      const conflictingLab: LabColor = { L: 0, a: 0, b: 0 };

      const result = getToneCompatibility('light-spring', conflictingLab);

      // 블랙은 light-spring에 어울리지 않음
      expect(result.score).toBeLessThan(80);
    });

    it('should have valid grade values', () => {
      const testLab: LabColor = { L: 50, a: 10, b: 20 };

      const result = getToneCompatibility('true-autumn', testLab);

      expect(['perfect', 'good', 'neutral', 'poor', 'avoid']).toContain(result.grade);
    });

    it('should provide description matching grade', () => {
      const testLab: LabColor = { L: 70, a: 5, b: 15 };

      const result = getToneCompatibility('true-summer', testLab);

      expect(result.description).toBeDefined();
      expect(typeof result.description).toBe('string');
      expect(result.description.length).toBeGreaterThan(0);
    });

    it('should clamp score between 0 and 100', () => {
      const extremeLab: LabColor = { L: 100, a: -128, b: 127 };

      const result = getToneCompatibility('deep-winter', extremeLab);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return rounded score', () => {
      const testLab: LabColor = { L: 55, a: 8, b: 12 };

      const result = getToneCompatibility('bright-winter', testLab);

      expect(Number.isInteger(result.score)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getAllTonePalettes
  // ---------------------------------------------------------------------------

  describe('getAllTonePalettes', () => {
    it('should return array of 12 palettes', () => {
      const palettes = getAllTonePalettes();

      expect(Array.isArray(palettes)).toBe(true);
      expect(palettes.length).toBe(12);
    });

    it('should include all seasons', () => {
      const palettes = getAllTonePalettes();
      const tones = palettes.map((p) => p.tone);

      // Spring
      expect(tones).toContain('light-spring');
      expect(tones).toContain('true-spring');
      expect(tones).toContain('bright-spring');

      // Summer
      expect(tones).toContain('light-summer');
      expect(tones).toContain('true-summer');
      expect(tones).toContain('muted-summer');

      // Autumn
      expect(tones).toContain('muted-autumn');
      expect(tones).toContain('true-autumn');
      expect(tones).toContain('deep-autumn');

      // Winter
      expect(tones).toContain('true-winter');
      expect(tones).toContain('bright-winter');
      expect(tones).toContain('deep-winter');
    });

    it('should have unique tones', () => {
      const palettes = getAllTonePalettes();
      const tones = palettes.map((p) => p.tone);
      const uniqueTones = new Set(tones);

      expect(uniqueTones.size).toBe(12);
    });
  });
});
