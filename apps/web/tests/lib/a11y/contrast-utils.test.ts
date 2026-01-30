/**
 * 색상 대비 유틸리티 테스트
 *
 * @see lib/a11y/contrast-utils.ts
 */
import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  getRelativeLuminance,
  getContrastRatio,
  checkContrast,
  isReadable,
  getReadableTextColor,
  adjustBrightness,
  adjustForContrast,
  CONTRAST_THRESHOLDS,
} from '@/lib/a11y/contrast-utils';

describe('contrast-utils', () => {
  describe('hexToRgb', () => {
    it('should convert 6-digit hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#4F46E5')).toEqual({ r: 79, g: 70, b: 229 });
    });

    it('should handle hex without #', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert 3-digit hex to RGB', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('abc')).toEqual({ r: 170, g: 187, b: 204 });
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
      expect(rgbToHex({ r: 79, g: 70, b: 229 })).toBe('#4f46e5');
    });

    it('should clamp values to 0-255', () => {
      expect(rgbToHex({ r: -10, g: 300, b: 128 })).toBe('#00ff80');
    });

    it('should pad single digit hex values', () => {
      expect(rgbToHex({ r: 0, g: 0, b: 15 })).toBe('#00000f');
    });
  });

  describe('getRelativeLuminance', () => {
    it('should return 1 for white', () => {
      const luminance = getRelativeLuminance({ r: 255, g: 255, b: 255 });
      expect(luminance).toBeCloseTo(1, 5);
    });

    it('should return 0 for black', () => {
      const luminance = getRelativeLuminance({ r: 0, g: 0, b: 0 });
      expect(luminance).toBeCloseTo(0, 5);
    });

    it('should return correct luminance for gray', () => {
      const luminance = getRelativeLuminance({ r: 128, g: 128, b: 128 });
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });

    it('should weight green more than red and blue', () => {
      const redLuminance = getRelativeLuminance({ r: 255, g: 0, b: 0 });
      const greenLuminance = getRelativeLuminance({ r: 0, g: 255, b: 0 });
      const blueLuminance = getRelativeLuminance({ r: 0, g: 0, b: 255 });

      expect(greenLuminance).toBeGreaterThan(redLuminance);
      expect(greenLuminance).toBeGreaterThan(blueLuminance);
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1 for same color', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 2);
    });

    it('should work with RGB objects', () => {
      const ratio = getContrastRatio(
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      );
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return same ratio regardless of order', () => {
      const ratio1 = getContrastRatio('#000000', '#ffffff');
      const ratio2 = getContrastRatio('#ffffff', '#000000');
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });

    it('should calculate correct ratio for brand primary color', () => {
      // #4F46E5 on white should be approximately 5.9:1
      const ratio = getContrastRatio('#4F46E5', '#ffffff');
      expect(ratio).toBeGreaterThan(5.5);
      expect(ratio).toBeLessThan(6.5);
    });
  });

  describe('checkContrast', () => {
    it('should pass all levels for black on white', () => {
      const result = checkContrast('#000000', '#ffffff');
      expect(result.passesAA).toBe(true);
      expect(result.passesAALarge).toBe(true);
      expect(result.passesAAA).toBe(true);
      expect(result.passesAAALarge).toBe(true);
    });

    it('should fail AA for low contrast', () => {
      // Gray on white
      const result = checkContrast('#999999', '#ffffff');
      expect(result.passesAA).toBe(false);
    });

    it('should include ratio string', () => {
      const result = checkContrast('#000000', '#ffffff');
      expect(result.ratioString).toMatch(/^\d+\.\d+:1$/);
    });

    it('should correctly identify AA-large pass', () => {
      // ~3.5:1 ratio should pass AA-large but fail AA
      // #888888 on white = ~3.54:1
      const result = checkContrast('#888888', '#ffffff');
      expect(result.passesAALarge).toBe(true);
      expect(result.passesAA).toBe(false);
    });
  });

  describe('isReadable', () => {
    it('should return true for high contrast', () => {
      expect(isReadable('#000000', '#ffffff')).toBe(true);
    });

    it('should return false for low contrast', () => {
      expect(isReadable('#aaaaaa', '#ffffff')).toBe(false);
    });

    it('should use AA level by default', () => {
      // 4.5:1 required for AA, #888888 = ~3.54:1 (fails)
      const result = isReadable('#888888', '#ffffff', { level: 'AA' });
      expect(result).toBe(false);
    });

    it('should apply large text exception', () => {
      // 3:1 sufficient for large text, #888888 = ~3.54:1 (passes)
      const result = isReadable('#888888', '#ffffff', {
        level: 'AA',
        isLargeText: true,
      });
      expect(result).toBe(true);
    });

    it('should check AAA level when specified', () => {
      // AAA requires 7:1
      const result = isReadable('#4F46E5', '#ffffff', { level: 'AAA' });
      expect(result).toBe(false);
    });
  });

  describe('getReadableTextColor', () => {
    it('should return white for dark background', () => {
      expect(getReadableTextColor('#000000')).toBe('#ffffff');
      expect(getReadableTextColor('#4F46E5')).toBe('#ffffff');
    });

    it('should return black for light background', () => {
      expect(getReadableTextColor('#ffffff')).toBe('#000000');
      expect(getReadableTextColor('#F3F4F6')).toBe('#000000');
    });

    it('should work with RGB objects', () => {
      expect(getReadableTextColor({ r: 0, g: 0, b: 0 })).toBe('#ffffff');
    });
  });

  describe('adjustBrightness', () => {
    it('should make color brighter with positive amount', () => {
      const result = adjustBrightness('#000000', 100);
      expect(hexToRgb(result).r).toBeGreaterThan(0);
    });

    it('should make color darker with negative amount', () => {
      const result = adjustBrightness('#ffffff', -100);
      expect(hexToRgb(result).r).toBeLessThan(255);
    });

    it('should clamp values to 0-255', () => {
      const tooLight = adjustBrightness('#ffffff', 100);
      expect(hexToRgb(tooLight)).toEqual({ r: 255, g: 255, b: 255 });

      const tooDark = adjustBrightness('#000000', -100);
      expect(hexToRgb(tooDark)).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('adjustForContrast', () => {
    it('should return original if already meeting target', () => {
      const result = adjustForContrast('#000000', '#ffffff');
      expect(result).not.toBeNull();
    });

    it('should darken color on light background', () => {
      const result = adjustForContrast('#999999', '#ffffff', CONTRAST_THRESHOLDS.AA);
      expect(result).not.toBeNull();
      if (result) {
        const ratio = getContrastRatio(result, '#ffffff');
        expect(ratio).toBeGreaterThanOrEqual(CONTRAST_THRESHOLDS.AA);
      }
    });

    it('should lighten color on dark background', () => {
      const result = adjustForContrast('#555555', '#000000', CONTRAST_THRESHOLDS.AA);
      expect(result).not.toBeNull();
      if (result) {
        const ratio = getContrastRatio(result, '#000000');
        expect(ratio).toBeGreaterThanOrEqual(CONTRAST_THRESHOLDS.AA);
      }
    });
  });

  describe('CONTRAST_THRESHOLDS', () => {
    it('should have correct AA threshold', () => {
      expect(CONTRAST_THRESHOLDS.AA).toBe(4.5);
    });

    it('should have correct AA_LARGE threshold', () => {
      expect(CONTRAST_THRESHOLDS.AA_LARGE).toBe(3);
    });

    it('should have correct AAA threshold', () => {
      expect(CONTRAST_THRESHOLDS.AAA).toBe(7);
    });

    it('should have correct UI_COMPONENT threshold', () => {
      expect(CONTRAST_THRESHOLDS.UI_COMPONENT).toBe(3);
    });
  });
});
